'use client';

import { useEffect, useMemo, useState, type Key } from 'react';
import Button from '@/components/Button';
import SearchIcon from '@/assets/icon/search.svg';
import FundingDataTable, {
  FundingTableColumn,
  SortDirection,
} from '@/components/artist/FundingDataTable';
import FundingCreateModal from '@/components/artist/FundingCreateModal';
import { fetchCategories } from '@/utils/api/category';
import { Category } from '@/types/funding.category';
import { fetchArtistFundingList, ArtistFunding } from '@/services/artistFunding';


type FundingRow = {
  id: string;
  title: string;
  percent: string;
  joinNumber: string;
  totalFunding: string;
  endAt: string;
};

const columns: FundingTableColumn<FundingRow>[] = [
  { key: 'title', header: '펀딩제목', align: 'center', sortable: true },
  { key: 'percent', header: '달성률', align: 'center', sortable: true },
  { key: 'joinNumber', header: '참여자 수', align: 'center', sortable: true },
  { key: 'totalFunding', header: '총 펀딩액', align: 'center', sortable: true },
  { key: 'endAt', header: '마감기한', align: 'center', sortable: true },
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
  const [fundings, setFundings] = useState<FundingRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [sortKey, setSortKey] = useState<keyof FundingRow | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryList, setCategoryList] = useState<Category[]>();

  const [page, setPage] = useState(1);
  const size = 10;

  const [openModal, setOpenModal] = useState(false);

  // 카테고리 api
  useEffect(() => {
    const loadCategory = async () => {
      const categoryData = await fetchCategories();
      setCategoryList(categoryData.data);
    };
    loadCategory();
  }, []);

  // 펀딩 목록 조회 api
  useEffect(() => {
    const loadFundingList = async () => {
      try {
        setLoading(true);
        const data = await fetchArtistFundingList({
          page: page - 1, // API는 0부터 시작
          size,
          keyword: searchTerm || undefined,
          sort: sortKey || 'title',
          order: sortDirection.toUpperCase() as 'ASC' | 'DESC',
        });

        const mapped: FundingRow[] = data.content.map((f: ArtistFunding) => ({
          id: String(f.fundingId),
          title: f.title,
          percent: `${Math.round(f.achievementRate)}%`,
          joinNumber: `${f.participantCount}명`,
          totalFunding: `₩ ${f.currentAmount.toLocaleString()}`,
          endAt: f.endDate?.split('T')[0]?.replace(/-/g, '. ') ?? '-',
        }));

        setFundings(mapped);
        setTotalPages(Math.max(1, data.totalPages || 1));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFundingList();
  }, [page, searchTerm, sortKey, sortDirection]);

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
        rows={fundings}
        rowKey={(row) => row.id}
        sortKey={sortKey as string | undefined}
        sortDirection={sortDirection}
        onSortChange={updateSort}
        selectedRowKeys={selectedIds}
        onSelectionChange={handleSelectionChange}
        onRowClick={() => {
          console.log('row click');
        }}
      />

      {/* 페이지네이션 + 검색 */}
      <div className="relative mt-6 flex items-center justify-center">
        <nav className="flex items-center gap-2 text-sm text-[var(--color-gray-700)]">
          <button
            onClick={() => setPage(1)}
            disabled={page <= 1}
            className="px-2 py-1 hover:text-primary disabled:opacity-40"
          >
            «
          </button>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-2 py-1 hover:text-primary disabled:opacity-40"
          >
            ‹
          </button>

          {getPageRange(page, totalPages, 5).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`h-8 w-8 rounded-full text-center leading-8 ${
                n === page ? 'text-primary font-semibold' : 'hover:text-primary'
              }`}
            >
              {n}
            </button>
          ))}

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-2 py-1 hover:text-primary disabled:opacity-40"
          >
            ›
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
            className="px-2 py-1 hover:text-primary disabled:opacity-40"
          >
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

      {/* 펀딩 생성 모달 */}
      <FundingCreateModal
        open={openModal}
        mode="create"
        onClose={() => setOpenModal(false)}
        categoryList={categoryList as Category[]}
      />
    </>
  );
}
