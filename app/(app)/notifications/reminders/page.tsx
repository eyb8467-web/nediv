import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTabs } from "@/components/PageTabs";
import { RemindersClient } from "@/components/notifications/RemindersClient";

export default async function RemindersPage() {
  const { org } = await requireOrgContext();
  const supabase = supabaseServer();

  const { data: reminders } = await supabase
    .from("reminders")
    .select("*")
    .eq("org_id", org.id)
    .order("due_at", { ascending: true, nullsFirst: false });

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
      <RemindersClient orgId={org.id} initialReminders={reminders ?? []} />
    </div>
  );
}
