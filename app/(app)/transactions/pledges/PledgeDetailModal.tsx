"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Modal } from "@/components/Modal";
import { StatusBadge } from "@/components/StatusBadge";
import { donorLabel } from "@/components/DonorPicker";
import type { PledgeRow } from "./PledgesClient";

function money(n: number | null | undefined) {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const PAYMENT_TYPES = ["Cash", "Check", "Credit Card", "Matbia", "ACH", "Other"];

export function PledgeDetailModal({
  pledge,
  onClose,
  orgId,
  onUpdated,
}: {
  pledge: PledgeRow | null;
  onClose: () => void;
  orgId: string;
  onUpdated: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAmount("");
    setPaymentType("Cash");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setError(null);
  }, [pledge?.id]);

  if (!pledge) return null;

  const balance = Number(pledge.amount) - Number(pledge.paid_amount);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pledge) return;
    const amt = Number(amount);
    if (!amount || amt <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = supabaseBrowser();

    const { data: paymentRow, error: payErr } = await supabase
      .from("payments")
      .insert({
        org_id: orgId,
        donor_id: pledge.donor_id,
        amount: amt,
        payment_date: paymentDate,
        payment_type: paymentType,
        status: "Success",
        campaign_id: pledge.campaign_id,
        reason_id: pledge.reason_id,
        applied_to_pledge_id: pledge.id,
        note: `Payment against pledge ${pledge.pledge_number ?? pledge.id}`,
      })
      .select()
      .single();

    if (payErr || !paymentRow) {
      setSaving(false);
      setError(payErr?.message ?? "Could not record payment.");
      return;
    }

    const { error: linkErr } = await supabase.from("pledge_payments").insert({
      org_id: orgId,
      pledge_id: pledge.id,
      payment_id: paymentRow.id,
      amount: amt,
    });
    if (linkErr) {
      setSaving(false);
      setError(linkErr.message);
      return;
    }

    const newPaid = Number(pledge.paid_amount) + amt;
    const newStatus = newPaid >= Number(pledge.amount) ? "Paid" : pledge.status;
    const { error: updErr } = await supabase
      .from("pledges")
      .update({ paid_amount: newPaid, status: newStatus })
      .eq("id", pledge.id);

    setSaving(false);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    onUpdated();
  }

  return (
    <Modal open={!!pledge} onClose={onClose} title={`Pledge ${pledge.pledge_number ?? ""}`} wide>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-ink/50">Donor:</span> {donorLabel(pledge.donors)}
          </div>
          <div>
            <span className="text-ink/50">Pledge Date:</span> {new Date(pledge.pledge_date).toLocaleDateString()}
          </div>
          <div>
            <span className="text-ink/50">Amount:</span> {money(pledge.amount)}
          </div>
          <div>
            <span className="text-ink/50">Paid Amount:</span> {money(pledge.paid_amount)}
          </div>
          <div>
            <span className="text-ink/50">Balance:</span> {money(balance)}
          </div>
          <div>
            <span className="text-ink/50">Status:</span> <StatusBadge status={pledge.status} />
          </div>
          <div>
            <span className="text-ink/50">Campaign:</span> {pledge.campaigns?.name || "—"}
          </div>
          <div>
            <span className="text-ink/50">Email:</span> {pledge.email || "—"}
          </div>
          <div className="col-span-2">
            <span className="text-ink/50">External Note:</span> {pledge.external_note || "—"}
          </div>
        </div>

        <div className="border-t border-black/10 pt-4">
          <h3 className="text-sm font-semibold text-ink mb-3">Record a payment against this pledge</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Payment Type</label>
                <select className="input" value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                  {PAYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Close
              </button>
              <button type="submit" className="btn-primary" disabled={saving || balance <= 0}>
                {saving ? "Saving…" : "Record Payment"}
              </button>
            </div>
            {balance <= 0 && <p className="text-xs text-ink/40 text-right">This pledge is fully paid.</p>}
          </form>
        </div>
      </div>
    </Modal>
  );
}
