// app/funding/_components/FilterSidebar.client.tsx
'use client';

import { useState } from 'react';

export function FilterSidebar() {
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);

  const toggleStatus = (status: string) => {
    setSelectedStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const togglePrice = (price: string) => {
    setSelectedPrices((prev) =>
      prev.includes(price) ? prev.filter((p) => p !== price) : [...prev, price],
    );
  };

  return (
    <aside className="bg-[#f6f4eb] px-[38px] py-[29px] min-h-[calc(100vh-300px)]">
      <div className="space-y-6">
        <div>
          <h2 className="font-bold text-[18px] mb-3">진행 상황</h2>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={selectedStatus.includes('ongoing')}
                onChange={() => toggleStatus('ongoing')}
              />
              <span className="text-sm">진행 중</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={selectedStatus.includes('ended')}
                onChange={() => toggleStatus('ended')}
              />
              <span className="text-sm">종료</span>
            </label>
          </div>
        </div>

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
                  checked={selectedPrices.includes(price.id)}
                  onChange={() => togglePrice(price.id)}
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
