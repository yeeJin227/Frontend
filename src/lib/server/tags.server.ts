
import 'server-only';
import { cookies } from 'next/headers';
import { revalidateTag, revalidatePath } from 'next/cache';
import type { Tag, TagPayload, ApiResponse } from '@/types/tag';


// SSR 태그 목록 (사이드바용)
export async function fetchTagsServer(): Promise<Tag[]> {
  const cookieHeader = cookies().toString();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tags`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    credentials: 'include',
    next: { tags: ['tags'] },
  });

  if (!res.ok) throw new Error('태그 조회 실패');

  const json = await res.json();
  const data = Array.isArray(json) ? json : json?.data;
  return Array.isArray(data) ? data : [];
}

// 태그 등록 
export async function createTag(payload: TagPayload): Promise<Tag> {
  const cookieHeader = cookies().toString();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('태그 등록 실패');

  const json = (await res.json()) as ApiResponse<Tag | null>;
  if (json.resultCode !== '200' || !json.data) {
    throw new Error(json.msg || '태그 등록 실패');
  }

  // 즉시 반영
  revalidateTag('tags');
  revalidatePath('/category', 'layout');

  return json.data;
}

// 태그 수정 
export async function updateTag(id: number, payload: TagPayload): Promise<Tag> {
  const cookieHeader = cookies().toString();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tags/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('태그 수정 실패');

  const json = (await res.json()) as ApiResponse<Tag | null>;
  if (json.resultCode !== '200' || !json.data) {
    throw new Error(json.msg || '태그 수정 실패');
  }

  // 즉시 반영
  revalidateTag('tags');
  revalidatePath('/category', 'layout');

  return json.data;
}

// 태그 삭제 
export async function deleteTag(id: number): Promise<boolean> {
  const cookieHeader = cookies().toString();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tags/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('태그 삭제 실패');

  const json = (await res.json()) as ApiResponse<null>;
  if (json.resultCode !== '200') {
    throw new Error(json.msg || '태그 삭제 실패');
  }

  // 즉시 반영
  revalidateTag('tags');
  revalidatePath('/category', 'layout');

  return true;
}
