'use client';

import { useState, useEffect } from 'react';
import FullHeart from '@/assets/icon/full_heart.svg';
import EmptyHeart from '@/assets/icon/empty_heart.svg';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ToastProvider';

interface ProductInfoProps {
  id: number;
  title: string;
  category: string;
  price: number;
  stock: number;
  soldCount: number;
  currentAmount: number;
  targetAmount: number;
  remainingDays: number;
  participants: number;
}

export interface addCartRequest {
  fundingId: number;
  quantity: number;
  cartType: 'FUNDING';
  fundingPrice: number;
  fundingStock: number;
}

export default function ProductInfo({
  id,
  title,
  category,
  price,
  stock,
  soldCount,
  currentAmount,
  targetAmount,
  remainingDays,
  participants,
}: ProductInfoProps) {
  const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'
  ).replace(/\/+$/, '');

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [isCheckingWishlist, setIsCheckingWishlist] = useState(false);

  const isFundingEnded = remainingDays < 0;
  const isOutOfStock = stock <= 0;
  const role = useAuthStore((store) => store.role);
  const toast = useToast();

  // 🔥 페이지 진입 시 찜 상태 확인
  useEffect(() => {
    const checkWishlistStatus = async () => {
      // 로그인하지 않았으면 확인하지 않음
      if (!role) {
        setIsWishlisted(false);
        return;
      }

      setIsCheckingWishlist(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/fundings/${id}/wish/check`,
          {
            method: 'GET',
            credentials: 'include',
          },
        );

        if (!response.ok) {
          // 404나 다른 에러는 찜하지 않은 상태로 처리
          console.warn('찜 상태 확인 실패:', response.status);
          setIsWishlisted(false);
          return;
        }

        const result = await response.json();

        // API 응답 구조에 따라 조정 필요
        // 예: { resultCode: "200", msg: "success", data: true }
        setIsWishlisted(result.data === true || result.data === 'true');
      } catch (error) {
        console.error('찜 상태 확인 중 오류:', error);
        // 에러 발생 시 찜하지 않은 상태로 처리
        setIsWishlisted(false);
      } finally {
        setIsCheckingWishlist(false);
      }
    };

    checkWishlistStatus();
  }, [id, role, API_BASE_URL]); // role이 변경되면 다시 확인

  const handleAddCart = async () => {
    if (!role) {
      toast.error('로그인이 필요한 서비스입니다.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fundingId: id,
          quantity: 1,
          cartType: 'FUNDING',
          fundingPrice: price,
          fundingStock: stock,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error : ${response.status} ${response.statusText}`);
      }
      if (response.status === 200) {
        toast.success('장바구니에 추가되었습니다.');
      }
    } catch (error) {
      console.error(error);
      toast.error('장바구니 추가에 실패했습니다.');
    }
  };

  const handleWishlistToggle = async () => {
    if (isTogglingWishlist) return;
    if (!role) {
      toast.error('로그인이 필요한 서비스입니다.');
      return;
    }

    setIsTogglingWishlist(true);

    try {
      // 현재 상태에 따라 메서드 결정
      const method = isWishlisted ? 'DELETE' : 'POST';

      console.log(`찜 ${method === 'POST' ? '추가' : '제거'} 요청 중...`);

      const response = await fetch(`${API_BASE_URL}/api/fundings/${id}/wish`, {
        method: method,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('서버 에러:', errorData);
        throw new Error(
          `위시리스트 처리 실패: ${response.status} ${
            errorData.msg || response.statusText
          }`,
        );
      }

      const result = await response.json();
      console.log('서버 응답:', result);

      // 상태 토글
      if (isWishlisted) {
        setIsWishlisted(false);
        toast.success('찜 목록에서 제거되었습니다.');
      } else {
        setIsWishlisted(true);
        toast.success('찜 목록에 추가되었습니다.');
      }
    } catch (error) {
      console.error('위시리스트 토글 중 오류 발생:', error);
      toast.error('위시리스트 처리에 실패했습니다.');
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  return (
    <div className="space-y-6 ml-[92px]">
      <div>
        <span className="inline-block bg-primary text-white text-xs px-2 py-1 rounded-[6px] mb-2">
          {category}
        </span>
        <h1 className="font-bold text-gray-900 mb-4">{title}</h1>
      </div>

      <div className="space-y-2 grid gap-7 text-[26px]">
        {/* 가격 정보 */}
        <div>
          <p>가격</p>
          <div className="text-3xl font-bold text-gray-900">
            {(price ?? 0).toLocaleString()}
            <span className="text-[18px] font-normal">원</span>
          </div>
        </div>

        {/* 재고/판매 정보 */}
        <div>
          <p>재고 현황</p>
          <div className="flex gap-4 items-center">
            <div className="font-bold text-gray-900">
              {(stock ?? 0).toLocaleString()}
              <span className="text-[18px] font-normal">개 남음</span>
            </div>
            <div className="text-gray-500 font-normal text-[18px]">
              {(soldCount ?? 0).toLocaleString()}개 판매됨
            </div>
          </div>
        </div>

        <div>
          <p>모인 금액</p>
          <div className="flex gap-20">
            <div className="text-3xl font-bold text-gray-900">
              {(currentAmount ?? 0).toLocaleString()}
              <span className="text-[18px] font-normal">원</span>
            </div>
            <div className="text-gray-500 font-normal self-end">
              목표 금액 {(targetAmount ?? 0).toLocaleString()}원
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

      <div className="space-x-3 flex gap-7">
        <button
          onClick={handleAddCart}
          disabled={isFundingEnded || isOutOfStock}
          className={`max-w-[162px] w-full border-1 py-3 px-6 rounded-[6px] text-[25px] font-bold transition-colors ${
            isFundingEnded || isOutOfStock
              ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
              : 'bg-white border-primary text-primary hover:bg-green-50'
          }`}
        >
          장바구니
        </button>
        <button
          disabled={isFundingEnded || isOutOfStock}
          className={`max-w-[162px] w-full py-3 px-6 rounded-[6px] text-[25px] font-bold transition-colors ${
            isFundingEnded || isOutOfStock
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary-60'
          }`}
        >
          예약 구매
        </button>
        <button
          id="wishList"
          onClick={handleWishlistToggle}
          disabled={isFundingEnded || isTogglingWishlist || isCheckingWishlist}
          className={`p-3 border rounded-lg transition-colors ${
            isFundingEnded || isTogglingWishlist || isCheckingWishlist
              ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
              : 'border-gray-300 hover:border-primary'
          }`}
        >
          {isWishlisted ? <FullHeart /> : <EmptyHeart />}
        </button>
      </div>

      {/* 상태 메시지 */}
      {isFundingEnded && (
        <p className="text-red-500 text-sm font-semibold">
          이 펀딩은 종료되었습니다.
        </p>
      )}
      {!isFundingEnded && isOutOfStock && (
        <p className="text-red-500 text-sm font-semibold">
          재고가 모두 소진되었습니다.
        </p>
      )}
    </div>
  );
}
