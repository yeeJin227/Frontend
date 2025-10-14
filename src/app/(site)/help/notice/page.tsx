'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Button from '@/components/Button';
import { DataTable } from '@/components/table/DataTable';
import type { Column } from '@/components/table/DataTable';
import { useToast } from '@/components/ToastProvider';
import { fetchNoticeList, type NoticeSummary } from '@/services/notices';
import { useAuthStore } from '@/stores/authStore';

type NoticeRow = {
  id: number;
  no: string;
  title: string;
  important?: boolean;
  date: string;
  views: number;
};

const noticeCols: Column<NoticeRow>[] = [
  { key: 'no', header: '글번호', width: 'w-24' },
  {
    key: 'title',
    header: '제목',
    render: (row) => (
      <div className="flex items-center gap-2">
        <span className="truncate font-medium">{row.title}</span>
        {row.important && (
          <span className="font-extrabold text-red-500">중요</span>
        )}
      </div>
    ),
  },
  { key: 'date', header: '작성일', width: 'w-32' },
  { key: 'views', header: '조회수', width: 'w-20', align: 'center' },
];

export default function NoticeListPage() {
  const router = useRouter();
  const toast = useToast();
  const role = useAuthStore((store) => store.role);
  const isHydrated = useAuthStore((store) => store.isHydrated);

  const [keyword, setKeyword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [items, setItems] = useState<NoticeSummary[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLast, setIsLast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const canManage = role === 'ADMIN';

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const list = await fetchNoticeList({
          keyword: searchTerm,
          page,
          size: pageSize,
        });
        if (cancelled) return;
        setItems(list.notices);
        setTotalPages(Math.max(1, list.totalPages));
        setTotalElements(list.totalElements);
        setIsLast(list.isLast);
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error
            ? error.message
            : '공지사항 목록을 불러오지 못했습니다.';
        toast.error(message);
        setItems([]);
        setTotalPages(1);
        setTotalElements(0);
        setIsLast(true);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, searchTerm, toast]);

  const rows: NoticeRow[] = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        no: item.id.toString().padStart(5, '0'),
        title: item.title,
        important: item.isImportant,
        date: formatDate(item.createDate),
        views: item.viewCount,
      })),
    [items],
  );

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    const total = totalPages;
    const current = page;
    const tentativeStart = Math.max(0, current - Math.floor(maxButtons / 2));
    const start = Math.min(tentativeStart, Math.max(0, total - maxButtons));
    const end = Math.min(total, start + maxButtons);
    return Array.from(
      { length: Math.max(0, end - start) },
      (_, idx) => start + idx,
    );
  }, [page, totalPages]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(0);
    setSearchTerm(keyword.trim());
  };

  const handlePageChange = (next: number) => {
    if (next < 0 || next >= totalPages || next === page) return;
    setPage(next);
  };

  return (
    <>
      <div className="mt-[94px] mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-bold">공지사항</h3>
        {isHydrated && canManage && (
          <Link href="/help/notice/new">
            <Button variant="primary" size="sm">
              공지사항 작성
            </Button>
          </Link>
        )}
      </div>

      <DataTable
        columns={noticeCols}
        rows={rows}
        rowKey={(row) => row.id.toString()}
        rowClassName={(row) =>
          row.important
            ? 'bg-[var(--color-danger-10)] hover:bg-[var(--color-danger-20)]'
            : ''
        }
        onRowClick={(row) => router.push(`/help/notice/${row.id}`)}
      />

      {isLoading && (
        <p className="mt-4 text-sm text-[var(--color-gray-500)]">
          목록을 불러오는 중입니다…
        </p>
      )}

      {!isLoading && rows.length === 0 && (
        <p className="mt-4 text-sm text-[var(--color-gray-500)]">
          등록된 공지사항이 없습니다.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="hidden md:flex md:flex-1" />
        <div className="flex flex-col items-center gap-2 md:flex-1">
          <nav className="flex items-center justify-center gap-3 text-sm text-[var(--color-gray-700)]">
            <button
              type="button"
              className="px-2 py-1 hover:text-primary disabled:cursor-not-allowed disabled:text-[var(--color-gray-400)]"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 0 || isLoading}
              aria-label="Prev"
            >
              ‹
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`h-8 w-8 rounded-full text-center leading-8 ${
                  pageNumber === page ? 'font-semibold text-primary' : 'hover:text-primary'
                }`}
                onClick={() => handlePageChange(pageNumber)}
                disabled={isLoading}
              >
                {pageNumber + 1}
              </button>
            ))}
            <button
              type="button"
              className="px-2 py-1 hover:text-primary disabled:cursor-not-allowed disabled:text-[var(--color-gray-400)]"
              onClick={() => handlePageChange(page + 1)}
              disabled={isLoading || isLast}
              aria-label="Next"
            >
              ›
            </button>
          </nav>
          <p className="text-xs text-[var(--color-gray-500)]">
            총 {totalElements.toLocaleString('ko-KR')}건 · {totalPages.toLocaleString('ko-KR')}페이지
          </p>
        </div>
        <form
          className="flex w-full items-center gap-2 md:flex-1 md:justify-end"
          onSubmit={handleSearch}
        >
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="제목 또는 내용으로 검색"
            className="h-10 w-full rounded border border-[var(--color-gray-200)] px-3 py-2 md:w-[220px]"
          />
          <Button type="submit" variant="outline" size="sm" disabled={isLoading}>
            검색
          </Button>
        </form>
      </div>
    </>
  );
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('ko-KR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
