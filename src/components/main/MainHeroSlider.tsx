
'use client';

import { useState, useEffect } from 'react';
import MainHero from '@/assets/mainhero.svg';

type Slide = { id: number; Svg: React.FC<React.SVGProps<SVGSVGElement>> };

const heroImages: Slide[] = [
  { id: 1, Svg: MainHero },
  { id: 2, Svg: MainHero },
  { id: 3, Svg: MainHero },
  { id: 4, Svg: MainHero },
];

export function MainHeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goToPrev = () =>
    setCurrentSlide((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1));
  const goToNext = () =>
    setCurrentSlide((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1));

  useEffect(() => {
    const interval = setInterval(goToNext, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full h-[300px] relative overflow-hidden">
      <div
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {heroImages.map(({ id, Svg }) => (
          <div
            key={id}
            className="min-w-full h-full relative flex items-center justify-center"
          >
            <Svg
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="xMidYMid slice"
            />
          </div>
        ))}
      </div>

      {/* 이전 버튼 */}
      <button
        onClick={goToPrev}
        className="absolute left-8 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all"
        aria-label="이전 슬라이드"
      >
        <svg
          className="w-6 h-6 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 다음 버튼 */}
      <button
        onClick={goToNext}
        className="absolute right-8 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all"
        aria-label="다음 슬라이드"
      >
        <svg
          className="w-6 h-6 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide
                ? 'bg-green-600'
                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
            aria-label={`${index + 1}번째 슬라이드로 이동`}
          />
        ))}
      </div>
    </section>
  );
}
