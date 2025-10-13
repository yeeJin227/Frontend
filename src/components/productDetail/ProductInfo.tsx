
'use client';

import Image from 'next/image';
import type { ProductDetail } from '@/types/product';

type Spec = { label: string; value: string };

function asText(v?: unknown, fallback = '-') {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

export default function ProductInfo({ product }: { product?: ProductDetail }) {
  // 상품 이미지(최대 3장) : MAIN → ADDITIONAL → THUMBNAIL 
  const images = (() => {
    const list = product?.images ?? [];
    const main = list.filter((i) => i.fileType === 'MAIN');
    const add = list.filter((i) => i.fileType === 'ADDITIONAL');
    const thumb = list.filter((i) => i.fileType === 'THUMBNAIL');
    return [...main, ...add, ...thumb].slice(0, 3);
  })();

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

  return (
    <section>
      <h3 className="font-semibold py-12">상품 정보</h3>

      {/* 상세 이미지 영역 */}
      <div className="flex flex-col justify-center items-center gap-10">
        {images.length > 0 ? (
          images.map((img, idx) => (
            <Image
              key={`${img.fileUrl}-${idx}`}
              src={img.fileUrl}
              alt={`상세 이미지 ${idx + 1}`}
              width={600}
              height={360}
              className="w-[600px] h-[360px] object-cover"
            />
          ))
        ) : (
          <>
            <p>상품 상세 이미지가 없습니다.</p>
          </>
        )}
      </div>

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
