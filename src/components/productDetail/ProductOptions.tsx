'use client';

import FilterArrowOpen from "@/assets/icon/filterarrowopen.svg";
import ArrowClose from "@/assets/icon/arrowclose.svg";
import Heart from "@/assets/icon/heart.svg";
import X from "@/assets/icon/x.svg";
import { useEffect, useRef, useState } from "react";
import { addToWishlist, removeFromWishlist } from "@/services/wishlist";
import { addToCart } from "@/services/cart";

type Option = {
  id: string;
  label: string;
  price: number;
  count?: number;
};

const OPTIONS: Option[] = [
  { id: "opt1", label: "상품옵션 1", price: 8000 },
  { id: "opt2", label: "상품옵션 2", price: 10000 },
  { id: "opt3", label: "상품옵션 3", price: 10000 },
];

type Props = {
  productUuid?: string;
};

export default function ProductOptions({ productUuid }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [selectedValue, setSelectedValue] = useState<Option[]>([]);
  const [isWish, setIsWish] = useState(false);
  const [loading, setLoading] = useState(false);

  // 외부 클릭 시 드롭다운 닫기

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const root = rootRef.current;
      if (root && !root.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  // 옵션 선택
  const onPick = (id: string) => {
    const option = OPTIONS.find((item) => item.id === id);
    if (!option) return;
    setSelectedValue((prev) => {
      const exist = prev.find((item) => item.id === id);
      if (exist) {
        return prev.map((item) =>
          item.id === id ? { ...item, count: item.count! + 1 } : item
        );
      }
      return [...prev, { ...option, count: 1 }];
    });
    setOpen(false);
  };

  const removeOption = (id: string) => {
    setSelectedValue((prev) => prev.filter((item) => item.id !== id));
  };

  const totalPrice = selectedValue.reduce(
    (sum, item) => sum + item.price * item.count!,
    0
  );

  // 찜
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
            method: "POST",
            credentials: "include",
          }
        );
        if (res.status === 409) {
          setIsWish(true);
          return;
        }
        if (!res.ok) throw new Error("찜 등록 실패");
        setIsWish(true);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "찜 처리 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  // 장바구니 추가
  const handleAddToCart = async () => {
    if (!productUuid) return alert("상품 정보가 없습니다.");
    if (selectedValue.length === 0) return alert("옵션을 선택해주세요.");
    try {
      const first = selectedValue[0];
      await addToCart({
        productUuid,
        quantity: first.count ?? 1,
        optionInfo: first.label,
        cartType: "NORMAL",
      });
      alert("장바구니에 상품이 추가되었습니다!");
    } catch (e) {
      alert(e instanceof Error ? e.message : "장바구니 추가 실패");
    }
  };

  // 바로구매
  const handleBuyNow = () => {
    alert("바로구매 기능은 현재 준비 중입니다.");
  };

  return (
    <div>
      <div className="my-5 border-y py-5">
        {/* 드롭다운 */}
        <div ref={rootRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex justify-between items-center w-full rounded-md border border-primary bg-white px-3 py-4 text-left cursor-pointer transition hover:bg-primary-20"
          >
            <span>상품을 선택해주세요</span>
            {open ? <ArrowClose /> : <FilterArrowOpen />}
          </button>

          {open && (
            <div className="absolute left-0 right-0 z-50 mt-2 rounded-md border border-primary bg-white">
              <ul className="max-h-64 overflow-auto py-1">
                {OPTIONS.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onPick(item.id)}
                      className="w-full px-3 py-3 text-left cursor-pointer hover:bg-gray-50 transition"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 선택된 옵션 리스트 */}
        <div className="mt-4 space-y-2.5 overflow-auto max-h-[220px]">
          {selectedValue.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-5"
            >
              <span className="font-semibold">{item.label}</span>
              <div className="flex items-center gap-4">
                <span>{item.count}개</span>
                <span>{(item.price * item.count!).toLocaleString()}원</span>
                <button
                  type="button"
                  onClick={() => removeOption(item.id)}
                  className="flex items-center justify-center text-gray-300 cursor-pointer"
                >
                  <X width={16} height={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 총 금액 + 버튼 */}
      <div>
        <div className="flex justify-between px-4 py-6">
          <span>총 상품 금액</span>
          <span className="text-danger font-semibold">
            {totalPrice.toLocaleString()}원
          </span>
        </div>

        <div className="flex justify-center gap-4">
          {/* 장바구니 */}
          <button
            className="border border-primary rounded-sm px-5 py-3.5 cursor-pointer hover:bg-primary-20 transition"
            onClick={handleAddToCart}
          >
            장바구니
          </button>

          {/* 바로구매  */}
          <button
            className="border border-primary rounded-sm px-5 py-3.5 cursor-pointer hover:bg-primary-20 transition"
            onClick={handleBuyNow}
          >
            바로구매
          </button>

          {/* 찜 */}
          <button
            type="button"
            onClick={handleWishToggle}
            disabled={loading}
            className={`border border-primary rounded-sm px-5 py-3.5 cursor-pointer transition ${
              isWish ? "bg-primary text-white" : "hover:bg-primary-20"
            }`}
          >
            <Heart
              className={isWish ? "fill-red-500" : "fill-none"}
              width={16}
              height={16}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
