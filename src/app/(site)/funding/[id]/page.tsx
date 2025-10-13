// app/funding/[id]/page.tsx
import { notFound } from 'next/navigation';
import ProductImages from './components/ProductImages';
import ProductInfo from './components/ProductInfo';
import ProductTabs from './components/ProductTabs';
import AuthorInfo from './components/AuthorInfo';
import { FundingDetailResponse } from '@/types/funding';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'
).replace(/\/+$/, '');

async function getFundingDetail(id: string) {
  try {
    const url = `${API_BASE_URL}/api/fundings/${id}`;
    console.log('📤 API 호출:', url);

    const response = await fetch(url, {
      cache: 'no-store',
    });

    console.log('📥 응답 상태:', response.status);

    if (!response.ok) {
      console.error('❌ 응답 실패:', response.status, response.statusText);
      return null;
    }

    const data: FundingDetailResponse = await response.json();
    console.log('✅ 받은 데이터:', data);
    console.log('resultCode:', data.resultCode);

    return data.data;
  } catch (error) {
    console.error('❌ 펀딩 상세 조회 실패:', error);
    return null;
  }
}

interface FundingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function FundingDetailPage({
  params,
}: FundingDetailPageProps) {
  const resolvedParams = await params;
  console.log('🔍 펀딩 ID:', resolvedParams.id);

  const funding = await getFundingDetail(resolvedParams.id);
  console.log('📦 최종 펀딩 데이터:', funding);

  if (!funding) {
    console.error('❌ 펀딩 데이터 없음 - not-found 표시');
    notFound();
  }

  // 이미지 배열 구성
  const productImages = [
    funding.imageUrl,
    '/productImages/funding1.png',
    '/productImages/funding2.png',
    '/productImages/funding3.png',
  ];

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 gap-8 mb-12">
          <ProductImages images={productImages} />

          <ProductInfo
            id={funding.id}
            title={funding.title}
            category={funding.categoryName}
            currentAmount={funding.currentAmount}
            targetAmount={funding.targetAmount}
            remainingDays={funding.remainingDays}
            participants={funding.participants}
            progress={funding.progress}
          />
        </div>

        <div className="grid grid-cols-2 gap-8">
          <ProductTabs
            fundingId={funding.id}
            description={funding.description}
            news={funding.news}
            communities={funding.communities}
          />

          <AuthorInfo
            authorId={funding.author.id}
            authorName={funding.author.name}
            authorDescription={funding.author.artistDescription}
            profileImageUrl={funding.author.profileImageUrl}
          />
        </div>
      </main>
    </div>
  );
}
