
import type { ApiResponse } from '@/types/productArtist';
import type { ProductArtistInfo } from '@/types/productArtist';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');

export async function fetchProductArtistInfo(productUuid: string): Promise<ProductArtistInfo | null> {
  const url = `${API_BASE}/api/products/${productUuid}/artist`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { accept: 'application/json' },
    credentials: 'include',
    cache: 'no-store',
  });

  const text = await res.text().catch(() => '');
  if (res.status === 404) return null;

  if (!res.ok) {
    let msg = `작가 정보 조회 실패 (HTTP ${res.status})`;
    try {
      const parsed = JSON.parse(text) as Partial<ApiResponse<unknown>>;
      if (parsed?.msg) msg = parsed.msg;
    } catch {}
    throw new Error(msg);
  }

  const json = JSON.parse(text) as ApiResponse<ProductArtistInfo>;
  if (json.resultCode !== '200') {
    throw new Error(json.msg || '작가 정보 조회 실패');
  }
  return json.data ?? null;
}
