import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { org } = await requireOrgContext();
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar orgName={org.name} orgNumber={org.org_number} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar userLabel={user?.email ?? ""} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
