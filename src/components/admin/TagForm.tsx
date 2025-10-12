'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { createTagAction } from '@/app/admin/(dashboard)/products/tags/action';
import { useToast } from '@/components/ToastProvider';

// 에러 메시지 안전 추출
function hasMessage(x: unknown): x is { message: string } {
  return (
    typeof x === 'object' &&
    x !== null &&
    'message' in x &&
    typeof (x as { message?: unknown }).message === 'string'
  );
}
function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (hasMessage(err)) return err.message;
  return '';
}

export default function TagForm() {
  const router = useRouter();
  const toast = useToast();

  const [tagName, setTagName] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = tagName.trim();
    if (!name) {
      toast.info('태그명을 입력해주세요.');
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('tagName', name);

      const res = await createTagAction(fd);

      if (res.success && res.data) {
        toast.success(`태그 등록 완료: ${res.data.tagName}`, { duration: 1800 });
        setTagName('');
        inputRef.current?.focus();

        window.dispatchEvent(new CustomEvent('tag:created', { detail: { tag: res.data } }));

        router.refresh();
      } else {
        toast.error(res.message || '태그 등록 실패');
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || '태그 등록 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="mb-1 block text-sm" htmlFor="tagName">
        태그 이름
      </label>
      <div className="flex items-center gap-3">
        <input
          id="tagName"
          ref={inputRef}
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
          placeholder="예) 귀염"
          className="rounded border px-3 py-2"
          disabled={loading}
        />
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? '등록 중…' : '등록'}
        </Button>
      </div>
    </form>
  );
}
