// app/funding/_components/SortDropdown.client.tsx
'use client';

import { useState } from 'react';

const sortOptions = [
  { id: 'popular', label: '인기순' },
  { id: 'latest', label: '최신순' },
  { id: 'reviews', label: '리뷰 많은순' },
  { id: 'rating', label: '별점 높은순' },
];

export function SortDropdown() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selected, setSelected] = useState('popular');

  const handleSelect = (id: string) => {
    setSelected(id);
    setIsExpanded(false);
  };

  const selectedLabel = sortOptions.find((opt) => opt.id === selected)?.label;

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
        <span className="font-medium">{selectedLabel}</span>
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
