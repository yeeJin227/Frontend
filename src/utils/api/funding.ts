import {
  FundingListProps,
  CreateFundingRequest,
  CreateFundingResponse,
  FundingListResponse,
} from '@/types/funding';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'
).replace(/\/+$/, '');

export const fetchFundingList = async (
  params: FundingListProps,
): Promise<FundingListResponse> => {
  try {
    const searchParams = new URLSearchParams();
    // status는 배열이므로 쉼표로 조인
    if (params.status && params.status.length > 0) {
      searchParams.append('status', params.status.join(','));
    }

    // 나머지 파라미터 추가
    if (params.sortBy) {
      searchParams.append('sortBy', params.sortBy);
    }

    if (params.keyword) {
      searchParams.append('keyword', params.keyword);
    }

    if (params.minPrice !== undefined) {
      searchParams.append('minPrice', String(params.minPrice));
    }

    if (params.maxPrice !== undefined) {
      searchParams.append('maxPrice', String(params.maxPrice));
    }

    if (params.page !== undefined) {
      searchParams.append('page', String(params.page));
    }

    if (params.size !== undefined) {
      searchParams.append('size', String(params.size));
    }
    const url = `${API_BASE_URL}/api/fundings?${searchParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const apiResponse: FundingListResponse = await response.json();

    // ⭐ 전체 응답 반환
    return apiResponse;
  } catch (error) {
    console.error('펀딩 리스트 조회 실패:', error);
    throw error;
  }
};

export const createNewFunding = async (
  fundingData: CreateFundingRequest,
): Promise<CreateFundingResponse> => {
  try {
    console.log('📤 보내는 데이터:', JSON.stringify(fundingData, null, 2));

    const url = `${API_BASE_URL}/api/fundings`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ⭐ 쿠키 포함 (필수)
      body: JSON.stringify(fundingData),
    });

    console.log('📥 응답 상태:', response.status);

    if (!response.ok) {
      // ⭐ 서버의 에러 메시지 확인
      const errorData = await response.json().catch(() => null);
      console.error('❌ 서버 에러 응답:', errorData);

      // 서버가 준 에러 메시지가 있으면 그것을 사용
      const errorMessage =
        errorData?.msg || errorData?.message || response.statusText;

      throw new Error(`펀딩 생성 실패 (${response.status}): ${errorMessage}`);
    }

    const data: CreateFundingResponse = await response.json();
    console.log('✅ 성공 응답:', data);

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('펀딩 생성 중 오류:', error.message);
      throw error;
    }

    console.error('알 수 없는 오류 발생:', error);
    throw new Error('펀딩을 생성하는 중 문제가 발생했습니다.');
  }
};
