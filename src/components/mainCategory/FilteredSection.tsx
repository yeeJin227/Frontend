'use client'

import { Product } from "@/utils/categoryData"
import ProductFilter from "./ProductFilter"
import ProductCard from "../ProductCard"
import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

function toNumberPrice(v: string | number) {
  if (typeof v === 'number') return v;
  return Number(String(v).replace(/[^\d.-]/g, '')) || 0;
}

export default function FilteredSection({products}:{products: Product[]}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL의 sort 반영
  const currentSort = searchParams.get('sort');
  const [sortOption, setSortOption] = useState<'인기순'|'최신순'|'낮은 가격순'|'높은 가격순'>(
    currentSort === 'priceAsc' ? '낮은 가격순'
    : currentSort === 'priceDesc' ? '높은 가격순'
    : currentSort === 'newest' ? '최신순'
    : '인기순'
  );

  const sorted = useMemo(() => {
    const copy = [...products];
    switch (sortOption) {
      case '최신순':
        return copy.sort((a,b) =>
          new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
        );
      case '낮은 가격순':
        return copy.sort((a,b) => toNumberPrice(a.price) - toNumberPrice(b.price));
      case '높은 가격순':
        return copy.sort((a,b) => toNumberPrice(b.price) - toNumberPrice(a.price));
      default:
        return copy;
    }
  }, [products, sortOption]);

  const handleSortChange = (value: typeof sortOption) => {
    setSortOption(value);
    const qs = new URLSearchParams(searchParams.toString());
    qs.set('sort',
      value === '낮은 가격순' ? 'priceAsc' :
      value === '높은 가격순' ? 'priceDesc' :
      value === '최신순' ? 'newest' : 'popular'
    );
    router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
  };

  return (
    <>
      <ProductFilter selected={sortOption} onChange={handleSortChange} />

      <div className="max-w-[min(1200px,calc(100vw-250px))] mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {sorted.map((item) => (
            <div key={item.id}>
              <Link href={`/product/${item.id}`}>
                <ProductCard {...item} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
