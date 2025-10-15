

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080').replace(/\/+$/, '');

// 펀딩 조회 요청 파라미터 타입
export interface FundingQuery {
  page?: number;
  size?: number;
  keyword?: string;
  status?: 'OPEN' | 'CLOSED' | 'SUCCESS' | 'FAILED' | 'CANCELED';
  categoryId?: number;
  minAchievement?: number;
  maxAchievement?: number;
  startDate?: string;
  endDate?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

// 응답 데이터 타입
export interface ArtistFunding {
  fundingId: number;
  title: string;
  status: string;
  statusText: string;
  targetAmount: number;
  currentAmount: number;
  achievementRate: number;
  participantCount: number;
  startDate: string;
  endDate: string;
  registeredAt: string;
  mainImage: string;
  category?: { id: number; name: string };
  permissions?: { canEdit: boolean; canCancel: boolean; canCreateNews: boolean };
  flags?: { goalAchieved: boolean; dueSoon: boolean; ended: boolean };
}

export interface ArtistFundingListResponse {
  content: ArtistFunding[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// 펀딩 목록 조회 api
export async function fetchArtistFundingList(params: FundingQuery = {}) {
  const url = new URL(`${API_BASE_URL}/api/dashboard/artist/funding`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, String(value));
    }
  });

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json;charset=UTF-8' },
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok || result.resultCode !== '200') {
    throw new Error(result.msg || '펀딩 목록을 불러오는 데 실패했습니다.');
  }

  return result.data as ArtistFundingListResponse;
}
