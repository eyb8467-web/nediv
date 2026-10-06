import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTabs } from "@/components/PageTabs";
import { PledgesClient, PledgeRow } from "./PledgesClient";

export default async function PledgesPage() {
  const { org } = await requireOrgContext();
  const supabase = supabaseServer();

  const [{ data: pledges }, { data: donors }, { data: campaigns }, { data: reasons }] = await Promise.all([
    supabase
      .from("pledges")
      .select("*, donors(first_name,last_name), campaigns(name)")
      .eq("org_id", org.id)
      .order("pledge_date", { ascending: false }),
    supabase.from("donors").select("id,first_name,last_name").eq("org_id", org.id).order("first_name").limit(200),
    supabase.from("campaigns").select("id,name").eq("org_id", org.id).order("name"),
    supabase.from("reasons").select("id,name").eq("org_id", org.id).order("name"),
  ]);

  return (
    <div>
      <PageTabs
        title="Transactions"
        tabs={[
          { href: "/transactions/payments", label: "Payments" },
          { href: "/transactions/pledges", label: "Pledges" },
          { href: "/transactions/schedules", label: "Schedules" },
        ]}
      />
      <PledgesClient
        orgId={org.id}
        initialPledges={(pledges ?? []) as unknown as PledgeRow[]}
        donors={donors ?? []}
        campaigns={campaigns ?? []}
        reasons={reasons ?? []}
      />
    </div>
  );
}
