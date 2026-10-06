import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTabs } from "@/components/PageTabs";
import { LISTS_TABS } from "@/lib/listsTabs";
import { SimpleListManager, FieldConfig } from "@/components/lists/SimpleListManager";
import { Column } from "@/components/DataTable";

const fields: FieldConfig[] = [
  { name: "acct_number", label: "Acct #" },
  { name: "full_name", label: "Full name", required: true },
  { name: "group", label: "Group" },
  { name: "class", label: "Class" },
  { name: "address", label: "Address" },
  { name: "phone", label: "Phone" },
  { name: "email", label: "Email" },
  { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"], defaultValue: "Active" },
];

const columns: Column<any>[] = [
  { key: "acct_number", header: "Acct #" },
  { key: "full_name", header: "Full name" },
  { key: "group", header: "Group" },
  { key: "class", header: "Class" },
  { key: "phone", header: "Phone" },
  { key: "email", header: "Email" },
  {
    key: "status",
    header: "Status",
    render: (r) => <span className={r.status === "Active" ? "badge-green" : "badge-gray"}>{r.status ?? "—"}</span>,
  },
];

export default async function CollectorsPage() {
  const { org } = await requireOrgContext();
  const supabase = supabaseServer();
  const { data: rows, count } = await supabase
    .from("collectors")
    .select("*", { count: "exact" })
    .eq("org_id", org.id)
    .order("full_name", { ascending: true });

  return (
    <div>
      <PageTabs title="Lists" tabs={LISTS_TABS} />
      <h2 className="text-sm font-semibold text-ink/60 uppercase tracking-wide mb-3">Collectors ({count ?? 0})</h2>
      <SimpleListManager
        table="collectors"
        orgId={org.id}
        columns={columns}
        fields={fields}
        initialRows={rows ?? []}
        newLabel="+ New Collector"
        modalTitleNew="New Collector"
        modalTitleEdit="Edit Collector"
        searchPlaceholder="Search collectors…"
      />
    </div>
  );
}
