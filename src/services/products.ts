'use client';

import type { ApiResponse, ProductCreateDto, ProductDetail, ProductListData, ProductListItem, ProductListParams, UploadedImageInfo, UploadType } from '@/types/product';


// 서버 엔티티 기준 정규화
function normalizePayload(p: ProductCreateDto): ProductCreateDto {
  const isFree = p.deliveryType === 'FREE';
  const isConditional = p.deliveryType === 'CONDITIONAL_FREE';

  return {
    ...p,
    deliveryCharge: isFree ? 0 : p.deliveryCharge,
    conditionalFreeAmount: isConditional ? (p.conditionalFreeAmount ?? 0) : null,
    sellingStartDate: p.isPlanned ? p.sellingStartDate : null,
    sellingEndDate: p.isPlanned ? p.sellingEndDate : null,
    tags: p.tags ?? [],
    options: p.options ?? [],
    additionalProducts: p.additionalProducts ?? [],
    images: p.images ?? [],
  };
}

// 공용 목록 읽기용 kind 
export type ProductKind =
  | 'all'
  | 'upcoming'
  | 'restock'
  | 'planned'
  | 'onsale'
  | 'new'
  | 'low-stock';

// 프리셋 엔드포인트 매핑
function resolveProductPath(kind: ProductKind) {
  switch (kind) {
    case 'all':       return '/api/products';
    case 'upcoming':  return '/api/products/upcoming';
    case 'restock':   return '/api/products/restock';
    case 'planned':   return '/api/products/planned';
    case 'onsale':    return '/api/products/onsale';
    case 'new':       return '/api/products/new';
    case 'low-stock': return '/api/products/low-stock';
  }
}


// tagIds(tagIds=1&tagIds=2...) 
function buildProductListQuery(params: ProductListParams) {
  const sp = new URLSearchParams();

  if (params.categoryId != null) sp.set('categoryId', String(params.categoryId));
  if (params.minPrice != null) sp.set('minPrice', String(params.minPrice));
  if (params.maxPrice != null) sp.set('maxPrice', String(params.maxPrice));
  if (params.deliveryType) sp.set('deliveryType', params.deliveryType);
  if (params.sort) sp.set('sort', params.sort);
  if (params.page != null) sp.set('page', String(params.page)); // 1부터
  if (params.size != null) sp.set('size', String(params.size));
  (params.tagIds ?? []).forEach((id) => sp.append('tagIds', String(id)));

  const q = sp.toString();
  return q ? `?${q}` : '';
}

// 에디터 (description) 이미지 업로드
export async function uploadDescriptionImages(files: File[]): Promise<string[]> {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));

  let token = '';
  try {
    token = localStorage.getItem('accessToken') || '';
  } catch {}

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/description-images`,
    {
      method: 'POST',
      body: form,
      // FormData 사용 시 Content-Type은 브라우저가 자동 설정 
      headers: {
        accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      // 세션/쿠키 기반 인증
      credentials: 'include',
    }
  );


  if (!res.ok) {
    let msg = '설명 이미지 업로드 실패';
    try {
      const j = await res.json();
      if (j?.msg) msg = j.msg;
    } catch {}
    if (res.status === 401) {
      throw new Error('로그인이 필요합니다.');
    }
    throw new Error(msg);
  }


  type DescriptionUploadResponse = ApiResponse<Array<{ fileUrl: string }>>;
  const json = (await res.json()) as DescriptionUploadResponse;
  const urls: string[] =
    (json?.data ?? [])
      .map((item) => item.fileUrl)
      .filter((u): u is string => typeof u === 'string' && u.length > 0);

  if (!urls.length) throw new Error('설명 이미지 업로드 결과가 비어 있습니다.');
  return urls;
}


// (첨부파일) 이미지 업로드
export async function uploadProductImages(
  files: File[],
  types: UploadType[]
): Promise<UploadedImageInfo[]> {
  if (!files?.length) throw new Error('업로드할 파일이 없습니다.');
  if (!types?.length) throw new Error('업로드 타입이 없습니다.');
  if (files.length !== types.length) {
    throw new Error(`files(${files.length})와 types(${types.length}) 개수가 일치하지 않습니다.`);
  }

  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  types.forEach((t) => form.append('types', t));

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/images`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });

  const json = (await res.json()) as ApiResponse<UploadedImageInfo[]>;
  if (!res.ok || json.resultCode !== '200' || !json.data) {
    throw new Error(json.msg || '이미지 업로드 실패');
  }
  return json.data;
}

// (첨부파일) s3 이미지 개별 삭제
export async function deleteProductImage(s3Key: string): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/images?s3Key=${encodeURIComponent(s3Key)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { accept: 'application/json;charset=UTF-8' },
    credentials: 'include',
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.resultCode !== '200') {
    const msg = json?.msg || '파일 삭제 실패';
    throw new Error(msg);
  }
  // 서버 예시: data = "product-images/uuid1.png"
  return json.data as string;
}

// 상품 생성
export async function createProduct(dto: ProductCreateDto): Promise<string> {
  const body = normalizePayload(dto);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new Error('인증이 필요합니다.');
  if (res.status === 403) throw new Error('상품 등록 권한이 없습니다.');

  if (res.status === 400) {
    try {
      const j = (await res.json()) as ApiResponse<null>;
      throw new Error(j?.msg || '잘못된 요청입니다.');
    } catch {
      throw new Error('잘못된 요청입니다.');
    }
  }

  const text = await res.text();
  if (!res.ok) throw new Error('상품 등록 실패');

  const json = JSON.parse(text) as ApiResponse<string | null>;
  if (json.resultCode !== '200' || !json.data) {
    throw new Error(json.msg || '상품 등록 실패');
  }
  return json.data;
}


// 상품 수정
export async function updateProduct(productUuid: string, dto: ProductCreateDto): Promise<string> {
  const body = normalizePayload(dto);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/${productUuid}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    },
  );

  if (res.status === 401) throw new Error('인증이 필요합니다.');
  if (res.status === 403) throw new Error('본인이 등록한 상품만 수정 가능합니다.');

  if (res.status === 400) {
    try {
      const j = (await res.json()) as ApiResponse<null>;
      throw new Error(j?.msg || '잘못된 요청입니다.');
    } catch {
      throw new Error('잘못된 요청입니다.');
    }
  }

  const text = await res.text();
  if (!res.ok) throw new Error('상품 수정 실패');

  const json = JSON.parse(text) as ApiResponse<string | null>;
  if (json.resultCode !== '200' || !json.data) {
    throw new Error(json.msg || '상품 수정 실패');
  }
  return json.data;
}

// 상품 삭제
export async function deleteProduct(productUuid: string): Promise<string> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/${productUuid}`,
    {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    },
  );

  if (res.status === 401) throw new Error('인증이 필요합니다.');
  if (res.status === 403) throw new Error('본인이 등록한 상품만 삭제 가능합니다.');

  if (res.status === 400) {
    try {
      const j = (await res.json()) as ApiResponse<null>;
      throw new Error(j?.msg || '잘못된 요청입니다.');
    } catch {
      throw new Error('잘못된 요청입니다.');
    }
  }

  const text = await res.text();
  if (!res.ok) throw new Error('상품 삭제 실패');

  const json = JSON.parse(text) as ApiResponse<string | null>;
  if (json.resultCode !== '200') {
    throw new Error(json.msg || '상품 삭제 실패');
  }

  return json.data ?? productUuid;
}

// 전체상품목록 조회
export async function getProducts(params: ProductListParams): Promise<ProductListData> {
  const query = buildProductListQuery(params);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products${query}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  const text = await res.text();
  if (!res.ok) {
    try {
      const j = JSON.parse(text) as ApiResponse<null>;
      throw new Error(j?.msg || `상품 목록 조회 실패 (${res.status})`);
    } catch {
      throw new Error(`상품 목록 조회 실패 (${res.status})`);
    }
  }

  const json = JSON.parse(text) as ApiResponse<ProductListData | null>;
  if (json.resultCode !== '200' || !json.data) {
    throw new Error(json.msg || '상품 목록 조회 실패');
  }

  return json.data;
}


export type ArtistProductListParams = {
  page?: number;                 // 0-based
  size?: number;                 // 기본 10
  keyword?: string;  
  selling?: boolean; 
  sort?: 'createDate' | 'price' | 'name';
  order?: 'ASC' | 'DESC';
};

export type ArtistProduct = {
  wishId?: string;
  productId?: number;
  productNumber?: string;
  productName: string;
  price: number;
  artist?: { id: string; name: string };
  imageUrl?: string;
  sellingStatus?: 'SELLING' | 'STOPPED' | 'SOLD_OUT' | string;
  registeredDate?: string; 
  addedAt?: string;
  productPageUrl?: string;
  permissions?: { canUnwish?: boolean };
};

export type ArtistProductListData = {
  content: ArtistProduct[];
  page: number;           // 0-based
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

// 작가별 상품 조회
export async function fetchArtistProducts(params: ArtistProductListParams = {}): Promise<ArtistProductListData> {
  const {
    page = 0,
    size = 10,
    keyword,
    selling,
    sort = 'createDate',
    order = 'DESC',
  } = params;

  const sp = new URLSearchParams();
  sp.set('page', String(page));     // 0-based
  sp.set('size', String(size));
  if (keyword) sp.set('keyword', keyword);
  if (typeof selling === 'boolean') sp.set('selling', String(selling));
  if (sort) sp.set('sort', sort);
  if (order) sp.set('order', order);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard/artist/products?${sp.toString()}`, {
    method: 'GET',
    headers: { accept: 'application/json;charset=UTF-8' },
    credentials: 'include',
  });

  const text = await res.text();
  if (!res.ok) {
    try {
      const j = JSON.parse(text) as ApiResponse<null>;
      throw new Error(j?.msg || `내 상품 목록 조회 실패 (${res.status})`);
    } catch {
      throw new Error(`내 상품 목록 조회 실패 (${res.status})`);
    }
  }

  const json = JSON.parse(text) as ApiResponse<ArtistProductListData | null>;
  if (json.resultCode !== '200' || !json.data) {
    throw new Error(json.msg || '내 상품 목록 조회 실패');
  }
  return json.data;
}

// 안전한 JSON 파싱 
async function safeParseJson<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// /api/products  UI 0-base → 서버 1-base
function buildAllListQuery(params?: ProductListParams) {
  if (!params) return '';
  const sp = new URLSearchParams();

  const set = (k: string, v?: string | number | boolean | null) => {
    if (v === undefined || v === null) return;
    sp.set(k, String(v));
  };

  set('categoryId', params.categoryId);
  set('minPrice', params.minPrice);
  set('maxPrice', params.maxPrice);
  set('deliveryType', params.deliveryType);
  set('sort', params.sort ?? 'newest');
  set('page', (params.page ?? 0) + 1); // 서버 1-base로 변환
  set('size', params.size ?? 12);

  (params.tagIds ?? []).forEach((id) => sp.append('tagIds', String(id)));

  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

// 서버 응답(여러 스키마)을 UI 기준 ProductListData로
function normalizeProductsPaged(input: unknown, fallbackSize: number): ProductListData {
  const empty: ProductListData = {
    page: 0,
    size: fallbackSize,
    totalElements: 0,
    totalPages: 0,
    products: [],
  };
  if (input == null) return empty;

  // ApiResponse<ProductListResponse>
  // ProductListResponse: { page(1-base), size, totalElements, totalPages, products: [...] }
  const asApi = input as ApiResponse<{
    page: number;       // 1-base
    size: number;
    totalElements: number;
    totalPages: number;
    products: Array<{
      productUuid: string;
      url: string;
      brandName: string;
      name: string;
      price: number;
      discountRate: number;
      discountPrice: number;
      rating: number | null;
    }>;
  }>;

  if (asApi && typeof asApi === 'object' && 'data' in asApi) {
    const d = asApi.data;
    if (d && Array.isArray(d.products)) {
      return {
        page: Math.max(0, (d.page ?? 1) - 1), // 1-base → 0-base
        size: d.size ?? fallbackSize,
        totalElements: d.totalElements ?? 0,
        totalPages: d.totalPages ?? 0,
        products: d.products.map((p) => ({
          productUuid: p.productUuid,
          url: p.url,
          brandName: p.brandName,
          name: p.name,
          price: p.price,
          discountRate: p.discountRate,
          discountPrice: p.discountPrice,
          rating: p.rating ?? null,
        })),
      };
    }
  }

  // 프리셋 API(/new, /onsale ...): { code?, message?, data: ProductListItem[] }
  const asArrayEnvelope = input as { data?: unknown };
  if (asArrayEnvelope && Array.isArray(asArrayEnvelope.data)) {
    const list = asArrayEnvelope.data as ProductListItem[];
    const total = list.length;
    return {
      page: 0,
      size: Math.max(fallbackSize, total),
      totalElements: total,
      totalPages: total ? 1 : 0,
      products: list,
    };
  }

  return empty;
}

// 상품 목록  (UI 0-base)
export async function fetchProductList(kind: ProductKind, params?: ProductListParams): Promise<ProductListData> {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '') + resolveProductPath(kind);
  const url = kind === 'all' ? base + buildAllListQuery(params) : base;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      cache: 'no-store',
      credentials: 'include',
    });

    const parsed = await safeParseJson<unknown>(res);

    if (res.status === 404) {
      return normalizeProductsPaged(parsed, params?.size ?? 12);
    }

    if (!res.ok) {
      console.error('[fetchProductList] FAIL', { url, status: res.status, parsed });
      return normalizeProductsPaged(parsed, params?.size ?? 12);
    }

    return normalizeProductsPaged(parsed, params?.size ?? 12);
  } catch (e) {
    console.error('[fetchProductList] EXCEPTION', e);
    return { page: 0, size: params?.size ?? 12, totalElements: 0, totalPages: 0, products: [] };
  }
}


// 상품 상세
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');

export async function fetchProductDetail(productUuid: string): Promise<ProductDetail> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/${productUuid}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.msg ?? '상품 상세 조회 실패');

  const data = json?.data;
  const images = (data?.images ?? []).map((d: any) => ({
    url: d.url,
    type: d.type,
    s3Key: d.s3Key,
    originalFileName: d.originalFileName,
  }));

  return {
    ...data,
    images,
  } as ProductDetail;
}


// 가격 포맷
export const formatWon = (n: number | null | undefined) =>
  typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString('ko-KR') + '원' : '-';



