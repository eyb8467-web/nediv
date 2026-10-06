import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTabs } from "@/components/PageTabs";
import { MinyanimClient } from "./MinyanimClient";

const ADMIN_TABS = [
  { href: "/admin/profile", label: "Profile" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/branding", label: "Branding" },
  { href: "/admin/api-keys", label: "API Keys" },
  { href: "/admin/minyanim", label: "Minyanim" },
  { href: "/admin/seats", label: "Seats" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/advanced-fields", label: "Advanced fields" },
];

export default async function AdminMinyanimPage() {
  const { membership, org } = await requireOrgContext();

  if (membership.role !== "owner" && membership.role !== "admin") {
    return (
      <div>
        <PageTabs title="Admin" tabs={ADMIN_TABS} />
        <p className="text-ink/50">You don't have access to Admin.</p>
      </div>
    );
  }

  const supabase = supabaseServer();
  const { data: minyanim } = await supabase
    .from("minyanim")
    .select("*")
    .eq("org_id", org.id)
    .order("time_of_day", { ascending: true });

  return (
    <div>
      <PageTabs title="Admin" tabs={ADMIN_TABS} />
      <MinyanimClient orgId={org.id} minyanim={minyanim ?? []} />
    </div>
  );
}
