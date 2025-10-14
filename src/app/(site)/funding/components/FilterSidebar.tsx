// app/funding/_components/FilterSidebar.client.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 현재 선택된 값들 가져오기
  const currentStatuses = searchParams.get('status')?.split(',') || [];
  const currentPriceRanges = searchParams.get('priceRange')?.split(',') || [];

  const toggleStatus = (status: string) => {
    const params = new URLSearchParams(searchParams);

    let statuses = params.get('status')?.split(',').filter(Boolean) || [];

    // 토글: 이미 선택되어 있으면 제거, 없으면 추가
    if (statuses.includes(status)) {
      statuses = statuses.filter((s) => s !== status);
    } else {
      statuses.push(status);
    }

    // status 업데이트
    if (statuses.length > 0) {
      params.set('status', statuses.join(','));
    } else {
      params.delete('status');
    }

    params.set('page', '0');
    router.push(`/funding?${params.toString()}`);
  };

  // ⭐ 종료 상태 토글 (CLOSED, SUCCESS, FAILED 한번에)
  const toggleClosedStatuses = () => {
    const params = new URLSearchParams(searchParams);
    const closedStatuses = ['CLOSED', 'SUCCESS', 'FAILED'];

    let statuses = params.get('status')?.split(',').filter(Boolean) || [];

    // 세 개 중 하나라도 포함되어 있으면 모두 제거
    const hasAnyClosedStatus = closedStatuses.some((status) =>
      statuses.includes(status),
    );

    if (hasAnyClosedStatus) {
      // 모두 제거
      statuses = statuses.filter((s) => !closedStatuses.includes(s));
    } else {
      // 모두 추가 (중복 방지)
      closedStatuses.forEach((status) => {
        if (!statuses.includes(status)) {
          statuses.push(status);
        }
      });
    }

    // status 업데이트
    if (statuses.length > 0) {
      params.set('status', statuses.join(','));
    } else {
      params.delete('status');
    }

    params.set('page', '0');
    router.push(`/funding?${params.toString()}`);
  };

  const togglePriceRange = (priceId: string) => {
    const params = new URLSearchParams(searchParams);

    let priceRanges =
      params.get('priceRange')?.split(',').filter(Boolean) || [];

    // 토글
    if (priceRanges.includes(priceId)) {
      priceRanges = priceRanges.filter((p) => p !== priceId);
    } else {
      priceRanges.push(priceId);
    }

    // priceRange 업데이트
    if (priceRanges.length > 0) {
      params.set('priceRange', priceRanges.join(','));
    } else {
      params.delete('priceRange');
    }

    // ⭐ minPrice, maxPrice 계산
    params.delete('minPrice');
    params.delete('maxPrice');

    if (priceRanges.length > 0) {
      const prices = priceRanges.map((id) => {
        switch (id) {
          case 'under10k':
            return { min: 0, max: 10000 };
          case '10k-30k':
            return { min: 10000, max: 30000 };
          case '30k-50k':
            return { min: 30000, max: 50000 };
          case 'over50k':
            return { min: 50000, max: Infinity };
          default:
            return { min: 0, max: Infinity };
        }
      });

      // 최소값과 최대값 계산
      const minPrice = Math.min(...prices.map((p) => p.min));
      const maxPrice = Math.max(
        ...prices.map((p) => (p.max === Infinity ? 0 : p.max)),
      );

      if (minPrice > 0) {
        params.set('minPrice', String(minPrice));
      }
      if (maxPrice > 0 && maxPrice !== Infinity) {
        params.set('maxPrice', String(maxPrice));
      }
    }

    params.set('page', '0');
    router.push(`/funding?${params.toString()}`);
  };

  // ⭐ 종료 상태 체크 여부 (CLOSED, SUCCESS, FAILED 중 하나라도 있으면 체크)
  const isClosedChecked =
    currentStatuses.includes('CLOSED') ||
    currentStatuses.includes('SUCCESS') ||
    currentStatuses.includes('FAILED');

  return (
    <aside className="bg-[#f6f4eb] px-[38px] py-[29px] min-h-[calc(100vh-300px)]">
      <div className="space-y-6">
        {/* 진행 상황 - 여러 개 선택 가능 (checkbox) */}
        <div>
          <h2 className="font-bold text-[18px] mb-3">진행 상황</h2>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={currentStatuses.includes('OPEN')}
                onChange={() => toggleStatus('OPEN')}
              />
              <span className="text-sm">진행 중</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={isClosedChecked}
                onChange={toggleClosedStatuses}
              />
              <span className="text-sm">종료</span>
            </label>
          </div>
        </div>

        {/* ⭐ 가격대 - 여러 개 선택 가능 (checkbox) */}
        <div>
          <h2 className="font-bold text-[18px] mb-3">가격대</h2>
          <div className="space-y-2">
            {[
              { id: 'under10k', label: '10,000원 이하' },
              { id: '10k-30k', label: '10,000~30,000원' },
              { id: '30k-50k', label: '30,000원~50,000원' },
              { id: 'over50k', label: '50,000원 이상' },
            ].map((price) => (
              <label
                key={price.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={currentPriceRanges.includes(price.id)}
                  onChange={() => togglePriceRange(price.id)}
                />
                <span className="text-sm">{price.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
