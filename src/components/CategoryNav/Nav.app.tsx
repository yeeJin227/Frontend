import { fetchCategoriesServer } from '@/lib/server/categories.server';
import { buildCategoryPath } from '@/utils/slug';
import { Category } from '@/types/category';
import { CategoryNavClient } from './nav.client';

const staticItems = [{ href: '/funding', label: '펀딩', kind: 'static' as const }];
const forestItems = [{ href: '/forest', label: '작가숲' }];

export const dynamic = 'force-dynamic';

type CategoryLike = Category & {
  parentId?: number | null;
  parentCategoryId?: number | null;
  displayOrder?: number | null;
};

export default async function CategoryNavApp() {
  const all = (await fetchCategoriesServer()) as CategoryLike[];

  const topLevel = all.filter((c) => (c.parentId ?? c.parentCategoryId) == null);
  topLevel.sort(
    (a, b) =>
      (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
      a.id - b.id
  );

  const categoryLinks = topLevel.map((c) => ({
    href: buildCategoryPath({ id: c.id }),
    label: c.categoryName,
    kind: 'category' as const,
  }));

  return <CategoryNavClient categories={[...staticItems, ...categoryLinks]} forestItems={forestItems} />;
}
