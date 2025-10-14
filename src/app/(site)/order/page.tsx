import React from 'react';
import OrderContent from './components/OrderContent';

const OrderPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-2xl mb-8">
          <span className="font-bold">01 장바구니</span>
          <span className="text-gray-300 mx-2">&gt;</span>
          <span className="text-gray-300">02 주문/결제</span>
          <span className="text-gray-300 mx-2">&gt;</span>
          <span className="text-gray-300">03 주문완료</span>
        </div>

        <OrderContent />
      </main>
    </div>
  );
};

export default OrderPage;
