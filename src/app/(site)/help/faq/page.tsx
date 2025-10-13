"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Button from "@/components/Button";
import { DataTable, type Column } from "@/components/table/DataTable";
import { useToast } from "@/components/ToastProvider";
import { fetchFaqList, FAQ_CATEGORY_OPTIONS, type FaqSummary } from "@/services/faqs";
import { useAuthStore } from "@/stores/authStore";

type FaqRow = {
  id: number;
  no: string;
  category: string;
  question: string;
};

const faqCols: Column<FaqRow>[] = [
  { key: "no", header: "글번호", width: "w-24" },
  {
    key: "category",
    header: "카테고리",
    width: "w-32",
  },
  {
    key: "question",
    header: "질문",
    render: (row) => (
      <span className="block truncate font-medium text-[var(--color-gray-900)] hover:underline">
        {row.question}
      </span>
    ),
  },
];

const ALL_CATEGORY_OPTION = { value: "ALL", label: "전체" } as const;

export default function Page() {
  const router = useRouter();
  const toast = useToast();
  const role = useAuthStore((store) => store.role);
  const isHydrated = useAuthStore((store) => store.isHydrated);

  const [category, setCategory] = useState<string>(ALL_CATEGORY_OPTION.value);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [items, setItems] = useState<FaqSummary[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const canManage = role === "ADMIN";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const list = await fetchFaqList({ category, page, size });
        if (cancelled) return;
        setItems(list.faqs);
        setTotalPages(Math.max(1, list.totalPages));
        setTotalElements(list.totalElements);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "FAQ 목록을 불러오지 못했습니다.";
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
  }, [category, page, size, toast]);

  const rows: FaqRow[] = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        no: item.id.toString().padStart(5, "0"),
        category: item.categoryDisplayName ?? getCategoryLabel(item.category),
        question: item.question,
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

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(event.target.value);
    setPage(0);
  };

  const handlePageChange = (next: number) => {
    if (next < 0 || next >= totalPages || next === page) return;
    setPage(next);
  };

  return (
    <>
      <div className="mt-[94px] mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h3 className="text-2xl font-bold">자주 묻는 질문(FAQ)</h3>
        <div className="flex items-center gap-3">
          <select
            value={category}
            onChange={handleCategoryChange}
            className="h-10 rounded border border-[var(--color-gray-200)] px-3 text-sm"
          >
            {[ALL_CATEGORY_OPTION, ...FAQ_CATEGORY_OPTIONS].map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {isHydrated && canManage && (
            <Link href="/help/faq/new">
              <Button size="sm">FAQ 작성</Button>
            </Link>
          )}
        </div>
      </div>

      <DataTable
        columns={faqCols}
        rows={rows}
        rowKey={(row) => row.id.toString()}
        onRowClick={(row) => router.push(`/help/faq/${row.id}`)}
      />

      {isLoading && <p className="mt-4 text-sm text-[var(--color-gray-500)]">목록을 불러오는 중입니다…</p>}
      {!isLoading && rows.length === 0 && (
        <p className="mt-4 text-sm text-[var(--color-gray-500)]">등록된 FAQ가 없습니다.</p>
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

function getCategoryLabel(value: string | undefined): string {
  if (!value) return '기타';
  const option = FAQ_CATEGORY_OPTIONS.find((item) => item.value === value);
  return option?.label ?? value;
}
