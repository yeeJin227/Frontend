// app/funding/[id]/_components/CommunitySection.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import PlusBtn from '@/assets/icon/plusBtn.svg';
import TrashCan from '@/assets/icon/trashcan.svg';
import { FundingCommunity } from '@/types/funding';

interface CommunitySectionProps {
  fundingId: number;
  authorId: number;
  currentUserId?: number;
  currentUserName?: string; // 추가
  currentUserProfileImage?: string; // 추가
  communities: FundingCommunity[];
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'
).replace(/\/+$/, '');

export default function CommunitySection({
  fundingId,
  authorId,
  currentUserId,
  currentUserName,
  currentUserProfileImage,
  communities: initialCommunities,
}: CommunitySectionProps) {
  const [newMessage, setNewMessage] = useState('');
  const [communities, setCommunities] =
    useState<FundingCommunity[]>(initialCommunities);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 로그인 여부 확인
  const isLoggedIn = !!currentUserId;

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/fundings/${fundingId}/communities`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: newMessage,
          }),
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('댓글 등록 실패');
      }

      const result = await response.json();

      // 새 댓글을 맨 위에 추가 (현재 사용자 정보 사용)
      const newCommunity: FundingCommunity = {
        id: result.data,
        writerId: currentUserId,
        writerName: currentUserName || '사용자',
        profileImageUrl: currentUserProfileImage || '',
        content: newMessage,
        createDate: new Date().toISOString(),
      };

      setCommunities((prev) => [newCommunity, ...prev]);
      setNewMessage('');
      alert('댓글이 등록되었습니다.');
    } catch (error) {
      console.error('댓글 등록 실패:', error);
      alert('댓글 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (communityId: number) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) {
      return;
    }

    setDeletingId(communityId);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/fundings/${fundingId}/communities/${communityId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('댓글 삭제 실패');
      }

      setCommunities((prev) => prev.filter((c) => c.id !== communityId));
      alert('댓글이 삭제되었습니다.');
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return '방금전';
    if (diffInMinutes < 60) return `${diffInMinutes}분전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간전`;
    return `${Math.floor(diffInMinutes / 1440)}일전`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* 댓글 입력창 */}
      <div className="p-4">
        <h3 className="font-medium text-gray-800 mb-3">댓글</h3>

        {isLoggedIn ? (
          <div className="flex gap-2 items-end">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="댓글을 남겨주세요..."
              className="flex-1 px-4 py-3 rounded-[22px] border border-gray-400 bg-primary-20 text-sm"
              onKeyPress={(e) =>
                e.key === 'Enter' && !isSubmitting && handleSendMessage()
              }
              disabled={isSubmitting}
            />
            <button
              onClick={handleSendMessage}
              disabled={isSubmitting}
              className="disabled:opacity-50"
            >
              <PlusBtn />
            </button>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 bg-gray-100 rounded-lg">
            댓글을 작성하려면 로그인이 필요합니다.
          </div>
        )}
      </div>

      <div className="bg-gray-200 h-[1px] w-full my-[40px]" />

      {/* 댓글 목록 */}
      <div className="p-4 space-y-4">
        {communities.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            아직 등록된 댓글이 없습니다.
          </div>
        ) : (
          communities.map((community) => {
            return (
              <div
                key={community.id}
                className="p-4 rounded-lg border bg-white border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden relative">
                      {community.profileImageUrl ? (
                        <Image
                          src={community.profileImageUrl}
                          alt={community.writerName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-gray-600">👤</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {community.writerName}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTimeAgo(community.createDate)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-800 leading-relaxed break-words whitespace-pre-wrap">
                  {community.content}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
