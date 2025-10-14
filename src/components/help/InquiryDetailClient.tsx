'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DOMPurify from 'dompurify';

import PostDetail from '@/components/help/PostDetail';
import CommentForm from '@/components/help/CommentForm';
import Button from '@/components/Button';
import { useToast } from '@/components/ToastProvider';
import {
  fetchInquiryDetail,
  INQUIRY_CATEGORY_OPTIONS,
  createInquiryReply,
  deleteInquiry,
  type InquiryDetail,
} from '@/services/inquiries';
import { useAuthStore } from '@/stores/authStore';

type Props = {
  inquiryId: string;
};

type LoadState =
  | { status: 'idle' | 'loading' }
  | { status: 'loaded'; data: InquiryDetail }
  | { status: 'error'; message: string };

export default function InquiryDetailClient({ inquiryId }: Props) {
  const [state, setState] = useState<LoadState>({ status: 'idle' });
  const toast = useToast();
  const router = useRouter();
  const isHydrated = useAuthStore((store) => store.isHydrated);
  const currentUserName = useAuthStore((store) => store.userProfile?.nickname ?? store.userProfile?.email ?? '');
  const role = useAuthStore((store) => store.role);
  const accessToken = useAuthStore((store) => store.accessToken);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setState({ status: 'loading' });
    fetchInquiryDetail(inquiryId)
      .then((data) => {
        if (mounted) {
          setState({ status: 'loaded', data });
        }
      })
      .catch((error) => {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : '문의를 불러오지 못했습니다.';
        setState({ status: 'error', message });
      });
    return () => {
      mounted = false;
    };
  }, [inquiryId, reloadKey]);

  const attachments = useMemo(() => {
    if (state.status !== 'loaded' || state.data.documents.length === 0) return null;
    return (
      <div className="mb-6 flex flex-col gap-2 rounded border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-4 text-sm">
        <span className="font-medium">첨부파일</span>
        <ul className="flex flex-col gap-2">
          {state.data.documents.map((doc) => (
            <li key={doc.id}>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-primary)] underline-offset-2 hover:underline"
              >
                {doc.fileName}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }, [state]);

  const inquiry = state.status === 'loaded' ? state.data : null;
  const sanitizedContent = useMemo(
    () =>
      inquiry
        ? {
            __html: DOMPurify.sanitize(inquiry.content, { USE_PROFILES: { html: true } }),
          }
        : { __html: '' },
    [inquiry?.content],
  );

  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <div className="mt-[94px] flex flex-col gap-4">
        <div className="h-10 w-48 animate-pulse rounded bg-[var(--color-gray-100)]" />
        <div className="h-6 w-full max-w-xl animate-pulse rounded bg-[var(--color-gray-100)]" />
        <div className="h-64 w-full animate-pulse rounded bg-[var(--color-gray-100)]" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="mt-[94px] flex flex-col items-center gap-4 text-center">
        <h3 className="text-xl font-semibold">문의를 불러오는 중 오류가 발생했습니다.</h3>
        <p className="text-sm text-[var(--color-gray-600)]">{state.message}</p>
        <Button onClick={() => router.refresh()}>다시 시도</Button>
      </div>
    );
  }

  if (!inquiry) {
    return null;
  }

  const isMine = Boolean(currentUserName) && inquiry.authorName === currentUserName;
  const canManage = Boolean(accessToken) && (role === 'ADMIN' || isMine);

  const comments = inquiry.replies.map((reply) => ({
    author: reply.authorName ?? reply.replyType,
    content: (
      <div className="text-sm">
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(reply.content, { USE_PROFILES: { html: true } }),
          }}
        />
        {reply.modifyDate && (
          <span className="ml-1 text-xs text-[var(--color-gray-500)]">
            (수정 {formatDate(reply.modifyDate)})
          </span>
        )}
      </div>
    ),
    date: formatDate(reply.createDate),
  }));

  const handleCreateReply = async (text: string) => {
    if (!accessToken) {
      toast.error('로그인 후 이용해 주세요.');
      router.push('/login');
      return;
    }

    try {
      await createInquiryReply(inquiry.id, { content: text }, { accessToken });
      toast.success('댓글이 등록되었습니다.');
      setReloadKey((prev) => prev + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : '댓글 등록에 실패했습니다.';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!canManage) return;
    const confirmed = window.confirm('정말로 이 문의를 삭제하시겠습니까?');
    if (!confirmed) return;
    if (!accessToken) {
      toast.error('로그인 후 이용해 주세요.');
      router.push('/login');
      return;
    }

    try {
      await deleteInquiry(inquiry.id, { accessToken });
      toast.success('문의가 삭제되었습니다.');
      router.replace('/help/contact');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : '문의 삭제에 실패했습니다.';
      toast.error(message);
    }
  };

  return (
    <>
      <PostDetail
        header="문의하기"
        topLeft={[{ label: '카테고리', value: getCategoryLabel(inquiry.category) }]}
        topRight={[
          { label: '작성일자', value: formatDate(inquiry.createDate) },
          { label: '글번호', value: inquiry.id },
          { label: '조회수', value: inquiry.viewCount.toLocaleString('ko-KR') },
          { label: '상태', value: inquiry.status === 'ANSWERED' ? '답변 완료' : '답변 대기' },
        ]}
        titleLeft={{ label: '제목', value: inquiry.title }}
        titleRight={{ label: '작성자', value: inquiry.authorName ?? '-' }}
        content={
          <div className="flex flex-col gap-4">
            {inquiry.isSecret && (
              <span className="inline-flex w-fit items-center gap-2 rounded bg-[var(--color-gray-100)] px-3 py-1 text-xs text-[var(--color-gray-600)]">
                🔒 비공개 문의
              </span>
            )}
            <div className="text-sm" dangerouslySetInnerHTML={sanitizedContent} />
            {attachments}
          </div>
        }
        comments={comments}
      />

      {isHydrated && (
        <CommentForm currentUserName={currentUserName || '익명 사용자'} onSubmit={handleCreateReply} />
      )}

      <div className="mt-6 flex items-center justify-between">
        <Link href="/help/contact" className="text-sm text-[var(--color-gray-600)] underline-offset-4 hover:underline">
          목록으로
        </Link>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/help/contact/${inquiry.id}/edit`)}>
              수정하기
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              삭제하기
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getCategoryLabel(value: string): string {
  const found = INQUIRY_CATEGORY_OPTIONS.find((option) => option.value === value);
  return found?.label ?? value;
}
