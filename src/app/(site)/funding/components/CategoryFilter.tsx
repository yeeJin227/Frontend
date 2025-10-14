// app/funding/_components/CategoryFilter.client.tsx
'use client';

import { useState } from 'react';

interface Category {
  name: string;
  count: number;
}

interface CategoryFilterProps {
  categories: Category[];
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  };

  return (
    <div className="flex gap-3 my-8">
      {categories.map((category) => (
        <button
          key={category.name}
          onClick={() => toggle(category.name)}
          className={`border rounded-[20px] px-4 py-2 text-sm transition-colors ${
            selected.includes(category.name)
              ? 'bg-primary text-white border-primary'
              : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
