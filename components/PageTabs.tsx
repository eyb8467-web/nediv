"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PageTabs({ tabs, title }: { tabs: { href: string; label: string }[]; title: string }) {
  const pathname = usePathname();
  return (
    <div className="mb-4">
      <h1 className="text-xl font-semibold text-ink mb-2">{title}</h1>
      <div className="flex gap-1 border-b border-black/10">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className={`tab-link ${pathname.startsWith(t.href) ? "active" : ""}`}>
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
