// app/funding/page.tsx
import { HeroSlider } from './components/HeroSlider';
import { FilterSidebar } from './components/FilterSidebar';
import { CategoryFilter } from './components/CategoryFilter';
import { PopularFundingSlider } from './components/PopularFundingSlider';
import { SortDropdown } from './components/SortDropdown';
import { FundingGrid } from './components/FundingGrid';

// 서버에서 데이터 페칭 (나중에 구현)
async function getFundings() {
  // const res = await fetch('...');
  // return res.json();
  return Array.from({ length: 12 }, (_, i) => ({ id: i }));
}

async function getPopularFundings() {
  return Array.from({ length: 8 }, (_, i) => ({ id: i }));
}

export default async function FundingPage() {
  const fundings = await getFundings();
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

          <PopularFundingSlider fundings={popularFundings} />

          <div className="bg-gray-200 h-[1px] w-full max-w-5xl my-8" />

          <div className="mb-6 w-full max-w-5xl">
            <SortDropdown />
          </div>

          <FundingGrid fundings={fundings} />
        </main>
      </div>
    </>
  );
}
