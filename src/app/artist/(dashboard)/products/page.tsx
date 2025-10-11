'use client';

import { useState, useMemo, type Key, useEffect, useRef } from 'react';
import Button from '@/components/Button';
import ProductCreateModal from '@/components/artist/ProductCreateModal';
import { ProductCreatePayload, ProductRow } from '@/types/product';
import { deleteProduct, fetchArtistProducts, getProducts } from '@/services/products';
import SearchIcon from '@/assets/icon/search.svg';
import ArtistDataTable, { ArtistTableColumn, SortDirection } from '@/components/artist/ArtistDataTable';


type RowEx = ProductRow & {
  // 서버 productId 
  productId?: string;
  // 서버 UUID
  productUuid?: string;
  // 최근 작성 스냅샷
  payloadSnapshot?: ProductCreatePayload;
};

type ArtistProductItem = {
  productUuid?: string;
  uuid?: string;
  productUUID?: string;
  product?: { uuid?: string };
  productId?: string | number;
  id?: string | number;
  productNumber?: string | number;

  artist?: { name?: string };
  brandName?: string;
  productName?: string;
  name?: string;

  registeredDate?: string;
  registrationDate?: string;
  addedAt?: string;
  createdAt?: string;

  sellingStatus?: string;
  status?: string;
  selling?: boolean;
};

type PublicProductListItem = {
  brandName?: string;
  name?: string;
  productUuid?: string;
};

const columns: ArtistTableColumn<RowEx>[] = [
  { key: 'id', header: '상품번호', align: 'center', sortable: true },
  { key: 'name', header: '상품명', align: 'center', sortable: true },
  { key: 'author', header: '작가명', align: 'center', sortable: true },
  { key: 'status', header: '판매상태', align: 'center', sortable: true },
  { key: 'createdAt', header: '등록일자', align: 'center', sortable: true },
];

const makeRowId = (uiPage: number, idx: number) =>
  String((uiPage - 1) * 1000 + (idx + 1)).padStart(7, '0');

function getPageRange(current: number, total: number, count = 5) {
  if (total <= 1) return [1];
  const half = Math.floor(count / 2);
  let start = Math.max(1, current - half);
  const end = Math.min(total, start + count - 1);
  start = Math.max(1, end - count + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// 폼 → 판매상태
function computeStatusFromPayload(p: ProductCreatePayload): 'BEFORE_SELLING' | 'SELLING' | 'SOLD_OUT' | 'END_OF_SALE' {
  const now = new Date();
  if (p.plannedSale) {
    const s = new Date(p.plannedSale.startAt);
    const e = p.plannedSale.endAt ? new Date(p.plannedSale.endAt) : undefined;
    if (!isNaN(s.getTime()) && now < s) return 'BEFORE_SELLING';
    if (e && !isNaN(e.getTime()) && now > e) return 'END_OF_SALE';
  }
  if ((p.stock ?? 0) <= 0) return 'SOLD_OUT';
  return 'SELLING';
}

// 판매상태 라벨
const STATUS_LABEL: Record<string, string> = {
  BEFORE_SELLING: '판매예정',
  SELLING: '판매중',
  SOLD_OUT: '품절',
  END_OF_SALE: '판매종료',
  STOPPED: '판매중지',
};

// 로컬 스냅샷 저장 키
const STORAGE_KEY = 'productFormSnapshotsById';

// 스냅샷 load/save
function loadCache(): Record<string, ProductCreatePayload> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ProductCreatePayload>) : {};
  } catch {
    return {};
  }
}
function saveCache(obj: Record<string, ProductCreatePayload>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {}
}

const UUID_BY_ID_KEY = 'uuidByProductId';
const UUID_BY_NAME_KEY = 'uuidByBrandAndName';

function loadJson<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function saveJson<T>(k: string, v: T) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

export default function ProductsPage() {
  const [rows, setRows] = useState<RowEx[]>([]);
  const [sortKey, setSortKey] = useState<keyof RowEx | undefined>(undefined);
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
  const [editingRow, setEditingRow] = useState<RowEx | null>(null);

  // 스냅샷 캐시
  const snapshotsRef = useRef<Record<string, ProductCreatePayload>>({});
  // uuid 캐시
  const uuidByIdRef = useRef<Record<string, string>>({});
  const uuidByNameRef = useRef<Record<string, string>>({});

  const updateSort = (key: string, direction: SortDirection) => {
    setSortKey(key as keyof RowEx);
    setSortDirection(direction);
  };

  // 최초 마운트: 로컬 스토리지 → 메모리 적재
  useEffect(() => {
    snapshotsRef.current = { ...snapshotsRef.current, ...loadCache() };
    uuidByIdRef.current = loadJson(UUID_BY_ID_KEY, {} as Record<string, string>);
    uuidByNameRef.current = loadJson(UUID_BY_NAME_KEY, {} as Record<string, string>);
  }, []);

  // 목록 조회 (작가 전용, 서버 0기반)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchArtistProducts({
          page: page - 1,
          size,
          keyword: searchTerm || undefined,
          selling: undefined,
          sort: 'createDate',
          order: 'DESC',
        });
        if (cancelled) return;

        const elements = Number((data as { totalElements?: number }).totalElements ?? 0);
        const pages =
          Number((data as { totalPages?: number }).totalPages ?? 0) ||
          Math.max(1, Math.ceil(elements / size));
        setTotalElements(elements);
        setTotalPages(pages);

        const content = ((data as { content?: unknown[] }).content ?? []) as ArtistProductItem[];

        const mapped: RowEx[] = content.map((p, idx) => {
          // 가능한 후보에서 uuid 추출
          let productUuid: string | undefined =
            p.productUuid ?? p.uuid ?? p.productUUID ?? p.product?.uuid ?? undefined;

          const productId: string | undefined =
            p.productId != null
              ? String(p.productId)
              : p.id != null
              ? String(p.id)
              : p.productNumber != null
              ? String(p.productNumber)
              : undefined;

          // 캐시로 보강
          if (!productUuid && productId) {
            const cached = uuidByIdRef.current[productId];
            if (cached) productUuid = cached;
          }
          if (!productUuid) {
            const nameKey = `${(p.artist?.name ?? p.brandName ?? '내 브랜드').trim()}|||${(p.productName ?? p.name ?? '(이름 없음)').trim()}`;
            const cachedByName = uuidByNameRef.current[nameKey];
            if (cachedByName) productUuid = cachedByName;
          }

          const created =
            p.registeredDate ??
            p.registrationDate ??
            p.addedAt ??
            p.createdAt ??
            new Date().toISOString();
          const createdDate = new Date(created);
          const createdAt = isNaN(createdDate.getTime())
            ? new Date().toLocaleDateString('en-CA')
            : createdDate.toLocaleDateString('en-CA');

          // 스냅샷 우선 없으면 서버 상태
          const snap = productId ? snapshotsRef.current[productId] : undefined;
          const rawCode =
            p.sellingStatus ??
            p.status ??
            (typeof p.selling === 'boolean' ? (p.selling ? 'SELLING' : 'STOPPED') : 'SELLING');
          let code = String(rawCode).toUpperCase();
          if (snap) code = computeStatusFromPayload(snap);
          const status = STATUS_LABEL[code] ?? code;

          return {
            id: makeRowId(page, idx),
            name: p.productName ?? p.name ?? '(이름 없음)',
            author: p.artist?.name ?? p.brandName ?? '내 브랜드',
            status,
            createdAt,
            productUuid,
            productId,
            payloadSnapshot: productId ? snapshotsRef.current[productId] : undefined,
          };
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
  }, [page, size, refreshKey, searchTerm]);

  // 페이지 이동
  const gotoPage = (p: number) => setPage(p);

  const handleSelectionChange = (keys: Key[]) => {
    setSelectedIds(keys.map((key) => String(key)));
  };

  // 선택된 행들
  const selectedRows = useMemo<RowEx[]>(
    () => rows.filter((r) => selectedIds.includes(r.id)),
    [rows, selectedIds],
  );

  // 생성 완료
  const handleCreated = ({ productUuid, payload }: { productUuid: string; payload: ProductCreatePayload }) => {
    const nameKey = `내 브랜드|||${payload.title?.trim() ?? ''}`;
    if (payload.title?.trim()) {
      uuidByNameRef.current[nameKey] = productUuid;
      saveJson(UUID_BY_NAME_KEY, uuidByNameRef.current);
    }

    const nextTotal = totalElements + 1;
    const nextPages = Math.max(1, Math.ceil(nextTotal / size));
    setTotalElements(nextTotal);
    setTotalPages(nextPages);
    if (page !== 1) setPage(1);
    else setRefreshKey((k) => k + 1);
  };

  // brand+name 일치 항목의 uuid
  const resolveUuidForRow = async (row: RowEx): Promise<string | undefined> => {
    if (row.productUuid) return row.productUuid;

    if (row.productId) {
      const byId = uuidByIdRef.current[row.productId];
      if (byId) return byId;
    }

    const brand = (row.author ?? '').trim();
    const name = (row.name ?? '').trim();
    const nameKey = `${brand}|||${name}`;
    if (uuidByNameRef.current[nameKey]) return uuidByNameRef.current[nameKey];

    const MAX_PAGES = 5;
    const SIZE = 30;
    for (let p = 1; p <= MAX_PAGES; p++) {
      const list = await getProducts({ page: p, size: SIZE, sort: 'newest' });
      const products = (list as { products?: unknown[] }).products as
        | PublicProductListItem[]
        | undefined;

      const hit = products?.find(
        (prod) => (prod.brandName ?? '').trim() === brand && (prod.name ?? '').trim() === name,
      );

      if (hit?.productUuid) {
        // 캐시에 저장
        if (row.productId) {
          uuidByIdRef.current[row.productId] = hit.productUuid;
          saveJson(UUID_BY_ID_KEY, uuidByIdRef.current);
        }
        uuidByNameRef.current[nameKey] = hit.productUuid;
        saveJson(UUID_BY_NAME_KEY, uuidByNameRef.current);

        // 행에도 즉시 반영
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, productUuid: hit.productUuid } : r)));
        return hit.productUuid;
      }

      const total = (list as { totalPages?: number }).totalPages ?? p;
      if (p >= total) break;
    }
    return undefined;
  };

  // 행 클릭
  const handleRowClick = async (row: RowEx) => {
    const uuid = await resolveUuidForRow(row);

    // 스냅샷 보강
    let payloadSnapshot = row.payloadSnapshot;
    if (!payloadSnapshot && row.productId) {
      const cache = loadCache();
      payloadSnapshot = cache[row.productId];
    }

    setEditingRow({ ...row, productUuid: uuid, payloadSnapshot });
    setMode('edit');
    setOpenModal(true);
  };

  // 상단 - 선택 수정
  const handleTopEdit = () => {
    const row = selectedRows[0];
    if (!row) return;
    void handleRowClick(row);
  };

  // 상단 - 선택 삭제
  const handleTopDelete = async () => {
    if (selectedRows.length === 0) return;

    setLoading(true);

    // uuid
    const withUuid: Array<{ row: RowEx; uuid: string }> = [];
    const unresolved: RowEx[] = [];
    for (const r of selectedRows) {
      const uuid = await resolveUuidForRow(r);
      if (uuid) withUuid.push({ row: r, uuid });
      else unresolved.push(r);
    }

    setLoading(false);

    if (!withUuid.length) {
      alert(
        '선택한 항목에서 productUuid를 찾지 못해 삭제할 수 없습니다.\n' +
          (unresolved.length ? unresolved.map((r) => `- ${r.author} / ${r.name}`).join('\n') : ''),
      );
      return;
    }

    const ok = confirm(`${withUuid.length}개의 상품을 삭제할까요?`);
    if (!ok) return;

    setLoading(true);
    const results = await Promise.allSettled(withUuid.map((x) => deleteProduct(x.uuid)));
    setLoading(false);

    const successUiIds = new Set(
      results
        .map((res, i) => (res.status === 'fulfilled' ? withUuid[i].row.id : null))
        .filter(Boolean) as string[],
    );
    setRows((prev) => prev.filter((r) => !successUiIds.has(r.id)));
    setSelectedIds([]);

    const failed = results
      .map((res, i) => ({ res, row: withUuid[i].row }))
      .filter((x): x is { res: PromiseRejectedResult; row: RowEx } => x.res.status === 'rejected');

    let msg = '';
    if (unresolved.length) {
      msg += `uuid 미해결: ${unresolved.length}건\n` + unresolved.map((r) => `- ${r.author} / ${r.name}`).join('\n') + '\n\n';
    }
    if (failed.length) {
      msg +=
        `삭제 실패: ${failed.length}건\n` +
        failed
          .map((f) => `- ${f.row.author} / ${f.row.name}: ${(f.res.reason as Error)?.message ?? '오류'}`)
          .join('\n');
    }
    alert(msg || '삭제가 완료되었습니다.');
  };

  // 모달에서 저장해 온 스냅샷을 반영
  const handleSaveSnapshot = (productId: string, payload: ProductCreatePayload) => {
    snapshotsRef.current[productId] = payload;
    const cache = loadCache();
    cache[productId] = payload;
    saveCache(cache);
    setRows((prev) =>
      prev.map((r) => (r.productId === productId ? { ...r, payloadSnapshot: payload } : r)),
    );
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

      <ArtistDataTable
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
          <button onClick={() => gotoPage(1)} disabled={page <= 1} className="px-2 py-1 hover:text-primary disabled:opacity-40" aria-label="First">
            «
          </button>
          <button onClick={() => gotoPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-2 py-1 hover:text-primary disabled:opacity-40" aria-label="Previous">
            ‹
          </button>

          {getPageRange(page, totalPages, 5).map((n) => (
            <button
              key={n}
              onClick={() => gotoPage(n)}
              className={`h-8 w-8 rounded-full text-center leading-8 ${n === page ? 'text-primary font-semibold' : 'hover:text-primary'}`}
              aria-current={n === page ? 'page' : undefined}
            >
              {n}
            </button>
          ))}

          <button onClick={() => gotoPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="px-2 py-1 hover:text-primary disabled:opacity-40" aria-label="Next">
            ›
          </button>
          <button onClick={() => gotoPage(totalPages)} disabled={page >= totalPages} className="px-2 py-1 hover:text-primary disabled:opacity-40" aria-label="Last">
            »</button>
        </nav>

        <ProductCreateModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          mode={mode}
          productUuid={editingRow?.productUuid}
          productId={editingRow?.productId}
          initialBrand="내 브랜드"
          initialPayload={editingRow?.payloadSnapshot}
          onCreated={handleCreated}
          onUpdated={() => {
            setRefreshKey((k) => k + 1);
          }}
          onSaveSnapshot={handleSaveSnapshot}
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
