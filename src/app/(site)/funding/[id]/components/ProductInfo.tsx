// app/funding/[id]/_components/ProductInfo.tsx
'use client';

import { useState } from 'react';
import FullHeart from '@/assets/icon/full_heart.svg';
import EmptyHeart from '@/assets/icon/empty_heart.svg';

interface ProductInfoProps {
  id: number;
  title: string;
  category: string;
  currentAmount: number;
  targetAmount: number;
  remainingDays: number;
  participants: number;
  progress: number;
}

export default function ProductInfo({
  title,
  category,
  currentAmount,
  targetAmount,
  remainingDays,
  participants,
}: ProductInfoProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const isFundingEnded = remainingDays < 0;

  return (
    <div className="space-y-6 ml-[92px]">
      <div>
        <span className="inline-block bg-primary text-white text-xs px-2 py-1 rounded-[6px] mb-2">
          {category}
        </span>
        <h1 className="font-bold text-gray-900 mb-4">{title}</h1>
      </div>

      <div className="space-y-2 grid gap-7 text-[26px]">
        <div>
          <p>모인 금액</p>
          <div className="flex gap-20">
            <div className="text-3xl font-bold text-gray-900">
              {currentAmount.toLocaleString()}
              <span className="text-[18px] font-normal">원</span>
            </div>
            <div className="text-gray-500 font-normal self-end">
              목표 금액 {targetAmount.toLocaleString()}원
            </div>
          </div>
        </div>
        <div>
          <p>남은 기간</p>
          {remainingDays > 0 && (
            <div className="font-bold text-gray-900">
              {remainingDays}
              <span className="text-[18px] font-normal">일</span>
            </div>
          )}
          {remainingDays <= 0 && (
            <div className="font-bold text-gray-900">
              {remainingDays === 0 ? '마감일' : '펀딩 종료'}
            </div>
          )}
        </div>
        <div>
          <p>후원자</p>
          <div className="font-bold text-gray-900">
            {participants}
            <span className="text-[18px] font-normal">명</span>
          </div>
        </div>
      </div>

      {/* <div className="space-x-3 flex gap-7">
        <button className="max-w-[162px] w-full bg-white border-1 border-primary text-primary py-3 px-6 rounded-[6px] text-[25px] font-bold hover:bg-green-50 transition-colors">
          장바구니
        </button>
        <button className="max-w-[162px] w-full bg-primary text-white py-3 px-6 rounded-[6px] hover:bg-primary-60 transition-colors text-[25px] font-bold">
          예약 구매
        </button>
        <button
          onClick={() => setIsWishlisted(!isWishlisted)}
          className="p-3 border rounded-lg transition-colors border-gray-300"
        >
          {isWishlisted ? <FullHeart /> : <EmptyHeart />}
        </button>
      </div> */}
      <div className="space-x-3 flex gap-7">
        <button
          disabled={isFundingEnded}
          className={`max-w-[162px] w-full border-1 py-3 px-6 rounded-[6px] text-[25px] font-bold transition-colors ${
            isFundingEnded
              ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
              : 'bg-white border-primary text-primary hover:bg-green-50'
          }`}
        >
          장바구니
        </button>
        <button
          disabled={isFundingEnded}
          className={`max-w-[162px] w-full py-3 px-6 rounded-[6px] text-[25px] font-bold transition-colors ${
            isFundingEnded
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary-60'
          }`}
        >
          예약 구매
        </button>
        <button
          disabled={isFundingEnded}
          onClick={() => setIsWishlisted(!isWishlisted)}
          className={`p-3 border rounded-lg transition-colors ${
            isFundingEnded
              ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
              : 'border-gray-300 hover:border-primary'
          }`}
        >
          {isWishlisted ? <FullHeart /> : <EmptyHeart />}
        </button>
      </div>

      {/* ⭐ 종료 메시지 표시 (선택사항) */}
      {isFundingEnded && (
        <p className="text-red-500 text-sm font-semibold">
          이 펀딩은 종료되었습니다.
        </p>
      )}
    </div>
  );
}
