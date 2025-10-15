

export async function addToWishlist(productUuid: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/wishlist/${productUuid}`,
    {
      method: 'POST',
      credentials: 'include', // 로그인 세션 유지
    },
  );

  if (!res.ok) throw new Error('찜 등록 실패');
  const json = await res.json();
  return json.data as string; // 반환되는 UUID
}

export async function removeFromWishlist(productUuid: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/wishlist/${productUuid}`,
    {
      method: 'DELETE',
      credentials: 'include',
    },
  );

  if (!res.ok) throw new Error('찜 삭제 실패');
  const json = await res.json();
  return json.data as string;
}
