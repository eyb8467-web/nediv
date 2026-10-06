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

  return (
    <header className="h-14 border-b border-black/10 bg-white flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Link href="/lists/donors?create=1" className="btn-primary">
          <Icon name="plus" className="w-4 h-4" /> Create
        </Link>
        <Link href="/transactions/payments?new=1" className="btn-secondary">
          New Transaction
        </Link>
      </div>
      <div className="flex items-center gap-4 text-ink/50">
        <button className="hover:text-ink" title="Language">A / א</button>
        <a href="https://github.com" target="_blank" className="hover:text-ink" title="System updates">
          <Icon name="bell" className="w-5 h-5" />
        </a>
        <span className="text-sm text-ink/70">{userLabel}</span>
        <button onClick={signOut} className="hover:text-ink" title="Sign out">
          <Icon name="log-out" className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
