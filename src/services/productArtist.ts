import { ArtistPublicProfile } from '@/types/artistDashboard';
import type { ProductArtistInfo } from '@/types/productArtist';

export type ArtistListEntry = {
  artistId: number;
  artistName: string;
};

export type ArtistProfileProduct = {
  productUuid: string;
  name: string;
  price: number;
  discountPrice: number;
  discountRate: number;
  thumbnailUrl: string;
  rating: number;
  reviewCount: number;
  stock: number;
  sellingStatus: string;
};


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
type FetchError = Error & { status?: number };

export async function fetchArtistList(): Promise<ArtistListEntry[]> {
  const res = await fetch(`${API_BASE}/api/artist/list`, {
    method: 'GET',
    headers: { accept: 'application/json' },
    credentials: 'include',
    cache: 'no-store',
  });

  const json = (await res
    .json()
    .catch(() => ({}))) as { msg?: string; data?: ArtistListEntry[] };

  if (!res.ok) {
    const message = (json && json.msg) || '작가 목록을 불러오지 못했습니다.';
    const error: FetchError = new Error(message);
    error.status = res.status;
    throw error;
  }

  const data = Array.isArray(json.data) ? json.data : [];
  return data.map((item) => ({
    artistId: Number(item.artistId),
    artistName: String(item.artistName ?? ''),
  }));
}

export async function fetchArtistPublicProfile(artistId: number): Promise<ArtistPublicProfile> {
  const res = await fetch(`${API_BASE}/api/artist/profile/${artistId}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
    credentials: 'include',
    cache: 'no-store',
  });

  const json = (await res
    .json()
    .catch(() => ({}))) as { msg?: string; data?: ArtistPublicProfile };
  if (!res.ok) {
    const message = (json && json.msg) || '작가 프로필 정보를 불러오지 못했습니다.';
    const error: FetchError = new Error(message);
    error.status = res.status;
    throw error;
  }

  if (!json || !json.data) {
    const error: FetchError = new Error('작가 프로필 정보가 없습니다.');
    error.status = res.status;
    throw error;
  }

  return json.data as ArtistPublicProfile;
}

type ArtistProductsParams = {
  artistId: number;
  page?: number;
  size?: number;
};

export async function fetchArtistProfileProducts({
  artistId,
  page = 1,
  size = 12,
}: ArtistProductsParams): Promise<{ items: ArtistProfileProduct[]; page: number; size: number }> {
  const url = new URL(`${API_BASE}/api/artist/profile/${artistId}/products`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(size));

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { accept: 'application/json' },
    credentials: 'include',
    cache: 'no-store',
  });

  const json = (await res
    .json()
    .catch(() => ({}))) as { msg?: string; data?: ArtistProfileProduct[] };

  if (!res.ok) {
    const message = (json && json.msg) || '작가 상품 목록을 불러오지 못했습니다.';
    const error: FetchError = new Error(message);
    error.status = res.status;
    throw error;
  }

  const items = Array.isArray(json.data) ? json.data : [];
  return {
    items: items.map((item) => ({
      productUuid: String(item.productUuid ?? ''),
      name: String(item.name ?? ''),
      price: Number(item.price ?? 0),
      discountPrice: Number(item.discountPrice ?? 0),
      discountRate: Number(item.discountRate ?? 0),
      thumbnailUrl: String(item.thumbnailUrl ?? ''),
      rating: Number(item.rating ?? 0),
      reviewCount: Number(item.reviewCount ?? 0),
      stock: Number(item.stock ?? 0),
      sellingStatus: String(item.sellingStatus ?? ''),
    })),
    page,
    size,
  };
}
