const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');

export type AdminFundingApprovalResponse = {
  resultCode?: string;
  msg?: string;
  data?: unknown;
};

export type FundingApprovalQuery = {
  page?: number;
  size?: number;
  keyword?: string;
  startDate?: string;
  sort?: 'registeredAt' | 'requestedAt' | string;
  order?: 'ASC' | 'DESC' | string;
};

export type FundingApprovalItem = {
  fundingId: number;
  productName: string;
  requestedAt: string;
  [key: string]: unknown;
};

export type FundingApprovalList = {
  content: FundingApprovalItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type FundingApprovalDetail = {
  fundingId: number;
  fundingTitle: string;
  artist?: {
    id?: number;
    name?: string;
    email?: string;
    phone?: string;
  };
  business?: {
    businessNumber?: string;
    telecomSalesNumber?: string;
    businessName?: string;
    businessAddress?: string;
    businessDocument?: string;
    commerceDocument?: string;
  };
  summary?: string;
  images?: Array<{ id?: number; url?: string; description?: string }>;
  [key: string]: unknown;
};

export async function fetchFundingApprovalList(
  query: FundingApprovalQuery = {},
  options?: { accessToken?: string },
): Promise<FundingApprovalList> {
  const params = new URLSearchParams();
  if (typeof query.page === 'number') params.set('page', String(Math.max(0, query.page)));
  if (typeof query.size === 'number') params.set('size', String(Math.max(1, query.size)));
  if (query.keyword && query.keyword.trim()) params.set('keyword', query.keyword.trim());
  if (query.startDate) params.set('startDate', query.startDate);
  if (query.sort) params.set('sort', query.sort);
  if (query.order) params.set('order', query.order);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const res = await fetch(
    `${API_BASE}/api/dashboard/admin/fundings/approvals${params.toString() ? `?${params.toString()}` : ''}`,
    {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers,
    },
  );

  const payload: AdminFundingApprovalResponse & { data?: FundingApprovalList } = await res
    .json()
    .catch(() => ({} as AdminFundingApprovalResponse & { data?: FundingApprovalList }));

  if (!res.ok) {
    const message = payload.msg || '펀딩 승인 대기 목록을 불러오지 못했습니다.';
    throw new Error(message);
  }

  const data = payload.data;
  if (!data || !Array.isArray(data.content)) {
    throw new Error('펀딩 승인 대기 목록 응답이 올바르지 않습니다.');
  }

  return {
    content: data.content.map((item) => {
      const fundingItem = item as FundingApprovalItem;

      return {
        ...item,
        fundingId: Number(fundingItem.fundingId ?? 0),
        productName: String(fundingItem.productName ?? ''),
        requestedAt: String(fundingItem.requestedAt ?? ''),
      };
    }),
    page: Number(data.page ?? 0) || 0,
    size: Number(data.size ?? data.content.length) || data.content.length,
    totalElements: Number(data.totalElements ?? data.content.length) || data.content.length,
    totalPages: Number(data.totalPages ?? 1) || 1,
    hasNext: Boolean(data.hasNext),
    hasPrevious: Boolean(data.hasPrevious),
  };
}

export async function fetchFundingApprovalDetail(
  fundingId: string | number,
  options?: { accessToken?: string },
): Promise<FundingApprovalDetail> {
  if (fundingId == null) {
    throw new Error('펀딩 ID가 필요합니다.');
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const res = await fetch(`${API_BASE}/api/dashboard/admin/fundings/approvals/${fundingId}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers,
  });

  const payload: AdminFundingApprovalResponse & { data?: FundingApprovalDetail } = await res
    .json()
    .catch(() => ({} as AdminFundingApprovalResponse & { data?: FundingApprovalDetail }));

  if (!res.ok) {
    const message = payload.msg || '펀딩 승인 상세 정보를 불러오지 못했습니다.';
    throw new Error(message);
  }

  if (!payload.data) {
    throw new Error('펀딩 승인 상세 정보가 없습니다.');
  }

  const rawDetail = (payload.data ?? {}) as Record<string, unknown>;
  const detail = { ...rawDetail } as Record<string, unknown>;

  const rawFundingId = detail.fundingId;
  const rawFundingTitle = detail.fundingTitle;
  const artist = detail.artist;
  const business = detail.business;
  const summary = detail.summary;
  const images = detail.images;

  delete detail.fundingId;
  delete detail.fundingTitle;
  delete detail.artist;
  delete detail.business;
  delete detail.summary;
  delete detail.images;

  return {
    fundingId: Number(rawFundingId ?? fundingId),
    fundingTitle: typeof rawFundingTitle === 'string' ? rawFundingTitle : '',
    artist: artist as FundingApprovalDetail['artist'],
    business: business as FundingApprovalDetail['business'],
    summary: typeof summary === 'string' ? summary : undefined,
    images: Array.isArray(images)
      ? (images as FundingApprovalDetail['images'])
      : undefined,
    ...detail,
  };
}

export async function approveFundingApplication(
  applicationId: string | number,
  options?: { accessToken?: string },
): Promise<AdminFundingApprovalResponse> {
  if (!applicationId && applicationId !== 0) {
    throw new Error('승인할 신청 ID가 없습니다.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(
    `${API_BASE}/api/dashboard/admin/artist-applications/${applicationId}/approve`,
    {
      method: 'POST',
      credentials: 'include',
      headers,
    },
  );

  const payload: AdminFundingApprovalResponse & { message?: string } = await response
    .json()
    .catch(() => ({} as AdminFundingApprovalResponse & { message?: string }));

  if (!response.ok) {
    const message = payload.msg || payload.message || '펀딩 승인에 실패했습니다.';
    throw new Error(message);
  }

  return payload;
}



export async function rejectFundingApplication(
  applicationId: string | number,
  rejectionReason: string,
  options?: { accessToken?: string },
): Promise<AdminFundingApprovalResponse> {
  if (!applicationId && applicationId !== 0) {
    throw new Error('거절할 신청 ID가 없습니다.');
  }

  const reason = rejectionReason.trim();
  if (reason.length === 0) {
    throw new Error('거절 사유를 입력해 주세요.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(
    `${API_BASE}/api/dashboard/admin/artist-applications/${applicationId}/reject`,
    {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ rejectionReason: reason }),
    },
  );

  const payload: AdminFundingApprovalResponse & { message?: string } = await response
    .json()
    .catch(() => ({} as AdminFundingApprovalResponse & { message?: string }));

  if (!response.ok) {
    const message = payload.msg || payload.message || '입점 거절에 실패했습니다.';
    throw new Error(message);
  }

  return payload;
}
