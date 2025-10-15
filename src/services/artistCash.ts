export type ApiResponse<T> = {
  resultCode: string; 
  msg: string;
  data: T;
};


export type ArtistCashBalance = {
  currentBalance: number;      // 현재 지갑 잔액
  pendingSettlement: number;   // 정산 대기 금액
  pendingWithdrawal: number;   // 환전 처리 중 금액
  withdrawable: number;        // 환전 가능 금액
  currency: string;            // 통화
  updatedAt: string;           // 업데이트 시각
};

// 작가 지갑 잔액 조회 api
export async function fetchArtistCashBalance(accessToken?: string): Promise<ArtistCashBalance> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard/artist/cash/balance`, {
    method: 'GET',
    headers: {
      Accept: 'application/json;charset=UTF-8',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    credentials: 'include',
  });

  if (!res.ok) throw new Error(`지갑 잔액 조회 실패: ${res.status}`);

  const json = await res.json();

  if (!json?.data) {
    throw new Error('응답 데이터가 올바르지 않습니다.');
  }

  return json.data as ArtistCashBalance;
}