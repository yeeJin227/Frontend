'use client';

import { FormEvent, useState } from 'react';
import Button from '@/components/Button';
import { useToast } from '@/components/ToastProvider';
import { requestPasswordReset } from '@/services/auth';

export default function Page() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error('이메일을 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      toast.success('임시 비밀번호가 이메일로 발송되었어요. 받은 메일을 확인해 주세요.');
    } catch (error) {
      const message = error instanceof Error ? error.message : '비밀번호 찾기에 실패했습니다.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative z-10 rounded-2xl border border-[var(--color-primary)] bg-white p-6 pt-16 shadow-[8px_8px_0_0_var(--color-primary-40)]">
      <h1 className="mb-6 text-center text-[32px] font-bold">비밀번호 찾기</h1>
      <h2 className="mb-15 text-center text-xl">가입한 이메일(아이디)을 입력해 주세요.</h2>
      <form
        className="mx-auto mb-[130px] flex w-full max-w-[463px] flex-col items-center justify-center gap-[30px]"
        onSubmit={handleSubmit}
      >
        <input
          type="email"
          className="w-full rounded border border-gray-200 px-3 py-2 outline-none transition-colors duration-150 focus:border-[var(--color-primary)]"
          placeholder="이메일(아이디)"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Button type="submit" className="w-full" isLoading={submitting} disabled={submitting}>
          비밀번호 찾기
        </Button>
      </form>
    </div>
  );
}
