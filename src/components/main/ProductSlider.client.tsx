'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import ProductCard from '../ProductCard';
import type { ProductListItem } from '@/types/product';

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const toCurrency = (n: number | null | undefined) =>
  isNum(n) ? `${n.toLocaleString('ko-KR')}원` : '';
const toPercent = (n: number | null | undefined) =>
  isNum(n) && n > 0 ? `${n}%` : undefined;
const toRating = (n: number | null | undefined) =>
  isNum(n) ? n.toFixed(1) : '0.0';

export default function ProductSlider({ items }: { items: ProductListItem[] }) {
  const itemsPerPage = 4;

  const pages = useMemo(() => {
    const result: ProductListItem[][] = [];
    const total = Math.max(1, Math.ceil(items.length / itemsPerPage));
    for (let i = 0; i < total; i++) {
      result.push(items.slice(i * itemsPerPage, (i + 1) * itemsPerPage));
    }
    return result;
  }, [items]);

  const totalPages = pages.length;
  const [currentSlide, setCurrentSlide] = useState(0);

  const next = useCallback(() => {
    if (totalPages <= 1) return;
    setCurrentSlide((s) => (s + 1) % totalPages);
  }, [totalPages]);

  const prev = useCallback(() => {
    if (totalPages <= 1) return;
    setCurrentSlide((s) => (s - 1 + totalPages) % totalPages);
  }, [totalPages]);

  return (
    <div className="relative overflow-visible px-6 sm:px-10">
      {/* 왼쪽 화살표 */}
      <button
        onClick={prev}
        className="absolute left-0 sm:left-[-30px] top-1/2 z-20 -translate-y-1/2 rounded-full bg-white border-none p-2 sm:p-3 shadow-md transition hover:shadow-lg disabled:opacity-40"
        disabled={totalPages <= 1}
        aria-label="이전 보기"
      >
        <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 뷰포트 */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {pages.map((page, idx) => (
            <div key={idx} className="min-w-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {page.map((p) => (
                  <div key={p.productUuid}>
                    <Link href={`/product/${p.productUuid}`}>
                      <ProductCard
                        img={p.url}
                        title={p.name}
                        brand={p.brandName}
                        discount={p.discountRate ? toPercent(p.discountRate) : undefined}
                        price={toCurrency(p.discountPrice)}
                        originalPrice={toCurrency(p.price)}
                        rating={toRating(p.rating)}
                      />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 오른쪽 화살표 */}
      <button
        onClick={next}
        className="absolute right-0 sm:right-[-30px] top-1/2 z-20 -translate-y-1/2 rounded-full bg-white border-none p-2 sm:p-3 shadow-md transition hover:shadow-lg disabled:opacity-40"
        disabled={totalPages <= 1}
        aria-label="다음 보기"
      >
        <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
