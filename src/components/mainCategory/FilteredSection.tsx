
'use client';

import ProductFilter from './ProductFilter';
import ProductCard from '../ProductCard';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ProductListItem } from '@/types/product';


const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const toCurrency = (n: number | null | undefined) =>
  isNum(n) ? `${n.toLocaleString('ko-KR')}원` : '';
const toPercent = (n: number | null | undefined) =>
  isNum(n) && n > 0 ? `${n}%` : undefined;
const toRating = (n: number | null | undefined) =>
  isNum(n) ? n.toFixed(1) : '0.0';
const safeImg = (url?: string | null): string | null =>
  url && url.trim().length > 0 ? url : null;

type SortLabel = '인기순' | '최신순' | '낮은 가격순' | '높은 가격순';

export default function FilteredSection({ items }: { items: ProductListItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL의 sort 반영
  const currentSort = searchParams.get('sort');
  const [sortOption, setSortOption] = useState<SortLabel>(
    currentSort === 'priceAsc'
      ? '낮은 가격순'
      : currentSort === 'priceDesc'
      ? '높은 가격순'
      : currentSort === 'newest'
      ? '최신순'
      : '인기순'
  );

  // 정렬: 가격은 클라이언트에서 처리, 인기/최신은 서버 정렬 결과 사용
  const sorted = useMemo(() => {
    const copy = [...items];
    switch (sortOption) {
      case '낮은 가격순':
        return copy.sort(
          (a, b) =>
            (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price)
        );
      case '높은 가격순':
        return copy.sort(
          (a, b) =>
            (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price)
        );
      case '최신순':
      case '인기순':
      default:
        return copy;
    }
  }, [items, sortOption]);

  const handleSortChange = (value: SortLabel) => {
    setSortOption(value);
    const qs = new URLSearchParams(searchParams.toString());
    qs.set(
      'sort',
      value === '낮은 가격순'
        ? 'priceAsc'
        : value === '높은 가격순'
        ? 'priceDesc'
        : value === '최신순'
        ? 'newest'
        : 'popular'
    );
    router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
  };

  return (
    <>
      <ProductFilter selected={sortOption} onChange={handleSortChange} />

      <div className="max-w-[min(1200px,calc(100vw-250px))] mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {sorted.map((p) => (
            <div key={p.productUuid}>
              <Link href={`/product/${p.productUuid}`}>
                <ProductCard
                  img={safeImg(p.url)}
                  title={p.name}
                  brand={p.brandName}
                  discount={toPercent(p.discountRate)}
                  price={toCurrency(p.discountPrice ?? p.price)}
                  originalPrice={toCurrency(p.price)}
                  rating={toRating(p.rating)}
                />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
