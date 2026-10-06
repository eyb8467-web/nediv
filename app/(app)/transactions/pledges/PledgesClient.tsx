"use client";

import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { DataTable, Column } from "@/components/DataTable";
import { StatTile } from "@/components/StatTile";
import { StatusBadge } from "@/components/StatusBadge";
import { Icon } from "@/components/Icon";
import type { DonorOption } from "@/components/DonorPicker";
import { donorLabel } from "@/components/DonorPicker";
import { NewPledgeModal } from "./NewPledgeModal";
import { PledgeDetailModal } from "./PledgeDetailModal";

export type PledgeRow = {
  id: string;
  pledge_number: string | null;
  pledge_date: string;
  amount: number;
  paid_amount: number;
  status: string;
  email: string | null;
  external_note: string | null;
  donor_id: string | null;
  campaign_id: string | null;
  reason_id: string | null;
  donors: { first_name: string | null; last_name: string | null } | null;
  campaigns: { name: string | null } | null;
};

export type LookupOption = { id: string; name: string };

function money(n: number | null | undefined) {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function PledgesClient({
  orgId,
  initialPledges,
  donors,
  campaigns,
  reasons,
}: {
  orgId: string;
  initialPledges: PledgeRow[];
  donors: DonorOption[];
  campaigns: LookupOption[];
  reasons: LookupOption[];
}) {
  const [pledges, setPledges] = useState<PledgeRow[]>(initialPledges);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<PledgeRow | null>(null);

  async function refetch() {
    const supabase = supabaseBrowser();
    const { data, error } = await supabase
      .from("pledges")
      .select("*, donors(first_name,last_name), campaigns(name)")
      .eq("org_id", orgId)
      .order("pledge_date", { ascending: false });
    if (!error) setPledges((data ?? []) as PledgeRow[]);
  }

  const yearSummaries = useMemo(() => {
    const byYear = new Map<number, { total: number; count: number }>();
    for (const p of pledges) {
      const year = new Date(p.pledge_date).getFullYear();
      const g = byYear.get(year) ?? { total: 0, count: 0 };
      g.total += Number(p.amount);
      g.count += 1;
      byYear.set(year, g);
    }
    return Array.from(byYear.entries())
      .map(([year, v]) => ({ year, ...v }))
      .sort((a, b) => b.year - a.year)
      .slice(0, 5);
  }, [pledges]);

  const columns: Column<PledgeRow>[] = [
    { key: "pledge_number", header: "Pledge #", render: (r) => r.pledge_number || "—" },
    { key: "pledge_date", header: "Pledge Date", render: (r) => new Date(r.pledge_date).toLocaleDateString() },
    { key: "donor", header: "Donor", render: (r) => donorLabel(r.donors) },
    { key: "amount", header: "Amount", render: (r) => money(r.amount) },
    { key: "paid_amount", header: "Paid Amount", render: (r) => money(r.paid_amount) },
    {
      key: "balance",
      header: "Balance",
      render: (r) => money(Number(r.amount) - Number(r.paid_amount)),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "campaign", header: "Campaign", render: (r) => r.campaigns?.name || "—" },
    { key: "email", header: "Email", render: (r) => r.email || "—" },
    { key: "external_note", header: "External Note", render: (r) => r.external_note || "—" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {yearSummaries.length === 0 && <StatTile label="Total Pledged" value={money(0)} sub="0 pledges" />}
        {yearSummaries.map((y) => (
          <StatTile key={y.year} label={String(y.year)} value={money(y.total)} sub={`${y.count} pledges`} />
        ))}
      </div>

      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Icon name="plus" className="w-4 h-4" /> New Pledge
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={pledges}
        onRowClick={(r) => setSelected(r)}
        emptyLabel="No pledges yet."
      />

      <NewPledgeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        orgId={orgId}
        donors={donors}
        campaigns={campaigns}
        reasons={reasons}
        onCreated={() => {
          setModalOpen(false);
          refetch();
        }}
      />

      <PledgeDetailModal
        pledge={selected}
        onClose={() => setSelected(null)}
        orgId={orgId}
        onUpdated={() => {
          setSelected(null);
          refetch();
        }}
      />
    </div>
  );
}
