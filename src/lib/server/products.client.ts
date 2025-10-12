
import type { ApiResponse } from '@/types/category';
import type { ProductListData, ProductListParams } from '@/types/product';

function buildProductListQuery(params: ProductListParams) {
  const sp = new URLSearchParams();

  if (params.categoryId != null) sp.set('categoryId', String(params.categoryId));
  if (params.minPrice != null) sp.set('minPrice', String(params.minPrice));
  if (params.maxPrice != null) sp.set('maxPrice', String(params.maxPrice));
  if (params.deliveryType) sp.set('deliveryType', params.deliveryType);
  if (params.sort) sp.set('sort', params.sort);
  // 서버는 1부터 시작
  sp.set('page', String(params.page ?? 1));
  sp.set('size', String(params.size ?? 12));

  // tagIds=1&tagIds=2...
  if (params.tagIds?.length) {
    params.tagIds.forEach((id) => sp.append('tagIds', String(id)));
  }

  return sp.toString();
}

export async function fetchProductList(params: ProductListParams): Promise<ProductListData> {
  const qs = buildProductListQuery(params);
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products?${qs}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    cache: 'no-store',
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || `상품 목록 조회 실패 (HTTP ${res.status})`);
  }

  const json = (await res.json()) as ApiResponse<ProductListData | null>;
  if (json.resultCode !== '200' || !json.data) {
    throw new Error(json.msg || '상품 목록 조회 실패');
  }
  return json.data;
}
