
export type AddToCartPayload = {
  productUuid: string;
  quantity: number;
  optionInfo?: string;
  cartType?: 'NORMAL' | 'FUNDING';
};

export async function addToCart(payload: AddToCartPayload) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // 로그인 세션 유지
      body: JSON.stringify({
        ...payload,
        cartType: payload.cartType ?? 'NORMAL',
      }),
    },
  );

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`장바구니 추가 실패: ${msg}`);
  }

  const json = await res.json();
  return json.data; 
}
