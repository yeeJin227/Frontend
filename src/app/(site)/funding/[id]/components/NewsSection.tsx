// app/funding/[id]/_components/NewsSection.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import NewsInputModal from '@/components/funding/NewsInputModal';
import FullThumbsUp from '@/assets/icon/thumbs_up.svg';
import { FundingNews } from '@/types/funding';

interface NewsSectionProps {
  fundingId: number;
  news: FundingNews[];
}

export default function NewsSection({ fundingId, news }: NewsSectionProps) {
  const [expandedNews, setExpandedNews] = useState<Record<number, boolean>>({});

  const toggleNews = (newsId: number) => {
    setExpandedNews((prev) => ({
      ...prev,
      [newsId]: !prev[newsId],
    }));
  };

  const getTruncatedContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm flex flex-col">
      <div className="ml-auto">
        <NewsInputModal fundingId={fundingId} />
      </div>

      <div className="space-y-6 p-6">
        {news.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            아직 등록된 소식이 없습니다.
          </div>
        ) : (
          news.map((item) => {
            const isExpanded = expandedNews[item.id] || false;
            const displayContent = isExpanded
              ? item.content
              : getTruncatedContent(item.content, 100);

            return (
              <div
                key={item.id}
                className="bg-green-50 rounded-lg px-6 pt-6 pb-2"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="font-bold text-2xl">{item.title}</h2>
                    <div className="text-sm text-gray-600">
                      {formatDate(item.createDate)} | {item.actorNickname}
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 leading-relaxed break-words whitespace-pre-wrap">
                  {displayContent}
                </p>

                {item.imageUrl && (
                  <div className="mb-4 relative w-32 h-32">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                )}

                <div className="flex items-center">
                  <button className="flex items-center space-x-2 text-primary hover:text-primary-60 w-9 h-9">
                    <FullThumbsUp className="w-5 h-5" />
                    <span className="text-sm font-semibold">0</span>
                  </button>
                  {item.content.length > 100 && (
                    <button
                      onClick={() => toggleNews(item.id)}
                      className="ml-auto text-primary text-[14px] hover:underline"
                    >
                      {isExpanded ? '접기' : '자세히 보기'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
