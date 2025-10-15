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

export interface OrderItemDetail {
  orderItemId: number;
  productUuid: string;
  productName: string;
  productThumbnailUrl: string;
  quantity: number;
  price: number;
  totalPrice: number;
  optionInfo: string;
}

export interface OrderDetail {
  orderId: number;
  orderNumber: string;
  status: 'PAYMENT_COMPLETED' | 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  totalQuantity: number;
  totalAmount: number;
  shippingFee: number;
  finalAmount: number;
  shippingAddress1: string;
  shippingAddress2: string;
  shippingZip: string;
  recipientName: string;
  recipientPhone: string;
  deliveryRequest: string;
  paymentMethod: 'MORI_CASH';
  orderDate: string;
  orderItems: OrderItemDetail[];
}

export interface OrderDetailApiResponse {
  resultCode: string;
  msg: string;
  data: OrderDetail;
}
