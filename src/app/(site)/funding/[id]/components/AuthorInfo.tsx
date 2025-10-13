// app/funding/[id]/_components/AuthorInfo.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Favorite from '@/assets/icon/bookmark.svg';
import EmptyFavorite from '@/assets/icon/empty_bookmark.svg';

interface AuthorInfoProps {
  authorId: number;
  authorName: string;
  authorDescription: string;
  profileImageUrl: string;
}

export default function AuthorInfo({
  authorId,
  authorName,
  authorDescription,
  profileImageUrl,
}: AuthorInfoProps) {
  const [isFavoriteAuthor, setIsFavoriteAuthor] = useState(false);

  return (
    <div className="space-y-8 ml-[92px]">
      <div className="bg-green-50 p-6 rounded-lg max-w-[366px] flex flex-col">
        <div className="text-center mb-4">
          <div className="flex">
            <h3 className="font-semibold">작가 소개</h3>
            <button
              className="ml-auto"
              onClick={() => setIsFavoriteAuthor((prev) => !prev)}
            >
              {isFavoriteAuthor ? <Favorite /> : <EmptyFavorite />}
            </button>
          </div>

          {/* 프로필 이미지 */}
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2 overflow-hidden relative">
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt={authorName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-green-200 flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
            )}
          </div>

          <h2 className="font-bold">{authorName}</h2>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
          {authorDescription}
        </p>

        <button
          onClick={() => {
            // 작가 페이지로 이동
            window.location.href = `/author/${authorId}`;
          }}
          className="mt-4 border p-2 rounded-[4px] ml-auto bg-white text-primary hover:underline"
        >
          작가페이지→
        </button>
      </div>
    </div>
  );
}
