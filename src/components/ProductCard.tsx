'use client'

import Star from "@/assets/icon/star.svg";
import Image from "next/image";

type ProductProps = {
  img?: string | null;
  title: string;
  brand: string;
  discount?: string;
  price: string;
  originalPrice?: string;
  rating: string;
};

export default function ProductCard({
  img,
  title,
  brand,
  discount,
  price,
  originalPrice,
  rating,
}: ProductProps) {
  const hasDiscount = !!discount;
  const validSrc = img && img.trim().length > 0 ? img : null;

  return (
    <article>
      <div>
        <div className="relative z-0 w-full aspect-square overflow-hidden rounded">
          {validSrc ? (
            <Image
              src={validSrc}
              alt={title}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
              priority={false}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 grid place-items-center text-xs text-gray-400">
              이미지 준비중…
            </div>
          )}
        </div>

        <p className="text-gray-300 mt-5">{brand}</p>
        <p className="text-[18px] mt-1">{title}</p>

        <div className="flex flex-wrap items-center mt-2">
          {hasDiscount ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[16px] font-bold text-primary">{discount}</span>
              <span className="text-[18px] font-bold">{price}</span>
              <span className="text-[16px] mr-2 text-gray-300 line-through">
                {originalPrice}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[22px] font-bold">{price}</span>
            </div>
          )}
        </div>

        <div className="flex items-center">
          <Star />
          <span className="mx-2 text-[18px]">{rating}</span>
        </div>
      </div>
    </article>
  );
}
