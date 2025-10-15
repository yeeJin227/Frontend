// ========== API 응답 타입 ==========

export interface CartItemResponse {
  cartId: number;
  productId: number;
  productName: string;
  productImageUrl: string;
  price: number;
  quantity: number;
  optionInfo: string;
  isSelected: boolean;
  cartType: string; // 'NORMAL' | 'FUNDING'
  createdAt: string;
}

export interface CartDataResponse {
  normalCartItems: CartItemResponse[];
  fundingCartItems: CartItemResponse[];
  totalNormalQuantity: number;
  totalFundingQuantity: number;
  totalNormalAmount: number;
  totalFundingAmount: number;
}

export interface CartApiResponse {
  resultCode: string;
  msg: string;
  data: CartDataResponse;
}

// ========== UI 타입 ==========

export interface CartItem {
  id: number;
  name: string;
  option: string;
  price: number;
  quantity: number;
  image: string;
  isChecked: boolean;
  isRegular: boolean;
}

// ========== Mutation 요청 타입 ==========

export interface UpdateQuantityRequest {
  quantity: number;
}

// ========== 장바구니 검증 응답 타입 ==========

export interface CartValidationResponse {
  isValid: boolean;
  invalidItems?: Array<{
    cartId: number;
    productName: string;
    reason: string; // '재고 부족', '판매 중단' 등
  }>;
}

export interface CartValidationApiResponse {
  resultCode: string;
  msg: string;
  data: CartValidationResponse;
}

// ========== 장바구니 총액 응답 타입 ==========

export interface CartTotalAmountResponse {
  totalProductAmount: number;
  totalShippingFee: number;
  totalAmount: number;
  itemCount: number;
}

export interface CartTotalAmountApiResponse {
  resultCode: string;
  msg: string;
  data: CartTotalAmountResponse;
}

// ========== 공통 응답 타입 ==========

export interface ApiResponse<T = unknown> {
  resultCode: string;
  msg: string;
  data?: T;
}
