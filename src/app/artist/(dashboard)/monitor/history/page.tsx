'use client';

import { useEffect, useState } from 'react';
import { CashTransaction, fetchCashHistory } from '@/services/cash';
import ArtistDataTable, { ArtistTableColumn } from '@/components/artist/ArtistDataTable';


type HistoryRow = {
  date: string;
  type: '정산금 입금' | '모리캐시 환전';
  depositAmount: number;
  withdrawAmount: number;
  balance: number;
  method: string;
};


const columns: ArtistTableColumn<HistoryRow>[] = [
  { key: 'date', header: '거래일자', align: 'center', sortable: true },
  { key: 'type', header: '구분', align: 'center', sortable: true },
  {
    key: 'depositAmount',
    header: '정산(입금)금액',
    align: 'right',
    render: (r) => `₩ ${r.depositAmount.toLocaleString()}`,
  },
  {
    key: 'withdrawAmount',
    header: '환전 금액',
    align: 'right',
    render: (r) => `₩ ${r.withdrawAmount.toLocaleString()}`,
  },
  {
    key: 'balance',
    header: '잔액',
    align: 'right',
    render: (r) => `₩ ${r.balance.toLocaleString()}`,
  },
  { key: 'method', header: '입금/환전수단', align: 'center' },
];


export default function SettlementHistoryPage() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);


  // api 호출 
  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchCashHistory({ page, size: 10 });

      // API → UI 형태로 매핑
      const mapped: HistoryRow[] = data.content.map((t: CashTransaction) => ({
        date: new Date(t.createdAt).toLocaleDateString('ko-KR'),
        type: t.transactionType === 'CHARGING' ? '정산금 입금' : '모리캐시 환전',
        depositAmount: t.transactionType === 'CHARGING' ? t.amount : 0,
        withdrawAmount: t.transactionType === 'EXCHANGE' ? t.amount : 0,
        balance: t.balanceAfter,
        method: t.pgProvider === 'MORI_CASH' ? '모리캐시' : '계좌이체',
      }));

      setRows(mapped);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('캐시 내역 불러오기 실패:', err);
    } finally {
      setLoading(false);
    }
  };


  // page 변경 마다 재호출
  useEffect(() => {
    load();
  }, [page]);

  
  // 페이지 이동 핸들러
  const handlePrev = () => setPage((p) => Math.max(0, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  return (
    <div>
      <h3 className="mb-6 text-2xl font-bold">입금/환전 내역</h3>

      {/* 테이블 */}
      {loading ? (
        <p className="text-gray-500 text-center py-10">불러오는 중...</p>
      ) : (
        <ArtistDataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => `${r.date}-${r.type}-${r.balance}`}
          sortKey="date"
          sortDirection="desc"
        />
      )}

      {/* 페이지네이션 */}
      <div className="mt-6 flex items-center justify-center gap-3 text-sm text-gray-700">
        <button
          className="px-2 py-1 hover:text-primary disabled:text-gray-400"
          disabled={page === 0}
          onClick={handlePrev}
        >
          ‹
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            className={`h-8 w-8 rounded-full text-center leading-8 ${
              i === page ? 'text-primary font-semibold' : 'hover:text-primary'
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          className="px-2 py-1 hover:text-primary disabled:text-gray-400"
          disabled={page === totalPages - 1}
          onClick={handleNext}
        >
          ›
        </button>
      </div>
    </div>
  );
}
