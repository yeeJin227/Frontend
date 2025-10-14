// app/funding/_components/CategoryFilter.client.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface CategoryFilterItem {
  id: number;
  name: string;
}

interface CategoryFilterProps {
  categories: CategoryFilterItem[];
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 현재 선택된 카테고리 ID (단일 선택이므로 배열 대신 단일 숫자 또는 null)
  // URL에서 'category' 파라미터를 가져와 숫자로 변환합니다. 없으면 null
  const selectedCategoryId = searchParams.get('category')
    ? Number(searchParams.get('category'))
    : null;

  const selectCategory = (id: number) => {
    const params = new URLSearchParams(searchParams);

    // ⭐ 수정된 부분 시작: 단일 선택 로직
    // 새로 클릭한 ID가 현재 선택된 ID와 같으면 해제(null), 아니면 새로 클릭한 ID로 설정
    const nextCategoryId = selectedCategoryId === id ? null : id;

    // category 업데이트
    if (nextCategoryId !== null) {
      params.set('category', String(nextCategoryId)); // 단일 ID만 설정
    } else {
      params.delete('category'); // 선택된 카테고리가 없으면 파라미터 삭제
    }
    // ⭐ 수정된 부분 끝

    // 페이지를 첫 페이지로 리셋
    params.set('page', '0');

    router.push(`/funding?${params.toString()}`);
  };

  return (
    <div className="flex gap-3 my-8">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => selectCategory(category.id)} // 함수 이름도 selectCategory로 변경
          className={`border rounded-[20px] px-4 py-2 text-sm transition-colors ${
            selectedCategoryId === category.id // 단일 ID와 비교
              ? 'bg-primary text-white border-primary'
              : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
