import { requireOrgContext } from "@/lib/org";
import { PageTabs } from "@/components/PageTabs";
import { BrandingForm } from "./BrandingForm";

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

export default async function AdminBrandingPage() {
  const { membership, org } = await requireOrgContext();

  if (membership.role !== "owner" && membership.role !== "admin") {
    return (
      <div>
        <PageTabs title="Admin" tabs={ADMIN_TABS} />
        <p className="text-ink/50">You don't have access to Admin.</p>
      </div>
    );
  }

  return (
    <div>
      <PageTabs title="Admin" tabs={ADMIN_TABS} />
      <BrandingForm initialOrg={org} />
    </div>
  );
}
