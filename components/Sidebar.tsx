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
    <aside className={`shrink-0 border-r border-black/[0.07] bg-white flex flex-col transition-all duration-200 ${collapsed ? "w-[64px]" : "w-[224px]"}`}>
      <div className={`flex items-center gap-2 h-14 border-b border-black/[0.07] ${collapsed ? "justify-center px-2" : "px-4"}`}>
        {!collapsed && (
          <span className="font-semibold text-brand-700 text-lg tracking-tight">Nediv</span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={`text-ink/40 hover:text-ink hover:bg-black/5 rounded-md p-1 transition-colors ${!collapsed ? "ml-auto" : ""}`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon name={collapsed ? "chevron-right" : "chevron-left"} className="w-4 h-4" />
        </button>
      </div>
      <nav className="flex-1 py-3 space-y-0.5 px-2.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.matchPrefix ?? item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-brand-50 text-brand-700" : "text-ink/55 hover:bg-black/[0.04] hover:text-ink"
              } ${collapsed ? "justify-center" : ""}`}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-brand-600" />
              )}
              <Icon name={item.icon} className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-black/[0.07]">
        {!collapsed ? (
          <div className="rounded-lg bg-brand-50/60 px-3 py-2.5">
            <div className="text-sm font-medium text-ink/80 truncate">{orgName}</div>
            {orgNumber && <div className="text-xs text-ink/45 mt-0.5">Org #{orgNumber}</div>}
            <Link href="/lists/donors" className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
              donate24hr <Icon name="chevron-right" className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="text-center text-[10px] text-ink/45">#{orgNumber}</div>
        )}
      </div>
    </aside>
  );
}
