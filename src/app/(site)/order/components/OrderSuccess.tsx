'use client';
import CheckSVG from '@/assets/icon/check.svg';

function OrderSuccess() {
  return (
    <div>
      <div className="flex justify-center mb-8">
        <CheckSVG></CheckSVG>
      </div>
      <h1 className="text-4xl font-bold mb-6 text-black">
        주문이 완료되었습니다.
      </h1>
      <div className="text-2xl text-gray-500 leading-relaxed">
        <p className="mb-1">구매해 주셔서 감사합니다.</p>
        <p className="mb-1">작가님께서 상품을 준비해 주실 예정입니다.</p>
        <p>조금만 기다려 주세요!</p>
      </div>
    </div>
  );
}
export default OrderSuccess;
