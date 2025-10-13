import type { ArtistOrderResponseDTO } from '@/types/artistDashboard';

export type OrderRow = {
  id: string;         // 주문번호
  statusText: string; // 상품명 요약
  buyer: string;      // "이름 / 닉네임(or id)"
  orderState: string; // 상태 한글(= statusText)
  requestAt: string;  // YYYY-MM-DD
};


export function toRow(item: ArtistOrderResponseDTO.Order): OrderRow {
  const buyerRight = item.buyer?.nickname || String(item.buyer?.id ?? '');
  const product = item.itemCount > 1
    ? `${item.productSummary} 외 ${item.itemCount - 1}개`
    : item.productSummary;

  const date = (item.orderDate ?? '').slice(0, 10);

  return {
    id: item.orderNumber,
    statusText: product,
    buyer: `${item.buyer?.name ?? '-'} / ${buyerRight || '-'}`,
    orderState: item.statusText || item.status || '-',
    requestAt: date,
  };
}
