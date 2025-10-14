'use client';

import { useMemo, useState, type Key } from 'react';
import Button from '@/components/Button';
import SearchIcon from '@/assets/icon/search.svg';
import FundingDataTable, { FundingTableColumn, SortDirection } from '@/components/artist/FundingDataTable';
import FundingCreateModal from '@/components/artist/FundingCreateModal'; // ⬅️ 모달 import

// 테이블 행 데이터 타입 (UI)
type FundingRow = {
  id: string;
  title: string;
  percent: string;
  joinNumber: string;
  totalFunding: string;
  endAt: string;
};

const MOCK_ROWS: FundingRow[] = [
  { id: '0000001', title: '펀딩 제목입니다 펀딩 제목입니다.', percent: '100%',  joinNumber: '800명', totalFunding: '₩ 900,000', endAt: '2025. 09. 18' },
  { id: '0000002', title: '펀딩 제목입니다 펀딩 제목입니다.', percent: '1500%', joinNumber: '800명', totalFunding: '₩ 900,000', endAt: '2025. 09. 18' },
  { id: '0000003', title: '펀딩 제목입니다 펀딩 제목입니다.', percent: '2040%', joinNumber: '800명', totalFunding: '₩ 900,000', endAt: '2025. 09. 18' },
  { id: '0000004', title: '펀딩 제목입니다 펀딩 제목입니다.', percent: '300%',  joinNumber: '800명', totalFunding: '₩ 900,000', endAt: '2025. 09. 18' },
  { id: '0000005', title: '펀딩 제목입니다 펀딩 제목입니다.', percent: '5000%', joinNumber: '800명', totalFunding: '₩ 900,000', endAt: '2025. 09. 18' },
  { id: '0000006', title: '펀딩 제목입니다 펀딩 제목입니다.', percent: '104%',  joinNumber: '800명', totalFunding: '₩ 900,000', endAt: '2025. 09. 18' },
  { id: '0000007', title: '펀딩 제목입니다 펀딩 제목입니다.', percent: '80%',   joinNumber: '800명', totalFunding: '₩ 900,000', endAt: '2025. 09. 18' },
  { id: '0000008', title: '펀딩 제목입니다 펀딩 제목입니다.', percent: '70%',   joinNumber: '800명', totalFunding: '₩ 900,000', endAt: '2025. 09. 18' },
  { id: '0000009', title: '펀딩 제목입니다 펀딩 제목입니다.', percent: '50%',   joinNumber: '800명', totalFunding: '₩ 900,000', endAt: '2025. 09. 18' },
  { id: '0000010', title: '펀딩 제목입니다 펀딩 제목입니다.', percent: '1%',    joinNumber: '800명', totalFunding: '₩ 900,000', endAt: '2025. 09. 18' },
  { id: '0000011', title: '펀딩 제목입니다 펀딩 제목입니다.', percent: '10%',   joinNumber: '800명', totalFunding: '₩ 900,000', endAt: '2025. 09. 18' },
  { id: '0000012', title: '펀딩 제목입니다 펀딩 제목입니다.', percent: '20%',   joinNumber: '800명', totalFunding: '₩ 900,000', endAt: '2025. 09. 18' },
  { id: '0000013', title: '펀딩 제목입니다 펀딩 제목입니다.', percent: '45%',   joinNumber: '800명', totalFunding: '₩ 900,000', endAt: '2025. 09. 18' },
  { id: '0000014', title: '펀딩 제목입니다 펀딩 제목입니다.', percent: '79%',   joinNumber: '800명', totalFunding: '₩ 900,000', endAt: '2025. 09. 18' },
];

const columns: FundingTableColumn<FundingRow>[] = [
  { key: 'title',        header: '펀딩제목',  align: 'center', sortable: true },
  { key: 'percent',      header: '달성률',    align: 'center', sortable: true },
  { key: 'joinNumber',   header: '참여자 수', align: 'center', sortable: true },
  { key: 'totalFunding', header: '총 펀딩액', align: 'center', sortable: true },
  { key: 'endAt',        header: '마감기한',  align: 'center', sortable: true },
];

function getPageRange(current: number, total: number, count = 5) {
  if (total <= 1) return [1];
  const half = Math.floor(count / 2);
  let start = Math.max(1, current - half);
  const end = Math.min(total, start + count - 1);
  start = Math.max(1, end - count + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function FundingManagePage() {
  const [sortKey, setSortKey] = useState<keyof FundingRow | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [page, setPage] = useState(1);
  const size = 10;

  const [openModal, setOpenModal] = useState(false); // ⬅️ 모달 상태

  const filtered = useMemo(() => {
    const q = searchTerm.trim();
    if (!q) return MOCK_ROWS;
    return MOCK_ROWS.filter((r) => r.title.includes(q));
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const pageRows = useMemo(
    () => filtered.slice((page - 1) * size, page * size),
    [filtered, page, size],
  );

  const handleSelectionChange = (keys: Key[]) => setSelectedIds(keys.map(String));
  const updateSort = (key: string, direction: SortDirection) => {
    setSortKey(key as keyof FundingRow);
    setSortDirection(direction);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="mb-[20px] text-2xl font-bold">펀딩 관리</h3>
        <div className="flex gap-2">
          <Button variant="tertiary">판매 요청</Button>
          <Button variant="primary" onClick={() => setOpenModal(true)}>
            새 펀딩
          </Button>
        </div>
      </div>

      <FundingDataTable
        columns={columns}
        rows={pageRows}
        rowKey={(row) => row.id}
        sortKey={sortKey as string | undefined}
        sortDirection={sortDirection}
        onSortChange={updateSort}
        selectedRowKeys={selectedIds}
        onSelectionChange={handleSelectionChange}
        onRowClick={() => { console.log('row click'); }}
      />

      {/* 페이지네이션 + 검색 */}
      <div className="relative mt-6 flex items-center justify-center">
        <nav className="flex items-center gap-2 text-sm text-[var(--color-gray-700)]">
          <button onClick={() => setPage(1)} disabled={page <= 1} className="px-2 py-1 hover:text-primary disabled:opacity-40" aria-label="First">
            «
          </button>
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-2 py-1 hover:text-primary disabled:opacity-40" aria-label="Previous">
            ‹
          </button>

          {getPageRange(page, totalPages, 5).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`h-8 w-8 rounded-full text-center leading-8 ${n === page ? 'text-primary font-semibold' : 'hover:text-primary'}`}
              aria-current={n === page ? 'page' : undefined}
            >
              {n}
            </button>
          ))}

          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="px-2 py-1 hover:text-primary disabled:opacity-40" aria-label="Next">
            ›
          </button>
          <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="px-2 py-1 hover:text-primary disabled:opacity-40" aria-label="Last">
            »
          </button>
        </nav>

        <form
          className="absolute right-0 flex h-10 w-[240px] items-center rounded-[12px] border border-primary px-4 text-sm text-[var(--color-gray-700)]"
          onSubmit={(e) => e.preventDefault()}
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

      {/* ⬇️ 모달 연결 */}
      <FundingCreateModal
        open={openModal}
        mode="create"
        onClose={() => setOpenModal(false)}
      />
    </>
  );
}
