'use client';

import React from 'react';
import { useToggleCartItem } from '../hooks/useCart';
import { CartItem as CartItemType } from '../types/cart.types';
import CartItem from './CartItem';

interface CartSectionProps {
  title: string;
  items: CartItemType[];
  isRegular: boolean;
}

const CartSection = ({ title, items, isRegular }: CartSectionProps) => {
  const toggleMutation = useToggleCartItem();

  const toggleAllCheck = () => {
    const allChecked = items.every((item) => item.isChecked);

    // 모든 아이템의 선택 상태를 토글
    items.forEach((item) => {
      toggleMutation.mutate(item.id);
    });
  };

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold mb-6">{title}</h2>

      {items.length === 0 ? (
        // 빈 장바구니 상태
        <div className="bg-white border border-gray-300 py-20 flex flex-col items-center justify-center">
          <div className="text-gray-400 text-lg mb-2">
            {isRegular
              ? '일반 장바구니가 비어있습니다.'
              : '펀딩 장바구니가 비어있습니다.'}
          </div>
          <div className="text-gray-400 text-sm">상품을 담아보세요!</div>
        </div>
      ) : (
        <>
          {/* 테이블 헤더 */}
          <div className="bg-white border border-gray-300 px-4 py-6 flex items-center">
            <div className="mr-6">
              <input
                type="checkbox"
                onChange={toggleAllCheck}
                checked={
                  items.length > 0 && items.every((item) => item.isChecked)
                }
                className="w-5 h-5 text-primary bg-gray-100 border-gray-300 rounded"
              />
            </div>
            <div className="w-[150px] mr-8"></div>
            <div className="flex-1 mr-8 text-center text-xl">상품 정보</div>
            <div className="w-24 text-center text-xl mr-12">주문 금액</div>
            <div className="mr-4"></div>
            <div className="w-[103px] text-center text-xl">수량</div>
          </div>

          {/* 상품 목록 */}
          <div className="bg-white">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default CartSection;
