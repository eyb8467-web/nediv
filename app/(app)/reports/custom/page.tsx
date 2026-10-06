import { requireOrgContext } from "@/lib/org";
import { PageTabs } from "@/components/PageTabs";
import { CustomReportClient } from "@/components/reports/CustomReportClient";

export default async function CustomReportPage() {
  const { org } = await requireOrgContext();

  return (
    <div>
      <PageTabs
        title="Reports"
        tabs={[
          { href: "/reports/query", label: "Query Reports" },
          { href: "/reports/custom", label: "Custom Report" },
        ]}
      />
      <CustomReportClient orgId={org.id} />
    </div>
  );
}
