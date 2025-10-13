
import type { ApiResponse } from '@/types/artistApplication';


type Auth = { accessToken: string };

async function adminFetch<T>(
  input: RequestInfo | URL,
  init: RequestInit,
): Promise<T> {
  const res = await fetch(input, init);
  const text = await res.text().catch(() => '');
  if (!res.ok) {
    try {
      const j = JSON.parse(text) as ApiResponse<unknown>;
      throw new Error(j?.msg || `요청 실패 (HTTP ${res.status})`);
    } catch {
      throw new Error(text || `요청 실패 (HTTP ${res.status})`);
    }
  }
  const json = JSON.parse(text) as ApiResponse<T>;
  if (json.resultCode !== '200') {
    throw new Error(json.msg || '요청 실패');
  }
  return json.data;
}

// 작가신청 승인

export async function approveArtistApplication(
  applicationId: number,
  { accessToken }: Auth,
): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard/admin/artist-applications/${applicationId}/approve`;
  return adminFetch<string>(url, {
    method: 'POST',
    headers: {
      accept: 'application/json;charset=UTF-8',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
    body: '{}', 
  });
}

// 작가신청 거절

export async function rejectArtistApplication(
  applicationId: number,
  reason: string,
  { accessToken }: Auth,
): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard/admin/artist-applications/${applicationId}/reject`;
  return adminFetch<string>(url, {
    method: 'POST',
    headers: {
      accept: 'application/json;charset=UTF-8',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
}
