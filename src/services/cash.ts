export type CashTransactionType = 'CHARGING' | 'EXCHANGE';
export type CashTransactionStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export interface CashTransaction {
  transactionId: number;
  transactionType: CashTransactionType;
  amount: number;
  balanceAfter: number;
  status: CashTransactionStatus;
  pgProvider: string;
  createdAt: string;
}

export interface CashSummary {
  periodDepositTotal: number;
  periodWithdrawalTotal: number;
  periodNet: number;
}

export interface CashHistoryResponse {
  summary: CashSummary;
  content: CashTransaction[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}



// 작가 캐시 거래 내역 조회
export async function fetchCashHistory(params?: {
  page?: number;
  size?: number;
  type?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  order?: string;
}): Promise<CashHistoryResponse> {
  const query = new URLSearchParams();

  if (params?.page !== undefined) query.append('page', String(params.page));
  if (params?.size !== undefined) query.append('size', String(params.size));
  if (params?.type) query.append('type', params.type);
  if (params?.status) query.append('status', params.status);
  if (params?.dateFrom) query.append('dateFrom', params.dateFrom);
  if (params?.dateTo) query.append('dateTo', params.dateTo);
  if (params?.sort) query.append('sort', params.sort);
  if (params?.order) query.append('order', params.order);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard/artist/cash/history?${query}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('캐시 내역 조회 실패');
  }

  const json = await res.json();
  return json.data;
}
