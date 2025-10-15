
'use server';

export type ProductSearchItem = {
  productUuid: string;
  url: string;
  brandName: string;
  name: string;
  price: number;
  discountRate: number;
  discountPrice: number;
  rating: number | null;
};

export type ArtistSearchItem = {
  artistId: number;
  artistName: string;
  profileImageUrl: string | null;
};

export type FundingSearchItem = {
  id: number;
  title: string;
  imageUrl: string;
  categoryName: string;
  authorName: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  remainingDays: number;
};

export type SearchResponse = {
  products: ProductSearchItem[];
  artists: ArtistSearchItem[];
  fundings: FundingSearchItem[];
};

// 통합 검색 API
export async function fetchSearchResults(keyword: string): Promise<SearchResponse> {
  if (!keyword.trim()) {
    return { products: [], artists: [], fundings: [] };
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/search?keyword=${encodeURIComponent(keyword)}`,
    {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    console.error('검색 API 실패', res.status);
    return { products: [], artists: [], fundings: [] };
  }

  const json = await res.json();
  return json.data;
}
