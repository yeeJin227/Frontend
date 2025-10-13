'use client';

import React from 'react';
import { CartItem } from '../types/cart.types';

interface OrderSummaryProps {
  allItems: CartItem[];
}

const OrderSummary = ({ allItems }: OrderSummaryProps) => {
  const calculateTotal = () => {
    const checkedItems = allItems.filter((item) => item.isChecked);
    const totalPrice = checkedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const shippingFee = totalPrice > 0 ? 3000 : 0;
    return {
      totalPrice,
      shippingFee,
      finalPrice: totalPrice + shippingFee,
      checkedCount: checkedItems.length,
    };
  };

  const { totalPrice, shippingFee, finalPrice, checkedCount } =
    calculateTotal();

  const handleSelectedOrder = () => {
    if (checkedCount === 0) {
      alert('선택된 상품이 없습니다.');
      return;
    }
    // TODO: 선택 주문 처리 로직
    console.log('선택 주문:', checkedCount);
  };

  const handleAllOrder = () => {
    if (allItems.length === 0) {
      alert('장바구니가 비어있습니다.');
      return;
    }
    // TODO: 전체 주문 처리 로직
    console.log('전체 주문:', allItems.length);
  };

  return (
    <>
      {/* 주문 요약 */}
      <section className="mb-8">
        <div className="flex justify-center gap-16 text-2xl">
          <div className="text-center">
            <div className="font-semibold mb-2">총 주문금액</div>
            <div>{totalPrice.toLocaleString()}원</div>
          </div>
          <div className="text-center">
            <div className="font-semibold mb-2">총 배송비</div>
            <div>{shippingFee.toLocaleString()}원</div>
          </div>
          <div className="text-center">
            <div className="font-semibold mb-2">총 결제금액</div>
            <div>{finalPrice.toLocaleString()}원</div>
          </div>
        </div>
      </section>

      {/* 주문 버튼 */}
      <section className="flex justify-center gap-4">
        <button
          onClick={handleSelectedOrder}
          className="px-8 py-3 border border-primary text-primary rounded bg-white font-semibold hover:bg-gray-50"
        >
          선택주문({checkedCount})
        </button>
        <button
          onClick={handleAllOrder}
          className="px-8 py-3 bg-primary text-white rounded font-semibold hover:bg-primary/90"
        >
          전체주문
        </button>
      </section>
    </>
  );
};

export default OrderSummary;
