import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTabs } from "@/components/PageTabs";
import { LISTS_TABS } from "@/lib/listsTabs";
import { SeatsClient } from "./SeatsClient";

export default async function SeatsPage() {
  const { org } = await requireOrgContext();
  const supabase = supabaseServer();

  const [seatsRes, seasonsRes, locationsRes] = await Promise.all([
    supabase
      .from("seats")
      .select("*, donors(first_name,last_name), locations(name), seat_seasons(name)")
      .eq("org_id", org.id)
      .order("seat_number", { ascending: true })
      .limit(500),
    supabase.from("seat_seasons").select("*").eq("org_id", org.id).order("created_at", { ascending: false }),
    supabase.from("locations").select("id,name").eq("org_id", org.id).order("name", { ascending: true }),
  ]);

  return (
    <div>
      <PageTabs title="Lists" tabs={LISTS_TABS} />
      <SeatsClient
        orgId={org.id}
        initialRows={seatsRes.data ?? []}
        seasons={seasonsRes.data ?? []}
        locations={locationsRes.data ?? []}
      />
    </div>
  );
}
