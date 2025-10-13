
'use client';

import { useEffect, useState } from 'react';
import DefaultProfile from '@/assets/icon/defaultprofile.svg';
import Scrap from '@/assets/icon/scrap.svg';
import RightGreenArrow from '@/assets/icon/rightgreenarrow.svg';
import { fetchProductArtistInfo } from '@/services/productArtist';
import type { ProductArtistInfo } from '@/types/productArtist';

function fmt(n?: number | null) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '0';
  return n.toLocaleString();
}

export default function ArtistInfo({ productUuid }: { productUuid?: string }) {
  const [artist, setArtist] = useState<ProductArtistInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!productUuid) return;
      try {
        setError(null);
        const data = await fetchProductArtistInfo(productUuid);
        if (!active) return;
        setArtist(data);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message ?? '작가 정보를 불러오지 못했습니다.');
        setArtist(null);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [productUuid]);

  const artistName = artist?.artistName ?? '작가명';
  const follower = fmt(artist?.followerCount ?? 0);
  const since = artist?.approvedDate ?? '-';
  const desc =
    (artist?.description && artist.description.trim()) ||
    '작가 소개입니다. 작가 소개입니다. 작가 소개입니다. 작가 소개입니다. 작가 소개입니다. 작가 소개입니다.';

  return (
    <section>
      <h3 className="font-semibold py-12">작가 정보</h3>

      {error ? (
        <p className="mb-2 text-sm text-rose-600">{error}</p>
      ) : null}

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
            {/* 프로필 기본 아이콘 */}
            <DefaultProfile width={60} height={60} />
          </div>

          <button
            type="button"
            className="flex justify-center items-center gap-2 bg-white border border-primary rounded-sm px-3.5 py-2 text-primary font-semibold cursor-pointer transition hover:bg-primary-20 hover:text-white"
            onClick={() => {
              if (artist?.artistPageUrl) {
                window.open(artist.artistPageUrl, '_blank', 'noopener,noreferrer');
              }
            }}
            disabled={!artist?.artistPageUrl}
          >
            작가페이지
            <RightGreenArrow />
          </button>
        </div>
      </div>
    </section>
  );
}
