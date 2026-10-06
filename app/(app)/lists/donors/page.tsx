import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTabs } from "@/components/PageTabs";
import { LISTS_TABS } from "@/lib/listsTabs";
import { DonorsClient } from "./DonorsClient";

export default async function DonorsPage() {
  const { org } = await requireOrgContext();
  const supabase = supabaseServer();

  const [donorsRes, countRes, locationsRes, tagsRes, customFieldsRes] = await Promise.all([
    supabase.from("donors").select("*").eq("org_id", org.id).order("created_at", { ascending: false }).limit(200),
    supabase.from("donors").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase.from("locations").select("id,name").eq("org_id", org.id).order("name", { ascending: true }),
    supabase.from("tags").select("*").eq("org_id", org.id).order("name", { ascending: true }),
    supabase.from("custom_fields").select("*").eq("org_id", org.id).order("name", { ascending: true }),
  ]);

  return (
    <div>
      <PageTabs title="Lists" tabs={LISTS_TABS} />
      <DonorsClient
        orgId={org.id}
        initialRows={donorsRes.data ?? []}
        initialCount={countRes.count ?? 0}
        locations={locationsRes.data ?? []}
        tags={tagsRes.data ?? []}
        customFields={customFieldsRes.data ?? []}
      />
    </div>
  );
}
