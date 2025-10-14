
'use client';

import type { ProductDetail } from '@/types/product';
import { useMemo } from 'react';

type Spec = { label: string; value: string };

function asText(v?: unknown, fallback = '-') {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

export default function ProductInfo({ product }: { product?: ProductDetail }) {

  // 스크립트 제거
function sanitizeHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

  // 필수 정보
  const e = product?.essentialInfo;
  const SPECS: Spec[] = [
    { label: '품명 및 모델명', value: asText(e?.productModelName) },
    { label: '법령 의한 인증, 허가 확인사항', value: e ? (e.certification ? '인증' : '해당 없음') : '-' },
    { label: '제조국 또는 원산지', value: asText(e?.origin) },
    { label: '제조자', value: asText(e?.businessName, asText(product?.brandName, asText(product?.artistName))) },
    { label: '재질', value: asText(e?.material) },
    { label: '사이즈', value: asText(e?.size) },
    { label: 'A/S 책임자/전화번호', value: asText(e?.asManager) },
    { label: '사업자 등록번호', value: asText(e?.businessNumber) },
    { label: '대표자명', value: asText(e?.ownerName) },
    { label: '운영자연락처', value: asText(e?.email) },
    { label: '주소', value: asText(e?.businessAddress) },
    { label: '통신판매업신고번호', value: asText(e?.telecomSalesNumber) },
  ];

   // 에디터 HTML 
  const descriptionHtml = useMemo(() => {
    const raw = product?.description?.trim() ?? '';
    return raw ? sanitizeHtml(raw) : '<p>상품 상세 설명이 없습니다.</p>';
  }, [product?.description]);

  return (
    <section>
      <h3 className="font-semibold py-12">상품 정보</h3>

      {/* 에디터 내용 */}
      <div
        className="product-content mx-auto w-full max-w-[800px] px-2 md:px-0"
        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
      />
      <style jsx>{`
        .product-content img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 16px auto;
          border-radius: 8px;
        }
        .product-content p { margin: 10px 0; line-height: 1.7; }
        .product-content h1, .product-content h2, .product-content h3 {
          margin-top: 20px; margin-bottom: 8px; font-weight: 700;
        }
        .product-content ul, .product-content ol { padding-left: 20px; }
        .product-content table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        .product-content table th, .product-content table td {
          border: 1px solid #e5e7eb; padding: 8px;
        }
        .product-content iframe, .product-content video {
          max-width: 100%;
        }
      `}</style>

      <div className="flex items-center pt-12 pb-3">
        <h4 className="font-semibold mr-6">상품 필수 정보</h4>
        <p className="text-gray-400 text-sm">
          전자상거래 등에서의 상품정보 제공 고시에 따라 작성되었습니다.
        </p>
      </div>

      <div className="bg-gray-50 p-3">
        <dl className="grid grid-cols-2 gap-y-1">
          {SPECS.map((item) => (
            <div key={item.label} className="flex gap-2 text-gray-500 text-sm">
              <dt className="font-semibold text-gray-600">{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
