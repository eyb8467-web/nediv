import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTabs } from "@/components/PageTabs";
import { BatchesClient, BatchRow } from "./BatchesClient";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default async function BatchesPage() {
  const { org } = await requireOrgContext();
  const supabase = supabaseServer();
  const { from, to } = defaultRange();

  const { data: batches } = await supabase
    .from("batches")
    .select("*")
    .eq("org_id", org.id)
    .gte("gateway_batch_date", from)
    .lte("gateway_batch_date", to)
    .order("gateway_batch_date", { ascending: false });

  return (
    <div>
      <PageTabs title="Finance" tabs={[{ href: "/finance/batches", label: "Batches" }]} />
      <BatchesClient
        orgId={org.id}
        initialBatches={(batches ?? []) as unknown as BatchRow[]}
        initialFrom={from}
        initialTo={to}
      />
    </div>
  );
}
