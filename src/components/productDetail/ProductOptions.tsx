'use client';

import FilterArrowOpen from '@/assets/icon/filterarrowopen.svg';
import ArrowClose from '@/assets/icon/arrowclose.svg';
import FullHeart from '@/assets/icon/full_heart.svg';
import LineFullHeart from '@/assets/icon/full_heart_line.svg';
import X from '@/assets/icon/x.svg';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { addToWishlist, removeFromWishlist } from '@/services/wishlist';
import { addToCart } from '@/services/cart';
import type {
  AdditionalProductResponse,
  OptionResponse,
} from '@/types/product';

type DropdownItem = {
  id: string;
  label: string;
  unitPrice: number;
  maxCount: number;
  kind: 'OPTION' | 'ADDITIONAL';
};

type SelectedItem = DropdownItem & { count: number };

type Props = {
  productUuid?: string;
  basePrice?: number;
  options?: OptionResponse[];
  additionals?: AdditionalProductResponse[];
};

const formatPrice = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export default function ProductOptions({
  productUuid,
  basePrice,
  options,
  additionals,
}: Props) {
  const [openDropdown, setOpenDropdown] = useState<null | 'option' | 'addon'>(
    null,
  );
  const optionRef = useRef<HTMLDivElement>(null);
  const addonRef = useRef<HTMLDivElement>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isWish, setIsWish] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!openDropdown) return;
    const handlePointer = (e: PointerEvent) => {
      const optionNode = optionRef.current;
      const addonNode = addonRef.current;
      const target = e.target as Node;
      if (
        (optionNode && optionNode.contains(target)) ||
        (addonNode && addonNode.contains(target))
      ) {
        return;
      }
      setOpenDropdown(null);
    };
    document.addEventListener('pointerdown', handlePointer, true);
    return () =>
      document.removeEventListener('pointerdown', handlePointer, true);
  }, [openDropdown]);

  const baseUnitPrice = useMemo(() => Math.max(0, basePrice ?? 0), [basePrice]);

  const optionItems = useMemo<DropdownItem[]>(
    () =>
      (options ?? []).map((opt, idx) => ({
        id: `option-${idx}`,
        label: opt.optionName,
        unitPrice: baseUnitPrice + Math.max(0, opt.optionAdditionalPrice ?? 0),
        maxCount: opt.optionStock ?? 0,
        kind: 'OPTION' as const,
      })),
    [options, baseUnitPrice],
  );

  const addonItems = useMemo<DropdownItem[]>(
    () =>
      (additionals ?? []).map((item, idx) => ({
        id: `addon-${idx}`,
        label: item.name,
        unitPrice: Math.max(0, item.price ?? 0),
        maxCount: item.stock ?? 0,
        kind: 'ADDITIONAL' as const,
      })),
    [additionals],
  );

  const handleSelectItem = (item: DropdownItem) => {
    if (item.maxCount !== undefined && item.maxCount <= 0) {
      alert('재고가 없습니다.');
      return;
    }
    setSelectedItems((prev) => {
      const exist = prev.find((p) => p.id === item.id);
      if (exist) {
        if (exist.maxCount > 0 && exist.count >= exist.maxCount) {
          alert('더 이상 추가할 수 없습니다.');
          return prev;
        }
        return prev.map((p) =>
          p.id === item.id ? { ...p, count: p.count + 1 } : p,
        );
      }
      return [...prev, { ...item, count: 1 }];
    });
    setOpenDropdown(null);
  };

  const removeItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const hasSelectableItems =
    optionItems.length > 0 || addonItems.length > 0;

  const fallbackBaseItem: SelectedItem | null = hasSelectableItems
    ? null
    : {
        id: 'base',
        label: '기본 상품',
        unitPrice: baseUnitPrice,
        maxCount: 0,
        kind: 'OPTION',
        count: 1,
      };

  const totalPrice = selectedItems.length
    ? selectedItems.reduce((sum, item) => sum + item.unitPrice * item.count, 0)
    : fallbackBaseItem
    ? fallbackBaseItem.unitPrice
    : 0;

  const handleWishToggle = async () => {
    if (!productUuid || loading) return;
    setLoading(true);
    try {
      if (isWish) {
        await removeFromWishlist(productUuid);
        setIsWish(false);
      } else {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/wishlist/${productUuid}`,
          {
            method: 'POST',
            credentials: 'include',
          },
        );
        if (res.status === 409) {
          setIsWish(true);
          return;
        }
        if (!res.ok) throw new Error('찜 등록 실패');
        setIsWish(true);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : '찜 처리 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!productUuid) return alert('상품 정보를 불러오지 못했습니다.');
    const itemsForCart =
      selectedItems.length > 0
        ? selectedItems
        : fallbackBaseItem
        ? [fallbackBaseItem]
        : [];
    if (!itemsForCart.length)
      return alert('구매할 옵션 또는 추가상품을 선택해주세요.');
    try {
      const quantity = itemsForCart.reduce((sum, item) => sum + item.count, 0);
      const optionInfo = itemsForCart
        .map((item) => `${item.label} x ${item.count}`)
        .join(', ');
      await addToCart({
        productUuid,
        quantity,
        optionInfo,
        cartType: 'NORMAL',
      });
      alert('장바구니에 상품이 추가되었습니다!');
    } catch (e) {
      alert(e instanceof Error ? e.message : '장바구니 추가 실패');
    }
  };

  const handleBuyNow = () => {
    alert('바로구매 기능은 현재 준비 중입니다.');
  };

  const renderDropdown = (
    items: DropdownItem[],
    label: string,
    type: 'option' | 'addon',
    ref: RefObject<HTMLDivElement>,
  ) => {
    if (!items.length) return null;
    const isOpen = openDropdown === type;
    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpenDropdown(isOpen ? null : type)}
          className="flex justify-between items-center w-full rounded-md border border-primary bg-white px-3 py-4 text-left cursor-pointer transition hover:bg-primary-20"
        >
          <span>{label}</span>
          {isOpen ? <ArrowClose /> : <FilterArrowOpen />}
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 z-50 mt-2 rounded-md border border-primary bg-white">
            <ul className="max-h-64 overflow-auto py-1">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    className="w-full px-3 py-3 text-left cursor-pointer hover:bg-gray-50 transition flex flex-col gap-0.5"
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-gray-500">
                      {formatPrice(item.unitPrice)}
                      {item.maxCount === 0 && ' · 품절'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="my-5 border-y py-5 space-y-4">
        {renderDropdown(
          optionItems,
          '상품 옵션을 선택해주세요',
          'option',
          optionRef,
        )}
        {renderDropdown(
          addonItems,
          '추가상품을 선택해주세요',
          'addon',
          addonRef,
        )}
        {!optionItems.length && !addonItems.length && (
          <p className="text-sm text-gray-500">선택 가능한 옵션이 없습니다.</p>
        )}

        <div className="mt-4 space-y-2.5 overflow-auto max-h-[220px]">
          {selectedItems.length === 0 ? (
            hasSelectableItems ? (
              <p className="text-sm text-gray-500">
                선택한 옵션/추가상품이 없습니다.
              </p>
            ) : (
              <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-5">
                <div>
                  <span className="font-semibold">기본 상품</span>
                  <span className="ml-2 text-xs text-gray-400">옵션 없음</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>1개</span>
                  <span>{formatPrice(baseUnitPrice)}</span>
                </div>
              </div>
            )
          ) : (
            selectedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-5"
              >
                <div>
                  <span className="font-semibold">{item.label}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {item.kind === 'OPTION' ? '옵션' : '추가상품'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span>{item.count}개</span>
                  <span>{formatPrice(item.unitPrice * item.count)}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="flex items-center justify-center text-gray-300 cursor-pointer"
                  >
                    <X width={16} height={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <div className="flex justify-between px-4 py-6">
          <span>총 상품 금액</span>
          <span className="text-danger font-semibold">
            {formatPrice(totalPrice)}
          </span>
        </div>

        <div className="flex justify-center gap-4">
          <button
            className="border border-primary rounded-sm px-5 py-3.5 cursor-pointer hover:bg-primary-20 transition"
            onClick={handleAddToCart}
          >
            장바구니
          </button>

          <button
            className="bg-primary text-white rounded-sm px-5 py-3.5 cursor-pointer hover:bg-primary-dark transition"
            onClick={handleBuyNow}
          >
            구매하기
          </button>

          <button
            type="button"
            onClick={handleWishToggle}
            className={`border border-primary rounded-sm px-5 py-3.5 flex items-center gap-1 transition `}
          >
            {isWish ? <FullHeart /> : <LineFullHeart />}
          </button>
        </div>
      </div>
    </div>
  );
}
