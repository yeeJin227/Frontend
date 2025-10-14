'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import PostDetail from '@/components/help/PostDetail';
import Button from '@/components/Button';
import { useToast } from '@/components/ToastProvider';
import { deleteFaq, fetchFaqDetail, type FaqDetail } from '@/services/faqs';
import { useAuthStore } from '@/stores/authStore';

type LoadState =
  | { status: 'idle' | 'loading' }
  | { status: 'loaded'; data: FaqDetail }
  | { status: 'error'; message: string };

type Props = {
  faqId: string;
};

export default function FaqDetailClient({ faqId }: Props) {
  const [state, setState] = useState<LoadState>({ status: 'idle' });
  const toast = useToast();
  const router = useRouter();
  const role = useAuthStore((store) => store.role);
  const isHydrated = useAuthStore((store) => store.isHydrated);
  const accessToken = useAuthStore((store) => store.accessToken);

  const isAdmin = role === 'ADMIN';

  useEffect(() => {
    let mounted = true;
    setState({ status: 'loading' });
    fetchFaqDetail(faqId)
      .then((data) => {
        if (mounted) {
          setState({ status: 'loaded', data });
        }
      })
      .catch((error) => {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : 'FAQ를 불러오지 못했습니다.';
        setState({ status: 'error', message });
      });
    return () => {
      mounted = false;
    };
  }, [faqId]);

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
        <h3 className="text-xl font-semibold">FAQ를 불러오지 못했습니다.</h3>
        <p className="text-sm text-[var(--color-gray-600)]">{state.message}</p>
        <Button onClick={() => router.refresh()}>다시 시도</Button>
      </div>
    );
  }

  if (state.status !== 'loaded') {
    return null;
  }

  const faq = state.data;

  const handleDelete = async () => {
    if (!isAdmin) return;
    const confirmed = window.confirm('FAQ를 삭제하시겠습니까? 삭제 후에는 되돌릴 수 없습니다.');
    if (!confirmed) return;
    if (!accessToken) {
      toast.error('인증 정보가 만료되었습니다. 다시 로그인해 주세요.');
      return;
    }

    try {
      await deleteFaq(faq.id, { accessToken });
      toast.success('FAQ를 삭제했습니다.');
      router.replace('/help/faq');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'FAQ 삭제에 실패했습니다.';
      toast.error(message);
    }
  };

  return (
    <>
      <PostDetail
        header="자주 묻는 질문(FAQ)"
        topLeft={[{ label: '카테고리', value: faq.categoryDisplayName ?? faq.category }]}
        topRight={[
          { label: '조회수', value: faq.viewCount.toLocaleString('ko-KR') },
          { label: '작성일', value: formatDate(faq.createDate) },
          { label: '수정일', value: formatDate(faq.modifyDate) },
          { label: '글번호', value: faq.id },
        ]}
        titleLeft={{ label: '질문', value: faq.question }}
        content={<div className="whitespace-pre-line text-sm text-[var(--color-gray-600)]">{faq.answer}</div>}
      />

      <div className="mb-10 flex justify-between">
        <Link href="/help/faq" className="text-sm text-[var(--color-gray-600)] underline-offset-4 hover:underline">
          목록으로
        </Link>
        {isHydrated && isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/help/faq/${faq.id}/edit`)}
            >
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
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
