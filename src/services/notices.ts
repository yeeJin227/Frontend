const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');

export type NoticeDocument = {
  id: number;
  fileName: string;
  fileUrl: string;
};

export type NoticeDetail = {
  id: number;
  title: string;
  content: string;
  isImportant: boolean;
  viewCount: number;
  createDate?: string;
  modifyDate?: string;
  documents: NoticeDocument[];
};

export type NoticeSummary = {
  id: number;
  title: string;
  isImportant: boolean;
  viewCount: number;
  documentCount: number;
  createDate?: string;
};

export type NoticeList = {
  notices: NoticeSummary[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  isLast: boolean;
};

type ApiEnvelope<T> = {
  resultCode?: string;
  msg?: string;
  data?: T;
  message?: string;
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

function resolveNoticeDetail(data: unknown): NoticeDetail {
  if (!data || typeof data !== 'object') {
    throw new Error('잘못된 공지사항 응답입니다.');
  }

  const payload = data as {
    id?: unknown;
    title?: unknown;
    content?: unknown;
    isImportant?: unknown;
    viewCount?: unknown;
    createDate?: unknown;
    modifyDate?: unknown;
    documents?: unknown;
  };

  const id = Number(payload.id);
  if (!Number.isFinite(id)) {
    throw new Error('공지사항 ID가 올바르지 않습니다.');
  }

  const title = typeof payload.title === 'string' ? payload.title : '';
  const content = typeof payload.content === 'string' ? payload.content : '';
  const isImportant = Boolean(payload.isImportant);
  const viewCount = Number(payload.viewCount ?? 0);

  const documents: NoticeDocument[] = Array.isArray(payload.documents)
    ? payload.documents
        .map((doc) => {
          if (!doc || typeof doc !== 'object') return null;
          const raw = doc as { id?: unknown; fileName?: unknown; fileUrl?: unknown };
          const docId = Number(raw.id);
          if (!Number.isFinite(docId)) return null;
          const fileName = typeof raw.fileName === 'string' ? raw.fileName : `첨부파일-${docId}`;
          const fileUrl = typeof raw.fileUrl === 'string' ? raw.fileUrl : '';
          if (!fileUrl) return null;
          return { id: docId, fileName, fileUrl };
        })
        .filter((doc): doc is NoticeDocument => Boolean(doc))
    : [];

  return {
    id,
    title,
    content,
    isImportant,
    viewCount: Number.isFinite(viewCount) ? viewCount : 0,
    createDate: typeof payload.createDate === 'string' ? payload.createDate : undefined,
    modifyDate: typeof payload.modifyDate === 'string' ? payload.modifyDate : undefined,
    documents,
  };
}

function resolveNoticeList(data: unknown): NoticeList {
  if (!data || typeof data !== 'object') {
    throw new Error('잘못된 공지사항 목록 응답입니다.');
  }

  const payload = data as {
    notices?: unknown;
    currentPage?: unknown;
    pageSize?: unknown;
    totalPages?: unknown;
    totalElements?: unknown;
    isLast?: unknown;
  };

  const notices: NoticeSummary[] = Array.isArray(payload.notices)
    ? payload.notices.reduce<NoticeSummary[]>((acc, item) => {
        if (!item || typeof item !== 'object') {
          return acc;
        }
        const raw = item as {
          id?: unknown;
          title?: unknown;
          isImportant?: unknown;
          viewCount?: unknown;
          documentCount?: unknown;
          createDate?: unknown;
        };
        const id = Number(raw.id);
        if (!Number.isFinite(id)) {
          return acc;
        }
        acc.push({
          id,
          title: typeof raw.title === 'string' ? raw.title : '',
          isImportant: Boolean(raw.isImportant),
          viewCount: Number(raw.viewCount ?? 0) || 0,
          documentCount: Number(raw.documentCount ?? 0) || 0,
          createDate: typeof raw.createDate === 'string' ? raw.createDate : undefined,
        });
        return acc;
      }, [])
    : [];

  const rawCurrentPage = Number(payload.currentPage);
  const currentPage = Number.isFinite(rawCurrentPage)
    ? Math.max(0, rawCurrentPage - 1)
    : 0;

  const rawPageSize = Number(payload.pageSize);
  const pageSize = Number.isFinite(rawPageSize) ? rawPageSize : notices.length || 10;

  const rawTotalPages = Number(payload.totalPages);
  const totalPages = Number.isFinite(rawTotalPages) ? Math.max(1, rawTotalPages) : 1;

  const rawTotalElements = Number(payload.totalElements);
  const totalElements = Number.isFinite(rawTotalElements)
    ? Math.max(0, rawTotalElements)
    : notices.length;

  return {
    notices,
    currentPage,
    pageSize,
    totalPages,
    totalElements,
    isLast: Boolean(payload.isLast),
  };
}

async function parseResponse<T>(res: Response, fallbackMessage: string): Promise<ApiEnvelope<T>> {
  const payload = (await res
    .json()
    .catch(() => null)) as ApiEnvelope<T> | null;

  if (!res.ok) {
    const message = extractMessage(payload ?? null, fallbackMessage);
    const error = new Error(message);
    (error as Error & { status?: number }).status = res.status;
    throw error;
  }

  return payload ?? {};
}

export async function fetchNoticeDetail(noticeId: string | number): Promise<NoticeDetail> {
  if (noticeId == null) {
    throw new Error('공지사항 ID가 필요합니다.');
  }

  const res = await fetch(`${API_BASE_URL}/api/support/notices/${noticeId}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  const payload = await parseResponse<NoticeDetail>(res, '공지사항을 불러오지 못했습니다.');
  const rawData = (payload.data ?? (payload as unknown)) as unknown;
  return resolveNoticeDetail(rawData);
}

export type NoticeListParams = {
  keyword?: string;
  page?: number;
  size?: number;
};

export async function fetchNoticeList(params: NoticeListParams = {}): Promise<NoticeList> {
  const searchParams = new URLSearchParams();
  if (params.keyword && params.keyword.trim()) {
    searchParams.set('keyword', params.keyword.trim());
  }
  if (typeof params.page === 'number') {
    const pageValue = Math.max(1, params.page + 1);
    searchParams.set('page', String(pageValue));
  }
  if (typeof params.size === 'number') {
    searchParams.set('size', String(params.size));
  }

  const query = searchParams.toString();
  const endpoint = `${API_BASE_URL}/api/support/notices${query ? `?${query}` : ''}`;
  const res = await fetch(endpoint, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  const payload = await parseResponse<NoticeList>(res, '공지사항 목록을 불러오지 못했습니다.');
  const rawData = (payload.data ?? (payload as unknown)) as unknown;
  return resolveNoticeList(rawData);
}

export type UpdateNoticePayload = {
  title: string;
  content: string;
  isImportant: boolean;
  files?: string[];
  deleteFileIds?: number[];
};

export type CreateNoticePayload = {
  title: string;
  content: string;
  isImportant: boolean;
  files?: string[];
};

type NoticeMutationPayload = {
  title: string;
  content: string;
  isImportant: boolean;
  files?: string[];
  deleteFileIds?: number[];
};

function buildNoticeFormBody(payload: NoticeMutationPayload): string {
  const params = new URLSearchParams();
  params.set('title', payload.title);
  params.set('content', payload.content);
  params.set('isImportant', String(payload.isImportant));
  (payload.files ?? []).forEach((fileUrl) => {
    if (fileUrl) params.append('files', fileUrl);
  });
  (payload.deleteFileIds ?? []).forEach((fileId) => {
    params.append('deleteFileIds', String(fileId));
  });
  return params.toString();
}

function buildAuthHeaders(accessToken?: string): HeadersInit {
  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : {};
}

export async function createNotice(payload: CreateNoticePayload, options?: { accessToken?: string }): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/support/notices`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      ...buildAuthHeaders(options?.accessToken),
    },
    body: buildNoticeFormBody(payload),
  });

  await parseResponse<unknown>(res, '공지사항을 생성하지 못했습니다.');
}

export async function updateNotice(
  noticeId: string | number,
  payload: UpdateNoticePayload,
  options?: { accessToken?: string },
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/support/notices/${noticeId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      ...buildAuthHeaders(options?.accessToken),
    },
    body: buildNoticeFormBody(payload),
  });

  await parseResponse<unknown>(res, '공지사항을 수정하지 못했습니다.');
}

export async function deleteNotice(noticeId: string | number, options?: { accessToken?: string }): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/support/notices/${noticeId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      ...buildAuthHeaders(options?.accessToken),
    },
  });

  await parseResponse<unknown>(res, '공지사항을 삭제하지 못했습니다.');
}
