'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Hamburger from '@/assets/icon/hamburger.svg';
import { fetchTagsClient } from '@/lib/client/tags.client';

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

// 초기 정적 태그
const STATIC_TAGS: Tag[] = [
  { id: 1, tagName: '귀염' },
  { id: 2, tagName: '음식' },
  { id: 3, tagName: '감성' },
  { id: 4, tagName: '도트' },
  { id: 5, tagName: '심플' },
  { id: 6, tagName: '개발자' },
  { id: 7, tagName: '동양풍' },
  { id: 8, tagName: '빈티지' },
];

export default function CategorySideBarClient({ title }: { title: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();

  const [dynamicTags, setDynamicTags] = useState<Tag[]>([]);

  // 서버에서 동적 태그 불러오기
  const loadTags = async () => {
    try {
      const res = await fetchTagsClient();
      setDynamicTags(res);
    } catch (e) {
      console.error('태그 불러오기 실패', e);
    }
  };

  // 최초 로드 + 태그 생성 시 새로고침
  useEffect(() => {
    loadTags();
    const handleNewTag = (e: Event) => {
      console.log('[Sidebar] 새 태그 생성 감지', e);
      loadTags();
    };
    window.addEventListener('tag:created', handleNewTag);
    return () => window.removeEventListener('tag:created', handleNewTag);
  }, []);

  // 전체 태그 (정적 + 동적 병합)
  const STYLE_TAGS = [...STATIC_TAGS, ...dynamicTags];

  // 선택된 상태
  const selectedTags = new Set(sp.getAll('tagIds').flatMap((v) => v.split(',')));

  // 태그 토글 (다중 append 방식)
  const toggleTag = (id: number) => {
    const next = new Set(selectedTags);
    const k = String(id);
    if (next.has(k)) next.delete(k);
    else next.add(k);

    const qs = new URLSearchParams(withResetPage(new URLSearchParams(sp)));
    qs.delete('tagIds');
    Array.from(next).forEach((tagId) => qs.append('tagIds', tagId));

    router.push(`${pathname}?${qs.toString()}`);
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
              <label key={opt.id} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectedTags.has(String(opt.id))}
                  onChange={() => toggleTag(opt.id)}
                  className="w-[14px] h-[14px] border-2 border-gray-200 rounded-[2px] bg-white shrink-0 transition-colors cursor-pointer"
                />
                <span className="text-sm leading-4">{opt.tagName}</span>
              </label>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
