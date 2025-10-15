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

/*
{
  "orderItems": [
    {
      "productUuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "quantity": 0,
      "optionInfo": "string"
    }
  ],
  "shippingAddress1": "string",
  "shippingAddress2": "string",
  "shippingZip": "string",
  "recipientName": "string",
  "recipientPhone": "010-2279-9289",
  "deliveryRequest": "string",
  "paymentMethod": "MORI_CASH"
}
*/
