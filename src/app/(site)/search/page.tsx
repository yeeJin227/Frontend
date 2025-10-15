'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ResultHeader from '@/components/search/ResultHeader';
import { fetchSearchResults } from '@/services/search';
import type {
  ProductSearchItem,
  ArtistSearchItem,
  FundingSearchItem,
} from '@/services/search';
import type { ProductListItem } from '@/types/product';
import ProductSlider from '@/components/main/ProductSlider.client';

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

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductSearchItem[]>([]);
  const [artists, setArtists] = useState<ArtistSearchItem[]>([]);
  const [fundings, setFundings] = useState<FundingSearchItem[]>([]);

  // 통합검색 API
  useEffect(() => {
    const load = async () => {
      if (!q) return;
      setLoading(true);
      try {
        const res = await fetchSearchResults(q);
        setProducts(res.products || []);
        setArtists(res.artists || []);
        setFundings(res.fundings || []);
      } catch (err) {
        console.error('검색 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [q]);

  // 상품 데이터 매핑 (ProductSlider)
  const mappedProducts: ProductListItem[] = useMemo(
    () =>
      products.map((p) => ({
        productUuid: p.productUuid,
        url: p.url,
        brandName: p.brandName,
        name: p.name,
        price: p.price ?? 0,
        discountRate: p.discountRate ?? 0,
        discountPrice: p.discountPrice ?? p.price ?? 0,
        rating: p.rating ?? 0,
      })),
    [products]
  );


  if (!q) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <main>
          <div className="rounded-2xl bg-white p-8 text-center text-lg font-medium text-gray-600 shadow">
            검색어를 입력해주세요.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 space-y-12">
      <main>
        <ResultHeader
          query={q || '전체'}
          total={products.length + artists.length + fundings.length}
          onSort={() => {}}
        />

        {loading ? (
          <div className="text-center mt-10 text-gray-500">검색 중...</div>
        ) : (
          <>
            {/* 상품 */}
            <section className='py-8'>
              <h2 className="text-xl font-semibold mb-4">상품</h2>
              {mappedProducts.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center p-10 bg-tertiary-20 rounded-2xl">
                  <div className="text-4xl mb-3">🧐</div>
                  <span className="text-lg font-semibold mb-2">
                    상품 검색결과가 없습니다.
                  </span>
                  <p className="text-sm text-slate-500 mb-2">
                    다른 검색어를 입력해보세요.
                  </p>
                </div>
              ) : (
                <ProductSlider items={mappedProducts} />
              )}
            </section>

            {/* 작가 */}
            <section className='py-8'>
              <h2 className="text-xl font-semibold mb-4">작가</h2>
              {artists.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center p-10 bg-tertiary-20 rounded-2xl">
                  <div className="text-4xl mb-3">🧐</div>
                  <span className="text-lg font-semibold mb-2">
                    작가 검색결과가 없습니다.
                  </span>
                  <p className="text-sm text-slate-500 mb-2">
                    다른 검색어를 입력해보세요.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {artists.map((artist) => (
                    <Link
                      key={artist.artistId}
                      href={`/artist/${artist.artistId}`}
                      className="flex flex-col items-center justify-center p-4 border rounded-lg shadow-sm bg-white hover:shadow-md transition"
                    >
                      <img
                        src={
                          artist.profileImageUrl ||
                          '/images/default-profile.png'
                        }
                        alt={artist.artistName}
                        className="w-24 h-24 rounded-full object-cover mb-3"
                      />
                      <p className="font-semibold">{artist.artistName}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* 펀딩 */}
            <section className='py-8'>
              <h2 className="text-xl font-semibold mb-4">펀딩</h2>
              {fundings.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center p-10 bg-tertiary-20 rounded-2xl">
                  <div className="text-4xl mb-3">🧐</div>
                  <span className="text-lg font-semibold mb-2">
                    펀딩 검색결과가 없습니다.
                  </span>
                  <p className="text-sm text-slate-500 mb-2">
                    다른 검색어를 입력해보세요.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {fundings.map((f) => (
                    <Link
                      key={f.id}
                      href={`/funding/${f.id}`}
                      className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition bg-white"
                    >
                      <img
                        src={f.imageUrl}
                        alt={f.title}
                        className="w-full h-[200px] object-cover"
                      />
                      <div className="p-4 space-y-1">
                        <h3 className="font-bold text-base truncate">
                          {f.title}
                        </h3>
                        <p className="text-sm text-gray-500">{f.authorName}</p>
                        <p className="text-sm text-gray-400">
                          {f.categoryName}
                        </p>
                        <div className="flex justify-between text-sm mt-2">
                          <span className="text-primary font-semibold">
                            {f.progress}% 달성
                          </span>
                          <span className="text-gray-500">
                            {f.remainingDays}일 남음
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
