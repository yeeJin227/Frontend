
'use client';

import type { ApiResponse } from '@/types/product';

export type FollowResponse = {
  followId: number;
  artistId: number;
  artistName: string;
  profileImageUrl: string;
  followerCount: number;
  followedAt: string;
  isFollowing: boolean;
};

// 작가 팔로우
export async function followArtist(artistId: number): Promise<FollowResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/follows/artists/${artistId}`,
    {
      method: 'POST',
      headers: { accept: 'application/json' },
      credentials: 'include',
    }
  );

  const json = (await res.json()) as ApiResponse<FollowResponse>;

  if (!res.ok || json.resultCode !== '200' || !json.data) {
    throw new Error(json.msg || '팔로우 실패');
  }

  return json.data;
}

// 작가 언팔로우
export async function unfollowArtist(artistId: number): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/follows/artists/${artistId}`,
    {
      method: 'DELETE',
      headers: { accept: 'application/json' },
      credentials: 'include',
    }
  );

  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.resultCode !== '200') {
    throw new Error(json?.msg || '언팔로우 실패');
  }
}
