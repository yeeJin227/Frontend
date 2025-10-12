'use client';

import { useEffect, useState } from 'react';
import { CategoryNavClient } from './nav.client';
import { buildCategoryPath } from '@/utils/slug';

const staticItems = [{ href: '/funding', label: '펀딩', kind: 'static' as const }];
const forestItems = [{ href: '/forest', label: '작가숲' }];

type Cat = {
  id: number;
  categoryName: string;
  parentId?: number | null;
  parentCategoryId?: number | null;
  displayOrder?: number | null;
};

function isCat(x: unknown): x is Cat {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === 'number' &&
    typeof o.categoryName === 'string'
  );
}

export default function CategoryNavPages() {
  const [cats, setCats] = useState<Cat[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/categories`, { credentials: 'include' });
      const json = await res.json();
      const raw = Array.isArray(json) ? json : json?.data;

      const list: Cat[] = Array.isArray(raw) ? raw.filter(isCat) : [];
      setCats(list);
    })();
  }, []);

  const topLevel = cats.filter((c) => (c.parentId ?? c.parentCategoryId) == null);

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

  return (
    <CategoryNavClient
      categories={[...staticItems, ...categoryLinks]}
      forestItems={forestItems}
    />
  );
}
