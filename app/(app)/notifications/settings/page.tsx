import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTabs } from "@/components/PageTabs";
import { AlertRulesClient } from "@/components/notifications/AlertRulesClient";

export default async function NotificationSettingsPage() {
  const { org } = await requireOrgContext();
  const supabase = supabaseServer();

  const { data: rules } = await supabase
    .from("alert_rules")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

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
      <AlertRulesClient orgId={org.id} initialRules={rules ?? []} />
    </div>
  );
}
