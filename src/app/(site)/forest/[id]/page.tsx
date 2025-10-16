import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  fetchArtistProfileProducts,
  fetchArtistPublicProfile,
} from '@/services/productArtist';
import type { ArtistProfileProduct } from '@/services/productArtist';
import type { ArtistPublicProfile } from '@/types/artistDashboard';
import ArtistProfileHeader from './ArtistProfileHeader';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const artistId = Number(rawId);

  if (!Number.isInteger(artistId) || artistId < 0) {
    notFound();
  }

  let profile: ArtistPublicProfile;
  try {
    profile = await fetchArtistPublicProfile(artistId);
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      (error as { status?: number }).status === 404
    ) {
      notFound();
    }
    throw error;
  }

  let products: ArtistProfileProduct[] = [];
  let productsError: string | null = null;
  try {
    const { items } = await fetchArtistProfileProducts({ artistId });
    products = items;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : '상품 정보를 불러오지 못했습니다.';
    productsError = message;
    products = [];
  }

  const intl = new Intl.NumberFormat('ko-KR');

  return (
    <main className="relative flex-1 overflow-auto bg-[#f5f5f5]">
      <div
        className="relative mx-auto flex w-full flex-col overflow-hidden bg-center pb-20 pt-16 shadow-[0_12px_45px_-20px_rgba(99,139,86,0.5)]"
        style={{
          minHeight: '100vh',
          backgroundImage: 'url(/forest_full.png)',
          backgroundRepeat: 'repeat',
          backgroundSize: '640px 640px',
        }}
      >
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <ArtistProfileHeader
            key={Number(profile.artistId) || artistId}
            profile={profile}
            artistId={artistId}
          />

          <section className="mt-12">
            <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-bold">작가님의 상품 목록</h2>
            </header>

            {productsError ? (
              <p className="rounded-2xl border border-dashed border-rose-200 bg-rose-50 py-12 text-center text-sm text-rose-500">
                {productsError}
              </p>
            ) : products.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[var(--color-gray-200)] bg-white/60 py-12 text-center text-sm text-[var(--color-gray-500)]">
                등록된 상품이 없습니다.
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((item) => (
                  <article
                    key={item.productUuid}
                    className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(0,0,0,0.25)]"
                  >
                    <div className="relative h-48 w-full overflow-hidden bg-[var(--color-gray-100)]">
                      <Image
                        src={item.thumbnailUrl || '/profile-placeholder.svg'}
                        alt={`${item.name} 대표 이미지`}
                        fill
                        sizes="(max-width: 768px) 60vw, 320px"
                        className="object-cover"
                        unoptimized={!item.thumbnailUrl}
                      />
                      <span className="absolute right-3 top-3 rounded-full bg-primary/90 px-2 py-1 text-xs font-semibold text-white">
                        {item.sellingStatus === 'SELLING'
                          ? '판매중'
                          : item.sellingStatus || '정보 없음'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 p-4">
                      <h3 className="line-clamp-2 text-base font-semibold text-[var(--color-gray-900)]">
                        {item.name || '상품명 미정'}
                      </h3>
                      <div className="flex items-end gap-2">
                        <strong className="text-lg font-bold text-primary">
                          ₩ {intl.format(item.discountPrice || item.price)}
                        </strong>
                        {item.discountRate > 0 ? (
                          <span className="text-sm font-semibold text-[#FF4B4B]">
                            {item.discountRate}%
                          </span>
                        ) : null}
                      </div>
                      {item.discountRate > 0 ? (
                        <span className="text-xs text-[var(--color-gray-400)] line-through">
                          ₩ {intl.format(item.price)}
                        </span>
                      ) : null}
                      <div className="mt-1 flex items-center justify-between text-xs text-[var(--color-gray-500)]">
                        <span>재고 {Math.max(0, item.stock)}개</span>
                        <span>
                          리뷰 {Math.max(0, item.reviewCount)} · 평점{' '}
                          {Number.isFinite(item.rating)
                            ? item.rating.toFixed(1)
                            : '0.0'}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
