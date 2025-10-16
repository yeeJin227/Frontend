export interface MoricashBalance {
  balanceId: number;
  userId: number;
  totalBalance: number;
  availableBalance: number;
  frozenBalance: number;
  totalCharged: number;
  totalUsed: number;
}

export interface MoricashBalanceResponse {
  resultCode: string;
  msg: string;
  data: MoricashBalance;
}

export interface MoriCashPaymentRequest {
  orderId: number;
  totalPrice: number;
  usedMoriCash: number;
}

export interface MoriCashPaymentResponseData {
  paymentId: number;
  orderId: number;
  userId: number;
  totalPrice: number;
  usedMoriCash: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  cashTransactionId: string;
  balanceAfter: number;
  transactionType: 'CHARGING' | 'PAYMENT';
  description: string;
  paidAt: string;
  createdAt: string;
}

// API 응답 구조 (성공 및 실패 모두를 포함할 수 있는 일반적인 구조)
export interface ApiResponse<T> {
  resultCode: string;
  msg: string;
  data: T | null;
}
