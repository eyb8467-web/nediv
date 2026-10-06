"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/types";
import { Icon } from "@/components/Icon";
import { useState } from "react";

export function Sidebar({ orgName, orgNumber }: { orgName: string; orgNumber: string | null }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`shrink-0 border-r border-black/10 bg-white flex flex-col transition-all ${collapsed ? "w-[64px]" : "w-[220px]"}`}>
      <div className="flex items-center gap-2 px-4 h-14 border-b border-black/10">
        <button onClick={() => setCollapsed((c) => !c)} className="text-ink/50 hover:text-ink">
          <Icon name="list" className="w-5 h-5" />
        </button>
        {!collapsed && <span className="font-semibold text-brand-700 text-lg">Nediv</span>}
      </div>
      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.matchPrefix ?? item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                active ? "bg-brand-50 text-brand-700" : "text-ink/60 hover:bg-black/5 hover:text-ink"
              }`}
            >
              <Icon name={item.icon} className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-black/10 text-xs text-ink/50">
        {!collapsed ? (
          <>
            <div className="font-medium text-ink/80 truncate">{orgName}</div>
            {orgNumber && <div>Org #{orgNumber}</div>}
            <Link href="/lists/donors" className="mt-2 inline-block text-brand-600 hover:underline">
              donate24hr →
            </Link>
          </>
        ) : (
          <div className="text-center">#{orgNumber}</div>
        )}
      </div>
    </aside>
  );
}
