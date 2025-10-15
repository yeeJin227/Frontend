'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DefaultProfile from '@/assets/icon/defaultprofile.svg';
import Scrap from '@/assets/icon/scrap.svg';
import RightGreenArrow from '@/assets/icon/rightgreenarrow.svg';
import { fetchProductArtistInfo, fetchArtistPublicProfile } from '@/services/productArtist';
import type { ProductArtistInfo } from '@/types/productArtist';
import { ArtistPublicProfile } from '@/types/artistDashboard';


function fmt(n?: number | null) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '0';
  return n.toLocaleString();
}

// artistPageUrl 또는 임의 문자열에서 숫자 ID 추출
function extractArtistId(input?: string | null): number | null {
  if (!input) return null;
  const m = String(input).match(/(?:artist\/|creator-)(\d+)/); // /artist/123  또는 creator-123
  return m ? Number(m[1]) : null;
}

export default function ArtistInfo({ productUuid }: { productUuid?: string }) {
  const router = useRouter();
  const [artist, setArtist] = useState<ProductArtistInfo | null>(null);
  const [publicProfile, setPublicProfile] = useState<ArtistPublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!productUuid) return;
      try {
        setError(null);

        // 1) 상품 상세 → 작가 기본정보
        const data = await fetchProductArtistInfo(productUuid);
        if (!active) return;
        setArtist(data);

        // 2) artistId 확보: 응답에 없으면 URL에서 추출
        const resolvedArtistId =
          (data?.artistId as number | undefined) ??
          extractArtistId(data?.artistPageUrl);

        // 3) 공개 프로필 조회 
        if (resolvedArtistId) {
          const profile = await fetchArtistPublicProfile(resolvedArtistId);
          if (!active) return;
          setPublicProfile(profile);
        } else {
          setPublicProfile(null);
        }
      } catch (e: unknown) {
        if (!active) return;
        const msg = e instanceof Error ? e.message : '작가 정보를 불러오지 못했습니다.';
        setError(msg);
        setArtist(null);
        setPublicProfile(null);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [productUuid]);


  const artistIdForRoute = useMemo<number | null>(() => {
    return publicProfile?.artistId ?? extractArtistId(artist?.artistPageUrl) ?? null;
  }, [publicProfile?.artistId, artist?.artistPageUrl]);

  const artistName = publicProfile?.artistName ?? artist?.artistName ?? '작가명';
  const follower = fmt(publicProfile?.followerCount ?? artist?.followerCount ?? 0);
  const since =
    artist?.approvedDate ??
    (publicProfile?.createdAt ? new Date(publicProfile.createdAt).toLocaleDateString('ko-KR') : '-');
  const desc =
    publicProfile?.description ??
    artist?.description ??
    '작가 소개입니다. 작가 소개입니다. 작가 소개입니다. 작가 소개입니다. 작가 소개입니다. 작가 소개입니다.';
  const profileImg = publicProfile?.profileImageUrl ?? artist?.profileImageUrl ?? null;

  return (
    <section>
      <h3 className="font-semibold py-12">작가 정보</h3>

      {error ? <p className="mb-2 text-sm text-rose-600">{error}</p> : null}

      <div className="bg-[url('/artistbg2.svg')] max-w-[600px] mx-auto rounded-lg p-7 flex justify-between">
        <div className="w-2/3">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <p className="font-bold text-[18px]">{artistName}</p>
              <p>
                팔로워 수 <strong>{follower}</strong> since <strong>{since}</strong>
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <p className="font-bold text-[18px]">작가 소개</p>
              <p>{desc}</p>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col items-center">
          <div className="my-3.5">
            <button type="button" className="absolute right-0 top-0">
              <Scrap />
            </button>

            {profileImg ? (
              <img
                src={profileImg}
                alt="작가 프로필"
                className="w-[60px] h-[60px] rounded-full object-cover border border-gray-200"
              />
            ) : (
              <DefaultProfile width={60} height={60} />
            )}
          </div>

          <button
            type="button"
            className="flex justify-center items-center gap-2 bg-white border border-primary rounded-sm px-3.5 py-2 text-primary font-semibold cursor-pointer transition hover:bg-primary-20 hover:text-white"
            onClick={() => {
              if (artistIdForRoute) router.push(`/forest/creator-${artistIdForRoute}`);
            }}
          >
            작가페이지
            <RightGreenArrow />
          </button>
        </div>
      </div>
    </section>
  );
}
