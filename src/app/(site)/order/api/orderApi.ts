import {
  CreateOrderRequest,
  CreateOrderApiResponse,
  OrderDetailApiResponse,
} from '../types/order.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * 주문 생성 (결제 페이지에서 호출)
 */
export const createOrder = async (
  orderData: CreateOrderRequest,
): Promise<CreateOrderApiResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    throw new Error('주문 생성에 실패했습니다.');
  }

  return response.json();
};

/**
 * 주문 상세 조회
 */
export const getOrder = async (
  orderId: number,
): Promise<OrderDetailApiResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('주문 조회에 실패했습니다.');
  }

  return response.json();
};
