import type { ArtistOrder } from '@/types/artistDashboard';

export type OrderRow = {
  id: string;         // 주문번호
  orderId: number;    // 실제 API용 ID
  statusText: string; // 상품명 요약
  buyer: string;      // "이름 / 닉네임(or id)"
  orderState: string; // 상태 한글
  requestAt: string;  // YYYY-MM-DD
  orderItemIds?: number[]; // 취소 대상 상품 ID 리스트
};

const toDateOnly = (isoOrDate?: string): string => {
  if (!isoOrDate) return '-';
  const d = isoOrDate.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '-';
};

export function toRow(item: ArtistOrder): OrderRow {
  const buyerRight =
    (item.buyer?.nickname && String(item.buyer.nickname)) ||
    (item.buyer?.id !== undefined ? String(item.buyer.id) : '');

  const product =
    item.itemCount && item.itemCount > 1
      ? `${item.productSummary} 외 ${item.itemCount - 1}개`
      : item.productSummary || '-';

  const orderItemIds =
    item.orderItems?.map((it) => it.orderItemId) ?? [];

  return {
    id: item.orderNumber || '-',          // UI 표시용
    orderId: Number(item.orderId) || 0,   // API 전송용
    statusText: product,
    buyer: `${item.buyer?.name ?? '-'} / ${buyerRight || '-'}`,
    orderState: item.statusText || item.status || '-',
    requestAt: toDateOnly(item.orderDate),
    orderItemIds,
  };
}
