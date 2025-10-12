
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Hamburger from '@/assets/icon/hamburger.svg';

type Tag = { id: number; tagName: string };

function buildQueryString(
  current: URLSearchParams,
  next: Record<string, string | number | null | undefined>
) {
  const sp = new URLSearchParams(current.toString());
  Object.entries(next).forEach(([k, v]) => {
    if (v == null || `${v}` === '') sp.delete(k);
    else sp.set(k, String(v));
  });
  return sp.toString();
}

function withResetPage(sp: URLSearchParams) {
  const next = new URLSearchParams(sp.toString());
  next.set('page', '1');
  return next;
}

// 정적 태그 
export const STYLE_TAGS: Tag[] = [
  { id: 1, tagName: '귀염' },
  { id: 2, tagName: '음식' },
  { id: 3, tagName: '감성' },
  { id: 4, tagName: '도트' },
  { id: 5, tagName: '심플' },
  { id: 6, tagName: '개발자' },
  { id: 7, tagName: '동양풍' },
  { id: 8, tagName: '빈티지' },
];

// 가격/배송 옵션
const PRICE_OPTIONS = [
  { label: '1,000원 이하', min: 0, max: 1000 },
  { label: '1,000원~2,000원', min: 1000, max: 2000 },
  { label: '2,000원~3,000원', min: 2000, max: 3000 },
  { label: '3,000원 이상', min: 3000, max: 999999 },
];

const SHIPPING_OPTIONS = [
  { label: '무료배송', value: 'FREE' },
  { label: '조건부 무료배송', value: 'CONDITIONAL' },
  { label: '유료배송', value: 'PAID' },
];

function SquareCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-[14px] h-[14px] border-2 border-gray-200 rounded-[2px] bg-white shrink-0 transition-colors cursor-pointer"
      />
      <span className="text-sm leading-4">{label}</span>
    </label>
  );
}

export default function CategorySideBarClient({ title }: { title: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();

  // CSV/다중키 모두 지원
  const selectedTags = new Set(sp.getAll('tagIds').flatMap((v) => v.split(',')));
  const minPrice = sp.get('minPrice');
  const maxPrice = sp.get('maxPrice');
  const deliveryType = sp.get('deliveryType');

  // 스타일(태그) → URL엔 CSV 한 건으로 저장
  const toggleTag = (id: number) => {
    const next = new Set(selectedTags);
    const k = String(id);
    if (next.has(k)) next.delete(k);
    else next.add(k);

    const csv = Array.from(next).join(','); // "1,5,8"
    const qs = buildQueryString(withResetPage(new URLSearchParams(sp)), {
      tagIds: csv || null,
    });
    router.push(`${pathname}?${qs}`);
  };

  const setPriceRange = (min: number, max: number) => {
    const isActive = minPrice === String(min) && maxPrice === String(max);
    const qs = buildQueryString(withResetPage(new URLSearchParams(sp)), {
      minPrice: isActive ? null : min,
      maxPrice: isActive ? null : max,
    });
    router.push(`${pathname}?${qs}`);
  };

  const setDelivery = (value: string) => {
    const isActive = deliveryType === value;
    const qs = buildQueryString(withResetPage(new URLSearchParams(sp)), {
      deliveryType: isActive ? null : value,
    });
    router.push(`${pathname}?${qs}`);
  };

  return (
    <aside className="bg-primary-20 text-black px-6 py-7 w-[240px] min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[28px] font-bold">{title}</h1>
        <button type="button" aria-label="필터 열기" className="grid gap-1.5">
          <Hamburger />
        </button>
      </div>

      <div className="space-y-8">
        {/* 스타일(태그) */}
        <section>
          <h2 className="font-bold text-[18px] mb-3">스타일</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {STYLE_TAGS.map((opt) => (
              <SquareCheckbox
                key={opt.id}
                label={opt.tagName}
                checked={selectedTags.has(String(opt.id))}
                onChange={() => toggleTag(opt.id)}
              />
            ))}
          </div>
        </section>

        {/* 가격대 */}
        <section>
          <h2 className="font-bold text-[18px] mb-3">가격대</h2>
          <div className="space-y-2">
            {PRICE_OPTIONS.map((opt) => {
              const isActive = minPrice === String(opt.min) && maxPrice === String(opt.max);
              return (
                <SquareCheckbox
                  key={opt.label}
                  label={opt.label}
                  checked={isActive}
                  onChange={() => setPriceRange(opt.min, opt.max)}
                />
              );
            })}
          </div>
        </section>

        {/* 배송비 */}
        <section>
          <h2 className="font-bold text-[18px] mb-3">배송비</h2>
          <div className="space-y-2">
            {SHIPPING_OPTIONS.map((opt) => (
              <SquareCheckbox
                key={opt.value}
                label={opt.label}
                checked={deliveryType === opt.value}
                onChange={() => setDelivery(opt.value)}
              />
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
