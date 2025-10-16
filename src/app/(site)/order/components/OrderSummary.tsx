'use client';

import React, { useEffect } from 'react';
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
  const {
    data: totalAmountData,
    isLoading: isLoadingAmount,
    refetch,
  } = useCartTotalAmount(false);

  // 체크된 아이템이 변경될 때마다 금액 다시 조회
  useEffect(() => {
    console.log('checkedCount 변경됨:', checkedCount);
    refetch();
  }, [checkedCount, refetch]);

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
  // const totalPrice = totalAmountData?.data || 0;
  // const shippingFee = 3000; // 고정 배송비
  // const finalPrice = totalPrice === 0 ? 0 : +totalPrice + +shippingFee;

  return (
    <>
      {/* 주문 요약 
      <section className="mb-8">
        <div className="flex justify-center gap-16 text-2xl">
          <div className="text-center">
            <div className="font-semibold mb-2">총 주문금액</div>
            <div>
              {isLoadingAmount ? (
                <span className="text-gray-400">계산 중...</span>
              ) : (
                `${totalPrice.toLocaleString()}원`
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="font-semibold mb-2">총 배송비</div>
            <div>
              {isLoadingAmount ? (
                <span className="text-gray-400">계산 중...</span>
              ) : (
                `${shippingFee.toLocaleString()}원`
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="font-semibold mb-2">총 결제금액</div>
            <div>
              {isLoadingAmount ? (
                <span className="text-gray-400">계산 중...</span>
              ) : (
                `${finalPrice.toLocaleString()}원`
              )}
            </div>
          </div>
        </div>
      </section>*/}

      {/* 주문 버튼 */}
      <section className="flex justify-center">
        <button
          onClick={handleOrder}
          disabled={checkedCount === 0 || isLoadingAmount}
          className="px-12 py-3 bg-primary text-white rounded font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          주문하기 ({checkedCount})
        </button>
      </section>
    </>
  );
};

export default OrderSummary;
