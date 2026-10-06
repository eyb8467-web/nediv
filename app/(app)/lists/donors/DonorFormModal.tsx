"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Donor } from "@/lib/types";

const empty = {
  first_name: "",
  last_name: "",
  first_name_hebrew: "",
  last_name_hebrew: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
  email: "",
  father_name: "",
  group: "",
  member_type: "",
  note: "",
};

export function DonorFormModal({
  open,
  onClose,
  orgId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  orgId: string;
  onCreated: (donor: Donor) => void;
}) {
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(name: keyof typeof empty, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleClose() {
    setForm({ ...empty });
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = supabaseBrowser();
    const payload: Record<string, any> = { org_id: orgId };
    for (const [k, v] of Object.entries(form)) {
      payload[k] = v === "" ? null : v;
    }
    const { data, error: err } = await supabase.from("donors").insert(payload).select().single();
    setSaving(false);
    if (err || !data) {
      setError(err?.message ?? "Could not create donor.");
      return;
    }
    onCreated(data as Donor);
    setForm({ ...empty });
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Donor" wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First name</label>
            <input className="input" value={form.first_name} onChange={(e) => set("first_name", e.target.value)} />
          </div>
          <div>
            <label className="label">Last name</label>
            <input className="input" value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
          </div>
          <div>
            <label className="label">First name (Hebrew)</label>
            <input className="input" value={form.first_name_hebrew} onChange={(e) => set("first_name_hebrew", e.target.value)} />
          </div>
          <div>
            <label className="label">Last name (Hebrew)</label>
            <input className="input" value={form.last_name_hebrew} onChange={(e) => set("last_name_hebrew", e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Address</label>
          <input className="input" value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">City</label>
            <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div>
            <label className="label">State</label>
            <input className="input" value={form.state} onChange={(e) => set("state", e.target.value)} />
          </div>
          <div>
            <label className="label">Zip</label>
            <input className="input" value={form.zip} onChange={(e) => set("zip", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Father's name</label>
            <input className="input" value={form.father_name} onChange={(e) => set("father_name", e.target.value)} />
          </div>
          <div>
            <label className="label">Group</label>
            <input className="input" value={form.group} onChange={(e) => set("group", e.target.value)} />
          </div>
          <div>
            <label className="label">Member type</label>
            <input className="input" value={form.member_type} onChange={(e) => set("member_type", e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Note</label>
          <textarea className="input" rows={3} value={form.note} onChange={(e) => set("note", e.target.value)} />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Create Donor"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
