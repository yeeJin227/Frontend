'use client';

import type { ApiResponse, ProductCreateDto, ProductListData, ProductListParams, UploadedImageInfo, UploadType } from '@/types/product';

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

  // 에러 처리
  if (!res.ok) {
    let msg = '설명 이미지 업로드 실패';
    try {
      const j = await res.json();
      if (j?.msg) msg = j.msg;
    } catch {}
    if (res.status === 401) {
      // 인증 실패
      throw new Error('로그인이 필요합니다.');
    }
    throw new Error(msg);
  }

  const json = await res.json();
  const urls: string[] = (json?.data ?? [])
    .map((x: any) => x?.fileUrl)
    .filter(Boolean);

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
  keyword?: string;              // 검색어
  selling?: boolean;             // 판매중만 필터
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
  registeredDate?: string; // ISO
  addedAt?: string;        // ISO
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
  sp.set('page', String(page));     // 0-based 주의
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


