import {
  MoricashBalance,
  MoricashBalanceResponse,
} from '../types/moricash.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * 모리캐시 잔액 조회
 */
export const getMoricashBalance = async (): Promise<MoricashBalance> => {
  const response = await fetch(`${API_BASE_URL}/api/moricash/balance`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('모리캐시 잔액 조회에 실패했습니다.');
  }

  return response.json();
};
