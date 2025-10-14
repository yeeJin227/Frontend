'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/components/Button';
import { useToast } from '@/components/ToastProvider';
import { createFaq, FAQ_CATEGORY_OPTIONS, type FaqCategory } from '@/services/faqs';
import { useAuthStore } from '@/stores/authStore';

export default function FaqCreatePage() {
  const router = useRouter();
  const toast = useToast();
  const role = useAuthStore((store) => store.role);
  const isHydrated = useAuthStore((store) => store.isHydrated);
  const accessToken = useAuthStore((store) => store.accessToken);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState<FaqCategory>('ACCOUNT');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = role === 'ADMIN';

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAdmin) {
      toast.error('관리자만 FAQ를 작성할 수 있습니다.');
      router.replace('/help/faq');
    }
  }, [isHydrated, isAdmin, router, toast]);

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
      await createFaq(
        {
          question: question.trim(),
          answer: answer.trim(),
          category,
        },
        { accessToken },
      );
      toast.success('FAQ를 등록했습니다.');
      router.replace('/help/faq');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'FAQ 등록에 실패했습니다.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mt-[94px] mb-10 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">FAQ 작성</h1>
        <p className="text-sm text-[var(--color-gray-500)]">자주 묻는 질문에 대한 답변을 등록해 주세요.</p>
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
          등록하기
        </Button>
      </div>
    </main>
  );
}
