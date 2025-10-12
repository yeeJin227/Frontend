'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Item = { href: string; label: string; kind: 'static' | 'category' };

export function CategoryNavClient({
  categories,
  forestItems,
}: {
  categories: Item[];
  forestItems: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href);

  return (
    <nav className="border-t border-b border-slate-200 bg-white">
      <ul className="mx-auto max-w-[1200px] flex gap-6 px-5 py-3 text-[14px] font-semibold">
        {categories.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`hover:text-primary ${
                isActive(item.href)
                  ? 'text-primary font-bold border-b-2 border-primary'
                  : 'text-gray-600'
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
        <span className="text-slate-400">|</span>
        {forestItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`hover:text-tertiary ${
                isActive(item.href) ? 'text-tertiary font-bold' : 'text-tertiary'
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
