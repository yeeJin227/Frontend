'use client';

import type { Category, CategoryPayload, ApiResponse } from '@/types/category';

// 로컬 파서 
async function parseApiResponse<T>(res: Response, fallbackMsg: string): Promise<T> {
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || fallbackMsg);
  }
  const json = (await res.json()) as ApiResponse<T | null>;
  if (json.resultCode !== '200' || !json.data) {
    throw new Error(json.msg || fallbackMsg);
  }
  return json.data;
}

async function readJsonIfAny<T>(res: Response): Promise<T | null> {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return null;
  try { return (await res.json()) as T; } catch { return null; }
}

const baseInit: RequestInit = {
  headers: { Accept: 'application/json' },
  credentials: 'include',
  cache: 'no-store',
};

// 카테고리 조회
export async function fetchCategoriesClient(): Promise<Category[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/categories`, { ...baseInit, method: 'GET' });
  return parseApiResponse<Category[]>(res, '카테고리 조회 실패');
}

// 카테고리 생성
export async function createCategoryClient(payload: CategoryPayload): Promise<Category> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/categories`, {
    ...baseInit,
    method: 'POST',
    headers: { ...(baseInit.headers as Record<string, string>), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseApiResponse<Category>(res, '카테고리 등록 실패');
}

// 카테고리 수정
export async function updateCategoryClient(
  id: number,
  payload: { categoryName: string; parentId: number | null }
): Promise<Category> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/categories/${id}`, {
    ...baseInit,
    method: 'PUT',
    headers: { ...(baseInit.headers as Record<string, string>), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseApiResponse<Category>(res, '카테고리 수정 실패');
}

// 카테고리 삭제
export async function deleteCategoryClient(id: number): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/categories/${id}`, { ...baseInit, method: 'DELETE' });
  const json = await readJsonIfAny<ApiResponse<null>>(res);
  if (!res.ok) {
    const fallback =
      res.status === 400 ? '하위 카테고리 또는 상품이 있어 삭제할 수 없습니다.' :
      res.status === 404 ? '삭제할 카테고리를 찾을 수 없습니다.' :
      '카테고리 삭제 실패';
    throw new Error(json?.msg || fallback);
  }
  if (json && json.resultCode !== '200') throw new Error(json.msg || '카테고리 삭제 실패');
}
