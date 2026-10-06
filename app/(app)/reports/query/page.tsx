import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTabs } from "@/components/PageTabs";
import { QueryBuilderClient } from "@/components/reports/QueryBuilderClient";

export default async function QueryReportsPage() {
  const { org, userId } = await requireOrgContext();
  const supabase = supabaseServer();

  const { data: savedQueries } = await supabase
    .from("saved_queries")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageTabs
        title="Reports"
        tabs={[
          { href: "/reports/query", label: "Query Reports" },
          { href: "/reports/custom", label: "Custom Report" },
        ]}
      />
      <QueryBuilderClient orgId={org.id} userId={userId} initialQueries={savedQueries ?? []} />
    </div>
  );
}
