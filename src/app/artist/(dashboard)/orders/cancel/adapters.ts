import { ArtistCancellationResponseDTO } from "@/types/artistDashboard";


export type CancelRow = {
  id: string;          // 주문번호
  statusText: string;  // 상품명
  buyer: string;       // "닉네임 / id"
  requestState: string;// 상태(한글)
  requestAt: string;   // YYYY-MM-DD
};

export function toRow(item: ArtistCancellationResponseDTO.CancellationRequest): CancelRow {
  const date = (item.requestDate ?? '').slice(0, 10);
  return {
    id: item.orderNumber,
    statusText: item.orderItem?.productName ?? '-',
    buyer: `${item.customer?.nickname ?? '-'} / ${item.customer?.id ?? ''}`,
    requestState: item.statusText || item.status || '-',
    requestAt: date,
  };
}
