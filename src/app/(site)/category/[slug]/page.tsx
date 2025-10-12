import { notFound } from 'next/navigation';
import Link from 'next/link';

import CategorySideBar from '@/components/CategorySideBar';
import CategoryBtn from '@/components/mainCategory/CategoryBtn';

import FilteredSection from '@/components/mainCategory/FilteredSection';

import { resolveCategoryIdBySlug, SLUG_TO_KOR } from '@/lib/server/categorySlug';
import { fetchProductList } from '@/lib/server/products.client';
import { fetchCategoriesServer } from '@/lib/server/categories.server';
import type { Category } from '@/types/category';
import ProductSlider from '@/components/main/ProductSlider.client';

// SSG: slug
export const dynamicParams = false;
export async function generateStaticParams() {
  return [
    { slug: '펀딩' },
    { slug: '스티커' },
    { slug: '메모' },
    { slug: '노트' },
    { slug: '악세서리' },
    { slug: '기타 문구류' },
    { slug: '디지털 문구' },
  ];
}

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    tagIds?: string | string[];
    minPrice?: string;
    maxPrice?: string;
    deliveryType?: 'FREE' | 'PAID' | 'CONDITIONAL';
    sort?: 'newest' | 'priceAsc' | 'priceDesc' | 'popular';
    page?: string;
    size?: string;
    categoryId?: string;
  }>;
};


const formatMoney = (n: number) =>
  new Intl.NumberFormat('ko-KR').format(Math.max(0, n));
const formatRating = (n?: number | null) =>
  Number.isFinite(n as number) && (n as number) > 0 ? (n as number).toFixed(1) : '';
const formatDiscountLabel = (rate?: number | null) =>
  rate && rate > 0 ? `${rate}%` : '';

// UIProduct
type UIProduct = {
  id: string;
  img: string;
  title: string;
  brand: string;
  price: string;
  originalPrice: string;
  discount: string;
  rating: string;
  createdAt: string;
};

function toUIProduct(p: {
  productUuid: string;
  url: string;
  brandName: string;
  name: string;
  price: number | null;
  discountRate: number;
  discountPrice: number;
  rating: number | null;
}): UIProduct {
  const originalPriceNum = p.price ?? p.discountPrice ?? 0;
  const priceNum = p.discountPrice ?? p.price ?? 0;

  return {
    id: p.productUuid,
    img: p.url,
    title: p.name,
    brand: p.brandName,
    price: formatMoney(priceNum),
    originalPrice: formatMoney(originalPriceNum),
    discount: formatDiscountLabel(p.discountRate),
    rating: formatRating(p.rating),
    createdAt: new Date().toISOString().slice(0, 10),
  };
}

// Metadata
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return {
    title: `모리모리 | ${slug}`,
    description: `${slug} 카테고리 상품`,
  };
}

// Page
export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};

  const categoryName = SLUG_TO_KOR[slug] ?? slug;

  // slug → 상위 categoryId
  const parentCategoryId = await resolveCategoryIdBySlug(slug);
  if (!parentCategoryId) return notFound();

  // 전체 카테고리 로드 → 하위카테고리
  const allCategories = await fetchCategoriesServer();
  function findNodeById(nodes: Category[], id: number): Category | null {
    const stack = [...nodes];
    while (stack.length) {
      const cur = stack.pop()!;
      if (cur.id === id) return cur;
      if (cur.subCategories?.length) stack.push(...cur.subCategories);
    }
    return null;
  }

  const currentNode = findNodeById(allCategories, parentCategoryId);
  const subCategories = currentNode?.subCategories ?? [];
  const selectedCategoryId = sp.categoryId ? Number(sp.categoryId) : parentCategoryId;

  // tagIds normalize
  let tagIds: number[] | undefined;
  if (Array.isArray(sp.tagIds)) {
    tagIds = sp.tagIds.flatMap((v) => v.split(',')).map(Number).filter(Boolean);
  } else if (typeof sp.tagIds === 'string') {
    tagIds = sp.tagIds.split(',').map(Number).filter(Boolean);
  }

  // BEST 상품
  const bestData = await fetchProductList({
    categoryId: selectedCategoryId,
    sort: 'popular',
    page: 1,
    size: 8,
  });
  const bestProducts: UIProduct[] = bestData.products.map(toUIProduct);

  // 전체 상품 리스트
  const data = await fetchProductList({
    categoryId: selectedCategoryId,
    tagIds,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    deliveryType: sp.deliveryType,
    sort: sp.sort ?? 'newest',
    page: sp.page ? Number(sp.page) : 1,
    size: sp.size ? Number(sp.size) : 12,
  });

  const uiProducts: UIProduct[] = data.products.map(toUIProduct);

  // 상품 없을 때
  const isEmpty =
    (bestProducts.length === 0 && uiProducts.length === 0) ||
    (data.totalElements === 0);

  return (
    <main>
      <div className="w-full grid grid-cols-[250px_1fr]">
        <CategorySideBar title={categoryName} />

        <main className="flex flex-col items-center px-4 py-12">
          {/* 세부 카테고리 버튼 */}
          {subCategories.length > 0 && (
            <div className="mb-8">
              <CategoryBtn
                items={subCategories.map((c) => ({
                  id: String(c.id),
                  label: c.categoryName,
                }))}
              />
            </div>
          )}

          {isEmpty ? (
            <div className="flex flex-col items-center w-full text-center p-50 mt-4 bg-tertiary-20">
              <div className="text-4xl mb-3">🧐</div>
              <p className="text-lg font-semibold mb-2">조건에 맞는 상품이 없습니다.</p>
              <p className="text-sm text-slate-500 mb-6">
                필터를 변경하거나 초기화해 보세요.
              </p>
              <Link
                href={`/category/${slug}`}
                className="px-4 py-2 rounded-md border border-tertiary text-sm transition hover:bg-tertiary-20"
              >
                필터 초기화
              </Link>
            </div>
          ) : (
            <>
              {/* BEST 슬라이드 */}
              {bestProducts.length > 0 && (
                <section className="mb-12 w-full max-w-5xl">
                  <h2 className="my-6 text-2xl font-bold px-4">{categoryName} BEST</h2>
                  <ProductSlider
                    items={bestData.products.map((p) => ({
                      ...p,
                      productUuid: p.productUuid,
                    }))}
                  />
                </section>
              )}

              <FilteredSection products={uiProducts} />
            </>
          )}
        </main>
      </div>
    </main>
  );
}

