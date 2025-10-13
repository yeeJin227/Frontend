
'use client';

import { useState } from 'react';
import ProductInfo from './ProductInfo';
import ArtistInfo from './ArtistInfo';
import QuestionInfo from './QnaInfo';
import ReviewInfo from './ReviewInfo';
import type { ProductDetail } from '@/types/product';

const TABS = ['상품 정보', '작가 정보', '상품 Q&A', '리뷰'];

export default function InfoTab({ product }: { product?: ProductDetail }) {
  const [activeTab, setActiveTab] = useState('상품 정보');

  return (
    <div className="mt-10 px-6">
      <div className="flex max-w-[1200px] mx-auto border border-tertiary">
        {TABS.map((item) => (
          <button
            key={item}
            onClick={() => setActiveTab(item)}
            className={`cursor-pointer flex-1 py-3 font-semibold text-tertiary ${
              activeTab === item ? 'text-white bg-tertiary' : ''
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <div className="max-w-[1200px] mx-auto">
        {activeTab === '상품 정보' && <ProductInfo product={product} />}
        {activeTab === '작가 정보' && <ArtistInfo productUuid={product?.productUuid} />}
        {activeTab === '상품 Q&A' && <QuestionInfo />}
        {activeTab === '리뷰' && <ReviewInfo />}
      </div>
    </div>
  );
}
