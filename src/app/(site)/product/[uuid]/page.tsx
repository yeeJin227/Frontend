
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

import InfoTab from '@/components/productDetail/InfoTab';
import ProductOptions from '@/components/productDetail/ProductOptions';
import Image from 'next/image';
import Star from '@/assets/icon/star.svg';

import { fetchProductDetail } from '@/services/products';
import type { ProductDetail } from '@/types/product';

function formatWon(n?: number | null) {
  return typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString('ko-KR') + '원' : '-';
}

export default function Page() {
  const { uuid } = useParams<{ uuid: string }>();

  const [data, setData] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchProductDetail(uuid);
        if (!alive) return;
        setData(res);
      } catch (e: unknown) {
    if (!alive) return;
    const msg =
      e instanceof Error ? e.message :
      typeof e === 'string' ? e :
      '상품을 불러오지 못했습니다.';
    setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [uuid]);

  const hero = useMemo(() => {
    const imgs = data?.images ?? [];
    return (
      imgs.find((i) => i.fileType === 'MAIN') ??
      imgs.find((i) => i.fileType === 'THUMBNAIL') ??
      imgs[0]
    );
  }, [data]);

  const hasDiscount = (data?.discountRate ?? 0) > 0;

  // 배송비 문구
  const shippingText = useMemo(() => {
    if (!data) return '';
    const base =
      data.deliveryType === 'FREE'
        ? '무료배송'
        : data.deliveryType === 'CONDITIONAL_FREE'
        ? `${formatWon(data.deliveryCharge)} ${formatWon(data.conditionalFreeAmount)} 이상 구매시 무료배송`
        : `${formatWon(data.deliveryCharge)}`;
    const extra =
      data.additionalShippingCharge > 0
        ? `\n(제주/도서산간 ${formatWon(data.additionalShippingCharge)} 추가)`
        : '';
    return base + extra;
  }, [data]);

  // 배송정보(기획/재입고 기준으로 간단 표기)
  const shippingInfo = useMemo(() => {
    if (!data) return { label: '배송정보', type: '일반배송', desc: '' };
    if (data.isPlanned) return { label: '배송정보', type: '예약배송', desc: '예약 상품입니다.' };
    if (data.isRestock) return { label: '배송정보', type: '재입고', desc: '재입고 상품입니다.' };
    return { label: '배송정보', type: '일반배송', desc: '' };
  }, [data]);

  return (
    <div className="pb-4">
      <main className="max-w-[1200px] mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* 좌측 이미지 영역 */}
        <section>
          {/* 로딩/에러/성공 순서대로 그대로 자리 유지 */}
          {loading ? (
            <div className="w-[500px] h-[550px] flex items-center justify-center border rounded">
              불러오는 중…
            </div>
          ) : error ? (
            <div className="w-[500px] h-[550px] flex items-center justify-center border rounded text-rose-600">
              {error}
            </div>
          ) : hero ? (
            <Image
              src={hero.fileUrl}
              alt={data?.name ?? '상품 이미지'}
              width={500}
              height={550}
              className="w-[500px] h-[550px] object-cover"
              priority
            />
          ) : (
            <Image
              src="/productexample1.svg"
              alt="상품 이미지"
              width={500}
              height={550}
              className="w-[500px] h-[550px]"
            />
          )}
        </section>

        {/* 우측 정보 영역 */}
        <section>
          <div className="text-gray-500 font-semibold">
            {loading || error || !data
              ? '작가명(브랜드명)'
              : data.brandName}
          </div>

          <div className="flex items-center">
            <h1 className="text-2xl font-bold py-5 pr-4">
              {loading || error || !data ? '상품명' : data.name}
            </h1>

            <div className="flex gap-1 items-center">
              <Star />
              <Star />
              <Star />
              <Star />
              <Star />
              <span className="font-bold text-[14px] text-gray-600">
                {loading || error || !data ? '0.0' : data.averageRating.toFixed(1)}
              </span>
              <span className="text-[12px] text-gray-400">
                ({loading || error || !data ? '0' : data.reviewCount})
              </span>
            </div>
          </div>

          {/* 가격 영역 */}
          <div className="flex items-center gap-3">
            {loading || error || !data ? (
              <>
                <span className="text-sm font-bold text-gray-200 line-through">10,000원</span>
                <span className="text-2xl font-bold">8,000원</span>
              </>
            ) : hasDiscount ? (
              <>
                <span className="text-sm font-bold text-gray-200 line-through">
                  {formatWon(data.price)}
                </span>
                <span className="text-2xl font-bold">{formatWon(data.discountPrice)}</span>
              </>
            ) : (
              <span className="text-2xl font-bold">{formatWon(data.price)}</span>
            )}
          </div>

          {/* 배송비 설명 */}
          <div className="flex items-center gap-9 py-10 whitespace-pre-line">
            <p>배송비</p>
            <p className="text-sm">
              {loading || error || !data ? '3,000원 30,000원 이상 구매시 무료배송\n(제주/도서산간 3,000원 추가)' : shippingText}
            </p>
          </div>

          {/* 배송정보 (UI 유지, 텍스트만 데이터 기반) */}
          <div className="flex justify-between items-center gap-6">
            <span className="text-sm">{shippingInfo.label}</span>
            <div className="flex items-center gap-1">
              {/* <p>{shippingInfo.type}</p> */}
              {shippingInfo.desc ? (
                <p className="font-bold text-tertiary">{shippingInfo.desc}</p>
              ) : null}
            </div>
          </div>

          {/* 옵션 컴포넌트는 UI 유지. props가 필요하면 여기서 data.options/stock 등을 넘겨줘 */}
          <ProductOptions />
        </section>
      </main>

      <InfoTab
  product={data ?? undefined}
  productId={
    typeof data?.productId === 'number'
      ? data.productId
      : data?.productId != null
        ? Number(data.productId)
        : undefined
  }
/>

    </div>
  );
}
