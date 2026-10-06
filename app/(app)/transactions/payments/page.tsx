import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTabs } from "@/components/PageTabs";
import { PaymentsClient, PaymentRow } from "./PaymentsClient";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default async function PaymentsPage() {
  const { org } = await requireOrgContext();
  const supabase = supabaseServer();
  const { from, to } = defaultRange();

  const [
    { data: payments },
    { data: donors },
    { data: campaigns },
    { data: reasons },
    { data: locations },
    { data: collectors },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("*, donors(first_name,last_name), campaigs(name)")
      .eq("org_id", org.id)
      .gte("payment_date", from)
      .lte("payment_date", to)
      .order("payment_date", { ascending: false }),
    supabase
      .from("donors")
      .select("id,first_name,last_name,first_name_hebrew,last_name_hebrew,phone")
      .eq("org_id", org.id)
      .order("first_name")
      .limit(200),
    supabase.from("campaigns").select("id,name").eq("org_id", org.id).order("name"),
    supabase.from("reasons").select("id,name").eq("org_id", org.id).order("name"),
    supabase.from("locations").select("id,name").eq("org_id", org.id).order("name"),
    supabase.from("collectors").select("id,full_name").eq("org_id", org.id).order("full_name"),
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
      <PaymentsClient
        orgId={org.id}
        initialPayments={(payments ?? []) as unknown as PaymentRow[]}
        initialFrom={from}
        initialTo={to}
        donors={donors ?? []}
        campaigns={campaigns ?? []}
        reasons={reasons ?? []}
        locations={locations ?? []}
        collectors={collectors ?? []}
      />
    </div>
  );
}
