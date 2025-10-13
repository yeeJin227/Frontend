const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');

export type FaqCategory =
  | 'ACCOUNT'
  | 'ORDER'
  | 'PAYMENT'
  | 'DELIVERY'
  | 'EXCHANGE_RETURN'
  | 'PRODUCT'
  | 'FUNDING'
  | 'ARTIST'
  | 'SERVICE'
  | 'ETC';

export const FAQ_CATEGORY_OPTIONS: ReadonlyArray<{ value: FaqCategory; label: string }> = [
  { value: 'ACCOUNT', label: '회원/계정' },
  { value: 'ORDER', label: '주문' },
  { value: 'PAYMENT', label: '결제' },
  { value: 'DELIVERY', label: '배송' },
  { value: 'EXCHANGE_RETURN', label: '교환/반품' },
  { value: 'PRODUCT', label: '상품' },
  { value: 'FUNDING', label: '펀딩' },
  { value: 'ARTIST', label: '작가' },
  { value: 'SERVICE', label: '서비스' },
  { value: 'ETC', label: '기타' },
];

export type FaqSummary = {
  id: number;
  question: string;
  category: FaqCategory | string;
  categoryDisplayName?: string;
  viewCount: number;
  createDate?: string;
};

export type FaqList = {
  faqs: FaqSummary[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
};

type ApiEnvelope<T> = {
  resultCode?: string;
  msg?: string;
  message?: string;
  data?: T;
};

function extractMessage<T>(payload: ApiEnvelope<T> | null, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload.msg === 'string' && payload.msg.trim()) return payload.msg.trim();
  if (typeof payload.message === 'string' && payload.message.trim()) return payload.message.trim();
  if (typeof payload.resultCode === 'string' && payload.resultCode.trim()) {
    return `${fallback} (${payload.resultCode.trim()})`;
  }
  return fallback;
}

async function parseResponse<T>(res: Response, fallback: string): Promise<ApiEnvelope<T>> {
  const payload = (await res
    .json()
    .catch(() => null)) as ApiEnvelope<T> | null;

  if (!res.ok) {
    const message = extractMessage(payload, fallback);
    const error = new Error(message);
    (error as Error & { status?: number }).status = res.status;
    throw error;
  }

  return payload ?? {};
}

function resolveFaqList(data: unknown): FaqList {
  if (!data || typeof data !== 'object') {
    throw new Error('잘못된 FAQ 응답입니다.');
  }

  const payload = data as {
    faqs?: unknown;
    currentPage?: unknown;
    pageSize?: unknown;
    totalPages?: unknown;
    totalElements?: unknown;
  };

  const faqs: FaqSummary[] = Array.isArray(payload.faqs)
    ? payload.faqs.reduce<FaqSummary[]>((acc, entry) => {
        if (!entry || typeof entry !== 'object') return acc;
        const raw = entry as {
          id?: unknown;
          question?: unknown;
          category?: unknown;
          categoryDisplayName?: unknown;
          viewCount?: unknown;
          createDate?: unknown;
        };
        const id = Number(raw.id);
        if (!Number.isFinite(id)) return acc;
        acc.push({
          id,
          question: typeof raw.question === 'string' ? raw.question : '',
          category:
            typeof raw.category === 'string' && raw.category.trim()
              ? (raw.category as string)
              : 'ETC',
          categoryDisplayName:
            typeof raw.categoryDisplayName === 'string' ? raw.categoryDisplayName : undefined,
          viewCount: Number(raw.viewCount ?? 0) || 0,
          createDate: typeof raw.createDate === 'string' ? raw.createDate : undefined,
        });
        return acc;
      }, [])
    : [];

  const rawCurrentPage = Number(payload.currentPage);
  const currentPage = Number.isFinite(rawCurrentPage) ? Math.max(0, rawCurrentPage - 1) : 0;

  const rawPageSize = Number(payload.pageSize);
  const pageSize = Number.isFinite(rawPageSize) ? rawPageSize : faqs.length || 10;

  const rawTotalPages = Number(payload.totalPages);
  const totalPages = Number.isFinite(rawTotalPages) ? Math.max(1, rawTotalPages) : 1;

  const rawTotalElements = Number(payload.totalElements);
  const totalElements = Number.isFinite(rawTotalElements) ? Math.max(0, rawTotalElements) : faqs.length;

  return {
    faqs,
    currentPage,
    pageSize,
    totalPages,
    totalElements,
  };
}

export type FetchFaqListParams = {
  category?: FaqCategory | string;
  page?: number;
  size?: number;
};

export async function fetchFaqList(params: FetchFaqListParams = {}): Promise<FaqList> {
  const searchParams = new URLSearchParams();
  if (params.category && params.category !== 'ALL') {
    searchParams.set('category', params.category);
  }
  if (typeof params.page === 'number') {
    const pageValue = Math.max(1, params.page + 1);
    searchParams.set('page', String(pageValue));
  }
  if (typeof params.size === 'number') {
    searchParams.set('size', String(params.size));
  }

  const query = searchParams.toString();
  const res = await fetch(`${API_BASE_URL}/api/support/faqs${query ? `?${query}` : ''}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  const payload = await parseResponse<FaqList>(res, 'FAQ 목록을 불러오지 못했습니다.');
  const rawData = (payload.data ?? (payload as unknown)) as unknown;
  return resolveFaqList(rawData);
}

export type CreateFaqPayload = {
  question: string;
  answer: string;
  category: FaqCategory;
};

function buildAuthHeaders(accessToken?: string): HeadersInit {
  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : {};
}

export async function createFaq(payload: CreateFaqPayload, options?: { accessToken?: string }): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/support/faqs`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(options?.accessToken),
    },
    body: JSON.stringify(payload),
  });

  await parseResponse<unknown>(res, 'FAQ를 생성하지 못했습니다.');
}
