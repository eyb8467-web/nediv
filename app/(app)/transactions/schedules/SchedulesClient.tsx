"use client";

import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { DataTable, Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Icon } from "@/components/Icon";
import type { DonorOption } from "@/components/DonorPicker";
import { donorLabel } from "@/components/DonorPicker";
import { NewScheduleModal } from "./NewScheduleModal";

export type ScheduleRow = {
  id: string;
  schedule_number: string | null;
  total_amount: number;
  scheduled_amount: number;
  frequency: string;
  next_payment_date: string | null;
  payments_left: number | null;
  status: string;
  payment_type: string | null;
  donor_id: string | null;
  campaign_id: string | null;
  donors: { first_name: string | null; last_name: string | null } | null;
};

export type LookupOption = { id: string; name: string };

function money(n: number | null | undefined) {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function SchedulesClient({
  orgId,
  initialSchedules,
  donors,
  campaigns,
}: {
  orgId: string;
  initialSchedules: ScheduleRow[];
  donors: DonorOption[];
  campaigns: LookupOption[];
}) {
  const [schedules, setSchedules] = useState<ScheduleRow[]>(initialSchedules);
  const [modalOpen, setModalOpen] = useState(false);

  async function refetch() {
    const supabase = supabaseBrowser();
    const { data, error } = await supabase
      .from("schedules")
      .select("*, donors(first_name,last_name)")
      .eq("org_id", orgId)
      .order("next_payment_date", { ascending: true });
    if (!error) setSchedules((data ?? []) as ScheduleRow[]);
  }

  const groups = useMemo(() => {
    type Group = { label: string; sortKey: number; rows: ScheduleRow[]; total: number };
    const map = new Map<string, Group>();
    for (const s of schedules) {
      let key: string;
      let label: string;
      let sortKey: number;
      if (!s.next_payment_date) {
        key = "unscheduled";
        label = "No Next Payment Date";
        sortKey = Number.MAX_SAFE_INTEGER;
      } else {
        const d = new Date(s.next_payment_date);
        key = `${d.getFullYear()}-${d.getMonth()}`;
        label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
        sortKey = d.getFullYear() * 12 + d.getMonth();
      }
      const g = map.get(key) ?? { label, sortKey, rows: [], total: 0 };
      g.rows.push(s);
      g.total += Number(s.scheduled_amount);
      map.set(key, g);
    }
    return Array.from(map.values()).sort((a, b) => a.sortKey - b.sortKey);
  }, [schedules]);

  const columns: Column<ScheduleRow>[] = [
    { key: "schedule_number", header: "Schedule #", render: (r) => r.schedule_number || "—" },
    { key: "donor", header: "Donor", render: (r) => donorLabel(r.donors) },
    { key: "total_amount", header: "Total Amount", render: (r) => money(r.total_amount) },
    { key: "scheduled_amount", header: "Scheduled Amount", render: (r) => money(r.scheduled_amount) },
    {
      key: "next_payment_date",
      header: "Next Payment Date",
      render: (r) => (r.next_payment_date ? new Date(r.next_payment_date).toLocaleDateString() : "—"),
    },
    { key: "payments_left", header: "Payments Left", render: (r) => r.payments_left ?? "—" },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "frequency", header: "Frequency" },
    { key: "payment_type", header: "Payment Type", render: (r) => r.payment_type || "—" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Icon name="plus" className="w-4 h-4" /> New Schedule
        </button>
      </div>

      {groups.length === 0 && <div className="card p-10 text-center text-ink/40">No schedules yet.</div>}

      {groups.map((g) => (
        <div key={g.label}>
          <h3 className="text-sm font-semibold text-ink mb-2">
            {g.label} <span className="text-ink/40 font-normal">({g.rows.length})</span>{" "}
            <span className="text-ink/40 font-normal">— {money(g.total)}</span>
          </h3>
          <DataTable columns={columns} rows={g.rows} />
        </div>
      ))}

      <NewScheduleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        orgId={orgId}
        donors={donors}
        campaigns={campaigns}
        onCreated={() => {
          setModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
