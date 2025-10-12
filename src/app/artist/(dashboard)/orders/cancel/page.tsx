
'use client';

import { useState, type Key } from 'react';
import AdminDataTable, { AdminTableColumn, SortDirection } from '@/components/admin/AdminDataTable';
import Button from '@/components/Button';
import SearchIcon from '@/assets/icon/search.svg';

type CancelRow = {
  id: string;
  statusText: string;
  buyer: string;
  requestState: string; // 취소 신청/취소 완료
  requestAt: string;
};

const columns: AdminTableColumn<CancelRow>[] = [
  { key: 'id', header: '주문번호', align: 'center', sortable: true },
  { key: 'statusText', header: '상품명', align: 'left', sortable: true },
  { key: 'buyer', header: '구매자 이름 / ID', align: 'center', sortable: true },
  { key: 'requestState', header: '주문상태', align: 'center', sortable: true },
  { key: 'requestAt', header: '주문일자', align: 'center', sortable: true },
];

const initialRows: CancelRow[] = [
  { id: '0123157', statusText: '상품명입니다 상품명입니다', buyer: '손영훈 / heroson02', requestState: '취소 신청', requestAt: '2025-09-18' },
  { id: '0123156', statusText: '상품명입니다 상품명입니다', buyer: '홍길동 / honggildong', requestState: '취소 신청', requestAt: '2025-09-18' },
  { id: '0123155', statusText: '상품명입니다 상품명입니다', buyer: '홍길동 / honggildong', requestState: '취소 완료', requestAt: '2025-09-18' },
  { id: '0123154', statusText: '상품명입니다 상품명입니다', buyer: '홍길동 / honggildong', requestState: '취소 완료', requestAt: '2025-09-18' },
];

export default function OrderCancelPage() {
  const [rows] = useState(initialRows);
  const [sortKey, setSortKey] = useState<keyof CancelRow | undefined>();
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-2xl font-bold">취소 요청</h3>
        <div className="flex gap-2">
          <Button variant="outline">취소 거부</Button>
          <Button variant="primary">취소 승인</Button>
        </div>
      </div>

      <AdminDataTable
        columns={columns}
        rows={
          searchTerm
            ? rows.filter((r) =>
                [r.id, r.statusText, r.buyer, r.requestState].some((v) =>
                  String(v).toLowerCase().includes(searchTerm.toLowerCase()),
                ),
              )
            : rows
        }
        rowKey={(row) => row.id}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={(k, d) => { setSortKey(k as keyof CancelRow); setSortDirection(d); }}
        selectedRowKeys={selectedIds}
        onSelectionChange={(keys: Key[]) => setSelectedIds(keys.map(String))}
      />

      <div className="relative mt-6 flex items-center justify-center">
        <nav className="flex items-center gap-4 text-sm text-[var(--color-gray-700)]">
          <button className="px-2 py-1 hover:text-primary" aria-label="Prev">‹</button>
          {[1,2,3,4,5].map((n)=>(
            <button key={n} className={`h-8 w-8 rounded-full text-center leading-8 ${n===1?'text-primary font-semibold':'hover:text-primary'}`}>{n}</button>
          ))}
          <button className="px-2 py-1 hover:text-primary" aria-label="Next">›</button>
        </nav>

        <form className="absolute right-0 flex h-10 w-[240px] items-center rounded-[12px] border border-primary px-4 text-sm text-[var(--color-gray-700)]">
          <input
            type="search"
            value={searchTerm}
            onChange={(e)=>setSearchTerm(e.target.value)}
            placeholder="검색어를 입력하세요"
            className="h-full flex-1 bg-transparent pr-8 outline-none placeholder:text-[var(--color-gray-400)]"
          />
          <SearchIcon className="absolute right-4 h-4 w-4 text-primary" aria-hidden />
        </form>
      </div>
    </>
  );
}
