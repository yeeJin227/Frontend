'use client';

import { useEffect, useMemo, useState, type Key } from 'react';
import AdminDataTable, { AdminTableColumn, SortDirection } from '@/components/admin/AdminDataTable';
import Button from '@/components/Button';
import SearchIcon from '@/assets/icon/search.svg';
import { fetchArtistCancellationRequests, cancelArtistOrder } from '@/services/artistDashboard';
import { toRow, type CancelRow } from './adapters';
import { ArtistCancellationParams } from '@/types/artistDashboard';

const columns: AdminTableColumn<CancelRow>[] = [
  { key: 'id', header: '주문번호', align: 'center', sortable: true },
  { key: 'statusText', header: '상품명', align: 'left', sortable: true },
  { key: 'buyer', header: '구매자 이름 / ID', align: 'center', sortable: true },
  { key: 'requestState', header: '주문상태', align: 'center', sortable: true },
  { key: 'requestAt', header: '주문일자', align: 'center', sortable: true },
];

// UI → API 매핑
const SORT_MAP: Record<string, string> = {
  id: 'orderNumber',
  statusText: 'productName',
  buyer: 'customerNickname',
  requestState: 'status',
  requestAt: 'requestDate',
};

export default function OrderCancelPage() {
  const [rows, setRows] = useState<CancelRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 검색/정렬/페이징
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof CancelRow | undefined>();
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // API 파라미터 구성
  const query: ArtistCancellationParams = useMemo(() => {
    const apiSortKey = sortKey ? SORT_MAP[String(sortKey)] ?? undefined : undefined;
    const order: 'ASC' | 'DESC' = sortDirection === 'asc' ? 'ASC' : 'DESC';
    return {
      page,
      size,
      keyword: searchTerm || undefined,
      sort: apiSortKey,
      order,
    };
  }, [page, size, searchTerm, sortKey, sortDirection]);

  // 취소 요청 목록 조회
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchArtistCancellationRequests(query);
        const mapped = (data.content ?? []).map(toRow);

        if (!alive) return;
        setRows(mapped);
        setTotalPages(Math.max(1, data.totalPages ?? 1));
        setSelectedIds([]);
      } catch (e: unknown) {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : '취소 요청 목록 조회 실패';
        setError(msg);
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

  // 취소 승인 api
  const handleApproveCancel = async () => {
    if (selectedIds.length === 0) return alert('승인할 주문을 선택해주세요.');

    const confirmApprove = confirm(
      `선택된 주문 ${selectedIds.join(', ')}의 취소를 승인하시겠습니까?`
    );
    if (!confirmApprove) return;

    try {
      const selectedRows = rows.filter((r) => selectedIds.includes(r.id));

      await Promise.all(
        selectedRows.map((row) =>
          cancelArtistOrder(
            row.orderId ?? 0,
            '판매자 승인 취소',
            row.orderItemIds ?? []
          )
        )
      );

      alert(`주문 ${selectedIds.join(', ')} 취소 승인 완료`);
      setRows((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
      alert('취소 승인 중 오류가 발생했습니다.');
    }
  };

  // 취소 거부 (임시)
  const handleRejectCancel = async () => {
    if (selectedIds.length === 0) return alert('거부할 주문을 선택해주세요.');
    alert('취소 거부 되었습니다.');
  };

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-2xl font-bold">취소 요청</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={selectedIds.length === 0}
            onClick={handleRejectCancel}
          >
            취소 거부
          </Button>
          <Button
            variant="primary"
            disabled={selectedIds.length === 0}
            onClick={handleApproveCancel}
          >
            취소 승인
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <AdminDataTable
        columns={columns}
        rows={loading ? [] : rows}
        rowKey={(row) => row.id}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={(k, d) => {
          setSortKey(k as keyof CancelRow);
          setSortDirection(d);
          setPage(1);
        }}
        selectedRowKeys={selectedIds}
        onSelectionChange={(keys: Key[]) => setSelectedIds(keys.map(String))}
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
