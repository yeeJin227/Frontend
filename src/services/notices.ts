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

  const res = await fetch(`${API_BASE_URL}/api/notices/${noticeId}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  const payload = await parseResponse<NoticeDetail>(res, '공지사항을 불러오지 못했습니다.');
  const rawData = (payload.data ?? (payload as unknown)) as unknown;
  return resolveNoticeDetail(rawData);
}

export type UpdateNoticePayload = {
  title: string;
  content: string;
  isImportant: boolean;
  files?: string[];
  deleteFileIds?: number[];
};

export async function updateNotice(noticeId: string | number, payload: UpdateNoticePayload): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/notices/${noticeId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  await parseResponse<unknown>(res, '공지사항을 수정하지 못했습니다.');
}

export async function deleteNotice(noticeId: string | number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/notices/${noticeId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  await parseResponse<unknown>(res, '공지사항을 삭제하지 못했습니다.');
}
