'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import PostDetail from '@/components/help/PostDetail';
import Button from '@/components/Button';
import { useToast } from '@/components/ToastProvider';
import { deleteNotice, fetchNoticeDetail, type NoticeDetail } from '@/services/notices';
import { useAuthStore } from '@/stores/authStore';

type NoticeDetailClientProps = {
  noticeId: string;
};

type LoadState =
  | { status: 'idle' | 'loading' }
  | { status: 'loaded'; notice: NoticeDetail }
  | { status: 'error'; message: string };

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

export default function NoticeDetailClient({ noticeId }: NoticeDetailClientProps) {
  const [state, setState] = useState<LoadState>({ status: 'idle' });
  const toast = useToast();
  const router = useRouter();
  const role = useAuthStore((store) => store.role);
  const isHydrated = useAuthStore((store) => store.isHydrated);

  const isAdmin = role === 'ADMIN';

  useEffect(() => {
    let mounted = true;
    setState({ status: 'loading' });
    fetchNoticeDetail(noticeId)
      .then((notice) => {
        if (mounted) {
          setState({ status: 'loaded', notice });
        }
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : '공지사항을 불러오지 못했습니다.';
        setState({ status: 'error', message });
      });
    return () => {
      mounted = false;
    };
  }, [noticeId]);

  const notice = state.status === 'loaded' ? state.notice : null;

  const attachments = useMemo(() => {
    if (!notice || notice.documents.length === 0) return null;
    return (
      <div className="mb-6 flex flex-col gap-2 rounded border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-4 text-sm">
        <span className="font-medium">첨부파일</span>
        <ul className="flex flex-col gap-2">
          {notice.documents.map((doc) => (
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
  }, [notice]);

  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <div className="mt-[94px] flex flex-col gap-4">
        <div className="h-10 w-48 animate-pulse rounded bg-[var(--color-gray-100)]" />
        <div className="h-6 w-full max-w-xl animate-pulse rounded bg-[var(--color-gray-100)]" />
        <div className="h-96 w-full animate-pulse rounded bg-[var(--color-gray-100)]" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="mt-[94px] flex flex-col items-center gap-4 text-center">
        <h3 className="text-xl font-semibold">공지사항을 불러오는 중 오류가 발생했습니다.</h3>
        <p className="text-sm text-[var(--color-gray-600)]">{state.message}</p>
        <Button onClick={() => router.refresh()}>다시 시도</Button>
      </div>
    );
  }

  const topRightMeta = [
    { label: '작성일자', value: formatDate(notice.createDate) },
    { label: '수정일자', value: formatDate(notice.modifyDate) },
    { label: '글번호', value: notice.id },
    { label: '조회수', value: notice.viewCount.toLocaleString('ko-KR') },
  ];

  const handleDelete = async () => {
    if (!isAdmin) return;
    const confirmed = window.confirm('정말로 이 공지사항을 삭제하시겠습니까? 삭제 후에는 되돌릴 수 없습니다.');
    if (!confirmed) return;

    try {
      await deleteNotice(notice.id);
      toast.success('공지사항을 삭제했습니다.');
      router.replace('/help/notice');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : '공지사항 삭제에 실패했습니다.';
      toast.error(message);
    }
  };

  return (
    <>
      <PostDetail
        header="공지사항"
        topLeft={[]}
        topRight={topRightMeta}
        titleLeft={{ label: '제목', value: notice.title }}
        titleRight={{ label: '분류', value: notice.isImportant ? '중요' : '일반' }}
        content={<div dangerouslySetInnerHTML={{ __html: notice.content }} />}
      />

      {attachments}

      <div className="mb-10 flex justify-between">
        <Link href="/help/notice" className="text-sm text-[var(--color-gray-600)] underline-offset-4 hover:underline">
          목록으로
        </Link>

        {isHydrated && isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/help/notice/${notice.id}/edit`)}>
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
