// app/funding/_components/PopularFundingSlider.client.tsx
'use client';

import { useState } from 'react';
import FundingCard from '@/components/funding/FundingCard';
import { Funding } from '../../../../types/funding';

interface PopularFundingSliderProps {
  fundings: Funding[];
}

export function PopularFundingSlider({ fundings }: PopularFundingSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(fundings.length / itemsPerPage);

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
  };

  return (
    <div className="mb-12 w-full max-w-5xl">
      <h2 className="text-[32px] font-bold mb-6 text-left">인기 펀딩</h2>

      <div className="relative">
        <button
          onClick={goToPrev}
          className="absolute left-[-60px] top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
          disabled={totalPages <= 1}
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

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {Array.from({ length: totalPages }, (_, pageIndex) => (
              <div
                key={pageIndex}
                className="grid grid-cols-4 gap-6 min-w-full"
              >
                {fundings
                  .slice(
                    pageIndex * itemsPerPage,
                    (pageIndex + 1) * itemsPerPage,
                  )
                  .map((funding) => (
                    <div key={funding.id}>
                      <FundingCard data={funding} />
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={goToNext}
          className="absolute right-[-60px] top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
          disabled={totalPages <= 1}
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
      </div>
    </div>
  );
}
