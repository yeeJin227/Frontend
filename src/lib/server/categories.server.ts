import 'server-only';
import { cookies } from 'next/headers';
import type { Category, CategoryPayload, ApiResponse } from '@/types/category';

// HeadersInit → Record<string,string>
function normalizeHeaders(init?: HeadersInit): Record<string, string> {
  if (!init) return {};
  if (init instanceof Headers) {
    const out: Record<string, string> = {};
    init.forEach((v, k) => { out[k] = v; });
    return out;
  }
  if (Array.isArray(init)) {
    const out: Record<string, string> = {};
    for (const [k, v] of init) out[k] = v;
    return out;
  }
  return { ...init };
}

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

async function authHeaders(init?: HeadersInit): Promise<HeadersInit> {
  const token = (await cookies()).get('accessToken')?.value;
  const base: Record<string, string> = {
    Accept: 'application/json',
    ...normalizeHeaders(init),
  };
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
}

// 카테고리 조회
export async function fetchCategoriesServer(): Promise<Category[]> {
  const headers = await authHeaders();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/categories`, {
    method: 'GET',
    headers,
    next: { tags: ['categories'] },
  });

  const loc = res.headers.get('location');
  if (res.status >= 300 && res.status < 400) {
    throw new Error(`302 redirected to "${loc}" (인증/세션 문제 가능)`);
  }
  return parseApiResponse<Category[]>(res, '카테고리 조회 실패');
}

// 카테고리 생성
export async function createCategoryServer(payload: CategoryPayload): Promise<Category> {
  const headers = await authHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/categories`, {
    method: 'POST', headers, cache: 'no-store', body: JSON.stringify(payload),
  });
  return parseApiResponse<Category>(res, '카테고리 등록 실패');
}

// 카테고리 수정
export async function updateCategoryServer(
  id: number,
  payload: { categoryName: string; parentId: number | null }
): Promise<Category> {
  const headers = await authHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/categories/${id}`, {
    method: 'PUT', headers, cache: 'no-store', body: JSON.stringify(payload),
  });
  return parseApiResponse<Category>(res, '카테고리 수정 실패');
}

// 카테고리 삭제
export async function deleteCategoryServer(id: number): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/categories/${id}`, { method: 'DELETE', headers, cache: 'no-store' });

  const json = await readJsonIfAny<ApiResponse<null>>(res);
  if (!res.ok) {
    const fallback =
      res.status === 400 ? '하위 카테고리 또는 상품이 있어 삭제할 수 없습니다.' :
      res.status === 404 ? '삭제할 카테고리를 찾을 수 없습니다.' :
      '카테고리 삭제 실패';
    throw new Error(json?.msg || fallback);
  }
  if (json && json.resultCode !== '200') {
    throw new Error(json.msg || '카테고리 삭제 실패');
  }
}
