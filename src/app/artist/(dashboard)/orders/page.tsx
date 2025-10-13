'use client';

import { useEffect, useMemo, useState, type Key } from 'react';
import Button from '@/components/Button';
import SearchIcon from '@/assets/icon/search.svg';
import ArtistDataTable, { ArtistTableColumn, SortDirection } from '@/components/artist/ArtistDataTable';
import { fetchArtistOrders } from '@/services/artistDashboard';
import type { ArtistOrdersParams } from '@/types/artistDashboard';
import { toRow, type OrderRow } from './adapters';

const columns: ArtistTableColumn<OrderRow>[] = [
  { key: 'id', header: '주문번호', align: 'center', sortable: true },
  { key: 'statusText', header: '상품명', align: 'left', sortable: true },
  { key: 'buyer', header: '구매자 이름 / ID', align: 'center', sortable: true },
  { key: 'orderState', header: '주문상태', align: 'center', sortable: true },
  { key: 'requestAt', header: '주문일자', align: 'center', sortable: true },
];

export default function OrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 검색/정렬/페이징
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof OrderRow | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1); // 1-base UI
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // API 파라미터 조립
  const query: ArtistOrdersParams = useMemo(() => {
    const sort = sortKey ? String(sortKey) : undefined;
    const order: 'ASC' | 'DESC' = sortDirection === 'asc' ? 'ASC' : 'DESC';
    return {
      page,
      size,
      keyword: searchTerm || undefined,
      sort,
      order,
      // 필요 시 status/startDate/endDate 추가
    };
  }, [page, size, searchTerm, sortKey, sortDirection]);

  // 데이터 로드
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchArtistOrders(query); // ArtistOrderResponseDTO.List
        const mapped = (data.content ?? []).map(toRow);
        if (!alive) return;
        setRows(mapped);
        setTotalPages(Math.max(1, data.totalPages ?? 1));
        setSelectedIds([]);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? '주문 목록 조회 실패');
        setRows([]);
        setTotalPages(1);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [query]);

  const updateSort = (key: string, direction: SortDirection) => {
    setSortKey(key as keyof OrderRow);
    setSortDirection(direction);
    setPage(1);
  };

  const handleSelectionChange = (keys: Key[]) => {
    setSelectedIds(keys.map((k) => String(k)));
  };

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-2xl font-bold">주문 내역</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { /* TODO: 엑셀 다운로드 */ }}>
            주문 엑셀 다운로드
          </Button>
          <Button variant="primary" disabled={selectedIds.length === 0} onClick={() => { /* TODO: 상태 변경 */ }}>
            주문 상태 변경
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <ArtistDataTable
        columns={columns}
        rows={loading ? [] : rows}
        rowKey={(row) => row.id}
        sortKey={sortKey ? String(sortKey) : undefined}
        sortDirection={sortDirection}
        onSortChange={updateSort}
        selectedRowKeys={selectedIds}
        onSelectionChange={handleSelectionChange}
        emptyText={loading ? '불러오는 중…' : '데이터가 없습니다.'}
      />

      {/* 페이지네이션 + 검색 */}
      <div className="relative mt-6 flex items-center justify-center">
        <nav className="flex items-center gap-4 text-sm text-[var(--color-gray-700)]">
          <button
            className="px-2 py-1 hover:text-primary disabled:opacity-40"
            aria-label="Prev"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            ‹
          </button>

          {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => {
            const n = i + 1;
            return (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`h-8 w-8 rounded-full text-center leading-8 ${
                  n === page ? 'text-primary font-semibold' : 'hover:text-primary'
                }`}
              >
                {n}
              </button>
            );
          })}

          <button
            className="px-2 py-1 hover:text-primary disabled:opacity-40"
            aria-label="Next"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            ›
          </button>
        </nav>

        <form
          className="absolute right-0 flex h-10 w-[240px] items-center rounded-[12px] border border-primary px-4 text-sm text-[var(--color-gray-700)]"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
          }}
        >
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="검색어를 입력하세요"
            className="h-full flex-1 bg-transparent pr-8 outline-none placeholder:text-[var(--color-gray-400)]"
          />
          <SearchIcon className="absolute right-4 h-4 w-4 text-primary" aria-hidden />
        </form>
      </div>
    </>
  );
}
