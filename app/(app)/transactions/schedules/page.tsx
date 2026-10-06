import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTabs } from "@/components/PageTabs";
import { SchedulesClient, ScheduleRow } from "./SchedulesClient";

export default async function SchedulesPage() {
  const { org } = await requireOrgContext();
  const supabase = supabaseServer();

  const [{ data: schedules }, { data: donors }, { data: campaigs }] = await Promise.all([
    supabase
      .from("schedules")
      .select("*, donors(first_name,last_name)")
      .eq("org_id", org.id)
      .order("next_payment_date", { ascending: true }),
    supabase
      .from("donors")
      .select("id,first_name,last_name,first_name_hebrew,last_name_hebrew,phone")
      .eq("org_id", org.id)
      .order("first_name")
      .limit(200),
    supabase.from("campaigs").select("id,name").eq("org_id", org.id).order("name"),
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
      <SchedulesClient
        orgId={org.id}
        initialSchedules={(schedules ?? []) as unknown as ScheduleRow[]}
        donors={donors ?? []}
        campaigns={campaigs ?? []}
      />
    </div>
  );
}
