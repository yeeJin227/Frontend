// app/funding/[id]/_components/ProductTabs.tsx
'use client';

import { useState } from 'react';
import NewsInputModal from '@/components/funding/NewsInputModal';
import CommunitySection from './CommunitySection';
import NewsSection from './NewsSection';
import { FundingNews, FundingCommunity } from '@/types/funding';

interface ProductTabsProps {
  fundingId: number;
  authorId: number;
  currentUserId?: number;
  currentUserName?: string; // 추가
  currentUserProfileImage?: string; // 추가
  description: string;
  news: FundingNews[];
  communities: FundingCommunity[];
}

export default function ProductTabs({
  fundingId,
  authorId,
  currentUserId,
  currentUserName,
  currentUserProfileImage,
  description,
  news,
  communities,
}: ProductTabsProps) {
  const [selectedTab, setSelectedTab] = useState('description');

  return (
    <div className="bg-white rounded-lg shadow-sm w-full max-w-[760px]">
      <nav className="flex text-4 font-semibold">
        <button
          onClick={() => setSelectedTab('description')}
          className={`flex-1 px-6 py-2 border-1 border-tertiary ${
            selectedTab === 'description'
              ? 'bg-tertiary text-white'
              : 'text-tertiary hover:bg-tertiary-20'
          }`}
        >
          프로젝트 소개
        </button>
        <button
          onClick={() => setSelectedTab('details')}
          className={`flex-1 px-6 py-2 border-1 border-tertiary ${
            selectedTab === 'details'
              ? 'bg-tertiary text-white'
              : 'text-tertiary hover:bg-tertiary-20'
          }`}
        >
          새 소식
        </button>
        <button
          onClick={() => setSelectedTab('shipping')}
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
            authorId={authorId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserProfileImage={currentUserProfileImage}
            communities={communities}
          />
        )}
      </div>
    </div>
  );
}
