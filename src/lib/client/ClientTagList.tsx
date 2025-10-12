'use client';

import { useEffect, useState, useTransition } from 'react';
import { useToast } from '@/components/ToastProvider';
import { updateTagAction, deleteTagAction } from '@/app/admin/(dashboard)/products/tags/action';
import type { Tag } from '@/types/tag';

// 에러 메시지 안전 추출 
function hasMessage(x: unknown): x is { message: string } {
  return typeof x === 'object' && x !== null && 'message' in x && typeof (x as Record<string, unknown>).message === 'string';
}
function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (hasMessage(err)) return err.message;
  return '';
}

export default function ClientTagList({ initialTags }: { initialTags: Tag[] }) {
  const toast = useToast();
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [openEditId, setOpenEditId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const h = (e: Event) => {
      const ce = e as CustomEvent<{ tag: Tag }>;
      setTags((prev) => [...prev, ce.detail.tag]);
    };
    window.addEventListener('tag:created', h as EventListener);
    return () => window.removeEventListener('tag:created', h as EventListener);
  }, []);

  const onUpdate = (id: number, name: string) => {
    const fd = new FormData();
    fd.set('id', String(id));
    fd.set('tagName', name.trim());

    startTransition(async () => {
      try {
        const res = await updateTagAction(fd);
        toast.success(`태그 수정 완료: ${res.name}`, { duration: 1800 });
        setTags((prev) => prev.map((t) => (t.id === id ? { ...t, tagName: res.name } : t)));
        setOpenEditId(null);
      } catch (err: unknown) { // ← any 제거
        toast.error(getErrorMessage(err) || '태그 수정 실패');
      }
    });
  };

  const onDelete = (id: number) => {
    if (!confirm('정말 삭제할까요?')) return;

    startTransition(async () => {
      try {
        await deleteTagAction(id);
        toast.success('태그 삭제 완료', { duration: 1800 });
        setTags((prev) => prev.filter((t) => t.id !== id));
      } catch (err: unknown) { // ← any 제거
        toast.error(getErrorMessage(err) || '태그 삭제 실패');
      }
    });
  };

  return (
    <ul className="space-y-1">
      {tags.map((t) => (
        <li key={t.id}>
          <Row
            tag={t}
            openEditId={openEditId}
            setOpenEditId={setOpenEditId}
            isPending={isPending}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}

function Row({
  tag, openEditId, setOpenEditId, isPending, onUpdate, onDelete,
}: {
  tag: Tag;
  openEditId: number | null;
  setOpenEditId: (id: number | null) => void;
  isPending: boolean;
  onUpdate: (id: number, name: string) => void;
  onDelete: (id: number) => void;
}) {
  const [name, setName] = useState(tag.tagName);
  const isOpen = openEditId === tag.id;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{tag.id}</span>
        <span className="font-medium">{tag.tagName}</span>
      </div>

      <div className="flex items-center gap-2">
        <details open={isOpen} className="group">
          <summary
            className="list-none cursor-pointer rounded border px-2 py-1 text-xs hover:bg-gray-50"
            onClick={(e) => {
              e.preventDefault();
              setOpenEditId(isOpen ? null : tag.id);
            }}
          >
            수정
          </summary>

          {isOpen && (
            <div className="mt-2 rounded border p-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onUpdate(tag.id, name);
                }}
                className="flex flex-wrap items-end gap-2"
              >
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500">태그명</span>
                  <input
                    name="tagName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded border px-2 py-1 text-sm"
                    required
                    disabled={isPending}
                  />
                </label>
                <button
                  type="submit"
                  className="rounded border px-3 py-1 text-xs font-medium hover:bg-gray-50 disabled:opacity-60"
                  disabled={isPending}
                >
                  {isPending ? '저장 중…' : '저장'}
                </button>
              </form>
            </div>
          )}
        </details>

        <button
          className="rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
          onClick={() => onDelete(tag.id)}
          disabled={isPending}
        >
          삭제
        </button>
      </div>
    </div>
  );
}
