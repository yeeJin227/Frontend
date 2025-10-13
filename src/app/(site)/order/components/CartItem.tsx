'use client';

import React from 'react';
import {
  useToggleCartItem,
  useUpdateCartQuantity,
  useDeleteCartItem,
} from '../hooks/useCart';
import { CartItem as CartItemType } from '../types/cart.types';

interface CartItemProps {
  item: CartItemType;
}

const CartItem = ({ item }: CartItemProps) => {
  const toggleMutation = useToggleCartItem();
  const updateQuantityMutation = useUpdateCartQuantity();
  const deleteMutation = useDeleteCartItem();

  const handleQuantityUpdate = (change: number) => {
    const newQuantity = Math.max(0, item.quantity + change);
    updateQuantityMutation.mutate({
      cartId: item.id,
      quantity: newQuantity,
    });
  };

  const handleToggle = () => {
    toggleMutation.mutate(item.id);
  };

  const handleDelete = () => {
    deleteMutation.mutate(item.id);
  };

  return (
    <div className="border-b border-gray-300 bg-white">
      <div className="flex items-center py-6 px-4">
        {/* 체크박스 */}
        <div className="mr-6">
          <input
            type="checkbox"
            checked={item.isChecked}
            onChange={handleToggle}
            className="w-5 h-5 text-primary bg-gray-100 border-gray-300 rounded"
          />
        </div>

        {/* 상품 이미지 */}
        <div className="w-[150px] h-[150px] bg-gray-200 rounded-lg mr-8 overflow-hidden">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
              상품 이미지
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div className="flex-1 mr-8">
          <h3 className="text-gray-800 font-semibold text-base leading-tight mb-2">
            {item.name}
          </h3>
          <p className="text-gray-500 text-sm">옵션 : {item.option}</p>
        </div>

        {/* 가격 */}
        <div className="w-24 text-center mr-12">
          <div className="text-2xl font-bold text-gray-800">
            {item.price.toLocaleString()}원
          </div>
        </div>

        {/* 삭제 버튼 */}
        <div className="mr-4">
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 text-xl disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* 수량 조절 */}
        <div className="flex items-center border border-gray-300 rounded w-[103px]">
          <button
            onClick={() => handleQuantityUpdate(-1)}
            disabled={updateQuantityMutation.isPending || item.quantity <= 0}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
          >
            -
          </button>
          <span className="flex-1 text-center py-2">{item.quantity}</span>
          <button
            onClick={() => handleQuantityUpdate(1)}
            disabled={updateQuantityMutation.isPending}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
