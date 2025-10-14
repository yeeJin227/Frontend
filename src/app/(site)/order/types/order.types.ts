// ========== 주문 생성 요청 타입 ==========

export interface OrderItemRequest {
  productUuid: string;
  quantity: number;
  optionInfo: string;
}

export interface CreateOrderRequest {
  orderItems: OrderItemRequest[];
  shippingAddress1: string;
  shippingAddress2: string;
  shippingZip: string;
  recipientName: string;
  recipientPhone: string; // "010-5085-7633" 형식
  deliveryRequest: string;
  paymentMethod: 'MORI_CASH';
}

// ========== 주문 생성 응답 타입 ==========

export interface CreateOrderResponse {
  orderId: number;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED';
  totalAmount: number;
  createdAt: string;
}

export interface CreateOrderApiResponse {
  resultCode: string;
  msg: string;
  data: CreateOrderResponse;
}

// ========== 주문 상세 조회 응답 타입 ==========

export interface OrderItemResponse {
  orderItemId: number;
  productId: number;
  productName: string;
  productImageUrl: string;
  price: number;
  quantity: number;
  optionInfo: string;
}

export interface OrderDetailResponse {
  orderId: number;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED';
  totalAmount: number;
  shippingFee: number;
  items: OrderItemResponse[];
  createdAt: string;
}

export interface OrderDetailApiResponse {
  resultCode: string;
  msg: string;
  data: OrderDetailResponse;
}
