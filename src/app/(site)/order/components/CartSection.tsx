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

  // 섹션이 비어있으면 렌더링하지 않음
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold mb-6">{title}</h2>

      {/* 테이블 헤더 */}
      <div className="bg-white border border-gray-300 px-4 py-6 flex items-center">
        <div className="mr-6">
          <input
            type="checkbox"
            onChange={toggleAllCheck}
            checked={items.length > 0 && items.every((item) => item.isChecked)}
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
    </section>
  );
};

export default CartSection;
