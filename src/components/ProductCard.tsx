'use client'

import Star from "@/assets/icon/star.svg";
import Image from "next/image";

type ProductProps = {
    img:string;
    title:string;
    brand:string;
    discount?:string;
    price:string;
    originalPrice?:string;
    rating:string
};


export default function ProductCard({
    img,title,brand,discount,price,originalPrice,rating
}:ProductProps) {
const hasDiscount = !!discount;

  return (
    <article>
        <div>
            <Image 
                src={img}
                alt={title}
                width={230}
                height={230}
                className="w-[230px] h-[230px]"
            />
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
                // 할인율 없을 때
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
    )
}

