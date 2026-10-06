import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTabs } from "@/components/PageTabs";
import { LISTS_TABS } from "@/lib/listsTabs";
import { SimpleListManager, FieldConfig } from "@/components/lists/SimpleListManager";
import { Column } from "@/components/DataTable";

const fields: FieldConfig[] = [
  { name: "name", label: "Name", required: true },
  {
    name: "type",
    label: "Type",
    type: "select",
    options: ["Donate", "Pay", "Phone", "Pocket", "Kiosk", "Scheduler", "Manual"],
    defaultValue: "Manual",
  },
  { name: "device_id", label: "Device ID" },
  { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"], defaultValue: "Active" },
  { name: "auto_active", label: "Auto-active", type: "checkbox" },
];

const columns: Column<any>[] = [
  { key: "name", header: "Name" },
  { key: "type", header: "Type" },
  { key: "device_id", header: "Device ID" },
  {
    key: "status",
    header: "Status",
    render: (r) => <span className={r.status === "Active" ? "badge-green" : "badge-gray"}>{r.status ?? "—"}</span>,
  },
  { key: "auto_active", header: "Auto-active", render: (r) => (r.auto_active ? "Yes" : "No") },
];

export default async function SourcesPage() {
  const { org } = await requireOrgContext();
  const supabase = supabaseServer();
  const { data: rows, count } = await supabase
    .from("sources")
    .select("*", { count: "exact" })
    .eq("org_id", org.id)
    .order("name", { ascending: true });

  return (
    <div>
      <PageTabs title="Lists" tabs={LISTS_TABS} />
      <h2 className="text-sm font-semibold text-ink/60 uppercase tracking-wide mb-3">Sources ({count ?? 0})</h2>
      <SimpleListManager
        table="sources"
        orgId={org.id}
        columns={columns}
        fields={fields}
        initialRows={rows ?? []}
        newLabel="+ New Source"
        modalTitleNew="New Source"
        modalTitleEdit="Edit Source"
        searchPlaceholder="Search sources…"
      />
    </div>
  );
}
