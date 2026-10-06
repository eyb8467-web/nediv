"use client";

import { FormEvent, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Modal } from "@/components/Modal";
import { DonorPicker, DonorOption } from "@/components/DonorPicker";
import type { LookupOption, CollectorOption } from "./PaymentsClient";

const PAYMENT_TYPES = ["Cash", "Check", "Credit Card", "Matbia", "ACH", "Other"];
const STATUSES = ["Success", "Pending", "Failed", "Canceled"];

export function NewPaymentModal({
  open,
  onClose,
  orgId,
  donors,
  campaigns,
  reasons,
  locations,
  collectors,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  orgId: string;
  donors: DonorOption[];
  campaigns: LookupOption[];
  reasons: LookupOption[];
  locations: LookupOption[];
  collectors: CollectorOption[];
  onCreated: () => void;
}) {
  const [donorId, setDonorId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentType, setPaymentType] = useState("Cash");
  const [refNumber, setRefNumber] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [reasonId, setReasonId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [collectorId, setCollectorId] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("Success");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setDonorId("");
    setAmount("");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentType("Cash");
    setRefNumber("");
    setCampaignId("");
    setReasonId("");
    setLocationId("");
    setCollectorId("");
    setNote("");
    setStatus("Success");
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error: insertError } = await supabase.from("payments").insert({
      org_id: orgId,
      donor_id: donorId || null,
      amount: Number(amount),
      payment_date: paymentDate,
      payment_type: paymentType,
      ref_number: refNumber || null,
      campaign_id: campaignId || null,
      reason_id: reasonId || null,
      location_id: locationId || null,
      collector_id: collectorId || null,
      note: note || null,
      status,
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
    <Modal open={open} onClose={handleClose} title="New Payment" wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Donor</label>
            <DonorPicker donors={donors} value={donorId} onChange={setDonorId} />
          </div>
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
            <label className="label">Payment Date</label>
            <input
              type="date"
              className="input"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
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
            <label className="label">Ref #</label>
            <input type="text" className="input" value={refNumber} onChange={(e) => setRefNumber(e.target.value)} />
          </div>
          <div>
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
          <div>
            <label className="label">Reason</label>
            <select className="input" value={reasonId} onChange={(e) => setReasonId(e.target.value)}>
              <option value="">—</option>
              {reasons.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <select className="input" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
              <option value="">—</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Collector</label>
            <select className="input" value={collectorId} onChange={(e) => setCollectorId(e.target.value)}>
              <option value="">—</option>
              {collectors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Note</label>
            <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save Payment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
