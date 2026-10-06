"use client";

import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { DataTable, Column } from "@/components/DataTable";
import { StatTile } from "@/components/StatTile";
import { StatusBadge } from "@/components/StatusBadge";
import { Icon } from "@/components/Icon";
import { NewBatchModal } from "./NewBatchModal";

export type BatchRow = {
  id: string;
  gateway: string | null;
  gateway_batch_number: string | null;
  status: string | null;
  gateway_batch_date: string | null;
  donary_batch_number: string | null;
  note: string | null;
  bank_tag: string | null;
  transactions_count: number | null;
  fee: number | null;
  deposited: number | null;
  amount: number | null;
};

function money(n: number | null | undefined) {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const STATUSES = ["UnBatched", "Batched", "Deposited", "Reconciled"];

export function BatchesClient({
  orgId,
  initialBatches,
  initialFrom,
  initialTo,
}: {
  orgId: string;
  initialBatches: BatchRow[];
  initialFrom: string;
  initialTo: string;
}) {
  const [batches, setBatches] = useState<BatchRow[]>(initialBatches);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  async function refetch(nextFrom: string, nextTo: string) {
    setLoading(true);
    const supabase = supabaseBrowser();
    const { data, error } = await supabase
      .from("batches")
      .select("*")
      .eq("org_id", orgId)
      .gte("gateway_batch_date", nextFrom)
      .lte("gateway_batch_date", nextTo)
      .order("gateway_batch_date", { ascending: false });
    if (!error) setBatches((data ?? []) as BatchRow[]);
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

  const visible = useMemo(
    () => (status ? batches.filter((b) => b.status === status) : batches),
    [batches, status]
  );

  const totalAmount = visible.reduce((s, b) => s + Number(b.amount ?? 0), 0);
  const totalDeposited = visible.reduce((s, b) => s + Number(b.deposited ?? 0), 0);
  const totalFee = visible.reduce((s, b) => s + Number(b.fee ?? 0), 0);

  const columns: Column<BatchRow>[] = [
    { key: "gateway", header: "Gateway", render: (r) => r.gateway || "—" },
    { key: "gateway_batch_number", header: "Gateway Batch #", render: (r) => r.gateway_batch_number || "—" },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "gateway_batch_date",
      header: "Gateway Batch Date",
      render: (r) => (r.gateway_batch_date ? new Date(r.gateway_batch_date).toLocaleDateString() : "—"),
    },
    { key: "donary_batch_number", header: "Batch #", render: (r) => r.donary_batch_number || "—" },
    { key: "note", header: "Note", render: (r) => r.note || "—" },
    { key: "bank_tag", header: "Bank Tag", render: (r) => r.bank_tag || "—" },
    { key: "transactions_count", header: "Transactions", render: (r) => r.transactions_count ?? 0 },
    { key: "fee", header: "Fee", render: (r) => money(r.fee) },
    { key: "deposited", header: "Deposited", render: (r) => money(r.deposited) },
    { key: "amount", header: "Amount", render: (r) => money(r.amount) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <StatTile label="Total Amount" value={money(totalAmount)} sub={`${visible.length} batches`} />
        <StatTile label="Deposited" value={money(totalDeposited)} />
        <StatTile label="Fees" value={money(totalFee)} />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-3">
          <div>
            <label className="label">From</label>
            <input type="date" className="input" value={from} onChange={(e) => handleFromChange(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input" value={to} onChange={(e) => handleToChange(e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {loading && <span className="text-xs text-ink/40 pb-2">Loading…</span>}
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Icon name="plus" className="w-4 h-4" /> New Batch
        </button>
      </div>

      <DataTable columns={columns} rows={visible} emptyLabel="No batches in this date range." />

      <NewBatchModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        orgId={orgId}
        onCreated={() => {
          setModalOpen(false);
          refetch(from, to);
        }}
      />
    </div>
  );
}
