'use client';

import { useState, useEffect } from 'react';
import Wallet from '@/assets/wallet.svg';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080').replace(/\/+$/, '');

interface CashData {
  currentBalance: number;
  currency: string;
  updatedAt: string | null;
}

export default function CashChargePage() {
  const [currentCash, setCurrentCash] = useState<number | null>(null);
  const [chargeAmount, setChargeAmount] = useState(10000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 계좌 정보 
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  const quickAmounts = [10000, 20000, 50000, 100000];

  // 보유 캐시 조회 api
  useEffect(() => {
    const fetchCurrentCash = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/dashboard/cash`, {
          method: 'GET',
          headers: { Accept: 'application/json;charset=UTF-8' },
          credentials: 'include',
        });

        if (!res.ok) throw new Error('보유 캐시 정보를 불러오는 데 실패했습니다.');

        const result = await res.json();
        if (result.resultCode === '200') {
          setCurrentCash(result.data.currentBalance);
        } else {
          throw new Error(result.msg || '알 수 없는 오류가 발생했습니다.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentCash();
  }, []);


  const handleAddAmount = (amount: number) => {
    setChargeAmount((prev) => prev + amount);
  };

  const handleChargeAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setChargeAmount(value ? parseInt(value, 10) : 0);
  };

  const totalCash = (currentCash ?? 0) - chargeAmount;

  // 환전 요청 api
  const handleExchange = async () => {
    if (!bankName || !accountNumber || !accountHolder) {
      alert('은행명, 계좌번호, 예금주를 모두 입력해주세요.');
      return;
    }

    if (chargeAmount < 10000) {
      alert('최소 환전 금액은 10,000원입니다.');
      return;
    }

    try {
      const payload = {
        amount: chargeAmount,
        bankName,
        accountNumber,
        accountHolder,
      };

      const res = await fetch(`${API_BASE_URL}/api/cash/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          Accept: 'application/json;charset=UTF-8',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.msg || '환전 요청에 실패했습니다.');
      }

      alert('환전 요청이 완료되었습니다.');
      console.log('환전 요청 결과:', result);

      // 요청 성공 시 금액 갱신
      setCurrentCash((prev) => (prev ?? 0) - chargeAmount);
      setChargeAmount(10000);
      setBankName('');
      setAccountNumber('');
      setAccountHolder('');
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : '환전 요청 중 오류가 발생했습니다.');
    }
  };


  return (
    <div>
      <h3 className="mt-15 ml-30 mb-5 text-3xl font-bold">환전 요청</h3>

      <div className="flex justify-center min-h-screen">
        <div className="relative w-full max-w-[600px]">
          <Wallet style={{ width: '100%', height: 'auto' }} className="w-full" aria-hidden />

          <div className="absolute inset-0 flex flex-col px-12 pt-32">
            {/* 보유 캐시 */}
            <div className="flex items-center gap-10 mb-6">
              <span className="text-[20px] font-medium text-gray-700">보유 모리캐시</span>
              {loading ? (
                <span className="text-2xl font-bold">불러오는 중...</span>
              ) : error ? (
                <span className="text-lg font-bold text-red-500">{error}</span>
              ) : (
                <span className="text-2xl font-bold">{(currentCash ?? 0).toLocaleString()} 원</span>
              )}
            </div>

            {/* 환전 금액 */}
            <div className="flex items-center gap-10 mb-4">
              <span className="text-[20px] font-medium text-gray-700">환전 금액</span>
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

            {/* 금액 추가 버튼 */}
            <div className="flex gap-2 mb-6">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleAddAmount(amount)}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-primary rounded-full hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  + {amount.toLocaleString()}
                </button>
              ))}
            </div>

            {/* 환전 후 잔액 */}
            <div className="flex items-center gap-10 mb-6">
              <span className="text-[20px] font-medium text-gray-700">환전 후 모리캐시</span>
              <span className="text-2xl font-bold text-primary">{totalCash.toLocaleString()} 원</span>
            </div>

            {/* 계좌 정보 입력 */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-4">
                <label className="w-24 text-[18px] font-medium text-gray-700">은행명</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="예) 국민은행"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-24 text-[18px] font-medium text-gray-700">계좌번호</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="예) 123-456-789012"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-24 text-[18px] font-medium text-gray-700">예금주명</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="홍길동"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* 환전하기 버튼 */}
            <button
              onClick={handleExchange}
              className="w-full max-w-[150px] mx-auto py-3 mt-5 text-white font-bold bg-primary rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
            >
              환전하기
            </button>
          </div>
        </div>
      </div>

      {/* 안내문 */}
      <ul className="mx-auto mt-10 max-w-3xl list-disc space-y-2 pl-5 text-sm text-[var(--color-gray-600)] leading-relaxed">
        <li>판매대금은 환불, 취소 가능 기간(주문일로부터 7일) 이후에만 정산 가능합니다.</li>
        <li>환급 가능 금액은 판매금액에서 플랫폼 수수료, PG사 수수료, 환불/차지백 보류액 등을 차감한 금액입니다.</li>
        <li>환급은 작가 본인 명이의 계좌로만 신청할 수 있으며, 계좌 정보가 올바르지 않은 경우 지급이 지연될 수 있습니다.</li>
        <li>환급 요청 후 지급까지는 영업일 기준 3~5일 정도 소요될 수 있습니다.</li>
        <li>환급 금액은 원천징수 없이 전액 지급되며, 세금 신고 의무는 작가 본인에게 있습니다.</li>
        <li>부정거래(허위 주문, 저작권 침해 등)로 확인되는 경우, 환급이 보류되거나 이미 지급된 금액이 환수될 수 있습니다.</li>
        <li>계정이 정지/탈퇴되는 경우에도 미정산 금액은 본인 확인 절차를 거쳐 환급 처리됩니다.</li>
      </ul>
    </div>
  );
}
