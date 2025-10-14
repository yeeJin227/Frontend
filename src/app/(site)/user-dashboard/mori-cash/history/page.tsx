'use client';

import { useState } from 'react';

interface CashHistory {
  id: number;
  date: string;
  type: string;
  chargeAmount: number;
  useAmount: number;
  balance: number;
  paymentMethod: string;
}

// 더미 데이터
const historyData: CashHistory[] = [
  {
    id: 1,
    date: '2025.09.24',
    type: '상품 주문',
    chargeAmount: 0,
    useAmount: 10000,
    balance: 0,
    paymentMethod: '모리캐시',
  },
  {
    id: 2,
    date: '2025.09.23',
    type: '모리캐시 충전',
    chargeAmount: 4100,
    useAmount: 0,
    balance: 10000,
    paymentMethod: '토스페이',
  },
  {
    id: 3,
    date: '2025.09.22',
    type: '모리캐시 충전',
    chargeAmount: 5900,
    useAmount: 0,
    balance: 5900,
    paymentMethod: '네이버페이',
  },
];

export default function CashHistoryPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* 제목 */}
      <h1 className="text-3xl font-bold mb-8">충전/사용 내역</h1>

      {/* 테이블 */}
      <div className="border-t-2 border-gray-900">
        {/* 테이블 헤더 */}
        <div className="grid grid-cols-6 gap-4 py-4 px-6 bg-white border-b border-gray-200">
          <div className="text-center font-medium text-gray-700">충전일</div>
          <div className="text-center font-medium text-gray-700">구분</div>
          <div className="text-center font-medium text-gray-700">충전 금액</div>
          <div className="text-center font-medium text-gray-700">사용 금액</div>
          <div className="text-center font-medium text-gray-700">잔액</div>
          <div className="text-center font-medium text-gray-700">결제수단</div>
        </div>

        {/* 테이블 바디 */}
        {historyData.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-6 gap-4 py-5 px-6 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="text-center">{item.date}</div>
            <div className="text-center">{item.type}</div>
            <div className="text-center">
              {item.chargeAmount > 0
                ? `${item.chargeAmount.toLocaleString()}원`
                : '0원'}
            </div>
            <div className="text-center">
              {item.useAmount > 0
                ? `${item.useAmount.toLocaleString()}원`
                : '0원'}
            </div>
            <div className="text-center font-medium text-primary">
              {item.balance.toLocaleString()}원
            </div>
            <div className="text-center">{item.paymentMethod}</div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center items-center gap-2 mt-12">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {[...Array(totalPages)].map((_, index) => {
          const page = index + 1;
          return (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded transition-colors ${
                currentPage === page
                  ? 'text-gray-900 font-bold'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
