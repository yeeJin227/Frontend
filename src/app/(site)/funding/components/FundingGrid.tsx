// app/funding/components/FundingGrid.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import FundingCard from '@/components/funding/FundingCard';
import { FundingItem } from '@/types/funding';

interface FundingGridProps {
  fundings: FundingItem[];
  totalPages: number;
  currentPage: number;
}

export function FundingGrid({
  fundings,
  totalPages,
  currentPage,
}: FundingGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    router.push(`/funding?${params.toString()}`);
  };

  if (!fundings || fundings.length === 0) {
    return (
      <div className="w-full max-w-5xl text-center py-20">
        <p className="text-gray-500 text-lg">해당하는 펀딩이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl">
      {/* 펀딩 카드 그리드 */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        {fundings.map((funding) => (
          <div key={funding.id}>
            <FundingCard data={funding} />
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 my-8 text-center leading-none">
          {/* 이전 페이지 버튼 */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className={`px-3 py-2 rounded-lg border transition-colors min-w-[40px] h-[40px] ${
              currentPage === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
            }`}
          >
            이전
          </button>

          {/* 페이지 번호 버튼들 */}
          {Array.from({ length: totalPages }, (_, i) => i).map((page) => {
            // 현재 페이지 근처만 표시 (예: 현재 페이지 ±2)
            if (
              page === 0 || // 첫 페이지
              page === totalPages - 1 || // 마지막 페이지
              (page >= currentPage - 2 && page <= currentPage + 2) // 현재 페이지 근처
            ) {
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg border transition-colors min-w-[40px] h-[40px] ${
                    page === currentPage
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  {page + 1}
                </button>
              );
            } else if (page === currentPage - 3 || page === currentPage + 3) {
              // ... 표시
              return (
                <span key={page} className="px-2 text-gray-400">
                  ...
                </span>
              );
            }
            return null;
          })}

          {/* 다음 페이지 버튼 */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            className={`px-3 py-2 rounded-lg border transition-colors min-w-[40px] h-[40px] ${
              currentPage === totalPages - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
            }`}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
