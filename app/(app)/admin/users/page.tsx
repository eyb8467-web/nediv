import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTabs } from "@/components/PageTabs";
import { UsersClient } from "./UsersClient";

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

export default async function AdminUsersPage() {
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
  const [
    { data: members },
    { data: reasons },
    { data: collectors },
    { data: locations },
    { data: campaigns },
    { data: sources },
  ] = await Promise.all([
    supabase.from("memberships").select("*").eq("org_id", org.id).order("created_at", { ascending: true }),
    supabase.from("reasons").select("id,name").eq("org_id", org.id).order("name"),
    supabase.from("collectors").select("id,full_name").eq("org_id", org.id).order("full_name"),
    supabase.from("locations").select("id,name").eq("org_id", org.id).order("name"),
    supabase.from("campaigns").select("id,name").eq("org_id", org.id).order("name"),
    supabase.from("sources").select("id,name").eq("org_id", org.id).order("name"),
  ]);

  return (
    <div>
      <PageTabs title="Admin" tabs={ADMIN_TABS} />
      <UsersClient
        orgId={org.id}
        members={members ?? []}
        reasons={reasons ?? []}
        collectors={collectors ?? []}
        locations={locations ?? []}
        campaigns={campaigns ?? []}
        sources={sources ?? []}
      />
    </div>
  );
}
