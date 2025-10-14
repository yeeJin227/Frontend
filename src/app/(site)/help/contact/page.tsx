"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Button from "@/components/Button";
import { DataTable, type Column } from "@/components/table/DataTable";
import { useToast } from "@/components/ToastProvider";
import {
  fetchInquiries,
  fetchPublicInquiries,
  INQUIRY_CATEGORY_OPTIONS,
  type InquirySummary,
} from "@/services/inquiries";
import { useAuthStore } from "@/stores/authStore";

type InquiryRow = {
  id: number;
  no: string;
  category: string;
  title: string;
  author: string;
  date: string;
  views: number;
  status: string;
  isSecret: boolean;
  replyCount: number;
};

const columns: Column<InquiryRow>[] = [
  { key: "no", header: "글번호", width: "w-24" },
  { key: "category", header: "카테고리", width: "w-32" },
  {
    key: "title",
    header: "제목",
    render: (row) => (
      <div className="flex items-center gap-2">
        {row.isSecret && (
          <span className="rounded bg-[var(--color-gray-200)] px-2 py-0.5 text-xs text-[var(--color-gray-700)]">
            비공개
          </span>
        )}
        <span className="truncate font-medium text-[var(--color-gray-900)]">{row.title}</span>
        {row.replyCount > 0 && (
          <span className="rounded bg-[var(--color-primary-40)] px-1.5 py-0.5 text-xs text-[var(--color-primary)]">
            답변 {row.replyCount}
          </span>
        )}
      </div>
    ),
  },
  { key: "author", header: "작성자", width: "w-28" },
  { key: "date", header: "작성일", width: "w-32" },
  { key: "views", header: "조회수", width: "w-20", align: "center" },
  {
    key: "status",
    header: "상태",
    width: "w-24",
    render: (row) => (
      <span
        className={`rounded px-2 py-0.5 text-xs font-semibold ${
          row.status === "ANSWERED"
            ? "bg-[var(--color-primary-40)] text-[var(--color-primary)]"
            : "bg-[var(--color-gray-100)] text-[var(--color-gray-600)]"
        }`}
      >
        {row.status === "ANSWERED" ? "답변 완료" : "답변 대기"}
      </span>
    ),
  },
];

export default function QuestionListPage() {
  const router = useRouter();
  const toast = useToast();
  const role = useAuthStore((store) => store.role);
  const isHydrated = useAuthStore((store) => store.isHydrated);

  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [items, setItems] = useState<InquirySummary[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const fetcher = role ? fetchInquiries : fetchPublicInquiries;
        const list = await fetcher({ page, size: pageSize });
        if (cancelled) return;
        setItems(list.inquiries);
        setTotalPages(Math.max(1, list.totalPages));
        setTotalElements(list.totalElements);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "문의 목록을 불러오지 못했습니다.";
        toast.error(message);
        setItems([]);
        setTotalPages(1);
        setTotalElements(0);
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
  }, [isHydrated, role, page, pageSize, toast]);

  const rows: InquiryRow[] = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        no: item.id.toString().padStart(5, "0"),
        category: getCategoryLabel(item.category),
        title: item.title,
        author: item.authorName ?? "-",
        date: formatDate(item.createDate),
        views: item.viewCount,
        status: item.status,
        isSecret: item.isSecret,
        replyCount: item.replyCount,
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
    return Array.from({ length: Math.max(0, end - start) }, (_, idx) => start + idx);
  }, [page, totalPages]);

  const handlePageChange = (next: number) => {
    if (next < 0 || next >= totalPages || next === page) return;
    setPage(next);
  };

  return (
    <>
      <div className="mt-[94px] mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-bold">문의하기</h3>
        <Link href="/help/contact/new">
          <Button variant="primary" size="sm">
            문의글 작성
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id.toString()}
        onRowClick={(row) => router.push(`/help/contact/${row.id}`)}
      />

      {isLoading && <p className="mt-4 text-sm text-[var(--color-gray-500)]">목록을 불러오는 중입니다…</p>}
      {!isLoading && rows.length === 0 && (
        <p className="mt-4 text-sm text-[var(--color-gray-500)]">등록된 문의가 없습니다.</p>
      )}

      <nav className="mt-6 flex items-center justify-center gap-3 text-sm text-[var(--color-gray-700)]">
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
              pageNumber === page ? "font-semibold text-primary" : "hover:text-primary"
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
          disabled={isLoading || page + 1 >= totalPages}
          aria-label="Next"
        >
          ›
        </button>
      </nav>

      <p className="mt-2 text-center text-xs text-[var(--color-gray-500)]">
        총 {totalElements.toLocaleString("ko-KR")}건 · {totalPages.toLocaleString("ko-KR")}페이지
      </p>
    </>
  );
}

function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getCategoryLabel(value: string): string {
  const found = INQUIRY_CATEGORY_OPTIONS.find((option) => option.value === value);
  return found?.label ?? value;
}
