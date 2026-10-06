import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTabs } from "@/components/PageTabs";
import { LISTS_TABS } from "@/lib/listsTabs";
import { SimpleListManager, FieldConfig } from "@/components/lists/SimpleListManager";
import { Column } from "@/components/DataTable";

const fields: FieldConfig[] = [
  { name: "name", label: "Name", required: true },
  { name: "reason_number", label: "Reason #" },
  { name: "goal", label: "Goal ($)", type: "number" },
  { name: "percentage", label: "Percentage (%)", type: "number" },
  { name: "contact_name", label: "Contact name" },
  { name: "contact_phone", label: "Contact phone" },
  { name: "contact_email", label: "Contact email" },
];

const columns: Column<any>[] = [
  { key: "name", header: "Name" },
  { key: "reason_number", header: "Reason #" },
  {
    key: "goal",
    header: "Goal",
    render: (r) => (r.goal != null ? Number(r.goal).toLocaleString("en-US", { style: "currency", currency: "USD" }) : "—"),
  },
  { key: "percentage", header: "%", render: (r) => (r.percentage != null ? `${r.percentage}%` : "—") },
  { key: "contact_name", header: "Contact" },
  { key: "contact_phone", header: "Phone" },
  { key: "contact_email", header: "Email" },
];

export default async function ReasonsPage() {
  const { org } = await requireOrgContext();
  const supabase = supabaseServer();
  const { data: rows, count } = await supabase
    .from("reasons")
    .select("*", { count: "exact" })
    .eq("org_id", org.id)
    .order("name", { ascending: true });

  return (
    <div>
      <PageTabs title="Lists" tabs={LISTS_TABS} />
      <h2 className="text-sm font-semibold text-ink/60 uppercase tracking-wide mb-3">Reasons ({count ?? 0})</h2>
      <SimpleListManager
        table="reasons"
        orgId={org.id}
        columns={columns}
        fields={fields}
        initialRows={rows ?? []}
        newLabel="+ New Reason"
        modalTitleNew="New Reason"
        modalTitleEdit="Edit Reason"
        searchPlaceholder="Search reasons…"
      />
    </div>
  );
}
