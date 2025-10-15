import { ArtistPublicProfile } from '@/types/artistDashboard';
import type { ProductArtistInfo } from '@/types/productArtist';


const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

// 상품별 작가 기본정보
export async function fetchProductArtistInfo(productUuid: string): Promise<ProductArtistInfo> {
  const res = await fetch(`${API_BASE}/api/products/${productUuid}/artist`, {
    method: 'GET',
    headers: { accept: 'application/json' },
    credentials: 'include',
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.msg || '작가 정보를 불러오지 못했습니다.');
  return json.data;
}

// 작가 공개 프로필 상세정보
export async function fetchArtistPublicProfile(artistId: number): Promise<ArtistPublicProfile> {
  const res = await fetch(`${API_BASE}/api/artist/profile/${artistId}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
    credentials: 'include',
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.msg || '작가 프로필 정보를 불러오지 못했습니다.');
  return json.data;
}
