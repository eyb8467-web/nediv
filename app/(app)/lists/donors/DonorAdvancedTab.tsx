"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Donor } from "@/lib/types";
import { CustomFieldRow } from "./DonorsClient";

export function DonorAdvancedTab({
  donor,
  orgId,
  customFields,
  onSaved,
}: {
  donor: Donor;
  orgId: string;
  customFields: CustomFieldRow[];
  onSaved: (donor: Donor) => void;
}) {
  const [form, setForm] = useState({
    collection: donor.collection ?? "",
    call_results: donor.call_results ?? "",
    member_type: donor.member_type ?? "",
    member_since: donor.member_since ?? "",
    locker_waiting_list: Boolean(donor.locker_waiting_list),
    seat_waiting_list: Boolean(donor.seat_waiting_list),
    seat_plate: donor.seat_plate ?? "",
    note: donor.note ?? "",
  });
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (customFields.length === 0) {
        setLoading(false);
        return;
      }
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("donor_custom_values")
        .select("field_id,value")
        .eq("org_id", orgId)
        .eq("donor_id", donor.id);
      if (cancelled) return;
      const map: Record<string, string> = {};
      for (const row of data ?? []) {
        map[row.field_id] = row.value ?? "";
      }
      setCustomValues(map);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donor.id]);

  function set(name: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function setCustom(fieldId: string, value: string) {
    setCustomValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedFlash(false);
    const supabase = supabaseBrowser();

    const payload: Record<string, any> = {
      collection: form.collection || null,
      call_results: form.call_results || null,
      member_type: form.member_type || null,
      member_since: form.member_since || null,
      locker_waiting_list: form.locker_waiting_list,
      seat_waiting_list: form.seat_waiting_list,
      seat_plate: form.seat_plate || null,
      note: form.note || null,
    };

    const { data, error: err } = await supabase
      .from("donors")
      .update(payload)
      .eq("id", donor.id)
      .eq("org_id", orgId)
      .select()
      .single();

    if (err || !data) {
      setError(err?.message ?? "Could not save advanced fields.");
      setSaving(false);
      return;
    }

    if (customFields.length > 0) {
      const rows = customFields.map((f) => ({
        org_id: orgId,
        donor_id: donor.id,
        field_id: f.id,
        value: customValues[f.id] ?? null,
      }));
      const { error: cvErr } = await supabase.from("donor_custom_values").upsert(rows, { onConflict: "donor_id,field_id" });
      if (cvErr) {
        setError(cvErr.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setSavedFlash(true);
    onSaved(data as Donor);
  }

  if (loading) {
    return <p className="text-sm text-ink/40 py-6">Loading…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Collection</label>
          <input className="input" value={form.collection} onChange={(e) => set("collection", e.target.value)} />
        </div>
        <div>
          <label className="label">Call results</label>
          <input className="input" value={form.call_results} onChange={(e) => set("call_results", e.target.value)} />
        </div>
        <div>
          <label className="label">Member type</label>
          <input className="input" value={form.member_type} onChange={(e) => set("member_type", e.target.value)} />
        </div>
        <div>
          <label className="label">Member since</label>
          <input
            className="input"
            type="date"
            value={form.member_since}
            onChange={(e) => set("member_since", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            checked={form.locker_waiting_list}
            onChange={(e) => set("locker_waiting_list", e.target.checked)}
          />
          Locker waiting list
        </label>
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            checked={form.seat_waiting_list}
            onChange={(e) => set("seat_waiting_list", e.target.checked)}
          />
          Seat waiting list
        </label>
      </div>

      <div>
        <label className="label">Seat plate</label>
        <input className="input" value={form.seat_plate} onChange={(e) => set("seat_plate", e.target.value)} />
      </div>

      <div>
        <label className="label">Note</label>
        <textarea className="input" rows={3} value={form.note} onChange={(e) => set("note", e.target.value)} />
      </div>

      {customFields.length > 0 && (
        <div className="pt-2 border-t border-black/10">
          <h3 className="text-xs font-semibold text-ink/50 uppercase tracking-wide mb-3 mt-3">Custom Fields</h3>
          <div className="grid grid-cols-2 gap-3">
            {customFields.map((f) => (
              <CustomFieldInput key={f.id} field={f} value={customValues[f.id] ?? ""} onChange={(v) => setCustom(f.id, v)} />
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}
      {savedFlash && !error && <p className="text-sm text-emerald-600">Saved.</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

function CustomFieldInput({
  field,
  value,
  onChange,
}: {
  field: CustomFieldRow;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.field_type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input type="checkbox" checked={value === "true"} onChange={(e) => onChange(e.target.checked ? "true" : "false")} />
        {field.name}
      </label>
    );
  }
  if (field.field_type === "select") {
    return (
      <div>
        <label className="label">{field.name}</label>
        <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">— Select —</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (field.field_type === "date") {
    return (
      <div>
        <label className="label">{field.name}</label>
        <input className="input" type="date" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  if (field.field_type === "number") {
    return (
      <div>
        <label className="label">{field.name}</label>
        <input className="input" type="number" step="any" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  return (
    <div>
      <label className="label">{field.name}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
