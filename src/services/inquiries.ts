const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');

export type InquiryCategory =
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

export const INQUIRY_CATEGORY_OPTIONS: ReadonlyArray<{ value: InquiryCategory; label: string }> = [
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

export type InquirySummary = {
  id: number;
  category: InquiryCategory | string;
  title: string;
  authorName?: string;
  createDate?: string;
  viewCount: number;
  status: 'PENDING' | 'ANSWERED' | string;
  isSecret: boolean;
  replyCount: number;
};

export type InquiryList = {
  inquiries: InquirySummary[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
};

export type InquiryDocument = {
  id: number;
  fileName: string;
  fileUrl: string;
};

export type InquiryReply = {
  id: number;
  content: string;
  replyType: string;
  authorId?: number;
  authorName?: string;
  childReplies?: string | null;
  createDate?: string;
  modifyDate?: string;
};

export type InquiryDetail = {
  id: number;
  category: InquiryCategory | string;
  title: string;
  content: string;
  status: string;
  isSecret: boolean;
  authorId?: number;
  authorName?: string;
  viewCount: number;
  documents: InquiryDocument[];
  replies: InquiryReply[];
  createDate?: string;
  modifyDate?: string;
};

export type CreateInquiryPayload = {
  category: InquiryCategory;
  title: string;
  content: string;
  isSecret: boolean;
  files?: string[];
};

export type UpdateInquiryPayload = {
  category: InquiryCategory;
  title: string;
  content: string;
  isSecret: boolean;
  files?: string[];
  deleteFileIds?: number[];
};

export type CreateInquiryReplyPayload = {
  content: string;
  parentReplyId?: number;
};

type InquiryFormPayload = CreateInquiryPayload | UpdateInquiryPayload;

function buildInquiryFormBody(payload: InquiryFormPayload): string {
  const params = new URLSearchParams();
  params.set('category', payload.category);
  params.set('title', payload.title);
  params.set('content', payload.content);
  params.set('isSecret', String(payload.isSecret));
  (payload.files ?? []).forEach((fileUrl) => {
    if (fileUrl) params.append('files', fileUrl);
  });
  if ('deleteFileIds' in payload && Array.isArray(payload.deleteFileIds)) {
    payload.deleteFileIds.forEach((fileId) => {
      if (Number.isFinite(fileId)) {
        params.append('deleteFileIds', String(fileId));
      }
    });
  }
  return params.toString();
}

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

function resolveInquiryList(data: unknown): InquiryList {
  if (!data || typeof data !== 'object') {
    throw new Error('잘못된 문의 목록 응답입니다.');
  }

  const payload = data as {
    inquiries?: unknown;
    currentPage?: unknown;
    totalPages?: unknown;
    totalElements?: unknown;
    pageSize?: unknown;
  };

  const inquiries: InquirySummary[] = Array.isArray(payload.inquiries)
    ? payload.inquiries.reduce<InquirySummary[]>((acc, entry) => {
        if (!entry || typeof entry !== 'object') return acc;
        const raw = entry as {
          id?: unknown;
          category?: unknown;
          title?: unknown;
          authorName?: unknown;
          createDate?: unknown;
          viewCount?: unknown;
          status?: unknown;
          isSecret?: unknown;
          replyCount?: unknown;
        };
        const id = Number(raw.id);
        if (!Number.isFinite(id)) return acc;
        acc.push({
          id,
          category: typeof raw.category === 'string' ? raw.category : 'ETC',
          title: typeof raw.title === 'string' ? raw.title : '',
          authorName: typeof raw.authorName === 'string' ? raw.authorName : undefined,
          createDate: typeof raw.createDate === 'string' ? raw.createDate : undefined,
          viewCount: Number(raw.viewCount ?? 0) || 0,
          status: typeof raw.status === 'string' ? raw.status : 'PENDING',
          isSecret: Boolean(raw.isSecret),
          replyCount: Number(raw.replyCount ?? 0) || 0,
        });
        return acc;
      }, [])
    : [];

  const rawCurrentPage = Number(payload.currentPage);
  const currentPage = Number.isFinite(rawCurrentPage) ? Math.max(0, rawCurrentPage - 1) : 0;
  const rawTotalPages = Number(payload.totalPages);
  const totalPages = Number.isFinite(rawTotalPages) ? Math.max(1, rawTotalPages) : 1;
  const rawTotalElements = Number(payload.totalElements);
  const totalElements = Number.isFinite(rawTotalElements) ? Math.max(0, rawTotalElements) : inquiries.length;
  const rawPageSize = Number(payload.pageSize);
  const pageSize = Number.isFinite(rawPageSize) ? rawPageSize : inquiries.length || 10;

  return {
    inquiries,
    currentPage,
    totalPages,
    totalElements,
    pageSize,
  };
}

export type FetchInquiryListParams = {
  page?: number;
  size?: number;
};

function buildQuery(params: FetchInquiryListParams): string {
  const searchParams = new URLSearchParams();
  if (typeof params.page === 'number') {
    searchParams.set('page', String(Math.max(1, params.page + 1)));
  }
  if (typeof params.size === 'number') {
    searchParams.set('size', String(params.size));
  }
  return searchParams.toString();
}

export async function fetchPublicInquiries(params: FetchInquiryListParams = {}): Promise<InquiryList> {
  const query = buildQuery(params);
  const res = await fetch(`${API_BASE_URL}/api/support/inquiries/public${query ? `?${query}` : ''}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  const payload = await parseResponse<InquiryList>(res, '문의 목록을 불러오지 못했습니다.');
  const rawData = (payload.data ?? (payload as unknown)) as unknown;
  return resolveInquiryList(rawData);
}

export async function fetchInquiries(params: FetchInquiryListParams = {}): Promise<InquiryList> {
  const query = buildQuery(params);
  const res = await fetch(`${API_BASE_URL}/api/support/inquiries${query ? `?${query}` : ''}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  const payload = await parseResponse<InquiryList>(res, '문의 목록을 불러오지 못했습니다.');
  const rawData = (payload.data ?? (payload as unknown)) as unknown;
  return resolveInquiryList(rawData);
}

export async function fetchInquiryDetail(inquiryId: string | number): Promise<InquiryDetail> {
  if (inquiryId == null) {
    throw new Error('문의 ID가 필요합니다.');
  }

  const res = await fetch(`${API_BASE_URL}/api/support/inquiries/${inquiryId}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  const payload = await parseResponse<InquiryDetail>(res, '문의를 불러오지 못했습니다.');
  const raw = (payload.data ?? (payload as unknown)) as unknown;

  if (!raw || typeof raw !== 'object') {
    throw new Error('문의 응답이 올바르지 않습니다.');
  }

  const data = raw as {
    id?: unknown;
    category?: unknown;
    title?: unknown;
    content?: unknown;
    status?: unknown;
    isSecret?: unknown;
    authorId?: unknown;
    authorName?: unknown;
    viewCount?: unknown;
    documents?: unknown;
    replies?: unknown;
    createDate?: unknown;
    modifyDate?: unknown;
  };

  const id = Number(data.id);
  if (!Number.isFinite(id)) {
    throw new Error('문의 ID가 올바르지 않습니다.');
  }

  const documents: InquiryDocument[] = Array.isArray(data.documents)
    ? data.documents.reduce<InquiryDocument[]>((acc, entry) => {
        if (!entry || typeof entry !== 'object') return acc;
        const doc = entry as { id?: unknown; fileName?: unknown; fileUrl?: unknown };
        const docId = Number(doc.id);
        if (!Number.isFinite(docId)) return acc;
        const fileUrl = typeof doc.fileUrl === 'string' ? doc.fileUrl : '';
        if (!fileUrl) return acc;
        acc.push({
          id: docId,
          fileName: typeof doc.fileName === 'string' ? doc.fileName : `첨부파일-${docId}`,
          fileUrl,
        });
        return acc;
      }, [])
    : [];

  const replies: InquiryReply[] = Array.isArray(data.replies)
    ? data.replies.reduce<InquiryReply[]>((acc, entry) => {
        if (!entry || typeof entry !== 'object') return acc;
        const rawReply = entry as {
          id?: unknown;
          content?: unknown;
          replyType?: unknown;
          authorId?: unknown;
          authorName?: unknown;
          childReplies?: unknown;
          createDate?: unknown;
          modifyDate?: unknown;
        };
        const replyId = Number(rawReply.id);
        if (!Number.isFinite(replyId)) return acc;
        acc.push({
          id: replyId,
          content: typeof rawReply.content === 'string' ? rawReply.content : '',
          replyType: typeof rawReply.replyType === 'string' ? rawReply.replyType : '',
          authorId: typeof rawReply.authorId === 'number' ? rawReply.authorId : undefined,
          authorName: typeof rawReply.authorName === 'string' ? rawReply.authorName : undefined,
          childReplies:
            typeof rawReply.childReplies === 'string' ? rawReply.childReplies : undefined,
          createDate: typeof rawReply.createDate === 'string' ? rawReply.createDate : undefined,
          modifyDate: typeof rawReply.modifyDate === 'string' ? rawReply.modifyDate : undefined,
        });
        return acc;
      }, [])
    : [];

  return {
    id,
    category: typeof data.category === 'string' ? data.category : 'ETC',
    title: typeof data.title === 'string' ? data.title : '',
    content: typeof data.content === 'string' ? data.content : '',
    status: typeof data.status === 'string' ? data.status : 'PENDING',
    isSecret: Boolean(data.isSecret),
    authorId: typeof data.authorId === 'number' ? data.authorId : undefined,
    authorName: typeof data.authorName === 'string' ? data.authorName : undefined,
    viewCount: Number(data.viewCount ?? 0) || 0,
    documents,
    replies,
    createDate: typeof data.createDate === 'string' ? data.createDate : undefined,
    modifyDate: typeof data.modifyDate === 'string' ? data.modifyDate : undefined,
  };
}

export async function createInquiry(
  payload: CreateInquiryPayload,
  options?: { accessToken?: string },
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/support/inquiries`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      ...(options?.accessToken
        ? { Authorization: `Bearer ${options.accessToken}` }
        : {}),
    },
    body: buildInquiryFormBody(payload),
  });
  await parseResponse<unknown>(res, '문의를 등록하지 못했습니다.');
}

export async function createInquiryReply(
  inquiryId: string | number,
  payload: CreateInquiryReplyPayload,
  options?: { accessToken?: string },
): Promise<void> {
  if (!options?.accessToken) {
    throw new Error('로그인 후 이용해 주세요.');
  }

  const res = await fetch(`${API_BASE_URL}/api/support/inquiries/${inquiryId}/replies`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  await parseResponse<unknown>(res, '댓글을 등록하지 못했습니다.');
}

export async function updateInquiry(
  inquiryId: string | number,
  payload: UpdateInquiryPayload,
  options?: { accessToken?: string },
): Promise<void> {
  if (!options?.accessToken) {
    throw new Error('로그인 후 이용해 주세요.');
  }

  const res = await fetch(`${API_BASE_URL}/api/support/inquiries/${inquiryId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Authorization: `Bearer ${options.accessToken}`,
    },
    body: buildInquiryFormBody(payload),
  });

  await parseResponse<unknown>(res, '문의를 수정하지 못했습니다.');
}

export async function deleteInquiry(
  inquiryId: string | number,
  options?: { accessToken?: string },
): Promise<void> {
  if (!options?.accessToken) {
    throw new Error('로그인 후 이용해 주세요.');
  }

  const res = await fetch(`${API_BASE_URL}/api/support/inquiries/${inquiryId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
    },
  });

  await parseResponse<unknown>(res, '문의를 삭제하지 못했습니다.');
}
