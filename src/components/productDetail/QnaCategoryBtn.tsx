'use client';

import { useState } from 'react';

type Item = { id: string; label: string };

type Props = {
  items: Item[];
  onSelect?: (label: string) => void; // 부모에게 클릭 이벤트 전달
};

export default function CategoryBtn({ items, onSelect }: Props) {
  const [active, setActive] = useState('전체'); // 기본값 전체

  const handleClick = (label: string) => {
    setActive(label);
    onSelect?.(label); // 부모(QnaInfo)에 알림
  };

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((it) => {
        const isActive = active === it.label;
        return (
          <button
            key={it.id}
            onClick={() => handleClick(it.label)}
            className={`
              rounded-[10px] border px-5 py-1 cursor-pointer transition
              ${
                isActive
                  ? 'bg-primary text-white border-primary'
                  : 'border-primary bg-white hover:bg-primary hover:text-white'
              }
            `}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
