'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductImagesProps {
  // images prop이 optional일 수 있음을 명시
  images?: string[];
}

export default function ProductImages({ images }: ProductImagesProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ✅ 1. 이미지가 없거나 비어있을 경우를 위한 방어 코드
  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col h-full space-y-4">
        <div className="relative flex-1 bg-gray-200 rounded-lg overflow-hidden min-h-[500px] flex items-center justify-center">
          <span className="text-gray-500">이미지가 없습니다.</span>
        </div>
        {/* 이미지가 없을 땐 썸네일 영역을 보여주지 않음 */}
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const mainImageUrl = images[currentImageIndex];

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 메인 이미지 */}
      <div className="relative flex-1 bg-gray-200 rounded-lg overflow-hidden min-h-[500px]">
        {/* mainImageUrl이 유효할 때만 Image 렌더링 */}
        {mainImageUrl ? (
          <Image
            src={mainImageUrl}
            alt="Product main image"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 645px"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-500">이미지를 불러올 수 없습니다.</span>
          </div>
        )}
      </div>

      {/* 썸네일 갤러리 */}
      <div className="flex items-center justify-center space-x-2">
        {/* 왼쪽 화살표 */}
        <button
          onClick={goToPrevious}
          className="bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-all border disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={images.length <= 1}
        >
          {/* SVG 아이콘 */}
        </button>

        {/* ✅ 2. 가로 스크롤이 가능한 썸네일 컨테이너 */}
        <div className="flex-1 overflow-hidden">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <div
                key={image || index} // 이미지 URL을 key로 사용하는 것이 더 안정적
                className={`relative flex-shrink-0 w-[111px] h-[62px] bg-gray-200 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  index === currentImageIndex
                    ? 'border-primary shadow-md'
                    : 'border-transparent hover:border-gray-300'
                }`}
                onClick={() => goToImage(index)}
              >
                {image ? (
                  <Image
                    src={image}
                    alt={`Product thumbnail ${index + 1}`}
                    fill
                    sizes="111px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽 화살표 */}
        <button
          onClick={goToNext}
          className="bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-all border disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={images.length <= 1}
        >
          {/* SVG 아이콘 */}
        </button>
      </div>
    </div>
  );
}
