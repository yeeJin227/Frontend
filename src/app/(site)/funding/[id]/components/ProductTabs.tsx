// app/funding/[id]/_components/ProductTabs.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CommunitySection from './CommunitySection';
import NewsSection from './NewsSection';
import { FundingNews, FundingCommunity } from '@/types/funding';

interface ProductTabsProps {
  fundingId: number;
  description: string;
  authorId: number;
  authorEmail: string;
  currentUserId?: number;
  news: FundingNews[];
  communities: FundingCommunity[];
}

export default function ProductTabs({
  fundingId,
  authorId,
  currentUserId,
  description,
  news,
  communities,
  authorEmail,
}: ProductTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL에서 현재 탭 읽기 (기본값: 'description')
  const tabFromUrl = searchParams.get('tab') || 'description';
  const [selectedTab, setSelectedTab] = useState(tabFromUrl);

  // URL 변경 시 탭 업데이트
  useEffect(() => {
    const tab = searchParams.get('tab') || 'description';
    setSelectedTab(tab);
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
    // URL 업데이트 (스크롤 위치 유지)
    router.push(`?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm w-full max-w-[760px]">
      <nav className="flex text-4 font-semibold">
        <button
          onClick={() => handleTabChange('description')}
          className={`flex-1 px-6 py-2 border-1 border-tertiary ${
            selectedTab === 'description'
              ? 'bg-tertiary text-white'
              : 'text-tertiary hover:bg-tertiary-20'
          }`}
        >
          프로젝트 소개
        </button>
        <button
          onClick={() => handleTabChange('details')}
          className={`flex-1 px-6 py-2 border-1 border-tertiary ${
            selectedTab === 'details'
              ? 'bg-tertiary text-white'
              : 'text-tertiary hover:bg-tertiary-20'
          }`}
        >
          새 소식
        </button>
        <button
          onClick={() => handleTabChange('shipping')}
          className={`flex-1 px-6 py-2 border-1 border-tertiary ${
            selectedTab === 'shipping'
              ? 'bg-tertiary text-white'
              : 'text-tertiary hover:bg-tertiary-20'
          }`}
        >
          커뮤니티
        </button>
      </nav>

      <div className="p-6">
        {selectedTab === 'description' && (
          <div>
            <div className="bg-gray-100 aspect-video rounded-lg flex items-center justify-center text-gray-500 mb-6">
              상세 페이지 이미지
            </div>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {description}
            </p>
          </div>
        )}

        {selectedTab === 'details' && (
          <NewsSection
            fundingId={fundingId}
            authorId={authorId}
            currentUserId={currentUserId}
            news={news}
          />
        )}

        {selectedTab === 'shipping' && (
          <CommunitySection
            fundingId={fundingId}
            communities={communities}
            authorEmail={authorEmail}
          />
        )}
      </div>
    </div>
  );
}
