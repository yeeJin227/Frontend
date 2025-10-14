
import type { ReviewStats } from '@/types/review';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');

type ApiResponse<T> = { resultCode?: string; msg?: string; data?: T };


function safeJSON<T = unknown>(text: string): T | undefined {
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}
function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}
function hasProp<T extends string>(
  x: unknown,
  key: T
): x is Record<T, unknown> & Record<string, unknown> {
  return isObject(x) && key in x;
}
function isBoolean(x: unknown): x is boolean {
  return typeof x === 'boolean';
}

// 리뷰 통계 
export async function fetchReviewStats(productId: number): Promise<ReviewStats> {
  const url = new URL(`${API_BASE}/api/reviews/stats`);
  url.searchParams.set('productId', String(productId));

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { accept: 'application/json;charset=UTF-8' },
    credentials: 'include',
    cache: 'no-store',
  });

  const payload = (await res
    .json()
    .catch(() => ({}))) as ApiResponse<ReviewStats> & { message?: string };

  if (!res.ok) {
    throw new Error(payload.msg || payload.message || `리뷰 통계 요청 실패 (HTTP ${res.status})`);
  }

  if (payload.data) return payload.data;

  // (임시)
  const maybeStats = payload as unknown as ReviewStats;
  if (typeof maybeStats?.totalReviewCount === 'number') return maybeStats;

  throw new Error('리뷰 통계 응답 형식이 올바르지 않습니다.');
}

// 리뷰 목록 
export type ReviewTypeParam = 'PHOTO' | 'GENERAL' | 'ALL';

export type ReviewImageDto = {
  imageId: number;
  imageUrl: string;
  originalFileName: string;
  s3Key: string;
  fileType: string;
  sortOrder: number;
};

export type ReviewDto = {
  reviewId: number;
  productId: number;
  productName: string;
  userId: number;
  userName: string;
  userProfileImageUrl?: string | null;
  rating: number;
  content: string;
  likeCount: number;
  isPhotoReview: boolean;
  images: ReviewImageDto[];
  hashtags: string[];
  productOption?: string | null;
  isLiked: boolean;
  createdAt: string;
  modifiedAt?: string | null;
};

export type ReviewListResponse = {
  reviews: ReviewDto[];
  totalCount: number;
  photoReviewCount: number;
  generalReviewCount: number;
  averageRating: number;
  hasNext: boolean;
  currentPage: number; // 1-based
  totalPages: number;
};

type ReviewListEnvelope = ApiResponse<ReviewListResponse> | ReviewListResponse;

function isReviewListResponse(x: unknown): x is ReviewListResponse {
  return (
    isObject(x) &&
    Array.isArray((x as ReviewListResponse).reviews) &&
    typeof (x as ReviewListResponse).totalCount === 'number'
  );
}

export async function fetchReviews(params: {
  productId: number;
  reviewType?: ReviewTypeParam; // PHOTO | GENERAL | ALL
  page?: number; // 1-based
  size?: number;
}): Promise<ReviewListResponse> {
  const { productId, reviewType = 'ALL', page = 1, size = 20 } = params;

  const url = new URL(`${API_BASE}/api/reviews`);
  url.searchParams.set('productId', String(productId));
  url.searchParams.set('reviewType', reviewType);
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(size));

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { accept: 'application/json;charset=UTF-8' },
    credentials: 'include',
    cache: 'no-store',
  });

  const text = await res.text().catch(() => '');
  const parsed = safeJSON<ReviewListEnvelope & { msg?: string }>(text) ?? {};

  if (!res.ok) {
    const msg = (isObject(parsed) && typeof parsed.msg === 'string' && parsed.msg) || '';
    throw new Error(msg || `리뷰 목록 요청 실패 (HTTP ${res.status})`);
  }

  let data: unknown = parsed;
  if (isObject(parsed) && hasProp(parsed, 'data')) data = parsed.data;

  if (!isReviewListResponse(data)) {
    return {
      reviews: [],
      totalCount: 0,
      photoReviewCount: 0,
      generalReviewCount: 0,
      averageRating: 0,
      hasNext: false,
      currentPage: page,
      totalPages: 0,
    };
  }
  return data;
}

// 좋아요 토글 
export async function toggleReviewLike(
  reviewId: number,
  options?: { accessToken?: string }
): Promise<boolean> {
  const url = `${API_BASE}/api/reviews/${reviewId}/like`;

  const headers: Record<string, string> = {
    accept: 'application/json;charset=UTF-8',
  };
  if (options?.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: '',
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    const j = safeJSON<{ resultCode?: string; msg?: string }>(text);
    throw new Error((j && j.msg) || text || `좋아요 요청 실패 (HTTP ${res.status})`);
  }

  const parsed = safeJSON<unknown>(text);

  // 1) 순수 boolean
  if (isBoolean(parsed)) return parsed;

  // 2) 문자열 "true"/"false"
  if (text.trim() === 'true') return true;
  if (text.trim() === 'false') return false;

  // 3) 객체 래핑
  if (isObject(parsed)) {
    const rc = hasProp(parsed, 'resultCode') ? parsed.resultCode : undefined;
    if (typeof rc === 'string' && rc !== '200') {
      const msg = hasProp(parsed, 'msg') && typeof parsed.msg === 'string' ? parsed.msg : '좋아요 실패';
      throw new Error(msg);
    }
    if (hasProp(parsed, 'data') && isBoolean(parsed.data)) return parsed.data;
  }

  return true;
}

// 리뷰 이미지 업로드 
export type UploadedImageDto = {
  url: string;
  type: 'MAIN' | 'ADDITIONAL' | 'THUMBNAIL' | 'DOCUMENT';
  s3Key: string;
  originalFileName: string;
};

// POST /api/reviews/images/upload (multipart/form-data)

export async function uploadReviewImages(
  files: File[],
  types: ('MAIN' | 'ADDITIONAL' | 'THUMBNAIL' | 'DOCUMENT')[],
  options?: { accessToken?: string }
): Promise<UploadedImageDto[]> {
  if (!files.length) return [];

  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  types.forEach((t) => form.append('types', t));

  const headers: Record<string, string> = { accept: 'application/json;charset=UTF-8' };
  if (options?.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

  const res = await fetch(`${API_BASE}/api/reviews/images/upload`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: form,
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    const j = safeJSON<{ resultCode?: string; msg?: string }>(text);
    throw new Error((j && j.msg) || text || `리뷰 이미지 업로드 실패 (HTTP ${res.status})`);
  }

  const parsed = safeJSON<unknown>(text);

  // Array<UploadedImageDto> | { data: Array<UploadedImageDto> }
  if (Array.isArray(parsed)) return parsed as UploadedImageDto[];
  if (isObject(parsed) && hasProp(parsed, 'data') && Array.isArray(parsed.data)) {
    return parsed.data as UploadedImageDto[];
  }

  throw new Error('리뷰 이미지 업로드 응답 형식이 올바르지 않습니다.');
}

// 리뷰 작성 
export type CreateReviewBody = {
  productId: number;
  rating: number; // 1~5
  content?: string; // <=1000
  images?: UploadedImageDto[]; 
  hashtags?: string[]; // # 제거된 문자열 배열
  productOption?: string;
};

// POST /api/reviews

export async function createReview(
  body: CreateReviewBody,
  options?: { accessToken?: string }
): Promise<ReviewDto> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    accept: 'application/json;charset=UTF-8',
  };
  if (options?.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

  const res = await fetch(`${API_BASE}/api/reviews`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(body),
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    const j = safeJSON<{ resultCode?: string; msg?: string }>(text);
    throw new Error((j && j.msg) || text || `리뷰 작성 실패 (HTTP ${res.status})`);
  }

  const parsed = safeJSON<unknown>(text);
  if (isObject(parsed)) {
    if (hasProp(parsed, 'data') && isObject(parsed.data)) {
      return parsed.data as ReviewDto;
    }
    return parsed as ReviewDto; 
  }

  throw new Error('리뷰 작성 응답 파싱 실패');
}
