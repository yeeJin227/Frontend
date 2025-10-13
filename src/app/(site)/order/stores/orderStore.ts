import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ShippingInfo {
  name: string;
  phone: string;
  address: string;
  detailAddress: string;
  zipCode: string;
}

interface OrderState {
  // 배송 정보
  shippingInfo: ShippingInfo | null;

  // 결제 정보
  paymentMethod: 'card' | 'bank' | 'kakao' | null;

  // 주문 완료 정보
  orderId: string | null;

  // Actions
  setShippingInfo: (info: ShippingInfo) => void;
  setPaymentMethod: (method: 'card' | 'bank' | 'kakao' | null) => void;
  completeOrder: (orderId: string) => void;
  clearOrder: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      shippingInfo: null,
      paymentMethod: null,
      orderId: null,

      setShippingInfo: (info) => set({ shippingInfo: info }),

      setPaymentMethod: (method) => set({ paymentMethod: method }),

      completeOrder: (orderId) => set({ orderId }),

      clearOrder: () =>
        set({
          shippingInfo: null,
          paymentMethod: null,
          orderId: null,
        }),
    }),
    {
      name: 'order-storage',
      partialize: (state) => ({
        shippingInfo: state.shippingInfo, // 배송 정보만 persist
      }),
    },
  ),
);
