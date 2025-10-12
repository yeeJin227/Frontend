
import type { Category } from '@/types/category';
import { fetchCategoriesServer } from '@/lib/server/categories.server';

// 서버 categoryName 매핑
export const SLUG_TO_KOR: Record<string, string> = {
  funding: '펀딩',
  sticker: '스티커',
  memo: '메모지',
  note: '노트',
  accessory: '액세서리',
  etc: '기타 문구류',
  digital: '디지털 문구',
};

function findCategoryIdByName(categories: Category[], targetName: string): number | null {
  const stack = [...categories];
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur.categoryName === targetName) return cur.id;
    if (cur.subCategories?.length) stack.push(...cur.subCategories);
  }
  return null;
}

export async function resolveCategoryIdBySlug(slug: string): Promise<number | null> {
  const kor = SLUG_TO_KOR[slug];
  if (!kor) return null;
  const cats = await fetchCategoriesServer();
  return findCategoryIdByName(cats, kor);
}
