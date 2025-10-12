import ProductSlider from './ProductSlider.client';
import type {
  ApiResponse,
  ProductListData,
  ProductListItem,
  ProductListParams,
} from '@/types/product';

export type Kind =
  | 'all'
  | 'upcoming'
  | 'restock'
  | 'planned'
  | 'onsale'
  | 'new'
  | 'low-stock';

function resolvePath(kind: Kind) {
  switch (kind) {
    case 'all':       return '/api/products';
    case 'upcoming':  return '/api/products/upcoming';
    case 'restock':   return '/api/products/restock';
    case 'planned':   return '/api/products/planned';
    case 'onsale':    return '/api/products/onsale';
    case 'new':       return '/api/products/new';
    case 'low-stock': return '/api/products/low-stock';
  }
}

function buildQuery(kind: Kind, params?: ProductListParams) {
  if (kind !== 'all' || !params) return '';
  const sp = new URLSearchParams();
  const set = (k: string, v?: string | number | boolean | null) => {
    if (v === undefined || v === null) return;
    sp.set(k, String(v));
  };
  set('categoryId', params.categoryId);
  set('minPrice', params.minPrice);
  set('maxPrice', params.maxPrice);
  set('deliveryType', params.deliveryType);
  set('sort', params.sort ?? 'newest');
  set('page', (params.page ?? 0) + 1); // 서버는 1부터
  set('size', params.size ?? 12);
  if (params.tagIds?.length) params.tagIds.forEach((id) => sp.append('tagIds', String(id)));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

// 안전한 타입 가드
function isProductListData(u: unknown): u is ProductListData {
  if (typeof u !== 'object' || u === null) return false;
  const o = u as {
    products?: unknown;
    page?: unknown;
    size?: unknown;
    totalElements?: unknown;
    totalPages?: unknown;
  };
  return (
    Array.isArray(o.products) &&
    typeof o.page === 'number' &&
    typeof o.size === 'number' &&
    typeof o.totalElements === 'number' &&
    typeof o.totalPages === 'number'
  );
}

function isApiResponseOfProductListData(u: unknown): u is ApiResponse<ProductListData> {
  if (typeof u !== 'object' || u === null) return false;
  const o = u as { data?: unknown };
  return isProductListData(o.data);
}

function isArrayEnvelope(u: unknown): u is { code?: string; message?: string; data: ProductListItem[] } {
  if (typeof u !== 'object' || u === null) return false;
  const o = u as { data?: unknown };
  return Array.isArray(o.data);
}

// 서로 다른 응답 스키마 -> 페이지형으로 통일 
function normalizeToPaged(input: unknown, fallbackSize: number): ProductListData {
  const empty: ProductListData = {
    page: 0,
    size: fallbackSize,
    totalElements: 0,
    totalPages: 0,
    products: [],
  };
  if (input == null) return empty;

  // ApiResponse<ProductListData>
  if (isApiResponseOfProductListData(input)) {
    return input.data;
  }

  // { code, message, data: ProductListItem[] | null }
  if (isArrayEnvelope(input)) {
    const list = input.data;
    const total = list.length;
    return {
      page: 0,
      size: Math.max(fallbackSize, total),
      totalElements: total,
      totalPages: total ? 1 : 0,
      products: list,
    };
  }

  return empty;
}



async function fetchProducts(kind: Kind, params?: ProductListParams) {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${resolvePath(kind)}${buildQuery(kind, params)}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      cache: 'no-store',
      credentials: 'include',
    });

    const raw = await res.text();
    let parsed: unknown = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch {}

    if (res.status === 404) return normalizeToPaged(parsed, params?.size ?? 12);
    if (!res.ok) {
      console.error('[ProductSection] FAIL', res.status);
      return normalizeToPaged(parsed, params?.size ?? 12);
    }
    return normalizeToPaged(parsed, params?.size ?? 12);
  } catch {
    console.error('[ProductSection] EXCEPTION');
    return { page: 0, size: params?.size ?? 12, totalElements: 0, totalPages: 0, products: [] };
  }
}

export default async function ProductSectionServer({
  title,
  description,
  kind = 'all',
  params = { page: 0, size: 12, sort: 'newest' },
}: {
  title: string;
  description?: string;
  kind?: Kind;
  params?: ProductListParams;
}) {
  const data = await fetchProducts(kind, params);
  const empty = data.products.length === 0;

  return (
    <section className="w-full pt-8">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-0">
        <div className="mx-auto mb-7 flex items-center"> 
          <h3 className="pr-5 text-[20px] font-bold">{title}</h3> 
          {description && <span className="text-[16px] text-gray-400">{description}</span>}
        </div>

        {/* 아무것도 없을 때 */}
        {empty ? (
          <div className="flex items-center justify-center rounded-xl bg-tertiary-20 py-14 text-center text-gray-500">
            아직 올라온 상품이 없습니다.
          </div>
        ) : (
          <ProductSlider items={data.products} />
        )}
      </div>
    </section>
  );
}

/* kind 프리셋 */
export const NewProductsSection = async (
  props: Omit<Parameters<typeof ProductSectionServer>[0], 'kind'>
) => <ProductSectionServer kind="new" {...props} />;

export const OnSaleProductsSection = async (
  props: Omit<Parameters<typeof ProductSectionServer>[0], 'kind'>
) => <ProductSectionServer kind="onsale" {...props} />;

export const RestockProductsSection = async (
  props: Omit<Parameters<typeof ProductSectionServer>[0], 'kind'>
) => <ProductSectionServer kind="restock" {...props} />;

export const LowStockProductsSection = async (
  props: Omit<Parameters<typeof ProductSectionServer>[0], 'kind'>
) => <ProductSectionServer kind="low-stock" {...props} />;

export const PlannedProductsSection = async (
  props: Omit<Parameters<typeof ProductSectionServer>[0], 'kind'>
) => <ProductSectionServer kind="planned" {...props} />;

export const UpcomingProductsSection = async (
  props: Omit<Parameters<typeof ProductSectionServer>[0], 'kind'>
) => <ProductSectionServer kind="upcoming" {...props} />;
