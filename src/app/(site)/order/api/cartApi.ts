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
  console.log('API 호출 URL:', `${API_BASE_URL}/api/cart`);

  const response = await fetch(`${API_BASE_URL}/api/cart`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // 쿠키 포함
  });

  console.log('응답 상태:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('에러 응답:', errorText);
    throw new Error('장바구니 조회에 실패했습니다.');
  }

  const data = await response.json();
  console.log('장바구니 데이터:', data);
  return data;
};

/**
 * 선택된 장바구니 아이템 조회
 */
export const getCartSelected = async (): Promise<CartApiResponse> => {
  console.log('API 호출 URL:', `${API_BASE_URL}/api/cart/selected`);

  const response = await fetch(`${API_BASE_URL}/api/cart/selected`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  console.log('응답 상태:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('에러 응답:', errorText);
    throw new Error('선택된 장바구니 조회에 실패했습니다.');
  }

  const data = await response.json();
  console.log('선택된 장바구니 데이터:', data);
  return data;
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
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
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
  const response = await fetch(
    `${API_BASE_URL}/api/cart/${cartId}/quantity?quantity=${quantity}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    },
  );

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
