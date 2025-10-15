'use client';

import { useEffect, useMemo, useState, type Key, useRef } from 'react';
import Button from '@/components/Button';
import SearchIcon from '@/assets/icon/search.svg';
import ArtistDataTable, {
  ArtistTableColumn,
  SortDirection,
} from '@/components/artist/ArtistDataTable';
import {
  cancelArtistOrder,
  fetchArtistOrders,
  updateArtistOrderStatus,
} from '@/services/artistDashboard';
import type { ArtistOrdersParams } from '@/types/artistDashboard';
import { toRow, type OrderRow } from './adapters';


const ORDER_STATUS_OPTIONS = [
  { value: 'PAYMENT_COMPLETED', label: '결제 완료' },
  { value: 'PREPARING_SHIPMENT', label: '배송 준비중' },
  { value: 'SHIPPING', label: '배송중' },
  { value: 'DELIVERED', label: '배송 완료' },
/*   { value: 'CANCELLATION_REQUESTED', label: '취소 요청' },
  { value: 'CANCELLATION_COMPLETED', label: '취소 완료' },
  { value: 'REFUND_REQUESTED', label: '환불 요청' },
  { value: 'REFUND_COMPLETED', label: '환불 완료' },
  { value: 'EXCHANGE_REQUESTED', label: '교환 요청' },
  { value: 'EXCHANGE_COMPLETED', label: '교환 완료' }, */
];


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

  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof OrderRow | undefined>();
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowStatusMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // api 파라미터
  const query: ArtistOrdersParams = useMemo(() => {
    const sort = sortKey ? String(sortKey) : undefined;
    const order: 'ASC' | 'DESC' =
      sortDirection === 'asc' ? 'ASC' : 'DESC';
    return {
      page,
      size,
      keyword: searchTerm || undefined,
      sort,
      order,
    };
  }, [page, size, searchTerm, sortKey, sortDirection]);

  // 주문 목록 불러오기
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchArtistOrders(query);
        let mapped = (data.content ?? []).map(toRow);

        // 테스트용 임시 데이터
        if (!mapped.length) {
          mapped = [
            {
              id: 'TEMP-001',
              orderId: 1,
              statusText: '벚꽃 키링',
              buyer: '홍길동 / test_user',
              orderState: '결제완료',
              requestAt: '2025-10-16',
              orderItemIds: [101],
            },
          ];
        }

        if (!alive) return;
        setRows(mapped);
        setTotalPages(Math.max(1, data.totalPages ?? 1));
        setSelectedIds([]);
      } catch (e: unknown) {
        if (!alive) return;
        const msg =
          e instanceof Error ? e.message : '주문 목록 조회 실패';
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

  // 정렬 / 선택
  const updateSort = (key: string, direction: SortDirection) => {
    setSortKey(key as keyof OrderRow);
    setSortDirection(direction);
    setPage(1);
  };

  const handleSelectionChange = (keys: Key[]) => {
    setSelectedIds(keys.map((k) => String(k)));
  };

  // 주문 취소
  const handleCancelOrders = async () => {
    if (selectedIds.length === 0)
      return alert('취소할 주문을 선택해주세요.');

    const cancelReason = prompt(
      '취소 사유를 입력해주세요.',
      '판매자 요청 취소'
    );
    if (!cancelReason) return;

    const confirmCancel = confirm(
      `선택된 주문 ${selectedIds.join(', ')}을(를) 취소하시겠습니까?`
    );
    if (!confirmCancel) return;

    try {
      const selectedRows = rows.filter((r) => selectedIds.includes(r.id));

      await Promise.all(
        selectedRows.map((row) =>
          cancelArtistOrder(
            row.orderId,
            cancelReason,
            row.orderItemIds ?? []
          )
        )
      );

      alert(`주문 ${selectedIds.join(', ')} 취소 완료`);
      setRows((prev) =>
        prev.filter((r) => !selectedIds.includes(r.id))
      );
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
      alert('주문 취소 중 오류가 발생했습니다.');
    }
  };

  // 주문 상태 변경 (버튼 드롭다운)
  const handleSelectStatus = async (status: string) => {
    if (selectedIds.length === 0)
      return alert('상태를 변경할 주문을 선택해주세요.');

    const confirmChange = confirm(
      `선택된 주문 ${selectedIds.join(', ')}의 상태를 '${status}'(으)로 변경하시겠습니까?`
    );
    if (!confirmChange) return;

    try {
      const selectedRows = rows.filter((r) => selectedIds.includes(r.id));

      await Promise.all(
        selectedRows.map((row) =>
          updateArtistOrderStatus(row.orderId, status)
        )
      );

      alert(`주문 상태 변경 완료 (${status})`);
      setPage(1);
    } catch (e) {
      console.error(e);
      alert('주문 상태 변경 중 오류가 발생했습니다.');
    } finally {
      setShowStatusMenu(false);
    }
  };


  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-2xl font-bold">주문 내역</h3>
        <div className="flex gap-2 items-center" ref={dropdownRef}>
          {/* 주문 상태 변경 드롭다운 버튼 */}
          <div className="relative">
            <Button
              variant="primary"
              disabled={selectedIds.length === 0}
              onClick={() => setShowStatusMenu((prev) => !prev)}
            >
              주문 상태 변경 ▾
            </Button>

            {showStatusMenu && (
              <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                {ORDER_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelectStatus(opt.value)}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            disabled={selectedIds.length === 0}
            onClick={handleCancelOrders}
          >
            주문 취소
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
        emptyText={
          loading ? '불러오는 중…' : '데이터가 없습니다.'
        }
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

          {Array.from({ length: totalPages })
            .slice(0, 7)
            .map((_, i) => {
              const n = i + 1;
              return (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`h-8 w-8 rounded-full text-center leading-8 ${
                    n === page
                      ? 'text-primary font-semibold'
                      : 'hover:text-primary'
                  }`}
                >
                  {n}
                </button>
              );
            })}

          <button
            className="px-2 py-1 hover:text-primary disabled:opacity-40"
            aria-label="Next"
            onClick={() =>
              setPage((p) => Math.min(totalPages, p + 1))
            }
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
          <SearchIcon
            className="absolute right-4 h-4 w-4 text-primary"
            aria-hidden
          />
        </form>
      </div>
    </>
  );
}
