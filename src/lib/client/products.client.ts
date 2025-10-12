// 상품 목록 조회

'use server';

export type ProductListParams = {
  page?: number;  // 1-base
  size?: number;
  categoryId?: number;
  tagIds?: number[];
  minPrice?: number;
  maxPrice?: number;
  deliveryType?: 'FREE' | 'PAID' | 'CONDITIONAL' | 'CONDITIONAL_FREE';
  sort?: 'newest' | 'priceAsc' | 'priceDesc' | 'popular';
};

function toInt(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function buildQS(params: ProductListParams) {
  const sp = new URLSearchParams();

  // 기본값
  const page1 = Math.max(1, toInt(params.page ?? 1, 1));   // 최소 1
  const size1 = Math.max(1, toInt(params.size ?? 12, 12)); // 최소 1

  if (params.categoryId != null) sp.set('categoryId', String(params.categoryId));

  sp.set('page', String(page1));
  sp.set('size', String(size1));

  if (params.tagIds?.length) {
    params.tagIds.forEach((id) => sp.append('tagIds', String(id)));
    sp.set('tagIdsCsv', params.tagIds.join(',')); 
  }

  if (params.minPrice != null) sp.set('minPrice', String(params.minPrice));
  if (params.maxPrice != null) sp.set('maxPrice', String(params.maxPrice));

  const delivery = params.deliveryType === 'CONDITIONAL' ? 'CONDITIONAL_FREE' : params.deliveryType;
  if (delivery) sp.set('deliveryType', delivery);
  if (params.sort) sp.set('sort', params.sort);

  return sp.toString();
}


export async function fetchProductList(params: ProductListParams) {
  // 1차 빌드
  const qs1 = buildQS(params);

  // 전송 직전 page>=1 로 고정
  const sp = new URLSearchParams(qs1);
  const pageNow = toInt(sp.get('page'), 1);
  if (!Number.isFinite(pageNow) || pageNow < 1) sp.set('page', '1');

  const sizeNow = toInt(sp.get('size'), 12);
  if (!Number.isFinite(sizeNow) || sizeNow < 1) sp.set('size', '12');

  const qsFinal = sp.toString();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products?${qsFinal}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`error ${res.status} :: ${text}`);
  }
  const json = await res.json();
  return json.data;
}
