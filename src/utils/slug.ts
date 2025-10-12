

// 이름 기반 슬러그를 만들지 않고, ID 사용
export const buildCategoryPath = (c: { id: number }) => `/category/${c.id}`;

// 라우트 세그먼트에서 ID 뽑기 (레거시 슬러그도 겸용으로 파싱)
export const parseCategoryParamToId = (seg: string): number | null => {
  // 1) /category/6 형태
  if (/^\d+$/.test(seg)) return Number(seg);

  // 2) /category/메모지-6 같은 레거시 대응
  const maybe = Number(seg.split('-').pop());
  return Number.isFinite(maybe) ? maybe : null;
};
