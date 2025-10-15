import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Button from '@/components/Button';
import { fetchArtistPublicProfile } from '@/services/productArtist';
import type { ArtistPublicProfile } from '@/types/artistDashboard';

export const dynamic = 'force-dynamic';

function formatFollowers(count: number) {
  return new Intl.NumberFormat('ko-KR').format(count);
}

function formatSince(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

export default async function Page({
  params,
}: {
  params: { id: string };
}) {
  const rawId = params.id;
  const artistId = Number(rawId);

  if (!Number.isInteger(artistId) || artistId < 0) {
    notFound();
  }

  let profile: ArtistPublicProfile;
  try {
    profile = await fetchArtistPublicProfile(artistId);
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && (error as { status?: number }).status === 404) {
      notFound();
    }
    throw error;
  }

  const displayName = profile.artistName;
  const followerLabel = formatFollowers(profile.followerCount);
  const sinceLabel = formatSince(profile.createdAt);
  const instagramHandle = profile.snsAccount?.trim() ?? '';
  const instagramUsername = instagramHandle.replace(/^@/, '');
  const hasInstagram = Boolean(instagramUsername);
  const mainProducts = profile.mainProducts
    ? profile.mainProducts
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const totalSales = Number.isFinite(profile.totalSales)
    ? new Intl.NumberFormat('ko-KR').format(profile.totalSales)
    : '-';
  const productCount = Number.isFinite(profile.productCount)
    ? new Intl.NumberFormat('ko-KR').format(profile.productCount)
    : '-';

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
          <section className="rounded-3xl">
            <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
              <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-full bg-[var(--color-gray-100)]">
                <Image
                  src={profile.profileImageUrl || '/profile-placeholder.svg'}
                  alt={`${displayName} 프로필 이미지`}
                  fill
                  sizes="128px"
                  className="object-cover"
                  priority
                  unoptimized={!profile.profileImageUrl}
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h1 className="flex flex-wrap items-center justify-center gap-3 text-2xl font-bold md:justify-start">
                    {displayName}
                    {hasInstagram ? (
                      <Link
                        href={`https://www.instagram.com/${instagramUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base font-medium text-[#E4405F] hover:underline"
                      >
                        <Image
                          width={50}
                          height={50}
                          src="/icons/instagram.png"
                          alt="Instagram"
                        />
                      </Link>
                    ) : null}
                  </h1>
                  <Button variant="primary">팔로우하기</Button>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm md:justify-start">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">팔로워</span>
                    <strong className="text-3xl font-bold">
                      {followerLabel}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-2xl">since</span>
                    <strong className="text-3xl font-bold">{sinceLabel}</strong>
                  </div>
                </div>
              </div>
            </div>
            <h1 className="mt-8 text-2xl font-bold">작가 소개</h1>
            <p className="mt-8 whitespace-pre-line text-base leading-relaxed">
              {profile.description || '소개 정보가 없습니다.'}
            </p>

            <div className="mt-10 grid gap-6 rounded-3xl bg-white p-8 shadow-sm md:grid-cols-3">
              <div className="flex flex-col gap-2 text-center">
                <span className="text-sm text-[var(--color-gray-500)]">총 매출</span>
                <strong className="text-2xl font-bold text-[var(--color-gray-900)]">
                  ₩ {totalSales}
                </strong>
              </div>
              <div className="flex flex-col gap-2 text-center">
                <span className="text-sm text-[var(--color-gray-500)]">등록 상품</span>
                <strong className="text-2xl font-bold text-[var(--color-gray-900)]">
                  {productCount} 개
                </strong>
              </div>
              <div className="flex flex-col gap-2 text-center">
                <span className="text-sm text-[var(--color-gray-500)]">대표 작품</span>
                <div className="flex flex-wrap justify-center gap-2">
                  {mainProducts.length > 0 ? (
                    mainProducts.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-[var(--color-gray-100)] px-4 py-1 text-sm text-[var(--color-gray-700)]"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[var(--color-gray-400)]">등록된 대표 작품 정보가 없습니다.</span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
