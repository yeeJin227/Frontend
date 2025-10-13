
import Hero from '@/components/Hero';
import {
  UpcomingProductsSection,
  RestockProductsSection,
  PlannedProductsSection,
  OnSaleProductsSection,
  NewProductsSection,
  LowStockProductsSection,
} from '@/components/main/ProductSection';

export const dynamic = 'force-dynamic';

export default async function Home() {
  return (
    <>
      <Hero />
      <div className="px-[125px] pb-12 space-y-12">
        {/* <ProductSection
          title="전체 상품"
          description="신상품순"
          kind="all"
          params={{ page: 0, size: 12, sort: 'newest' }}
        /> */}

        <NewProductsSection
          title="신상품"
          description="따끈따끈한 신상 모음"
        />

        <OnSaleProductsSection
          title="할인 중"
          description="지금 세일 중인 상품"
        />

        <RestockProductsSection
          title="재입고"
          description="다시 돌아온 인기템"
        />

        <LowStockProductsSection
          title="재고 5개 이하"
          description="놓치면 품절!"
        />

        <PlannedProductsSection
          title="기획 상품"
          description="기획전 특가"
        />

        <UpcomingProductsSection
          title="오픈 예정"
          description="곧 만나요!"
        />
      </div>
    </>
  );
}
