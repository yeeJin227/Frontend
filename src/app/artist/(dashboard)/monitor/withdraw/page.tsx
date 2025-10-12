'use client';

import { useMemo, useState } from 'react';
import Button from '@/components/Button';
import Wallet from '@/assets/wallet.svg';

export default function SettlementWithdrawPage() {
  const balance = 64000;
  const [amount, setAmount] = useState<number>(balance);
  const remain = useMemo(() => Math.max(balance - amount, 0), [balance, amount]);

  const quick = (delta: number | 'ALL') => {
    if (delta === 'ALL') return setAmount(balance);
    setAmount((a) => Math.min(Math.max(a + delta, 0), balance));
  };

  return (
    <div>
      <h3 className="mb-5 text-2xl font-bold">환전 요청</h3>

      <div className='flex items-center'>
        <div className="relative mx-auto w-full max-w-3xl aspect-[505/450]">
        <Wallet style={{ width: 600, height: 'auto' }} className="inset-0 h-full w-full" aria-hidden />
      </div>

      {/* 안내 */}
      <ul className="mx-auto max-w-3xl list-disc space-y-2 pl-5 text-sm text-[var(--color-gray-600)]">
        <li>판매대금은 환불, 취소 가능 기간(주문일로부터 7일) 이후에만 정산 가능합니다.</li>
        <li>환급 가능 금액은 판매금액에서 플랫폼 수수료, PG사 수수료, 환불/차지백 보류액 등을 차감한 금액입니다.</li>
        <li>환급은 작가 본인 명이의 계좌로만 신청할 수 있으며, 계좌 정보가 올바르지 않은 경우 지급이 지연될 수 있습니다.</li>
        <li>환급 요청 후 지급까지는 영업일 기준 3~5일 정도 소요될 수 있습니다.</li>
        <li>환급 금액은 원천징수 없이 전액 지급되며, 세금 신고 의무는 작가 본인에게 있습니다.</li>
        <li>부정거래(허위 주문, 저작권 침해 등)로 확인되는 경우, 환급이 보류되거나 이미 지급된 금액이 환수될 수 있습니다.</li>
        <li>계정이 정지/탈퇴되는 경우에도 미정산 금액은 본인 확인 절차를 거쳐 환급 처리됩니다.</li>
      </ul>
      </div>
    </div>
  );
}
