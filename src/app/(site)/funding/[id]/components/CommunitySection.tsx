// app/funding/[id]/_components/CommunitySection.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import PlusBtn from '@/assets/icon/plusBtn.svg';
import TrashCan from '@/assets/icon/trashcan.svg';
import { FundingCommunity } from '@/types/funding';

interface CommunitySectionProps {
  fundingId: number;
  communities: FundingCommunity[];
}

export default function CommunitySection({
  fundingId,
  communities: initialCommunities,
}: CommunitySectionProps) {
  const [newMessage, setNewMessage] = useState('');
  const [communities, setCommunities] =
    useState<FundingCommunity[]>(initialCommunities);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // TODO: API 호출로 실제 댓글 등록
      const newCommunity: FundingCommunity = {
        id: Date.now(),
        writerName: '현재 사용자',
        profileImageUrl: '',
        content: newMessage,
        createDate: new Date().toISOString(),
      };
      setCommunities((prev) => [...prev, newCommunity]);
      setNewMessage('');
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
      <div className="p-4 space-y-4">
        {communities.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            아직 등록된 댓글이 없습니다.
          </div>
        ) : (
          communities.map((community) => (
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
                    <div className="font-medium text-sm">
                      {community.writerName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTimeAgo(community.createDate)}
                    </div>
                  </div>
                </div>
                <button className="hover:cursor-pointer">
                  <TrashCan />
                </button>
              </div>
              <div className="text-sm text-gray-800 leading-relaxed break-words whitespace-pre-wrap">
                {community.content}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-gray-200 h-[1px] w-full my-[40px]" />

      <div className="p-4">
        <h3 className="font-medium text-gray-800 mb-3">댓글</h3>
        <div className="flex gap-2 items-end">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="댓글을 남겨주세요..."
            className="flex-1 px-4 py-3 rounded-[22px] border border-gray-400 bg-primary-20 text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button onClick={handleSendMessage}>
            <PlusBtn />
          </button>
        </div>
      </div>
    </div>
  );
}
