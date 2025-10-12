
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useToast } from '@/components/ToastProvider';
import { fetchCategoriesClient } from '@/lib/client/categories.client';
import type { Category } from '@/types/category';
import { deleteCategoryAction, updateCategoryAction } from '@/app/admin/(dashboard)/products/categories/actions';

export const dynamic = 'force-dynamic';

// 에러 메시지 안전 추출
function hasMessage(x: unknown): x is { message: string } {
  return typeof x === 'object' && x !== null && 'message' in x && typeof (x as Record<string, unknown>).message === 'string';
}
function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (hasMessage(err)) return err.message;
  return '';
}

// 불변 갱신
function updateCategoryName(nodes: Category[], targetId: number, name: string): Category[] {
  return nodes.map((n) => {
    if (n.id === targetId) return { ...n, categoryName: name };
    if (n.subCategories?.length) {
      return { ...n, subCategories: updateCategoryName(n.subCategories, targetId, name) };
    }
    return n;
  });
}
function removeCategory(nodes: Category[], targetId: number): Category[] {
  return nodes
    .filter((n) => n.id !== targetId)
    .map((n) =>
      n.subCategories?.length ? { ...n, subCategories: removeCategory(n.subCategories, targetId) } : n
    );
}
//parentId가 null이면 루트에, 있으면 해당 parent 하위에 
function insertCategory(nodes: Category[], parentId: number | null, newNode: Category): Category[] {
  if (parentId == null) {
    return [...nodes, { ...newNode, subCategories: newNode.subCategories ?? [] }];
  }
  return nodes.map((n) => {
    if (n.id === parentId) {
      const children = n.subCategories ?? [];
      return {
        ...n,
        subCategories: [...children, { ...newNode, subCategories: newNode.subCategories ?? [] }],
      };
    }
    if (n.subCategories?.length) {
      return { ...n, subCategories: insertCategory(n.subCategories, parentId, newNode) };
    }
    return n;
  });
}

export default function CategoryList() {
  const toast = useToast();
  const [tree, setTree] = useState<Category[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending] = useTransition();
  const [openEditId, setOpenEditId] = useState<number | null>(null);

  // 최초 로딩
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchCategoriesClient();
        if (mounted) setTree(data);
      } catch (e: unknown) {
        toast.error(getErrorMessage(e) || '카테고리 조회 실패');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [toast]);

  // CreateCategoryForm 성공 시 : 이벤트 즉시 반영
  useEffect(() => {
    function onCreated(ev: Event) {
      const ce = ev as CustomEvent<{ created: Category; parentId: number | null }>;
      const { created, parentId } = ce.detail;
      setTree((prev) => (prev ? insertCategory(prev, parentId, created) : [created]));
    }
    window.addEventListener('category:created', onCreated as EventListener);
    return () => window.removeEventListener('category:created', onCreated as EventListener);
  }, []);

  if (loading) return <p className="text-sm text-gray-600">로딩 중...</p>;
  if (!tree?.length) return <p className="text-sm text-gray-600">아직 카테고리가 없습니다.</p>;

  return (
    <Tree
      nodes={tree}
      isPending={isPending}
      openEditId={openEditId}
      setOpenEditId={setOpenEditId}
      onUpdateSuccess={(id, newName) => setTree((prev) => (prev ? updateCategoryName(prev, id, newName) : prev))}
      onDeleteSuccess={(id) => setTree((prev) => (prev ? removeCategory(prev, id) : prev))}
    />
  );
}

function Tree({
  nodes, isPending, openEditId, setOpenEditId, onUpdateSuccess, onDeleteSuccess,
}: {
  nodes: Category[]; isPending: boolean;
  openEditId: number | null;
  setOpenEditId: (id: number | null) => void;
  onUpdateSuccess: (id: number, name: string) => void;
  onDeleteSuccess: (id: number) => void;
}) {
  return (
    <ul className="space-y-1">
      {nodes.map((n) => (
        <li key={n.id}>
          <NodeRow n={n} isPending={isPending} openEditId={openEditId} setOpenEditId={setOpenEditId} onUpdateSuccess={onUpdateSuccess} onDeleteSuccess={onDeleteSuccess} />
          {!!n.subCategories?.length && (
            <div className="ms-4 mt-1 border-l pl-4">
              <Tree
                nodes={n.subCategories}
                isPending={isPending}
                openEditId={openEditId}
                setOpenEditId={setOpenEditId}
                onUpdateSuccess={onUpdateSuccess}
                onDeleteSuccess={onDeleteSuccess}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function NodeRow({
  n, isPending, openEditId, setOpenEditId, onUpdateSuccess, onDeleteSuccess,
}: {
  n: Category; isPending: boolean;
  openEditId: number | null;
  setOpenEditId: (id: number | null) => void;
  onUpdateSuccess: (id: number, name: string) => void;
  onDeleteSuccess: (id: number) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(n.categoryName);
  const [pending, startTransition] = useTransition();
  const disabled = isPending || pending;

  const onUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set('id', String(n.id));
    fd.set('categoryName', name.trim());
    fd.set('parentId', '');

    startTransition(async () => {
      try {
        const res = await updateCategoryAction(fd);
        toast.success(`카테고리 수정 완료: [${res.id}] ${name}`, { duration: 1800 });
        onUpdateSuccess(res.id, name.trim());
        setOpenEditId(null); 
      } catch (err: unknown) { 
        toast.error(getErrorMessage(err) || '카테고리 수정 실패');
      }
    });
  };

  const onDelete = () => {
    const ok = window.confirm('정말 삭제하시겠습니까?');
    if (!ok) return;

    startTransition(async () => {
      try {
        const res = await deleteCategoryAction(n.id);
        
        toast.success(`카테고리 삭제 완료: [${res.id}] ${name}`, { duration: 1800 });
        onDeleteSuccess(res.id);
      } catch (err: unknown) {
        toast.error(getErrorMessage(err) || '카테고리 삭제 실패');
      }
    });
  };

  const isOpen = openEditId === n.id;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{n.id}</span>
        <span className="font-medium">{n.categoryName}</span>
      </div>

      <div className="flex items-center gap-2">
        <details open={isOpen} className="group">
          <summary
            className="list-none cursor-pointer rounded border px-2 py-1 text-xs hover:bg-gray-50"
            onClick={(e) => {
              e.preventDefault();
              setOpenEditId(isOpen ? null : n.id); // 수정 하나만 열리도록
            }}
          >
            수정
          </summary>
          {isOpen && (
            <div className="mt-2 rounded border p-2">
              <form onSubmit={onUpdate} className="flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500">카테고리명</span>
                  <input
                    name="categoryName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded border px-2 py-1 text-sm"
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="rounded border px-3 py-1 text-xs font-medium hover:bg-gray-50 disabled:opacity-60"
                  disabled={disabled}
                >
                  {disabled ? '저장 중…' : '저장'}
                </button>
              </form>
            </div>
          )}
        </details>

        <button
          className="rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
          onClick={onDelete}
          disabled={disabled}
        >
          삭제
        </button>
      </div>
    </div>
  );
}
