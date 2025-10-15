// app/funding/page.tsx
import { HeroSlider } from './components/HeroSlider';
import { FilterSidebar } from './components/FilterSidebar';
import { CategoryFilter } from './components/CategoryFilter';
import { PopularFundingSlider } from './components/PopularFundingSlider';
import { SortDropdown } from './components/SortDropdown';
import { FundingGrid } from './components/FundingGrid';
import { fetchFundingList } from '@/utils/api/funding';
import { fetchCategories } from '@/utils/api/category';
import { FundingListProps, FundingStatus, SortBy } from '@/types/funding';

type SearchParams = {
  status?: string;
  sortBy?: string;
  keyword?: string;
  minPrice?: string;
  maxPrice?: string;
  category?: string; // 추가
  page?: string;
  size?: string;
};

interface FundingPageProps {
  searchParams: Promise<SearchParams>;
}

async function getPopularFundings() {
  const params: FundingListProps = {
    sortBy: 'popular',
    status: ['OPEN'],
    size: 8,
  };
  return await fetchFundingList(params);
}

const parseSearchParams = (searchParams: SearchParams): FundingListProps => {
  return {
    status: searchParams.status
      ? (searchParams.status.split(',') as FundingStatus[])
      : ['OPEN', 'CLOSED', 'SUCCESS', 'FAILED'],
    sortBy: (searchParams.sortBy as SortBy) || 'recent',
    keyword: searchParams.keyword || undefined,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    categoryIds: searchParams.category?.split(',').map(Number) || undefined,
    page: searchParams.page ? Number(searchParams.page) : 0,
    size: searchParams.size ? Number(searchParams.size) : 16,
  };
};

export default async function FundingPage({ searchParams }: FundingPageProps) {
  const resolvedSearchParams = await searchParams;
  const params = parseSearchParams(resolvedSearchParams);

  // 병렬로 데이터 가져오기
  const [fundingResponse, popularFundings, categoryResponse] =
    await Promise.all([
      fetchFundingList(params),
      getPopularFundings(),
      fetchCategories(),
    ]);

  const categories = categoryResponse.data.map((category) => ({
    id: category.id,
    name: category.categoryName,
  }));

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

          <FundingGrid
            fundings={fundingResponse.data.content}
            totalPages={fundingResponse.data.totalPages}
            currentPage={params.page || 0}
          />
        </main>
      </div>
    </>
  );
}
