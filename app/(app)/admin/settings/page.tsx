import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTabs } from "@/components/PageTabs";
import { SettingsClient } from "./SettingsClient";

const ADMIN_TABS = [
  { href: "/admin/profile", label: "Profile" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/branding", label: "Branding" },
  { href: "/admin/api-keys", label: "API Keys" },
  { href: "/admin/minyanim", label: "Minyanim" },
  { href: "/admin/seats", label: "Seats" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/advanced-fields", label: "Advanced fields" },
];

export default async function AdminSettingsPage() {
  const { membership, org } = await requireOrgContext();

  if (membership.role !== "owner" && membership.role !== "admin") {
    return (
      <div>
        <PageTabs title="Admin" tabs={ADMIN_TABS} />
        <p className="text-ink/50">You don't have access to Admin.</p>
      </div>
    );
  }

  const supabase = supabaseServer();
  const { data: settings } = await supabase
    .from("org_settings")
    .select("*")
    .eq("org_id", org.id)
    .maybeSingle();

  return (
    <div>
      <PageTabs title="Admin" tabs={ADMIN_TABS} />
      <SettingsClient
        orgId={org.id}
        initialPresetAmounts={(settings?.preset_amounts as any) ?? []}
        initialEmailTemplates={(settings?.email_templates as any) ?? {}}
        initialSmsTemplates={(settings?.sms_templates as any) ?? {}}
        initialBatchFeePopup={settings?.batch_fee_popup ?? false}
        settingsRowExists={!!settings}
      />
    </div>
  );
}
