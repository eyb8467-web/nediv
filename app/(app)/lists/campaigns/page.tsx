import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTabs } from "@/components/PageTabs";
import { LISTS_TABS } from "@/lib/listsTabs";
import { SimpleListManager, FieldConfig } from "@/components/lists/SimpleListManager";
import { Column } from "@/components/DataTable";

const fields: FieldConfig[] = [
  { name: "name", label: "Name", required: true },
  { name: "campaign_number", label: "Campaign #" },
  { name: "friendly_name", label: "Friendly name" },
];

const columns: Column<any>[] = [
  { key: "name", header: "Name" },
  { key: "campaign_number", header: "Campaign #" },
  { key: "friendly_name", header: "Friendly name" },
];

export default async function CampaignsPage() {
  const { org } = await requireOrgContext();
  const supabase = supabaseServer();
  const { data: rows, count } = await supabase
    .from("campaigns")
    .select("*", { count: "exact" })
    .eq("org_id", org.id)
    .order("name", { ascending: true });

  return (
    <div>
      <PageTabs title="Lists" tabs={LISTS_TABS} />
      <h2 className="text-sm font-semibold text-ink/60 uppercase tracking-wide mb-3">Campaigns ({count ?? 0})</h2>
      <SimpleListManager
        table="campaigns"
        orgId={org.id}
        columns={columns}
        fields={fields}
        initialRows={rows ?? []}
        newLabel="+ New Campaign"
        modalTitleNew="New Campaign"
        modalTitleEdit="Edit Campaign"
        searchPlaceholder="Search campaigns…"
      />
    </div>
  );
}
