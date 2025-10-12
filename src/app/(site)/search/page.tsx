'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ResultHeader from '@/components/search/ResultHeader';
import ProductCard from '@/components/ProductCard';

import { fuzzyMatch } from '@/utils/search';
import { allProducts } from '@/utils/product';

const SORTS = ['인기순', '최신순', '낮은 가격순', '높은 가격순'] as const;
type Sort = (typeof SORTS)[number];

function toNumberPrice(v: string | number) {
  if (typeof v === 'number') return v;
  return Number(String(v).replace(/[^\d.-]/g, '')) || 0;
}

export default function Page() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchContent />
    </Suspense>
  );
}

function SearchFallback() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <main>
        <div className="rounded-2xl bg-white p-8 text-center text-lg font-medium text-gray-600 shadow">
          검색 결과를 불러오는 중입니다…
        </div>
      </main>
    </div>
  );
}

function SearchContent() {
  const params = useSearchParams();
  const q = (params.get('q') ?? '').trim();

  const [sort, setSort] = useState<Sort>('인기순');

  const filtered = useMemo(() => {
    // 검색어: (대소문자 무시)
    const keyword = q.toLowerCase();

    const list = allProducts.filter(
      (item) =>
        !keyword ||
        fuzzyMatch(keyword, item.title) ||
        fuzzyMatch(keyword, item.brand),
    );

    // 정렬: FilteredSection과 동일 로직
    const copy = [...list];
    switch (sort) {
      case '최신순':
        return copy.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime(),
        );
      case '낮은 가격순':
        return copy.sort(
          (a, b) => toNumberPrice(a.price) - toNumberPrice(b.price),
        );
      case '높은 가격순':
        return copy.sort(
          (a, b) => toNumberPrice(b.price) - toNumberPrice(a.price),
        );
      case '인기순':
      default:
        return copy;
    }
  }, [q, sort]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <main>
        <ResultHeader
          query={q || '전체'}
          total={filtered.length}
          onSort={(v) => setSort(v)}
        />

        {filtered.length === 0 ? (
          <div className='flex flex-col justify-center items-center text-center p-50 mt-4 bg-tertiary-20'>
            <div className="text-4xl mb-3">🧐</div>
            <span className='text-lg font-semibold mb-2'>검색결과가 없습니다.</span>
            <p className="text-sm text-slate-500 mb-6">검색어를 다시 입력해주세요.</p>
          </div>
        ) : (
          <section className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <ProductCard
                key={item.id}
                img={item.img}
                title={item.title}
                brand={item.brand}
                discount={item.discount ? `${item.discount}` : undefined}
                price={item.price.toLocaleString()}
                originalPrice={item.originalPrice.toLocaleString()}
                rating={item.rating}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
