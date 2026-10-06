"use client";

import { Icon } from "@/components/Icon";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function Topbar({ userLabel }: { userLabel: string }) {
  const router = useRouter();

  async function signOut() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initial = (userLabel || "?").trim().charAt(0).toUpperCase();

  return (
    <header className="h-14 border-b border-black/[0.07] bg-white/90 backdrop-blur-sm shadow-soft flex items-center justify-between px-5 gap-4">
      <div className="flex items-center gap-2">
        <Link href="/lists/donors?create=1" className="btn-primary">
          <Icon name="plus" className="w-4 h-4" /> Create
        </Link>
        <Link href="/transactions/payments?new=1" className="btn-secondary">
          New Transaction
        </Link>
      </div>
      <div className="flex items-center gap-3 text-ink/45">
        <button className="hover:text-ink hover:bg-black/5 rounded-md px-1.5 py-1 text-sm transition-colors" title="Language">
          A / א
        </button>
        <a
          href="https://github.com"
          target="_blank"
          className="hover:text-ink hover:bg-black/5 rounded-full p-1.5 transition-colors"
          title="System updates"
        >
          <Icon name="bell" className="w-[18px] h-[18px]" />
        </a>
        <div className="w-px h-6 bg-black/[0.08]" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center shrink-0">
            {initial}
          </div>
          <span className="text-sm text-ink/70 max-w-[180px] truncate">{userLabel}</span>
        </div>
        <button
          onClick={signOut}
          className="hover:text-ink hover:bg-black/5 rounded-full p-1.5 transition-colors"
          title="Sign out"
        >
          <Icon name="log-out" className="w-[18px] h-[18px]" />
        </button>
      </div>
    </header>
  );
}
