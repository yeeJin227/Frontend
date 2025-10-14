'use client';

import { useState } from 'react';
import ProductInfo from './ProductInfo';
import ArtistInfo from './ArtistInfo';
import QuestionInfo from './QnaInfo';
import ReviewInfo from './ReviewInfo';
import type { ProductDetail } from '@/types/product';

const TABS = ['상품 정보', '작가 정보', '상품 Q&A', '리뷰'];

type Props = {
  // 리뷰/통계 API용 숫자 ID (삭제 예정) - 임시
  productId?: number;
  // 상품 상세 데이터 
  product?: ProductDetail;
};

export default function InfoTab({ productId, product }: Props) {
  const [activeTab, setActiveTab] = useState('상품 정보');

  return (
    <div className="mt-10 px-6">
      {/* 탭 버튼 */}
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
        {activeTab === '작가 정보' && (
          <ArtistInfo productUuid={product?.productUuid} />
        )}
        {activeTab === '상품 Q&A' && <QuestionInfo />}
        {activeTab === '리뷰' && <ReviewInfo productId={productId} />}
      </div>
    </div>
  );
}
