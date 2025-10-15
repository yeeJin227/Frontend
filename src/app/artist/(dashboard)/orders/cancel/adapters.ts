

import type { ArtistCancellationRequest } from '@/types/artistDashboard';

export type CancelRow = {
  id: string;          // 주문번호
  statusText: string;  // 상품명
  buyer: string;       // "닉네임 / id"
  requestState: string;// 상태(한글)
  requestAt: string;   // YYYY-MM-DD
};

const toDateOnly = (isoOrDate?: string): string => {
  if (!isoOrDate) return '-';
  const d = isoOrDate.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '-';
};

export function toRow(item: ArtistCancellationRequest): CancelRow {
  return {
    id: item.orderNumber || item.orderId || '-',
    statusText: item.orderItem?.productName || '-',
    buyer: `${item.customer?.nickname ?? '-'} / ${
      item.customer?.id !== undefined ? String(item.customer.id) : '-'
    }`,
    requestState: item.statusText || item.status || '-',
    requestAt: toDateOnly(item.requestDate),
  };
}
