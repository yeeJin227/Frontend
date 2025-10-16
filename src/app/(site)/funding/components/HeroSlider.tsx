// app/funding/_components/HeroSlider.client.tsx
'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

const heroImages = [
  {
    id: 1,
    title: '',
    bg: 'bg-[#D5D2D8]',
    imageURL: '/heroSectionImages/hs1.png',
  },
  {
    id: 2,
    title: '',
    bg: 'bg-[#FEF5EC]',
    imageURL: '/heroSectionImages/hs2.png',
  },
  {
    id: 3,
    title: '',
    bg: 'bg-[#F1E8E0]',
    imageURL: '/heroSectionImages/hs3.png',
  },
];

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) =>
        prev === heroImages.length - 1 ? 0 : prev + 1,
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full h-[300px] relative overflow-hidden">
      <div
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {heroImages.map((hero) => (
          <div
            key={hero.id}
            className={`min-w-full h-full relative ${hero.bg} flex items-center justify-center`}
          >
            <Image
              src={hero.imageURL}
              alt={'heroSection'}
              fill
              className="object-contain"
            />

            <h1 className="absolute text-3xl font-bold text-black z-10 p-4 bg-opacity-40 rounded-lg">
              {hero.title}
            </h1>
          </div>
        ))}
      </div>

      <button
        onClick={goToPrev}
        className="absolute left-8 top-1/2 transform -translate-y-1/2 z-20 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all"
      >
        <svg
          className="w-6 h-6 text-gray-600"
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
        className="absolute right-8 top-1/2 transform -translate-y-1/2 z-20 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all"
      >
        <svg
          className="w-6 h-6 text-gray-600"
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

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {/* 도트 내비게이션 코드 */}
      </div>
    </section>
  );
}
