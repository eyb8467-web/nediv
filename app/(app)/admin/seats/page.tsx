import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTabs } from "@/components/PageTabs";
import { SeatsClient } from "./SeatsClient";

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

export default async function AdminSeatsPage() {
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
  const [{ data: seasons }, { data: rates }, { data: locations }] = await Promise.all([
    supabase.from("seat_seasons").select("*").eq("org_id", org.id).order("created_at", { ascending: false }),
    supabase.from("seat_rates").select("*, locations(name)").eq("org_id", org.id).order("section"),
    supabase.from("locations").select("id,name").eq("org_id", org.id).order("name"),
  ]);

  return (
    <div>
      <PageTabs title="Admin" tabs={ADMIN_TABS} />
      <SeatsClient
        orgId={org.id}
        seasons={seasons ?? []}
        rates={rates ?? []}
        locations={locations ?? []}
      />
    </div>
  );
}
