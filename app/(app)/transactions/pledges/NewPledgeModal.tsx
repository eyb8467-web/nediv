"use client";

import { FormEvent, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Modal } from "@/components/Modal";
import { DonorPicker, DonorOption } from "@/components/DonorPicker";
import type { LookupOption } from "./PledgesClient";

export function NewPledgeModal({
  open,
  onClose,
  orgId,
  donors,
  campaigns,
  reasons,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  orgId: string;
  donors: DonorOption[];
  campaigns: LookupOption[];
  reasons: LookupOption[];
  onCreated: () => void;
}) {
  const [donorId, setDonorId] = useState("");
  const [amount, setAmount] = useState("");
  const [pledgeDate, setPledgeDate] = useState(new Date().toISOString().slice(0, 10));
  const [campaignId, setCampaignId] = useState("");
  const [reasonId, setReasonId] = useState("");
  const [email, setEmail] = useState("");
  const [externalNote, setExternalNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setDonorId("");
    setAmount("");
    setPledgeDate(new Date().toISOString().slice(0, 10));
    setCampaignId("");
    setReasonId("");
    setEmail("");
    setExternalNote("");
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
    const { error: insertError } = await supabase.from("pledges").insert({
      org_id: orgId,
      donor_id: donorId || null,
      amount: Number(amount),
      pledge_date: pledgeDate,
      campaign_id: campaignId || null,
      reason_id: reasonId || null,
      email: email || null,
      external_note: externalNote || null,
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
    <Modal open={open} onClose={handleClose} title="New Pledge" wide>
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
            <label className="label">Pledge Date</label>
            <input
              type="date"
              className="input"
              value={pledgeDate}
              onChange={(e) => setPledgeDate(e.target.value)}
              required
            />
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
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">External Note</label>
            <textarea
              className="input"
              rows={2}
              value={externalNote}
              onChange={(e) => setExternalNote(e.target.value)}
            />
          </div>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save Pledge"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
