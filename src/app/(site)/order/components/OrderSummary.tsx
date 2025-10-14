'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CartItem } from '../types/cart.types';

interface OrderSummaryProps {
  allItems: CartItem[];
}

const OrderSummary = ({ allItems }: OrderSummaryProps) => {
  const router = useRouter();

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

  const handleOrder = () => {
    if (checkedCount === 0) {
      alert('주문할 상품을 선택해주세요.');
      return;
    }

    // 결제 페이지로 이동
    router.push('/order/payment');
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
      <section className="flex justify-center">
        <button
          onClick={handleOrder}
          disabled={checkedCount === 0}
          className="px-6 py-3 bg-primary text-white rounded font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checkedCount}개 상품 주문하기
        </button>
      </section>
    </>
  );
};

export default OrderSummary;
