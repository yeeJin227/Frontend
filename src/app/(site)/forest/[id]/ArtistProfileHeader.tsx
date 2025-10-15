'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Button from '@/components/Button';
import { useToast } from '@/components/ToastProvider';
import { followArtist, unfollowArtist } from '@/services/productArtist';
import type { ArtistPublicProfile } from '@/types/artistDashboard';
import { useAuthStore } from '@/stores/authStore';

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

function parseMainProducts(value: string | undefined | null) {
  if (!value) return [] as string[];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

type ArtistProfileHeaderProps = {
  profile: ArtistPublicProfile;
  artistId: number;
};

export default function ArtistProfileHeader({ profile, artistId }: ArtistProfileHeaderProps) {
  const toast = useToast();
  const hydrate = useAuthStore((state) => state.hydrate);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);

  const initialFollowerCount = useMemo(() => {
    const value = Number(profile.followerCount);
    return Number.isFinite(value) ? value : 0;
  }, [profile.followerCount]);

  const [isFollowing, setIsFollowing] = useState(Boolean(profile.isFollowing));
  const [followerCount, setFollowerCount] = useState<number>(initialFollowerCount);
  const [pending, startTransition] = useTransition();
  const artistIdRef = useRef(artistId);

  useEffect(() => {
    if (!isHydrated) {
      void hydrate();
    }
  }, [hydrate, isHydrated]);

  const instagramHandle = profile.snsAccount?.trim() ?? '';
  const instagramUsername = useMemo(
    () => instagramHandle.replace(/^@/, ''),
    [instagramHandle],
  );
  const hasInstagram = Boolean(instagramUsername);

  const mainProducts = useMemo(() => parseMainProducts(profile.mainProducts), [profile.mainProducts]);

  const followerLabel = formatFollowers(followerCount);
  const sinceLabel = formatSince(profile.createdAt);
  const normalizedTotalSales = Number.isFinite(profile.totalSales) ? profile.totalSales : 0;
  const normalizedProductCount = Number.isFinite(profile.productCount) ? profile.productCount : 0;

  useEffect(() => {
    artistIdRef.current = artistId;
    setIsFollowing(Boolean(profile.isFollowing));
    setFollowerCount(initialFollowerCount);
  }, [artistId, initialFollowerCount, profile.isFollowing]);

  const handleFollow = () => {
    if (pending || isFollowing) {
      return;
    }

    if (!accessToken) {
      toast.error('로그인 후 이용해 주세요.');
      return;
    }

    const requestArtistId = artistIdRef.current;
    const previousFollowerCount = followerCount;

    setIsFollowing(true);
    setFollowerCount((prev) => (artistIdRef.current === requestArtistId ? prev + 1 : prev));

    startTransition(async () => {
      try {
        const result = await followArtist(artistIdRef.current, { accessToken });
        const resultFollowerCount = Number(result.followerCount);
        if (artistIdRef.current !== requestArtistId) {
          return;
        }

        setIsFollowing(Boolean(result.isFollowing ?? true));

        if (Number.isFinite(resultFollowerCount) && resultFollowerCount > previousFollowerCount) {
          setFollowerCount(resultFollowerCount);
        }

        toast.success('작가를 팔로우했습니다.');
      } catch (error) {
        if (artistIdRef.current === requestArtistId) {
          setIsFollowing(false);
          setFollowerCount(previousFollowerCount);
        }
        const message = (error instanceof Error) ? error.message : '작가 팔로우에 실패했습니다.';
        toast.error(message);
      }
    });
  };

  const handleUnfollow = () => {
    if (pending || !isFollowing) {
      return;
    }

    if (!accessToken) {
      toast.error('로그인 후 이용해 주세요.');
      return;
    }

    const requestArtistId = artistIdRef.current;
    const previousFollowerCount = followerCount;

    setIsFollowing(false);
    setFollowerCount((prev) => (artistIdRef.current === requestArtistId ? Math.max(0, prev - 1) : prev));

    startTransition(async () => {
      try {
        await unfollowArtist(requestArtistId, { accessToken });

        if (artistIdRef.current !== requestArtistId) {
          return;
        }

        toast.success('작가 팔로우를 해제했습니다.');
      } catch (error) {
        if (artistIdRef.current === requestArtistId) {
          setIsFollowing(true);
          setFollowerCount(previousFollowerCount);
        }
        const message = (error instanceof Error) ? error.message : '작가 언팔로우에 실패했습니다.';
        toast.error(message);
      }
    });
  };

  return (
    <section className="rounded-3xl">
      <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
        <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-full bg-[var(--color-gray-100)]">
          <Image
            src={profile.profileImageUrl || '/profile-placeholder.svg'}
            alt={`${profile.artistName} 프로필 이미지`}
            fill
            sizes="128px"
            className="object-cover"
            priority
            unoptimized={!profile.profileImageUrl}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h1 className="flex flex-wrap items-center justify-center gap-3 text-2xl font-bold md:justify-start">
              {profile.artistName}
              {hasInstagram ? (
                <Link
                  href={`https://www.instagram.com/${instagramUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-medium text-[#E4405F] hover:underline"
                >
                  <Image width={50} height={50} src="/icons/instagram.png" alt="Instagram" />
                </Link>
              ) : null}
            </h1>
            <Button
              variant={isFollowing ? 'outline' : 'primary'}
              onClick={isFollowing ? handleUnfollow : handleFollow}
              disabled={pending}
            >
              {pending ? (isFollowing ? '언팔로우 중...' : '팔로우 중...') : isFollowing ? '팔로잉' : '팔로우하기'}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm md:justify-start">
            <div className="flex items-center gap-2">
              <span className="text-2xl">팔로워</span>
              <strong className="text-3xl font-bold">{followerLabel}</strong>
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

    </section>
  );
}
