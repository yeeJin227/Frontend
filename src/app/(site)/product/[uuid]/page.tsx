'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Star from '@/assets/icon/star.svg';

import InfoTab from '@/components/productDetail/InfoTab';
import ProductOptions from '@/components/productDetail/ProductOptions';
import { fetchProductDetail } from '@/services/products';
import type { ProductDetail, ProductImageResponse } from '@/types/product';
import { toAbsoluteImageUrl } from '@/utils/image'; 

function formatWon(n?: number | null) {
  return typeof n === 'number' && Number.isFinite(n)
    ? n.toLocaleString('ko-KR') + '원'
    : '-';
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
        const res = await fetchProductDetail(uuid);
        if (!alive) return;
        setData(res);
      } catch (e: unknown) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : '상품을 불러오지 못했습니다.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [uuid]);

  const mainImages = useMemo(() => {
  const imgs = (data?.images ?? []) as ProductImageResponse[];
  return imgs.filter((img) => {
    const type = img.type ?? img.fileType;
    return type === 'MAIN' || type === 'ADDITIONAL' || type === 'THUMBNAIL';
  });
}, [data]);

  const hero = useMemo(() => {
  const imgs = data?.images ?? [];
  const pick = (imgs.find((i) => (i.type ?? i.fileType) === 'MAIN'))
    ?? (imgs.find((i) => (i.type ?? i.fileType) === 'THUMBNAIL'))
    ?? imgs[0];
  return pick;
}, [data]);

  const hasDiscount = (data?.discountRate ?? 0) > 0;

  const shippingText = useMemo(() => {
    if (!data) return '';
    const base =
      data.deliveryType === 'FREE'
        ? '무료배송'
        : data.deliveryType === 'CONDITIONAL_FREE'
        ? `${formatWon(data.deliveryCharge)} ${formatWon(
            data.conditionalFreeAmount
          )} 이상 구매시 무료배송`
        : `${formatWon(data.deliveryCharge)}`;
    const extra =
      data.additionalShippingCharge > 0
        ? `\n(제주/도서산간 ${formatWon(data.additionalShippingCharge)} 추가)`
        : '';
    return base + extra;
  }, [data]);

  const shippingInfo = useMemo(() => {
    if (!data) return { label: '배송정보', desc: '' };
    if (data.isPlanned)
      return { label: '배송정보', desc: '예약 상품입니다.' };
    if (data.isRestock)
      return { label: '배송정보', desc: '재입고 상품입니다.' };
    return { label: '배송정보', desc: '' };
  }, [data]);

  return (
    <div className="pb-4">
      <main className="max-w-[1200px] mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* 이미지 영역 */}
<section>
  {loading ? (
    <div className="w-[500px] h-[550px] flex items-center justify-center border rounded">
      불러오는 중…
    </div>
  ) : error ? (
    <div className="w-[500px] h-[550px] flex items-center justify-center border rounded text-rose-600">
      {error}
    </div>
  ) : hero ? (
    <div className="relative w-[500px] h-[550px] rounded overflow-hidden">
      <Image
        src={toAbsoluteImageUrl(hero.url) ?? '/productexample1.svg'}
        alt={data?.name ?? '상품 이미지'}
        fill
        className="object-cover"
        sizes="(min-width: 768px) 50vw, 100vw"
        priority
      />
    </div>
  ) : (
    <Image
      src="/productexample1.svg"
      alt="상품 이미지"
      width={500}
      height={550}
    />
  )}
</section>

        {/* 정보 영역 */}
        <section>
          <div className="text-gray-500 font-semibold">
            {data?.brandName ?? '작가명(브랜드명)'}
          </div>

          <div className='flex'>
            <h1 className="text-2xl font-bold py-5 pr-4">
            {data?.name ?? '상품명'}
          </h1>

          <div className="flex gap-1 items-center">
              <Star />
              <Star />
              <Star />
              <Star />
              <Star />
              <span className="font-bold text-[14px] text-gray-600">
                {loading || error || !data
                  ? '0.0'
                  : data.averageRating.toFixed(1)}
              </span>
              <span className="text-[12px] text-gray-400">
                ({loading || error || !data ? '0' : data.reviewCount})
              </span>
          </div>
          </div>

          {/* 가격 영역 */}
          <div className="flex items-center gap-3">
            {hasDiscount ? (
              <>
                <span className="text-sm font-bold text-gray-300 line-through">
                  {formatWon(data?.price)}
                </span>
                <span className="text-2xl font-bold text-black">
                  {formatWon(data?.discountPrice)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-black">
                {formatWon(data?.price)}
              </span>
            )}
          </div>

          {/* 배송비 */}
          <div className="flex items-center gap-9 py-10 whitespace-pre-line">
            <p>배송비</p>
            <p className="text-sm">{shippingText}</p>
          </div>

          <div className="flex justify-between items-center gap-6">
            <span className="text-sm">{shippingInfo.label}</span>
            {shippingInfo.desc && (
              <p className="font-bold text-tertiary">{shippingInfo.desc}</p>
            )}
          </div>

          <ProductOptions productUuid={uuid} />
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
