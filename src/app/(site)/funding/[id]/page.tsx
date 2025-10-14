// app/funding/[id]/page.tsx
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
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

    const response = await fetch(url, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('❌ 응답 실패:', response.status, response.statusText);
      return null;
    }

    const data: FundingDetailResponse = await response.json();

    return data.data;
  } catch (error) {
    console.error('❌ 펀딩 상세 조회 실패:', error);
    return null;
  }
}

// 현재 로그인한 사용자 정보 가져오기
async function getCurrentUser() {
  try {
    // 쿠키 가져오기
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString(); // 모든 쿠키를 문자열로 변환

    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      cache: 'no-store',
      headers: {
        Cookie: cookieHeader, // 쿠키를 헤더에 포함
      },
    });

    if (!response.ok) {
      console.log('사용자 정보 없음 (미로그인)');
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('❌ 사용자 정보 조회 실패:', error);
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

  const [funding, currentUser] = await Promise.all([
    getFundingDetail(resolvedParams.id),
    getCurrentUser(),
  ]);

  if (!funding) {
    console.error('❌ 펀딩 데이터 없음 - not-found 표시');
    notFound();
  }

  const currentUserId = currentUser?.userId;
  const currentUserName = currentUser?.name;
  const currentUserProfileImage = currentUser?.profileImageUrl;

  // 이미지 배열 구성
  const productImages = [
    funding.imageUrl,
    // '/productImages/funding1.png',
    // '/productImages/funding2.png',
    // '/productImages/funding3.png',
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
            price={funding.price}
            stock={funding.stock}
            soldCount={funding.soldCount}
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
            authorId={funding.author.id}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserProfileImage={currentUserProfileImage}
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
