'use client';

import { useState, useMemo, type Key, useEffect, useRef } from 'react';
import AdminDataTable, { AdminTableColumn, SortDirection } from '@/components/admin/AdminDataTable';
import Button from '@/components/Button';
import ProductCreateModal from '@/components/artist/ProductCreateModal';
import { ProductCreatePayload } from '@/types/product';
import { deleteProduct, getProducts } from '@/services/products';
import SearchIcon from '@/assets/icon/search.svg';

type ProductRow = {
  id: string;
  name: string;
  author: string;
  status: string;
  createdAt: string; // YYYY-MM-DD
  productUuid?: string;
  payloadSnapshot?: ProductCreatePayload;
};

const columns: AdminTableColumn<ProductRow>[] = [
  { key: 'id', header: '상품번호', align: 'center', sortable: true },
  { key: 'name', header: '상품명', align: 'center', sortable: true },
  { key: 'author', header: '작가명', align: 'center', sortable: true },
  { key: 'status', header: '판매상태', align: 'center', sortable: true },
  { key: 'createdAt', header: '등록일자', align: 'center', sortable: true },
];

// 7자리 표시용 ID (페이지 기준 가짜 번호)
const makeRowId = (uiPage: number, idx: number) =>
  String((uiPage - 1) * 1000 + (idx + 1)).padStart(7, '0');

// 페이지네이션 최대 5개 보이기
function getPageRange(current: number, total: number, count = 5) {
  if (total <= 1) return [1];
  const half = Math.floor(count / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, start + count - 1);
  start = Math.max(1, end - count + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function ProductsPage() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [sortKey, setSortKey] = useState<keyof ProductRow | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 페이지네이션 (UI 1기반)
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingRow, setEditingRow] = useState<ProductRow | null>(null);

  const snapshotsRef = useRef<Record<string, ProductCreatePayload>>({});

  const updateSort = (key: string, direction: SortDirection) => {
    setSortKey(key as keyof ProductRow);
    setSortDirection(direction);
  };

  // 목록 조회 (서버 0기반)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProducts({ page, size });
        if (cancelled) return;

        const elements = Number(data.totalElements ?? 0);
        const pagesFromServer = Number(data.totalPages ?? 0);
        const pagesFromCalc = Math.max(1, Math.ceil(elements / size));
        const pages = pagesFromServer > 0 ? pagesFromServer : pagesFromCalc;

        setTotalElements(elements);
        setTotalPages(pages);

        const mapped = (data.products ?? []).map((p, idx) => {
  const productUuid = p.productUuid;
  return {
    id: makeRowId(page, idx),
    name: p.name,
    author: p.brandName,
    status: '판매중',
    createdAt: new Date().toLocaleDateString('en-CA'),
    productUuid,
    payloadSnapshot: productUuid ? snapshotsRef.current[productUuid] : undefined, // ✨
  } as ProductRow;
});
        setRows(mapped);
        setSelectedIds([]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '목록 조회 실패');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, size, refreshKey]);

  // 페이지 이동
  const gotoPage = (p: number) => setPage(p);

  const handleSelectionChange = (keys: Key[]) => {
    setSelectedIds(keys.map((key) => String(key)));
  };

  // 선택된 행들
  const selectedRows = useMemo(
    () => rows.filter((r) => selectedIds.includes(r.id)),
    [rows, selectedIds],
  );

  // 생성 완료 
  const handleCreated = ({ productUuid, payload }: { productUuid: string; payload: ProductCreatePayload }) => {
  snapshotsRef.current[productUuid] = payload; // 스냅샷 저장
  const nextTotal = totalElements + 1;
  const nextPages = Math.max(1, Math.ceil(nextTotal / size));
  setTotalElements(nextTotal);
  setTotalPages(nextPages);
  if (page !== 1) setPage(1);
  else setRefreshKey((k) => k + 1);
};

  // 수정 완료 
  const handleUpdated = ({ productUuid, payload }: { productUuid: string; payload: ProductCreatePayload }) => {
  snapshotsRef.current[productUuid] = payload; // 스냅샷 갱신
  setPage((p) => p); // 리페치 트리거 유지
};

  // 삭제 완료 → 총개수/총페이지 보정 후 리페치
  const handleDeleted = ({ productUuid }: { productUuid: string }) => {
    const nextTotal = Math.max(0, totalElements - 1);
    const nextPages = Math.max(1, Math.ceil(nextTotal / size));
    setTotalElements(nextTotal);
    setTotalPages(nextPages);
    setPage((prev) => Math.min(prev, nextPages));
  };

  // 상단 - 행 클릭 수정
  const handleRowClick = (row: ProductRow) => {
    setEditingRow(row);
    setMode('edit');
    setOpenModal(true);
  };

  // 상단 - 선택 수정
  const handleTopEdit = () => {
    const row = selectedRows[0];
    setEditingRow(row);
    setMode('edit');
    setOpenModal(true);
  };

  // 상단 - 선택 삭제(병렬)
  const handleTopDelete = async () => {
    const deletables = selectedRows.filter((r) => !!r.productUuid);
    if (deletables.length === 0) {
      alert('선택된 항목에 삭제 가능한 상품이 없습니다.');
      return;
    }
    if (!confirm(`총 ${deletables.length}개 삭제합니다.`)) return;

    const results = await Promise.allSettled(
      deletables.map((r) => deleteProduct(r.productUuid!)),
    );

    const success = results.filter((r) => r.status === 'fulfilled').length;

    if (success > 0) {
      setSelectedIds([]);
      const nextTotal = Math.max(0, totalElements - success);
      const nextPages = Math.max(1, Math.ceil(nextTotal / size));
      setTotalElements(nextTotal);
      setTotalPages(nextPages);
      setPage((prev) => Math.min(prev, nextPages));
    }

    alert(`삭제 완료: ${success}개\n삭제 실패: ${deletables.length - success}개`);
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold mb-[20px]">상품 관리</h3>
        <div className="flex gap-2">
          <Button variant="tertiary" onClick={handleTopDelete} disabled={selectedRows.length === 0}>
            상품 삭제
          </Button>
          <Button variant="outline" onClick={handleTopEdit} disabled={selectedRows.length !== 1}>
            상품 수정
          </Button>
          <Button
            onClick={() => {
              setMode('create');
              setEditingRow(null);
              setOpenModal(true);
            }}
            variant="primary"
          >
            상품 등록
          </Button>
        </div>
      </div>

      {loading && <div className="text-gray-500 text-sm">불러오는 중...</div>}
      {error && <div className="text-red-500 text-sm">{error}</div>}

      <AdminDataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        sortKey={sortKey as string | undefined}
        sortDirection={sortDirection}
        onSortChange={(key, direction) => updateSort(key, direction)}
        selectedRowKeys={selectedIds}
        onSelectionChange={handleSelectionChange}
        onRowClick={handleRowClick}
      />

      {/* 페이지네이션 */}
      <div className="relative mt-6 flex items-center justify-center">
        <nav className="flex items-center gap-2 text-sm text-[var(--color-gray-700)]">
          <button
            onClick={() => gotoPage(1)}
            disabled={page <= 1}
            className="px-2 py-1 hover:text-primary disabled:opacity-40"
            aria-label="First"
          >
            «
          </button>
          <button
            onClick={() => gotoPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-2 py-1 hover:text-primary disabled:opacity-40"
            aria-label="Previous"
          >
            ‹
          </button>

          {getPageRange(page, totalPages, 5).map((n) => (
            <button
              key={n}
              onClick={() => gotoPage(n)}
              className={`h-8 w-8 rounded-full text-center leading-8 ${
                n === page ? 'text-primary font-semibold' : 'hover:text-primary'
              }`}
              aria-current={n === page ? 'page' : undefined}
            >
              {n}
            </button>
          ))}

          <button
            onClick={() => gotoPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-2 py-1 hover:text-primary disabled:opacity-40"
            aria-label="Next"
          >
            ›
          </button>
          <button
            onClick={() => gotoPage(totalPages)}
            disabled={page >= totalPages}
            className="px-2 py-1 hover:text-primary disabled:opacity-40"
            aria-label="Last"
          >
            »
          </button>
        </nav>


      <ProductCreateModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        mode={mode}
        initialBrand="내 브랜드"
        productUuid={editingRow?.productUuid}
        initialPayload={editingRow?.payloadSnapshot}
        onCreated={handleCreated}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
        onLoadBizFromProfile={async () => ({
          companyName: '모리모리 스튜디오',
          bizNumber: '123-45-67890',
          ceoName: '홍길동',
        })}
      />

      <form className="absolute right-0 flex h-10 w-[240px] items-center rounded-[12px] border border-primary px-4 text-sm text-[var(--color-gray-700)]">
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
