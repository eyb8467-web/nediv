"use client";

import { FormEvent, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Modal } from "@/components/Modal";
import { DonorPicker, DonorOption } from "@/components/DonorPicker";
import type { LookupOption } from "./SchedulesClient";

const FREQUENCIES = ["Weekly", "Monthly", "Yearly"];
const PAYMENT_TYPES = ["Cash", "Check", "Credit Card", "Matbia", "ACH", "Other"];

export function NewScheduleModal({
  open,
  onClose,
  orgId,
  donors,
  campaigns,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  orgId: string;
  donors: DonorOption[];
  campaigns: LookupOption[];
  onCreated: () => void;
}) {
  const [donorId, setDonorId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [scheduledAmount, setScheduledAmount] = useState("");
  const [frequency, setFrequency] = useState("Monthly");
  const [nextPaymentDate, setNextPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentsLeft, setPaymentsLeft] = useState("");
  const [paymentType, setPaymentType] = useState("Credit Card");
  const [campaignId, setCampaignId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setDonorId("");
    setTotalAmount("");
    setScheduledAmount("");
    setFrequency("Monthly");
    setNextPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentsLeft("");
    setPaymentType("Credit Card");
    setCampaignId("");
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!totalAmount || Number(totalAmount) <= 0 || !scheduledAmount || Number(scheduledAmount) <= 0) {
      setError("Enter valid amounts.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error: insertError } = await supabase.from("schedules").insert({
      org_id: orgId,
      donor_id: donorId || null,
      total_amount: Number(totalAmount),
      scheduled_amount: Number(scheduledAmount),
      frequency,
      next_payment_date: nextPaymentDate || null,
      payments_left: paymentsLeft ? Number(paymentsLeft) : null,
      payment_type: paymentType,
      campaign_id: campaignId || null,
      status: "Active",
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    reset();
    onCreated();
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Schedule" wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Donor</label>
            <DonorPicker donors={donors} value={donorId} onChange={setDonorId} />
          </div>
          <div>
            <label className="label">Total Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Scheduled Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={scheduledAmount}
              onChange={(e) => setScheduledAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Frequency</label>
            <select className="input" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Next Payment Date</label>
            <input
              type="date"
              className="input"
              value={nextPaymentDate}
              onChange={(e) => setNextPaymentDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Payments Left</label>
            <input
              type="number"
              min="0"
              step="1"
              className="input"
              value={paymentsLeft}
              onChange={(e) => setPaymentsLeft(e.target.value)}
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
          <div className="col-span-2">
            <label className="label">Campaign</label>
            <select className="input" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
              <option value="">—</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save Schedule"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
