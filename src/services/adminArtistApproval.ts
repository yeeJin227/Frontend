
type ApiResponse<T> = { resultCode: string; msg: string; data: T };
type Options = { accessToken?: string };


async function parseOkJson<T>(res: Response, fallbackMsg: string): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `${fallbackMsg} (HTTP ${res.status})`);
  }
  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    const text = await res.text().catch(() => '');
    throw new Error(text || fallbackMsg);
  }
  if (json.resultCode !== '200') {
    throw new Error(json.msg || fallbackMsg);
  }
  return json.data;
}

// 승인 
export async function approveArtistApplication(applicationId: number, opts: Options = {}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard/admin/artist-applications/${applicationId}/approve`, {
    method: 'POST',
    headers: {
      accept: 'application/json;charset=UTF-8',
      'content-type': 'application/json;charset=UTF-8',
      ...(opts.accessToken ? { Authorization: `Bearer ${opts.accessToken}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({}),
    cache: 'no-store',
  });
  return parseOkJson<unknown>(res, '입점 승인에 실패했습니다.');
}

// 거절
export async function rejectArtistApplication(
  applicationId: number,
  rejectionReason: string,
  opts: Options = {},
) {
  const trimmed = (rejectionReason ?? '').trim();
  if (!trimmed) {
    throw new Error('거절 사유를 입력해 주세요.');
  }

  const payload = { rejectionReason: trimmed, reason: trimmed };


  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard/admin/artist-applications/${applicationId}/reject`, {
    method: 'POST',
    headers: {
      accept: 'application/json;charset=UTF-8',
      'content-type': 'application/json;charset=UTF-8',
      ...(opts.accessToken ? { Authorization: `Bearer ${opts.accessToken}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  return parseOkJson<string>(res, '입점 거절에 실패했습니다.');
}



const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

// 서버 응답

export type AdminArtistApplicationResponse = {
  summary: unknown;
  content: Array<{
    applicationId: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
    submittedAt?: string;

    // DTO 
    artist?: { memberId?: string; name?: string };
    permissions?: { canApprove: boolean; canReject: boolean };

    name?: string;
    requestedArtistName?: string;
    artistName?: string;

    email?: string;
    phone?: string;
    businessNumber?: string;
    commerceNumber?: string; // 통신판매업
    fundingTitle?: string;
    fundingSummary?: string;
    businessDocument?: string;  // 사업자등록증 URL
    commerceDocument?: string;  // 통신판매업 신고증 URL
  }>;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

// ui

export type ArtistApplication = {
  applicationId: number;
  artistName: string;
  applicantId: string;
  appliedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  permissions: { canApprove: boolean; canReject: boolean };

  // 상세 모달에서 표시
  email?: string;
  phone?: string;
  businessNumber?: string;
  commerceNumber?: string;
  fundingTitle?: string;
  fundingSummary?: string;
  businessDocument?: string;
  commerceDocument?: string;
};


function buildQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    sp.append(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

// 입점 신청 목록 조회
export async function fetchArtistApplications(
  params: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
    page?: number; // 0-base
    size?: number;
    sort?: 'submittedAt' | string;
    order?: 'ASC' | 'DESC';
  },
  opts: Options = {},
): Promise<AdminArtistApplicationResponse['content']> {
  const q = buildQuery({
    status: params.status,
    page: params.page ?? 0,
    size: params.size ?? 20,
    sort: params.sort ?? 'submittedAt',
    order: params.order ?? 'DESC',
  });

  const res = await fetch(
    `${API_BASE}/api/dashboard/admin/artist-applications${q}`,
    {
      method: 'GET',
      headers: {
        accept: 'application/json;charset=UTF-8',
        ...(opts.accessToken ? { Authorization: `Bearer ${opts.accessToken}` } : {}),
      },
      credentials: 'include',
      cache: 'no-store',
    },
  );

  const data = await parseOkJson<AdminArtistApplicationResponse>(res, '입점 신청 목록을 불러오지 못했습니다.');
  return data.content ?? [];
}


// 신청자가 입력한 작가명 우선

export function normalizeArtistApplication(
  api: AdminArtistApplicationResponse['content'][number],
): ArtistApplication {
  const id = Number(api.applicationId);

  const rawName =
    (api.artist?.name ?? '').trim() ||
    (api.requestedArtistName ?? '').trim() ||
    (api.artistName ?? '').trim() ||
    (api.name ?? '').trim();

  const artistName = rawName || `application-${id}`;

  return {
    applicationId: id,
    artistName,
    applicantId: api.artist?.memberId ?? '',
    appliedAt: api.submittedAt ?? '',
    status: api.status,
    permissions: {
      canApprove: api.permissions?.canApprove ?? false,
      canReject: api.permissions?.canReject ?? false,
    },
    
    email: api.email,
    phone: api.phone,
    businessNumber: api.businessNumber,
    commerceNumber: api.commerceNumber,
    fundingTitle: api.fundingTitle,
    fundingSummary: api.fundingSummary,
    businessDocument: api.businessDocument,
    commerceDocument: api.commerceDocument,
  };
}
