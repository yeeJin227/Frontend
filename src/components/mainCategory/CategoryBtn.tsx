'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Item = { id: string; label: string };

export default function CategoryBtn({ items = [] }: { items?: Item[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const currentCategoryId = sp.get('categoryId'); // 현재 선택된 하위카테고리 ID

  const handleClick = (id: string) => {
    const nextParams = new URLSearchParams(sp.toString());

    // 선택 해제
    if (currentCategoryId === id) {
      nextParams.delete('categoryId');
    } else {
      nextParams.set('categoryId', id);
    }

    // 페이지 초기화 + 스크롤 유지
    nextParams.set('page', '1');
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((it) => {
        const isActive = currentCategoryId === it.id;
        return (
          <button
            key={it.id}
            onClick={() => handleClick(it.id)}
            className={`
              rounded-[10px] border px-5 py-1 cursor-pointer transition
              ${isActive
                ? 'bg-primary text-white border-primary'
                : 'border-primary bg-white hover:bg-primary hover:text-white'}
            `}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
