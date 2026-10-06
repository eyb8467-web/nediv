"use client";

import { FormEvent, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Modal } from "@/components/Modal";

const STATUSES = ["UnBatched", "Batched", "Deposited", "Reconciled"];

export function NewBatchModal({
  open,
  onClose,
  orgId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  orgId: string;
  onCreated: () => void;
}) {
  const [gateway, setGateway] = useState("");
  const [gatewayBatchNumber, setGatewayBatchNumber] = useState("");
  const [status, setStatus] = useState("UnBatched");
  const [gatewayBatchDate, setGatewayBatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [donaryBatchNumber, setDonaryBatchNumber] = useState("");
  const [note, setNote] = useState("");
  const [bankTag, setBankTag] = useState("");
  const [transactionsCount, setTransactionsCount] = useState("");
  const [fee, setFee] = useState("");
  const [deposited, setDeposited] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setGateway("");
    setGatewayBatchNumber("");
    setStatus("UnBatched");
    setGatewayBatchDate(new Date().toISOString().slice(0, 10));
    setDonaryBatchNumber("");
    setNote("");
    setBankTag("");
    setTransactionsCount("");
    setFee("");
    setDeposited("");
    setAmount("");
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error: insertError } = await supabase.from("batches").insert({
      org_id: orgId,
      gateway: gateway || null,
      gateway_batch_number: gatewayBatchNumber || null,
      status,
      gateway_batch_date: gatewayBatchDate || null,
      donary_batch_number: donaryBatchNumber || null,
      note: note || null,
      bank_tag: bankTag || null,
      transactions_count: transactionsCount ? Number(transactionsCount) : 0,
      fee: fee ? Number(fee) : 0,
      deposited: deposited ? Number(deposited) : 0,
      amount: amount ? Number(amount) : 0,
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
    <Modal open={open} onClose={handleClose} title="New Batch" wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Gateway</label>
            <input type="text" className="input" value={gateway} onChange={(e) => setGateway(e.target.value)} />
          </div>
          <div>
            <label className="label">Gateway Batch #</label>
            <input
              type="text"
              className="input"
              value={gatewayBatchNumber}
              onChange={(e) => setGatewayBatchNumber(e.target.value)}
            />
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
          <div>
            <label className="label">Gateway Batch Date</label>
            <input
              type="date"
              className="input"
              value={gatewayBatchDate}
              onChange={(e) => setGatewayBatchDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Batch #</label>
            <input
              type="text"
              className="input"
              value={donaryBatchNumber}
              onChange={(e) => setDonaryBatchNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Bank Tag</label>
            <input type="text" className="input" value={bankTag} onChange={(e) => setBankTag(e.target.value)} />
          </div>
          <div>
            <label className="label">Transactions</label>
            <input
              type="number"
              min="0"
              step="1"
              className="input"
              value={transactionsCount}
              onChange={(e) => setTransactionsCount(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Fee</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Deposited</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={deposited}
              onChange={(e) => setDeposited(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
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
            {saving ? "Saving…" : "Save Batch"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
