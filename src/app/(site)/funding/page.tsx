// app/funding/page.tsx
import { HeroSlider } from './components/HeroSlider';
import { FilterSidebar } from './components/FilterSidebar';
import { CategoryFilter } from './components/CategoryFilter';
import { PopularFundingSlider } from './components/PopularFundingSlider';
import { SortDropdown } from './components/SortDropdown';
import { FundingGrid } from './components/FundingGrid';
import { fetchFundingList } from '@/utils/api/funding';
import { FundingListProps, FundingStatus, SortBy } from '@/types/funding';
import TestCreateFunding from './components/TestCreateFunding';

type SearchParams = {
  status?: string;
  sortBy?: string;
  keyword?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
  size?: string;
};

interface FundingPageProps {
  searchParams: Promise<SearchParams>;
}

async function getPopularFundings() {
  const params: FundingListProps = {
    sortBy: 'popular',
    size: 8, // 인기 펀딩은 8개만
  };
  return await fetchFundingList(params);
}

const parseSearchParams = (searchParams: SearchParams): FundingListProps => {
  return {
    status: searchParams.status
      ? (searchParams.status.split(',') as FundingStatus[])
      : undefined,
    sortBy: (searchParams.sortBy as SortBy) || 'recent',
    keyword: searchParams.keyword || undefined,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    page: searchParams.page ? Number(searchParams.page) : 0,
    size: searchParams.size ? Number(searchParams.size) : 16,
  };
};

export default async function FundingPage({ searchParams }: FundingPageProps) {
  const resolvedSearchParams = await searchParams;
  const params = parseSearchParams(resolvedSearchParams);

  console.log('params : ', params);

  // ⭐ 전체 응답 데이터 받기
  const fundingResponse = await fetchFundingList(params);
  console.log('fundingResponse : ', fundingResponse);

  const popularFundings = await getPopularFundings();

  const categories = [
    { name: '스티커', count: 999 },
    { name: '메모지', count: 999 },
    { name: '노트', count: 999 },
    { name: '액세서리', count: 99 },
    { name: '디지털 문구', count: 99 },
  ];

  return (
    <>
      <HeroSlider />

      <div className="w-full grid grid-cols-[250px_1fr] gap-8">
        <FilterSidebar />

        <main className="flex flex-col items-center px-4">
          <CategoryFilter categories={categories} />

          <PopularFundingSlider fundings={popularFundings.data.content} />

          <div className="bg-gray-200 h-[1px] w-full max-w-5xl my-8" />

          <div className="mb-6 w-full max-w-5xl">
            <SortDropdown />
          </div>

          {/* ⭐ 페이징 정보 전달 */}
          <FundingGrid
            fundings={fundingResponse.data.content}
            totalPages={fundingResponse.data.totalPages}
            currentPage={params.page || 0}
          />
          {/* <TestCreateFunding /> */}
        </main>
      </div>
    </>
  );
}
