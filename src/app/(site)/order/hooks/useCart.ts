import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCart,
  toggleCartItemSelection,
  updateCartItemQuantity,
  deleteCartItem,
} from '../api/cartApi';
import { mapCartItemsResponseToCartItems } from '../types/mapper';
import { CartItem, CartApiResponse } from '../types/cart.types';

const CART_QUERY_KEY = ['cart'];

/**
 * 장바구니 데이터 조회 훅
 */
export const useCart = () => {
  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: getCart,
    staleTime: 0, // 항상 최신 데이터 유지
    select: (data) => {
      // API 응답을 UI에서 사용하기 쉽게 변환
      const normalItems = mapCartItemsResponseToCartItems(
        data.data.normalCartItems,
      );
      const fundingItems = mapCartItemsResponseToCartItems(
        data.data.fundingCartItems,
      );

      console.log(
        `일반 장바구니 : ${normalItems}\n펀딩 장바구니 :${fundingItems}`,
      );
      return {
        normalItems,
        fundingItems,
        allItems: [...normalItems, ...fundingItems],
        totalNormalQuantity: data.data.totalNormalQuantity,
        totalFundingQuantity: data.data.totalFundingQuantity,
        totalNormalAmount: data.data.totalNormalAmount,
        totalFundingAmount: data.data.totalFundingAmount,
      };
    },
  });
};

/**
 * 장바구니 아이템 선택 토글 훅 (낙관적 업데이트)
 */
export const useToggleCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleCartItemSelection,
    onMutate: async (cartId: number) => {
      // 진행 중인 refetch 취소
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });

      // 이전 데이터 저장
      const previousData =
        queryClient.getQueryData<CartApiResponse>(CART_QUERY_KEY);

      // 낙관적 업데이트
      queryClient.setQueryData<CartApiResponse>(CART_QUERY_KEY, (old) => {
        if (!old) return old;

        const updateItems = (items: typeof old.data.normalCartItems) =>
          items.map((item) =>
            item.cartId === cartId
              ? { ...item, isSelected: !item.isSelected }
              : item,
          );

        return {
          ...old,
          data: {
            ...old.data,
            normalCartItems: updateItems(old.data.normalCartItems),
            fundingCartItems: updateItems(old.data.fundingCartItems),
          },
        };
      });

      return { previousData };
    },
    onError: (err, cartId, context) => {
      // 에러 발생 시 이전 데이터로 롤백
      if (context?.previousData) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousData);
      }
    },
    onSettled: () => {
      // 완료 후 최신 데이터로 refetch
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
};

/**
 * 장바구니 아이템 수량 수정 훅 (낙관적 업데이트)
 */
export const useUpdateCartQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartId, quantity }: { cartId: number; quantity: number }) =>
      updateCartItemQuantity(cartId, quantity),
    onMutate: async ({ cartId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });

      const previousData =
        queryClient.getQueryData<CartApiResponse>(CART_QUERY_KEY);

      queryClient.setQueryData<CartApiResponse>(CART_QUERY_KEY, (old) => {
        if (!old) return old;

        const updateItems = (items: typeof old.data.normalCartItems) =>
          items.map((item) =>
            item.cartId === cartId ? { ...item, quantity } : item,
          );

        return {
          ...old,
          data: {
            ...old.data,
            normalCartItems: updateItems(old.data.normalCartItems),
            fundingCartItems: updateItems(old.data.fundingCartItems),
          },
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
};

/**
 * 장바구니 아이템 삭제 훅 (낙관적 업데이트)
 */
export const useDeleteCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCartItem,
    onMutate: async (cartId: number) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });

      const previousData =
        queryClient.getQueryData<CartApiResponse>(CART_QUERY_KEY);

      queryClient.setQueryData<CartApiResponse>(CART_QUERY_KEY, (old) => {
        if (!old) return old;

        const filterItems = (items: typeof old.data.normalCartItems) =>
          items.filter((item) => item.cartId !== cartId);

        return {
          ...old,
          data: {
            ...old.data,
            normalCartItems: filterItems(old.data.normalCartItems),
            fundingCartItems: filterItems(old.data.fundingCartItems),
          },
        };
      });

      return { previousData };
    },
    onError: (err, cartId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
};
