import {
  CartApiResponse,
  UpdateQuantityRequest,
  ApiResponse,
} from '../types/cart.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * 장바구니 전체 조회
 */
export const getCart = async (): Promise<CartApiResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/cart`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // 쿠키 포함
  });

  if (!response.ok) {
    throw new Error('장바구니 조회에 실패했습니다.');
  }

  return response.json();
};

/**
 * 장바구니 아이템 선택 상태 토글
 */
export const toggleCartItemSelection = async (
  cartId: number,
): Promise<ApiResponse<void>> => {
  const response = await fetch(
    `${API_BASE_URL}/api/cart/${cartId}/toggle-selection`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error('선택 상태 변경에 실패했습니다.');
  }

  return response.json();
};

/**
 * 장바구니 아이템 수량 수정
 */
export const updateCartItemQuantity = async (
  cartId: number,
  quantity: number,
): Promise<ApiResponse<void>> => {
  const body: UpdateQuantityRequest = { quantity };

  const response = await fetch(`${API_BASE_URL}/api/cart/${cartId}/quantity`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('수량 변경에 실패했습니다.');
  }

  return response.json();
};

/**
 * 장바구니 아이템 삭제
 */
export const deleteCartItem = async (
  cartId: number,
): Promise<ApiResponse<void>> => {
  const response = await fetch(`${API_BASE_URL}/api/cart/${cartId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('장바구니 삭제에 실패했습니다.');
  }

  return response.json();
};
