"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { DataTable, Column } from "@/components/DataTable";
import { StatTile } from "@/components/StatTile";
import { StatusBadge } from "@/components/StatusBadge";
import { Icon } from "@/components/Icon";
import type { DonorOption } from "@/components/DonorPicker";
import { donorLabel } from "@/components/DonorPicker";
import { NewPaymentModal } from "./NewPaymentModal";

export type PaymentRow = {
  id: string;
  receipt_number: string | null;
  payment_date: string;
  amount: number;
  payment_type: string;
  ref_number: string | null;
  status: string;
  note: string | null;
  donor_id: string | null;
  campaign_id: string | null;
  donors: { first_name: string | null; last_name: string | null } | null;
  campaigns: { name: string | null } | null;
};

export type LookupOption = { id: string; name: string };
export type CollectorOption = { id: string; full_name: string };

function money(n: number | null | undefined) {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function PaymentsClient({
  orgId,
  initialPayments,
  initialFrom,
  initialTo,
  donors,
  campaigns,
  reasons,
  locations,
  collectors,
}: {
  orgId: string;
  initialPayments: PaymentRow[];
  initialFrom: string;
  initialTo: string;
  donors: DonorOption[];
  campaigns: LookupOption[];
  reasons: LookupOption[];
  locations: LookupOption[];
  collectors: CollectorOption[];
}) {
  const [payments, setPayments] = useState<PaymentRow[]>(initialPayments);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  async function refetch(nextFrom: string, nextTo: string) {
    setLoading(true);
    const supabase = supabaseBrowser();
    const { data, error } = await supabase
      .from("payments")
      .select("*, donors(first_name,last_name), campaigns(name)")
      .eq("org_id", orgId)
      .gte("payment_date", nextFrom)
      .lte("payment_date", nextTo)
      .order("payment_date", { ascending: false });
    if (!error) setPayments((data ?? []) as PaymentRow[]);
    setLoading(false);
  }

  function handleFromChange(v: string) {
    setFrom(v);
    refetch(v, to);
  }
  function handleToChange(v: string) {
    setTo(v);
    refetch(from, v);
  }

  const totalAmount = payments.reduce((s, p) => s + Number(p.amount), 0);
  const byStatus: Record<string, number> = {};
  for (const p of payments) byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;

  const columns: Column<PaymentRow>[] = [
    { key: "receipt_number", header: "Receipt #", render: (r) => r.receipt_number || "—" },
    {
      key: "payment_date",
      header: "Payment Date",
      render: (r) => new Date(r.payment_date).toLocaleDateString(),
    },
    { key: "donor", header: "Donor", render: (r) => donorLabel(r.donors) },
    { key: "amount", header: "Amount", render: (r) => money(r.amount) },
    { key: "payment_type", header: "Payment Type" },
    { key: "ref_number", header: "Ref #", render: (r) => r.ref_number || "—" },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "note", header: "Note", render: (r) => r.note || "—" },
    { key: "campaign", header: "Campaign", render: (r) => r.campaigns?.name || "—" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4">
        <StatTile icon="banknote" label="Total Amount" value={money(totalAmount)} sub={`${payments.length} payments`} />
        <StatTile icon="layout-dashboard" label="Success" value={String(byStatus["Success"] ?? 0)} />
        <StatTile icon="wallet" label="Pending" value={String(byStatus["Pending"] ?? 0)} />
        <StatTile
          icon="x"
          label="Failed / Canceled"
          value={String((byStatus["Failed"] ?? 0) + (byStatus["Canceled"] ?? 0))}
        />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-3">
          <div>
            <label className="label">From</label>
            <input
              type="date"
              className="input"
              value={from}
              onChange={(e) => handleFromChange(e.target.value)}
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="date"
              className="input"
              value={to}
              onChange={(e) => handleToChange(e.target.value)}
            />
          </div>
          {loading && (
            <span className="flex items-center gap-1.5 text-xs text-ink/40 pb-2">
              <span className="spinner" /> Loading…
            </span>
          )}
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Icon name="plus" className="w-4 h-4" /> New Payment
        </button>
      </div>

      <DataTable columns={columns} rows={payments} emptyLabel="No payments in this date range." />

      <NewPaymentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        orgId={orgId}
        donors={donors}
        campaigns={campaigns}
        reasons={reasons}
        locations={locations}
        collectors={collectors}
        onCreated={() => {
          setModalOpen(false);
          refetch(from, to);
        }}
      />
    </div>
  );
}
