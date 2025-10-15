'use client';

import type {
  ApiResponse,
  ArtistMainParams,        ArtistMainRoot,
  ArtistOrdersParams,      ArtistOrderList,
  ArtistCancellationParams,ArtistCancellationList,
  ArtistExchangeParams,    ArtistExchangeList,
  ArtistSettingsRoot
} from '@/types/artistDashboard';


function toMainQuery(params: ArtistMainParams) {
  const sp = new URLSearchParams();
  if (params.range) sp.set('range', params.range);
  if (params.from) sp.set('from', params.from);
  if (params.to) sp.set('to', params.to);
  if (params.interval) sp.set('interval', params.interval);
  if (params.tz) sp.set('tz', params.tz);
  return sp.toString();
}

// 작가 대시보드 메인 현황 api

export async function fetchArtistMain(params: ArtistMainParams = {}) {
  const qs = toMainQuery(params);
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard/artist/main${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { accept: 'application/json;charset=UTF-8' },
    credentials: 'include',
    cache: 'no-store',
  });

  const text = await res.text().catch(() => '');
  // 404 포함, 항상 JSON 파싱 시도
  let json: ApiResponse<ArtistMainRoot> | null = null;
  try {
    json = text ? (JSON.parse(text) as ApiResponse<ArtistMainRoot>) : null;
  } catch {
  }

  // 프로필 없음(404)은 정상 처리
  if (!res.ok) {
    if (res.status === 404 || json?.resultCode === '404') {
      return { notFound: true } as const;
    }
    throw new Error(json?.msg || text || `메인 현황 조회 실패 (HTTP ${res.status})`);
  }

  if (!json || json.resultCode !== '200' || !json.data) {
    // 200인데 data null인 경우도 방어
    return { notFound: true } as const;
  }

  return { notFound: false, data: json.data } as const;
}


function toQuery(params: ArtistOrdersParams) {
  const sp = new URLSearchParams();
  const page0 = Math.max(1, params.page ?? 1) - 1; // UI 1-base → BE 0-base
  sp.set('page', String(page0));
  sp.set('size', String(params.size ?? 10));
  if (params.status) sp.set('status', params.status);
  if (params.keyword) sp.set('keyword', params.keyword);
  if (params.startDate) sp.set('startDate', params.startDate);
  if (params.endDate) sp.set('endDate', params.endDate);
  if (params.sort) sp.set('sort', params.sort);
  if (params.order) sp.set('order', params.order);
  return sp.toString();
}

export async function fetchArtistOrders(params: ArtistOrdersParams = {}) {
  const qs = toQuery(params);
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard/artist/orders?${qs}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { accept: 'application/json;charset=UTF-8' },
    credentials: 'include', // 세션/쿠키 인증 시 필요
    cache: 'no-store',
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) throw new Error(text || `주문 목록 조회 실패 (HTTP ${res.status})`);

  let json: ApiResponse<ArtistOrderList>;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('응답 파싱 실패');
  }

  if (json.resultCode !== '200' || !json.data) {
    throw new Error(json.msg || '주문 목록 조회 실패');
  }

  return json.data;
}


function toCancellationQuery(params: ArtistCancellationParams) {
  const sp = new URLSearchParams();
  const page0 = Math.max(1, params.page ?? 1) - 1; // UI 1-base → BE 0-base
  sp.set('page', String(page0));
  sp.set('size', String(params.size ?? 10));
  if (params.status) sp.set('status', params.status);
  if (params.keyword) sp.set('keyword', params.keyword);
  if (params.startDate) sp.set('startDate', params.startDate);
  if (params.endDate) sp.set('endDate', params.endDate);
  if (params.productId != null) sp.set('productId', String(params.productId));
  if (params.sort) sp.set('sort', params.sort);
  if (params.order) sp.set('order', params.order);
  return sp.toString();
}

export async function fetchArtistCancellationRequests(
  params: ArtistCancellationParams = {},
) {
  const qs = toCancellationQuery(params);
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const url = `${base}/api/dashboard/artist/requests/cancellations?${qs}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { accept: 'application/json;charset=UTF-8' },
    credentials: 'include', // 세션/쿠키 인증 사용 시 필수
    cache: 'no-store',
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) throw new Error(text || `취소 요청 목록 조회 실패 (HTTP ${res.status})`);

  let json: ApiResponse<ArtistCancellationList>;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('응답 파싱 실패');
  }

  if (json.resultCode !== '200' || !json.data) {
    throw new Error(json.msg || '취소 요청 목록 조회 실패');
  }

  return json.data;
}



function toExchangeQuery(params: ArtistExchangeParams) {
  const sp = new URLSearchParams();
  const page0 = Math.max(1, params.page ?? 1) - 1; // UI 1-base → BE 0-base
  sp.set('page', String(page0));
  sp.set('size', String(params.size ?? 10));
  if (params.status) sp.set('status', params.status);
  if (params.keyword) sp.set('keyword', params.keyword);
  if (params.startDate) sp.set('startDate', params.startDate);
  if (params.endDate) sp.set('endDate', params.endDate);
  if (params.productId != null) sp.set('productId', String(params.productId));
  if (params.sort) sp.set('sort', params.sort);
  if (params.order) sp.set('order', params.order);
  return sp.toString();
}

export async function fetchArtistExchangeRequests(
  params: ArtistExchangeParams = {},
) {
  const qs = toExchangeQuery(params);
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard/artist/requests/exchanges?${qs}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { accept: 'application/json;charset=UTF-8' },
    credentials: 'include', // 세션/쿠키 인증 시 필요
    cache: 'no-store',
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) throw new Error(text || `교환 요청 목록 조회 실패 (HTTP ${res.status})`);

  let json: ApiResponse<ArtistExchangeList>;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('응답 파싱 실패');
  }

  if (json.resultCode !== '200' || !json.data) {
    throw new Error(json.msg || '교환 요청 목록 조회 실패');
  }

  return json.data;
}



export async function fetchArtistSettings() {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard/artist/settings`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { accept: 'application/json;charset=UTF-8' },
    credentials: 'include',
    cache: 'no-store',
  });

  const text = await res.text().catch(() => '');
  let json: ApiResponse<ArtistSettingsRoot> | null = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }

  if (!res.ok) {
    // 404는 "프로필 없음" 
    if (res.status === 404 || json?.resultCode === '404') {
      return { notFound: true } as const;
    }
    throw new Error(json?.msg || text || `작가 설정 정보 조회 실패 (HTTP ${res.status})`);
  }

  if (!json || json.resultCode !== '200' || !json.data) {
    if (json?.resultCode === '404') return { notFound: true } as const;
    throw new Error(json?.msg || '작가 설정 정보 조회 실패');
  }

  return { notFound: false, data: json.data } as const;
}


// 주문 취소
export async function cancelArtistOrder(orderId: number | string, cancelReason: string, orderItemIds: number[]) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}), 
    },
    body: JSON.stringify({
      cancelReason,
      orderItemIds,
    }),
    credentials: 'include', 
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data?.msg || `주문 취소 실패 (${res.status})`;
    throw new Error(msg);
  }

  return res.json();
}


// 주문 상태 변경
export async function updateArtistOrderStatus(orderId: number | string, status: string) {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('accessToken')
      : null;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${orderId}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status }),
      credentials: 'include',
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data?.msg || `주문 상태 변경 실패 (${res.status})`;
    throw new Error(msg);
  }

  return res.json();
}
