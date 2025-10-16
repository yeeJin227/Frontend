import { CartItemResponse, CartItem } from './cart.types';

/**
 * API 응답을 UI 타입으로 변환
 */
export const mapCartItemResponseToCartItem = (
  item: CartItemResponse,
): CartItem => {
  return {
    id: item.cartId,
    name: item.productName,
    option: item.optionInfo || '옵션 없음',
    price:
      item.cartType === 'FUNDING'
        ? item.fundingPrice || item.price
        : item.price,
    quantity: item.quantity,
    image: item.productImageUrl,
    isChecked: item.isSelected,
    isRegular: item.cartType === 'NORMAL',
  };
};

/**
 * API 응답 배열을 UI 타입 배열로 변환
 */
export const mapCartItemsResponseToCartItems = (
  items: CartItemResponse[],
): CartItem[] => {
  return items.map(mapCartItemResponseToCartItem);
};
