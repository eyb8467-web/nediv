import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTabs } from "@/components/PageTabs";
import { AlertsClient } from "@/components/notifications/AlertsClient";

export default async function AlertsPage() {
  const { org } = await requireOrgContext();
  const supabase = supabaseServer();

  const { data: alerts } = await supabase
    .from("alerts")
    .select("id, subject, message, created_at, campaign:campaigns(name), source:sources(name)")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <div>
      <PageTabs
        title="Notifications"
        tabs={[
          { href: "/notifications/alerts", label: "Alerts" },
          { href: "/notifications/reminders", label: "Reminders" },
          { href: "/notifications/settings", label: "Settings" },
        ]}
      />
      <AlertsClient orgId={org.id} initialAlerts={(alerts ?? []) as any} />
    </div>
  );
}
