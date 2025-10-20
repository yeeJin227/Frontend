'use client';

import { useState, useEffect } from 'react';
import Wallet from '@/assets/wallet.svg';
import { loadTossPayments } from '@tosspayments/payment-sdk';

// --- API 연동을 위한 설정 ---
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'
).replace(/\/+$/, '');

// --- TypeScript 타입 정의 ---
interface CashData {
  currentBalance: number;
  currency: string;
  updatedAt: string | null;
}

interface Payment {
  /** 트랜잭션 고유 ID */
  transactionId: number;

  /** 사용자 ID */
  userId: number;

  /** 연관된 주문 ID */
  orderId: string;

  /** 결제/거래 금액 */
  amount: number;

  /** 결제 상태 (예시: PENDING, COMPLETED, FAILED) */
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | string;

  /** 결제 수단 (예: CARD, BANK, MORI_CASH) */
  paymentMethod: string;

  /** PG사 이름 (예: TOSS, KAKAO, NICE) */
  pgProvider: string;

  /** PG사 측 트랜잭션 ID */
  pgTransactionId: string;

  /** PG사 승인 번호 */
  pgApprovalNumber: string;

  /** 결제 후 잔액 (캐시, 포인트 등) */
  balanceAfter: number;

  /** 생성 일시 (ISO 8601 형식) */
  createdAt: string;

  /** 완료 일시 (ISO 8601 형식) */
  completedAt: string;
}

function CashChargePage() {
  // --- 상태 관리 ---
  const [currentCash, setCurrentCash] = useState<number | null>(null); // 보유 모리캐시 (API로부터 fetch)
  const [chargeAmount, setChargeAmount] = useState(10000); // 충전 모리캐시 (기본값 설정)
  const [paymentMethod, setPaymentMethod] = useState<'naver' | 'toss'>('naver');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  const CLIENT_URL =
    process.env.NEXT_PUBLIC_CLIENT_BASE_URL || 'http://localhost:3000';

  const quickAmounts = [5000, 10000, 30000, 50000];

  // --- 데이터 패칭 로직 ---
  useEffect(() => {
    const fetchCurrentCash = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/cash`, {
          method: 'GET',
          headers: {
            Accept: 'application/json;charset=UTF-8',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('보유 캐시 정보를 불러오는 데 실패했습니다.');
        }

        const result = await response.json();

        if (result.resultCode === '200') {
          setCurrentCash(result.data.currentBalance);
        } else {
          throw new Error(result.msg || '알 수 없는 오류가 발생했습니다.');
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('데이터를 불러오는 중 문제가 발생했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentCash();
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // --- 이벤트 핸들러 ---
  const handleAddAmount = (amount: number) => {
    setChargeAmount((prev) => prev + amount);
  };

  const handleChargeAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setChargeAmount(value ? parseInt(value, 10) : 0);
  };

  const totalCash = (currentCash ?? 0) + chargeAmount;

  const handleCharge = async () => {
    console.log('충전 시도 : ', {
      chargeAmount,
      paymentMethod,
      totalCash,
    });
    // TODO: 충전 API 호출
    try {
      const response = await fetch(`${API_BASE_URL}/api/cash/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify({
          amount: chargeAmount,
          paymentMethod: '카드',
          pgProvider: 'TOSS',
        }),
        credentials: 'include',
      });

      if (!response.ok)
        throw new Error(`${response.status} : ${response.statusText}`);
      if (!TOSS_CLIENT_KEY)
        throw new Error('토스페이먼츠 클라이언트 키가 없습니다.');
      const data: Promise<Payment> = await response.json();
      try {
        const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
        await tossPayments.requestPayment('카드', {
          amount: chargeAmount,
          orderId: (await data).orderId, // string이어야 함
          orderName: '모리캐시 충전',
          customerName: '이소민',
          successUrl: `${CLIENT_URL}/payment/success`, // ⭐️ 성공 리다이렉트 URL
          failUrl: `${CLIENT_URL}/payment/fail`, // ⭐️ 실패 리다이렉트 URL
        });
      } catch (error) {
        console.error('토스 sdk 실행 중 에러 : ', error);
      }
    } catch (error) {
      console.error('캐시 충전 중 에러 : ', error);
    }
  };

  return (
    <div>
      <h3 className="mt-15 ml-30 mb-5 text-3xl font-bold">캐시 충전</h3>

      <div className="flex justify-center min-h-screen">
        <div className="relative w-full max-w-[600px]">
          {/* 배경 이미지 */}
          <Wallet
            style={{ width: '100%', height: 'auto' }}
            className="w-full"
            aria-hidden
          />

          {/* 오버레이 콘텐츠 */}
          <div className="absolute inset-0 flex flex-col px-12 pt-32">
            {/* 보유 모리캐시 */}
            <div className="flex items-center gap-10 mb-6">
              <span className="text-[20px] font-medium text-gray-700">
                보유 모리캐시
              </span>
              {loading ? (
                <span className="text-2xl font-bold">불러오는 중...</span>
              ) : error ? (
                <span className="text-lg font-bold text-red-500">{error}</span>
              ) : (
                <span className="text-2xl font-bold">
                  {(currentCash ?? 0).toLocaleString()} 원
                </span>
              )}
            </div>

            {/* 충전 모리캐시 */}
            <div className="flex items-center gap-10 mb-4">
              <span className="text-[20px] font-medium text-gray-700">
                충전 모리캐시
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chargeAmount.toLocaleString()}
                  onChange={handleChargeAmountChange}
                  className="w-32 px-3 py-1 text-right text-2xl font-bold border-2 border-gray-300 rounded-md focus:outline-none focus:border-primary bg-white"
                />
                <span className="text-lg font-medium">원</span>
              </div>
            </div>

            {/* 금액 추가 버튼들 */}
            <div className="flex gap-2 mb-6">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleAddAmount(amount)}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-primary rounded-full hover:bg-primary/90 transition-colors"
                >
                  + {amount.toLocaleString()}
                </button>
              ))}
            </div>

            {/* 충전 후 모리캐시 */}
            <div className="flex items-center gap-10 mb-6">
              <span className="text-[20px] font-medium text-gray-700">
                충전 후 모리캐시
              </span>
              <span className="text-2xl font-bold text-primary">
                {totalCash.toLocaleString()} 원
              </span>
            </div>

            {/* 충전 방법 */}
            <div className="mb-8">
              <span className="block text-[20px] font-medium text-gray-700 mb-3">
                충전 방법
              </span>
              <div className="flex gap-4">
                {/* <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="naver"
                    checked={paymentMethod === 'naver'}
                    onChange={() => setPaymentMethod('naver')}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded-full border-2 border-gray-400 peer-checked:border-primary flex items-center justify-center">
                    <div
                      className={`w-3 h-3 rounded-full transition-colors ${paymentMethod === 'naver' ? 'bg-primary' : 'bg-transparent'}`}
                    />
                  </div>
                  <span className="text-[16px] font-medium">네이버페이</span>
                </label> */}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="toss"
                    checked={paymentMethod === 'toss'}
                    onChange={() => setPaymentMethod('toss')}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded-full border-2 border-gray-400 peer-checked:border-primary flex items-center justify-center">
                    <div
                      className={`w-3 h-3 rounded-full transition-colors ${paymentMethod === 'toss' ? 'bg-primary' : 'bg-transparent'}`}
                    />
                  </div>
                  <span className="text-[16px] font-medium">토스페이</span>
                </label>
              </div>
            </div>

            {/* 충전하기 버튼 */}
            <button
              onClick={handleCharge}
              className="w-full max-w-[200px] mx-auto py-3 text-white font-bold bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              충전하기
            </button>
          </div>
        </div>
      </div>

      {/* 주의사항 */}
      <ul className="mx-auto w-full max-w-[505px] mt-8 space-y-1 text-sm text-gray-600">
        <li>
          ** 캐시 충전 후 7일 이내에 사용하지 않은 경우에 한해, 결제 취소가
          가능합니다.
        </li>
        <li>
          ** 법정대리인의 동의가 없는 미성년자의 결제는 취소될 수 있습니다.
        </li>
        <li>
          ** 캐시를 사용하여 결제한 금액은 현금 환불이 불가하며,
          <br />
          계정 탈퇴 시 잔액은 전액 소멸됩니다.
        </li>
      </ul>
    </div>
  );
}

export default CashChargePage;
