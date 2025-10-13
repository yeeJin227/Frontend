
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');

export type ArtistApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ArtistApplicationSummary = {
  applicationId: number;
  applicantId: string;
  artistName: string;
  fundingTitle: string;
  fundingSummary?: string;
  email?: string;
  phone?: string;
  businessNumber?: string;
  businessDocument?: string;
  commerceNumber?: string;
  commerceDocument?: string;
  submittedAt?: string; // 서버 명세서
};

export type ArtistApplication = {
  applicationId: number;
  applicantId: string;
  artistName: string;
  fundingTitle: string;
  fundingSummary: string;
  email: string;
  phone: string;
  businessNumber?: string;
  businessDocument?: string;
  commerceNumber?: string;
  commerceDocument?: string;
  appliedAt: string; // UI
};

export type ArtistApplicationsResponse = {
  resultCode?: string;
  msg?: string;
  data?: {
    content: ArtistApplicationSummary[];
    page?: number;
    size?: number;
    totalElements?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
  };
};

export type ArtistApplicationsParams = {
  status?: ArtistApplicationStatus;
  page?: number;
  size?: number;
  sort?: 'artistName' | 'submittedAt' | 'status';
  order?: 'ASC' | 'DESC';
  keyword?: string;
};

export async function fetchArtistApplications(
  params: ArtistApplicationsParams = {},
  options?: { accessToken?: string },
): Promise<ArtistApplicationSummary[]> {
  const url = new URL(`${API_BASE}/api/dashboard/admin/artist-applications`);

  const page = Number.isFinite(params.page) ? Number(params.page) : 0;
  const size = Number.isFinite(params.size) ? Number(params.size) : 50;

  url.searchParams.set('page', String(Math.max(0, page)));
  url.searchParams.set('size', String(size > 0 ? size : 50));
  url.searchParams.set('sort', params.sort ?? 'submittedAt');
  url.searchParams.set('order', params.order ?? 'DESC');

  if (params.status) url.searchParams.set('status', params.status);
  if (params.keyword?.trim()) url.searchParams.set('keyword', params.keyword.trim());

  const headers: Record<string, string> = {
    accept: 'application/json;charset=UTF-8',
    ...(options?.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
  };

  const res = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
    headers,
    cache: 'no-store',
  });

  const payload: ArtistApplicationsResponse & { message?: string } = await res
    .json()
    .catch(() => ({} as ArtistApplicationsResponse & { message?: string }));

  if (!res.ok) {
    const message = payload.msg || payload.message || '입점 신청 목록을 불러오지 못했습니다.';
    throw new Error(message);
  }

  if (!payload.data || !Array.isArray(payload.data.content)) {
    return [];
  }

  return payload.data.content;
}

export function normalizeArtistApplication(summary: ArtistApplicationSummary): ArtistApplication {
  const resolve = (value: unknown, fallback = '-') =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;

  const applicationId = Number(summary.applicationId);
  const applicantId = resolve(summary.applicantId, `application-${applicationId}`);

  // 서버는 submittedAt, UI는 appliedAt
  const submitted = typeof summary.submittedAt === 'string' ? summary.submittedAt : undefined;

  return {
    applicationId: Number.isFinite(applicationId) ? applicationId : 0,
    applicantId,
    artistName: resolve(summary.artistName, applicantId),
    fundingTitle: resolve(summary.fundingTitle, '제목 미상'),
    fundingSummary: resolve(summary.fundingSummary),
    email: resolve(summary.email),
    phone: resolve(summary.phone),
    businessNumber: (summary.businessNumber ?? undefined) as string | undefined,
    businessDocument: (summary.businessDocument ?? undefined) as string | undefined,
    commerceNumber: (summary.commerceNumber ?? undefined) as string | undefined,
    commerceDocument: (summary.commerceDocument ?? undefined) as string | undefined,
    appliedAt: submitted ?? new Date().toISOString(),
  };
}
