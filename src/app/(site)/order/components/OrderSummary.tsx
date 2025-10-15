'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CartItem } from '../types/cart.types';
import { useCartTotalAmount, useValidateCart } from '../hooks/useCart';

interface OrderSummaryProps {
  allItems: CartItem[];
}

const OrderSummary = ({ allItems }: OrderSummaryProps) => {
  const router = useRouter();
  const validateCartMutation = useValidateCart();

  const checkedCount = allItems.filter((item) => item.isChecked).length;

  // 서버에서 총 금액 계산 (선택된 아이템만)
  const { data: totalAmountData, isLoading: isLoadingAmount } =
    useCartTotalAmount(false);

  const handleOrder = async () => {
    if (checkedCount === 0) {
      alert('주문할 상품을 선택해주세요.');
      return;
    }

    try {
      // 주문 전 장바구니 검증
      const validationResult = await validateCartMutation.mutateAsync(false);

      if (validationResult.resultCode !== '200') {
        const invalidItems = validationResult.data.invalidItems || [];
        const reasons = invalidItems
          .map((item) => `- ${item.productName}: ${item.reason}`)
          .join('\n');

        alert(`주문할 수 없는 상품이 있습니다:\n${reasons}`);
        return;
      }

      // 검증 통과 시 결제 페이지로 이동
      router.push('/order/payment');
    } catch (error) {
      alert('주문 처리 중 오류가 발생했습니다.');
      console.error(error);
    }
  };

  // 로딩 중이거나 데이터가 없으면 기본값 표시
  const totalPrice = totalAmountData?.data.totalProductAmount || 0;
  const shippingFee = totalAmountData?.data.totalShippingFee || 0;
  const finalPrice = totalAmountData?.data.totalAmount || 0;

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
          className="px-12 py-3 bg-primary text-white rounded font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          주문하기 ({checkedCount})
        </button>
      </section>
    </>
  );
};

export default OrderSummary;
