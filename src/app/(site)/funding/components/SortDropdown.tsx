// app/funding/_components/SortDropdown.client.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const sortOptions = [
  { id: 'popular', label: '인기순' },
  { id: 'recent', label: '최신순' },
  { id: 'deadline', label: '마감 임박' },
  { id: 'highAmount', label: '목표금액 높은순' },
];
const sorOptionToKr = (input: string) => {
  return sortOptions.find((elem) => elem.id === input)?.label;
};

export function SortDropdown() {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sortBy') || 'recent';

  const handleSelect = (id: string) => {
    setIsExpanded(false);
    const params = new URLSearchParams(searchParams);
    params.set('sortBy', id);
    params.set('page', '0'); // 정렬 변경 시 첫 페이지로

    router.push(`/funding?${params.toString()}`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <svg
          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
        <span className="font-medium">{sorOptionToKr(currentSort)}</span>
      </button>

      {isExpanded && (
        <div className="absolute top-full left-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-2 py-2 z-10 min-w-[120px]">
          {sortOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className="block w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
