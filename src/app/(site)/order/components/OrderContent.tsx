'use client';

import React from 'react';
import { useCart } from '../hooks/useCart';
import CartSection from './CartSection';
import OrderSummary from './OrderSummary';

const OrderContent = () => {
  const { data, isLoading, isError, error } = useCart();

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-xl text-gray-500">장바구니를 불러오는 중...</div>
      </div>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-xl text-red-500">
          장바구니를 불러오는데 실패했습니다.
          <br />
          {error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.'}
        </div>
      </div>
    );
  }

  // 데이터 없음
  if (!data) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-xl text-gray-500">장바구니가 비어있습니다.</div>
      </div>
    );
  }

  const { normalItems, fundingItems } = data;

  return (
    <>
      <CartSection title="일반 장바구니" items={normalItems} isRegular={true} />

      <CartSection
        title="펀딩 장바구니"
        items={fundingItems}
        isRegular={false}
      />

      <OrderSummary allItems={data.allItems} />
    </>
  );
};

export default OrderContent;
