'use client';

import { useEffect, useState } from 'react';
import { fetchArtistSettlements } from '@/services/artistSettlements';
import RevenueBarChart from '@/components/artist/RevenueBarChart';
import ArtistDataTable, { ArtistTableColumn } from '@/components/artist/ArtistDataTable';

type Row = {
  date: string;
  product: string;
  amount: number;
  fee: number;
  income: number;
  status: string;
};

export default function ArtistSettlementPage() {
  const [summary, setSummary] = useState({ totalSales: 0, fee: 0, netIncome: 0 });
  const [trendData, setTrendData] = useState<{ label: string; value: number }[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);


  // API 호출
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchArtistSettlements({ year: 2025, month: 10, page: page - 1, size: 5 });

        // 상단 요약
        setSummary({
          totalSales: data.summary.totalSales.amount,
          fee: data.summary.totalCommission.amount,
          netIncome: data.summary.totalNetIncome.amount,
        });

        // 차트
        const chart = data.chart.series.sales.map((p) => ({
          label: p.bucketStart.replace('-', '월 '),
          value: p.value,
        }));
        setTrendData(chart);

        // 테이블
        const mapped = data.table.content.map((it) => ({
          date: it.date,
          product: it.product.name,
          amount: it.grossAmount,
          fee: it.commission,
          income: it.netAmount,
          status: it.statusText,
        }));
        setRows(mapped);
        setTotalPages(data.table.totalPages || 1);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);


  const columns: ArtistTableColumn<Row>[] = [
    { key: 'date', header: '정산 일자', align: 'center', sortable: true },
    { key: 'product', header: '상품명', align: 'left', sortable: true },
    {
      key: 'amount',
      header: '매출액',
      align: 'right',
      render: (r) => `₩ ${r.amount.toLocaleString()}`,
    },
    {
      key: 'fee',
      header: '수수료',
      align: 'right',
      render: (r) => `₩ ${r.fee.toLocaleString()}`,
    },
    {
      key: 'income',
      header: '순수익',
      align: 'right',
      render: (r) => `₩ ${r.income.toLocaleString()}`,
    },
    { key: 'status', header: '상태', align: 'center' },
  ];

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="pb-20">
      <h3 className="mb-8 text-2xl font-bold">정산 현황</h3>

      {/* 상단 카드 */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="💰 총 매출" value={summary.totalSales} />
        <SummaryCard label="💸 수수료" value={summary.fee} />
        <SummaryCard label="🛍️ 순이익" value={summary.netIncome} />
      </div>

      {/* 그래프 */}
      <div className="mb-10">
        <RevenueBarChart
          title="월별 매출 추이"
          data={trendData}
          color="var(--color-primary)"
        />
      </div>

      {/* 테이블 */}
      <div className="rounded-2xl bg-white p-6 border border-gray-200">
        <ArtistDataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => `${r.date}-${r.product}`}
          sortKey="date"
          sortDirection="desc"
        />

        {/* 페이지네이션 */}
        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={handlePrev}
          onNext={handleNext}
          setPage={setPage}
        />
      </div>

      {loading && <p className="text-sm text-gray-500 mt-4 text-center">데이터 불러오는 중...</p>}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col items-center text-center">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-semibold">₩ {value.toLocaleString()}</div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
  setPage,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  setPage: (p: number) => void;
}) {
  return (
    <div className="mt-6 flex items-center justify-center gap-3 text-sm text-gray-700">
      <button
        className="px-2 py-1 hover:text-primary disabled:text-gray-400"
        disabled={page === 1}
        onClick={onPrev}
      >
        ‹
      </button>

      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i}
          onClick={() => {
            window.scrollTo({ top: 0 });
            setPage(i + 1);
          }}
          className={`h-8 w-8 rounded-full text-center leading-8 ${
            i + 1 === page
              ? 'text-primary font-semibold'
              : 'hover:text-primary'
          }`}
        >
          {i + 1}
        </button>
      ))}

      <button
        className="px-2 py-1 hover:text-primary disabled:text-gray-400"
        disabled={page === totalPages}
        onClick={onNext}
      >
        ›
      </button>
    </div>
  );
}

