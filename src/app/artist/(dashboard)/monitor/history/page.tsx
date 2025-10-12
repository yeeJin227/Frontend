'use client';

import AdminDataTable, { AdminTableColumn } from '@/components/admin/AdminDataTable';

type HistoryRow = {
  date: string;  
  type: '정산금 입금' | '모리캐시 환전';
  depositAmount: number; // 정산(입금)금액
  withdrawAmount: number; // 환전 금액
  balance: number;    // 잔액
  method: string;     // 모리캐시 / 계좌이체
};

const columns: AdminTableColumn<HistoryRow>[] = [
  { key: 'date', header: '충전일', align: 'center', sortable: true },
  { key: 'type', header: '구분', align: 'center', sortable: true },
  { key: 'depositAmount', header: '정산(입금)금액', align: 'right', sortable: true, render: r => `₩ ${r.depositAmount.toLocaleString()}` },
  { key: 'withdrawAmount', header: '환전 금액', align: 'right', sortable: true, render: r => `₩ ${r.withdrawAmount.toLocaleString()}` },
  { key: 'balance', header: '잔액', align: 'right', sortable: true, render: r => `₩ ${r.balance.toLocaleString()}` },
  { key: 'method', header: '입금/환전수단', align: 'center', sortable: true },
];

const rows: HistoryRow[] = [
  { date: '2025.09.24', type: '정산금 입금',   depositAmount: 10000, withdrawAmount: 0,     balance: 10000, method: '모리캐시' },
  { date: '2025.09.23', type: '모리캐시 환전', depositAmount: 0,     withdrawAmount: 64000, balance: 0,     method: '계좌이체' },
  { date: '2025.09.22', type: '정산금 입금',   depositAmount: 64000, withdrawAmount: 0,     balance: 64000, method: '모리캐시' },
];

export default function SettlementHistoryPage() {
  return (
    <>
      <h3 className="mb-6 text-2xl font-bold">입금/환전 내역</h3>
      <AdminDataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => `${r.date}-${r.type}-${r.balance}`}
        sortKey="date"
        sortDirection="desc"
      />
      <div className="mt-6 flex items-center justify-center gap-3 text-sm text-[var(--color-gray-700)]">
        <button className="px-2 py-1 hover:text-primary" aria-label="Prev">‹</button>
        {[1,2,3,4,5].map(n=>(
          <button key={n} className={`h-8 w-8 rounded-full text-center leading-8 ${n===1?'text-primary font-semibold':'hover:text-primary'}`}>{n}</button>
        ))}
        <button className="px-2 py-1 hover:text-primary" aria-label="Next">›</button>
      </div>
    </>
  );
}
