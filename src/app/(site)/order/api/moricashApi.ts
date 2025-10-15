import {
  ApiResponse,
  MoricashBalance,
  MoricashBalanceResponse,
  MoriCashPaymentRequest,
  MoriCashPaymentResponseData,
} from '../types/moricash.types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:8080';

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

/*
 * 모리캐시 결제
 */

export const payMoricash = async (paymentData: MoriCashPaymentRequest) => {
  const response = await fetch(`${API_BASE_URL}/api/moricash/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(paymentData),
  });
  console.log(response);

  if (!response.ok) {
    let errorMsg = '모리캐시 결제 요청에 실패했습니다.';
    try {
      const errorData = await response.json();
      // 🚨 서버의 오류 메시지 (예: "모리캐시 잔액이 부족합니다.") 사용
      if (errorData.msg) {
        errorMsg = errorData.msg;
      }
    } catch (e) {
      console.error(e);
    }
    throw new Error(`결제 실패 (${response.status}): ${errorMsg}`);
  }

  const result: ApiResponse<MoriCashPaymentResponseData> =
    await response.json();

  return result;
};
