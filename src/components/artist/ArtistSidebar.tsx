"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminLink = {
  label: string;
  href?: string;
  children?: AdminLink[];
};

const adminLinks: AdminLink[] = [
  { href: "/artist/main", label: "메인 현황" },
  { href: "/artist/products", label: "상품 관리" },
  {
    label: "주문 관리",
    children: [
      { href: "/artist/orders", label: "주문 내역" },        // ← child는 '완전 일치'만 active
      { href: "/artist/orders/cancel", label: "취소 요청" },
      { href: "/artist/orders/exchange", label: "교환 요청" },
    ],
  },
  {
    label: "정산 내역",
    children: [
      { href: "/artist/monitor/approve", label: "정산 현황" },
      { href: "/artist/monitor/withdraw", label: "환전 요청" },
      { href: "/artist/monitor/history", label: "입금/환전 내역" },
    ],
  },
  { href: "/artist/users", label: "펀딩 관리" },
  { href: "/artist/account-setting", label: "판매자 설정" },
];

type AdminSidebarProps = { className?: string };

const normalize = (p: string) => (p.replace(/\/+$/, "") || "/");
const isPrefix = (current: string, target?: string) =>
  target ? normalize(current).startsWith(`${normalize(target)}`) : false;
const isExact = (current: string, target?: string) =>
  target ? normalize(current) === normalize(target) : false;

export default function ArtistSidebar({ className }: AdminSidebarProps = {}) {
  const pathname = usePathname();

  return (
    <aside
      className={clsx(
        "w-[240px] bg-[var(--color-primary-20)] p-6 text-[var(--color-gray-800)]",
        className,
      )}
    >
      <div className="mb-6 text-xl font-bold">작가 페이지</div>
      <nav className="space-y-4">
        {adminLinks.map((link) => {
          const hasChildren = !!link.children?.length;

          // 상위 단일 링크는 prefix 매칭으로 활성화 (/artist/products/create 등)
          const activeDirect = link.href ? isPrefix(pathname, link.href) : false;

          // 상위 그룹(주문 관리/정산 내역)은 '아무 자식이나 활성'이면 그룹 활성
          const activeGroup =
            hasChildren && link.children!.some((c) => isPrefix(pathname, c.href));

          const parentActive = activeDirect || activeGroup;

          const parentClass = clsx(
            "block rounded-md px-2 py-1 text-base transition-colors",
            parentActive ? "font-extrabold text-primary" : "font-medium text-[var(--color-gray-700)]",
            link.href && "hover:text-primary",
          );

          return (
            <div key={link.label} className="space-y-2">
              {link.href ? (
                <Link href={link.href} className={parentClass}>
                  {link.label}
                </Link>
              ) : (
                <span className={parentClass}>{link.label}</span>
              )}

              {hasChildren && (
                <ul className="space-y-1 pl-4 text-sm">
                  {link.children!.map((child) => {
                    // ✅ 자식은 '완전 일치'일 때만 활성화 (주문 내역이 다른 탭에서 켜지는 문제 해결)
                    const childActive = isExact(pathname, child.href);
                    return child.href ? (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={clsx(
                            "block rounded-md px-2 py-1 transition-colors hover:text-primary",
                            childActive
                              ? "font-extrabold text-primary"
                              : "font-medium text-[var(--color-gray-600)]",
                          )}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ) : (
                      <li key={child.label} className="px-2 py-1">
                        {child.label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
