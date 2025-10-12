'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { createCategoryClient } from '@/lib/client/categories.client';
import { useToast } from '../ToastProvider';


export default function CreateCategoryForm() {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await createCategoryClient({
        categoryName: name.trim(),
        parentId: parentId === '' ? null : Number(parentId),
      });
      toast.success(`카테고리 등록 완료: [${data.id}] ${data.categoryName}`, { duration: 1800 });
      // 트리 즉시 갱신 이벤트
      window.dispatchEvent(
        new CustomEvent('category:created', {
          detail: { created: data, parentId: parentId === '' ? null : Number(parentId) },
        }),
      );
      setName(''); setParentId('');
      router.refresh(); // 목록 즉시 갱신
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '카테고리 등록 실패';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-3">
      <div>
        <label className="mb-1 block text-sm" htmlFor="categoryName">카테고리 이름</label>
        <input
          id="categoryName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border px-3 py-2"
          placeholder="예) 스티커"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm">상위 카테고리 ID (없으면 비움)</label>
        <input
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="w-full rounded border px-3 py-2"
          placeholder="예) 1"
          inputMode="numeric"
        />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? '등록 중…' : '등록'}
        </Button>
      </div>
    </form>
  );
}
