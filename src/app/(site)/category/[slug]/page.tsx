import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

import CategoryBtn from '@/components/mainCategory/CategoryBtn';
import FilteredSection from '@/components/mainCategory/FilteredSection';
import ProductSlider from '@/components/main/ProductSlider.client';

import { fetchCategoriesServer } from '@/lib/server/categories.server';
import type { Category } from '@/types/category';
import { buildCategoryPath, parseCategoryParamToId } from '@/utils/slug';
import CategorySideBarClient from '@/components/CategorySideBar/Sidebar.client';
import { fetchProductListServer } from '@/lib/server/products.server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ApiProductListItem = {
  productUuid: string;
  url: string;
  brandName: string;
  name: string;
  price: number;
  discountRate: number;
  discountPrice?: number | null;
  rating?: number | null;
};

type SearchParams = {
  tagIds?: string | string[];
  minPrice?: string;
  maxPrice?: string;
  deliveryType?: 'FREE' | 'PAID' | 'CONDITIONAL';
  sort?: 'newest' | 'priceAsc' | 'priceDesc' | 'popular';
  page?: string; // 1-base in URL
  size?: string;
  categoryId?: string;
};

function findById(nodes: Category[], id: number): Category | null {
  const stack = [...nodes];
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur.id === id) return cur;
    if (cur.subCategories?.length) stack.push(...cur.subCategories);
  }
  return null;
}

// CSV/공백/NaN 안전 파서
function parseTagIds(v?: string | string[]) {
  if (!v) return undefined;
  const arr = Array.isArray(v) ? v : [v];
  const nums = arr
    .flatMap((s) => s.split(','))
    .map((s) => Number(String(s).trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  return nums.length ? nums : undefined;
}

// 배송타입 정규화
function normalizeDeliveryType(v?: 'FREE' | 'PAID' | 'CONDITIONAL') {
  if (!v) return undefined;
  if (v === 'CONDITIONAL') return 'CONDITIONAL_FREE' as const;
  return v;
}

function toInt(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const id = parseCategoryParamToId(slug);
  const all = await fetchCategoriesServer();
  const cur = id != null ? findById(all, id) : null;
  const title = cur?.categoryName ?? '카테고리';
  return { title: `모리모리 | ${title}`, description: `${title} 카테고리 상품` };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};

  const id = parseCategoryParamToId(slug);
  if (id == null) return notFound();

  const all = await fetchCategoriesServer();
  const current = findById(all, id);
  if (!current) return notFound();

  if (slug !== String(id)) {
    redirect(buildCategoryPath({ id }));
  }

  const selectedCategoryId =
    sp.categoryId && Number(sp.categoryId) ? Number(sp.categoryId) : current.id;
  const subCategories = current.subCategories ?? [];

  // URL의 page는 1-base → 서비스는 0-base
  const page0 = Math.max(0, toInt(sp.page ?? 1, 1) - 1);
  const size = Math.max(1, toInt(sp.size ?? 12, 12));

  // BEST (인기순 상위 8) — kind 명시 + 0-base
  const bestData = await fetchProductListServer('all', {
    categoryId: selectedCategoryId,
    sort: 'popular',
    page: 0,
    size: 8,
  });

  // 리스트 — kind 명시 + 0-base 페이지
  const listData = await fetchProductListServer('all', {
    categoryId: selectedCategoryId,
    tagIds: parseTagIds(sp.tagIds),
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    deliveryType: normalizeDeliveryType(sp.deliveryType),
    sort: sp.sort ?? 'newest',
    page: page0,
    size,
  });

  const bestSliderItems = (bestData.products as ApiProductListItem[]).map((p) => ({
    productUuid: p.productUuid,
    url: p.url,
    brandName: p.brandName,
    name: p.name,
    price: p.price,
    discountRate: p.discountRate,
    discountPrice: p.discountPrice ?? p.price ?? 0,
    rating: p.rating ?? 0,
  }));


const listSliderItems = (listData.products as ApiProductListItem[]).map((p) => ({
  productUuid: p.productUuid,
  url: p.url,
  brandName: p.brandName,
  name: p.name,
  price: p.price,
  discountRate: p.discountRate,
  discountPrice: p.discountPrice ?? p.price ?? 0,
  rating: p.rating ?? 0,
}));

  const isEmpty = listData.totalElements === 0;
  const resetHref = buildCategoryPath({ id: current.id });

  return (
    <main>
      <div className="w-full grid grid-cols-[250px_1fr]">
        <CategorySideBarClient title={current.categoryName} />
        <main className="flex flex-col items-center px-4 py-12">
          {!!subCategories.length && (
            <div className="mb-8">
              <CategoryBtn
                items={subCategories.map((c) => ({ id: String(c.id), label: c.categoryName }))}
              />
            </div>
          )}

          {isEmpty ? (
            <div className="flex flex-col items-center w-full text-center p-50 mt-4 bg-tertiary-20">
              <div className="text-4xl mb-3">🧐</div>
              <p className="text-lg font-semibold mb-2">조건에 맞는 상품이 없습니다.</p>
              <p className="text-sm text-slate-500 mb-6">필터를 변경하거나 초기화해 보세요.</p>
              <Link
                href={resetHref}
                className="px-4 py-2 rounded-md border border-tertiary text-sm transition hover:bg-tertiary-20"
              >
                필터 초기화
              </Link>
            </div>
          ) : (
            <>
              {!!bestSliderItems.length && (
                <section className="mb-12 w-full max-w-5xl">
                  <h2 className="my-6 text-2xl font-bold px-4">{current.categoryName} BEST</h2>
                  <ProductSlider items={bestSliderItems} />
                </section>
              )}
              <FilteredSection items={listSliderItems} />
            </>
          )}
        </main>
      </div>
    </main>
  );
}
