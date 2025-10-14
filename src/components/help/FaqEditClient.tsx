'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/components/Button';
import { useToast } from '@/components/ToastProvider';
import { fetchFaqDetail, updateFaq, FAQ_CATEGORY_OPTIONS, type FaqCategory } from '@/services/faqs';
import { useAuthStore } from '@/stores/authStore';

type Props = {
  faqId: string;
};

export default function FaqEditClient({ faqId }: Props) {
  const router = useRouter();
  const toast = useToast();
  const role = useAuthStore((store) => store.role);
  const isHydrated = useAuthStore((store) => store.isHydrated);
  const accessToken = useAuthStore((store) => store.accessToken);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState<FaqCategory>('ACCOUNT');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = role === 'ADMIN';

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAdmin) {
      toast.error('관리자만 FAQ를 수정할 수 있습니다.');
      router.replace(`/help/faq/${faqId}`);
    }
  }, [faqId, isHydrated, isAdmin, router, toast]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFaqDetail(faqId)
      .then((data) => {
        if (cancelled) return;
        setQuestion(data.question);
        setAnswer(data.answer);
        setCategory((data.category as FaqCategory) ?? 'ACCOUNT');
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'FAQ 정보를 불러오지 못했습니다.';
        setError(message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [faqId]);

  const handleSubmit = async () => {
    if (!isAdmin) return;
    if (!question.trim()) {
      toast.error('질문을 입력해 주세요.');
      return;
    }
    if (!answer.trim()) {
      toast.error('답변을 입력해 주세요.');
      return;
    }
    if (!accessToken) {
      toast.error('인증 정보가 만료되었습니다. 다시 로그인해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await updateFaq(
        faqId,
        {
          question: question.trim(),
          answer: answer.trim(),
          category,
        },
        { accessToken },
      );
      toast.success('FAQ를 수정했습니다.');
      router.replace(`/help/faq/${faqId}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'FAQ 수정에 실패했습니다.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="mt-[94px] flex flex-col gap-4">
        <div className="h-10 w-48 animate-pulse rounded bg-[var(--color-gray-100)]" />
        <div className="h-6 w-full max-w-xl animate-pulse rounded bg-[var(--color-gray-100)]" />
        <div className="h-64 w-full animate-pulse rounded bg-[var(--color-gray-100)]" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mt-[94px] flex flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-semibold">FAQ 정보를 불러오지 못했습니다.</h1>
        <p className="text-sm text-[var(--color-gray-600)]">{error}</p>
        <Button onClick={() => router.replace(`/help/faq/${faqId}`)}>돌아가기</Button>
      </main>
    );
  }

  return (
    <main className="mt-[94px] mb-10 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">FAQ 수정</h1>
        <p className="text-sm text-[var(--color-gray-500)]">FAQ 내용을 수정해 주세요.</p>
      </header>

      <section className="space-y-4">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-[var(--color-gray-800)]">카테고리</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as FaqCategory)}
            className="h-11 rounded border border-[var(--color-gray-200)] px-3"
          >
            {FAQ_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-[var(--color-gray-800)]">질문</span>
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className="h-11 rounded border border-[var(--color-gray-200)] px-3"
            placeholder="질문을 입력해 주세요"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-[var(--color-gray-800)]">답변</span>
          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            className="min-h-[180px] rounded border border-[var(--color-gray-200)] px-3 py-3"
            placeholder="답변을 입력해 주세요"
          />
        </label>
      </section>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()} disabled={submitting}>
          취소
        </Button>
        <Button onClick={handleSubmit} isLoading={submitting} disabled={submitting}>
          수정 완료
        </Button>
      </div>
    </main>
  );
}
