// app/funding/[id]/_components/NewsSection.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import NewsInputModal from '@/components/funding/NewsInputModal';
import { FundingNews } from '@/types/funding';

interface NewsSectionProps {
  fundingId: number;
  authorId: number; // 추가: 펀딩 작가 ID
  currentUserId?: number; // 추가: 현재 로그인한 사용자 ID
  news: FundingNews[];
}

export default function NewsSection({
  fundingId,
  authorId,
  currentUserId,
  news,
}: NewsSectionProps) {
  const [expandedNews, setExpandedNews] = useState<Record<number, boolean>>({});
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // 현재 사용자가 작가인지 확인
  const isAuthor = currentUserId === authorId;

  const toggleNews = (newsId: number) => {
    setExpandedNews((prev) => ({
      ...prev,
      [newsId]: !prev[newsId],
    }));
  };

  const handleDeleteNews = async (newsId: number) => {
    if (!confirm('이 소식을 삭제하시겠습니까?')) {
      return;
    }

    setIsDeleting(newsId);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/fundings/${fundingId}/news/${newsId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('삭제 실패');
      }

      alert('소식이 삭제되었습니다.');
      window.location.reload(); // 또는 revalidate
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('소식 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(null);
    }
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
      {/* 작가만 "새 소식 작성하기" 버튼 보임 */}
      {isAuthor && (
        <div className="ml-auto">
          <NewsInputModal fundingId={fundingId} />
        </div>
      )}

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

                  {/* 작가만 삭제 버튼 보임 */}
                  {isAuthor && (
                    <button
                      onClick={() => handleDeleteNews(item.id)}
                      disabled={isDeleting === item.id}
                      className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting === item.id ? '삭제 중...' : '삭제'}
                    </button>
                  )}
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
