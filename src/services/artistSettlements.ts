export type ApiResponse<T> = {
  resultCode: string; 
  msg: string;
  data: T;
};

export type ArtistSettlementResponse = {
  scope: { year: number; month: number };
  timezone: string;
  summary: {
    totalSales: { amount: number; label: string };
    totalCommission: { amount: number; label: string };
    totalNetIncome: { amount: number; label: string };
  };
  chart: {
    series: {
      sales: Array<{ bucketStart: string; value: number }>;
    };
  };
  table: {
    content: Array<{
      settlementId: number;
      date: string;
      product: { id: number; name: string };
      grossAmount: number;
      commission: number;
      netAmount: number;
      status: string;
      statusText: string;
    }>;
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  serverTime: string;
};

export async function fetchArtistSettlements(params: {
  year?: number;
  month?: number;
  page?: number;
  size?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}) {
  const query = new URLSearchParams();

  if (params.year) query.append('year', String(params.year));
  if (params.month) query.append('month', String(params.month));
  if (params.page) query.append('page', String(params.page));
  if (params.size) query.append('size', String(params.size));
  if (params.sort) query.append('sort', params.sort);
  if (params.order) query.append('order', params.order);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard/artist/settlements?${query.toString()}`,
    {
      headers: { Accept: 'application/json;charset=UTF-8' },
      credentials: 'include',
      cache: 'no-store',
    },
  );

  if (!res.ok) throw new Error('정산 내역을 불러오지 못했습니다.');
  const json = (await res.json()) as ApiResponse<ArtistSettlementResponse>;
  return json.data;
}
