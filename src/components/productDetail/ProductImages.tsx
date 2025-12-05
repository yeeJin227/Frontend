'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';

import type { ProductImageResponse, UploadedImageInfo } from '@/types/product';
import { toAbsoluteImageUrl } from '@/utils/image';

type ProductImageLike = ProductImageResponse | UploadedImageInfo;

type Props = {
  images?: ProductImageLike[];
};

const resolveType = (img: ProductImageLike): string =>
  (img.type ?? img.fileType ?? '').toUpperCase();

const resolveSrc = (img: ProductImageLike): string | null => {
  const raw =
    (img as { url?: string; imageUrl?: string; thumbnailUrl?: string }).url?.trim() ??
    (img as { imageUrl?: string }).imageUrl?.trim() ??
    (img as { thumbnailUrl?: string }).thumbnailUrl?.trim() ??
    '';
  if (!raw) return null;
  return toAbsoluteImageUrl(raw) ?? null;
};

const dedupKeyFrom = (
  img: ProductImageLike,
  resolvedUrl: string | null,
): string | null => {
  if (img.s3Key?.trim()) return img.s3Key.trim();
  if (img.originalFileName?.trim()) return img.originalFileName.trim();
  if (!resolvedUrl) return null;
  // remove protocol so https/http 같은 주소는 동일하게 인식
  return resolvedUrl.replace(/^https?:/, '');
};

export default function ProductImages({ images }: Props) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const candidates = useMemo(() => {
    const seen = new Set<string>();
    const buckets = (images ?? []).reduce(
      (acc, img) => {
        const type = resolveType(img);
        if (type === 'MAIN' || type === 'ADDITIONAL') {
          acc.primary.push(img);
        } else if (type === 'THUMBNAIL') {
          acc.thumbnail.push(img);
        }
        return acc;
      },
      { primary: [] as ProductImageLike[], thumbnail: [] as ProductImageLike[] },
    );
    const ordered =
      buckets.primary.length > 0 ? buckets.primary : buckets.thumbnail;

    return ordered
      .map((img) => {
        const displayUrl = resolveSrc(img);
        const dedupKey = dedupKeyFrom(img, displayUrl);
        return { ...img, displayUrl, dedupKey };
      })
      .filter(
        (
          img,
        ): img is typeof img & { displayUrl: string; dedupKey: string } => {
          if (!img.displayUrl || !img.dedupKey) return false;
          if (seen.has(img.dedupKey)) return false;
          seen.add(img.dedupKey);
          return true;
        },
      );
  }, [images]);

  const thumbnails = useMemo(
    () => candidates.map((img, index) => ({ img, index })),
    [candidates],
  );

  if (!candidates.length) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center h-[450px]">
          <span className="text-gray-500">표시할 이미지가 없습니다.</span>
        </div>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? candidates.length - 1 : prev - 1,
    );
  };
  const goToNext = () => {
    setCurrentImageIndex((prev) =>
      prev === candidates.length - 1 ? 0 : prev + 1,
    );
  };
  const goToImage = (index: number) => setCurrentImageIndex(index);

  const mainImage = candidates[currentImageIndex];

  return (
    <div className="space-y-4">
      <div className="relative w-full h-[550px] bg-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={goToPrevious}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-all border disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={candidates.length <= 1}
          aria-label="이전 이미지"
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={goToNext}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-all border disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={candidates.length <= 1}
          aria-label="다음 이미지"
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
        {mainImage?.displayUrl ? (
          <Image
            src={mainImage.displayUrl}
            alt={mainImage.originalFileName ?? '상품 이미지'}
            fill
            sizes="(min-width:768px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex items-center justify-center w-[645px] h-[645px]">
            <span className="text-gray-500">이미지를 불러올 수 없습니다.</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center space-x-2">
        <div className="flex space-x-2 justify-center w-[460px]">
          {thumbnails.slice(0, 4).map(({ img, index }) => (
            <div
              key={`${img.displayUrl}-${index}`}
              className={`relative bg-gray-200 rounded-lg overflow-hidden cursor-pointer border-2 transition-all w-[111px] h-[111px] ${
                index === currentImageIndex
                  ? 'border-primary shadow-md'
                  : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => goToImage(index)}
            >
              {img.displayUrl ? (
                <Image
                  src={img.displayUrl}
                  alt={`상품 이미지 ${index + 1}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
