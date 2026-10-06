import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTabs } from "@/components/PageTabs";
import { LISTS_TABS } from "@/lib/listsTabs";
import { SimpleListManager, FieldConfig } from "@/components/lists/SimpleListManager";
import { Column } from "@/components/DataTable";

const fields: FieldConfig[] = [
  { name: "name", label: "Name", required: true },
  { name: "short_name", label: "Short name" },
  { name: "type", label: "Type", defaultValue: "Shul" },
  { name: "nusach", label: "Nusach" },
  { name: "rabbi", label: "Rabbi" },
  { name: "address", label: "Address" },
  { name: "phone", label: "Phone" },
];

const columns: Column<any>[] = [
  { key: "name", header: "Name" },
  { key: "short_name", header: "Short name" },
  { key: "type", header: "Type" },
  { key: "nusach", header: "Nusach" },
  { key: "rabbi", header: "Rabbi" },
  { key: "phone", header: "Phone" },
];

export default async function LocationsPage() {
  const { org } = await requireOrgContext();
  const supabase = supabaseServer();
  const { data: rows, count } = await supabase
    .from("locations")
    .select("*", { count: "exact" })
    .eq("org_id", org.id)
    .order("name", { ascending: true });

  return (
    <div>
      <PageTabs title="Lists" tabs={LISTS_TABS} />
      <h2 className="text-sm font-semibold text-ink/60 uppercase tracking-wide mb-3">Locations ({count ?? 0})</h2>
      <SimpleListManager
        table="locations"
        orgId={org.id}
        columns={columns}
        fields={fields}
        initialRows={rows ?? []}
        newLabel="+ New Location"
        modalTitleNew="New Location"
        modalTitleEdit="Edit Location"
        searchPlaceholder="Search locations…"
      />
    </div>
  );
}
