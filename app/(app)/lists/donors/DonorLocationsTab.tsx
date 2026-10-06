"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Donor } from "@/lib/types";

type LocRow = {
  id: string;
  isNew?: boolean;
  label: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  is_primary: boolean;
};

function tempId() {
  return `new-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export function DonorLocationsTab({ donor, orgId }: { donor: Donor; orgId: string }) {
  const [rows, setRows] = useState<LocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("donor_locations")
        .select("id,label,address,city,state,zip,is_primary")
        .eq("org_id", orgId)
        .eq("donor_id", donor.id);
      if (cancelled) return;
      setRows(
        (data ?? []).map((r: any) => ({
          id: r.id,
          label: r.label ?? "",
          address: r.address ?? "",
          city: r.city ?? "",
          state: r.state ?? "",
          zip: r.zip ?? "",
          is_primary: Boolean(r.is_primary),
        }))
      );
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donor.id]);

  function addRow() {
    setRows((prev) => [
      ...prev,
      { id: tempId(), isNew: true, label: "", address: "", city: "", state: "", zip: "", is_primary: false },
    ]);
  }

  function updateRow(id: string, patch: Partial<LocRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function saveRow(row: LocRow) {
    setSavingId(row.id);
    setError(null);
    const supabase = supabaseBrowser();
    const payload = {
      label: row.label || null,
      address: row.address || null,
      city: row.city || null,
      state: row.state || null,
      zip: row.zip || null,
      is_primary: row.is_primary,
    };
    if (row.isNew) {
      const { data, error: err } = await supabase
        .from("donor_locations")
        .insert({ ...payload, org_id: orgId, donor_id: donor.id })
        .select()
        .single();
      setSavingId(null);
      if (err || !data) {
        setError(err?.message ?? "Could not save location.");
        return;
      }
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...row, id: data.id, isNew: false } : r)));
    } else {
      const { error: err } = await supabase.from("donor_locations").update(payload).eq("id", row.id).eq("org_id", orgId);
      setSavingId(null);
      if (err) {
        setError(err.message);
      }
    }
  }

  async function deleteRow(row: LocRow) {
    if (row.isNew) {
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      return;
    }
    if (!confirm("Delete this location?")) return;
    const supabase = supabaseBrowser();
    const { error: err } = await supabase.from("donor_locations").delete().eq("id", row.id).eq("org_id", orgId);
    if (err) {
      setError(err.message);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  }

  if (loading) return <p className="text-sm text-ink/40 py-6">Loading…</p>;

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {rows.length === 0 && <p className="text-sm text-ink/40">No additional locations on file.</p>}

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="card p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Label</label>
                <input
                  className="input"
                  placeholder="e.g. Summer home"
                  value={row.label}
                  onChange={(e) => updateRow(row.id, { label: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Address</label>
                <input className="input" value={row.address} onChange={(e) => updateRow(row.id, { address: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">City</label>
                <input className="input" value={row.city} onChange={(e) => updateRow(row.id, { city: e.target.value })} />
              </div>
              <div>
                <label className="label">State</label>
                <input className="input" value={row.state} onChange={(e) => updateRow(row.id, { state: e.target.value })} />
              </div>
              <div>
                <label className="label">Zip</label>
                <input className="input" value={row.zip} onChange={(e) => updateRow(row.id, { zip: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-ink/80">
                <input
                  type="checkbox"
                  checked={row.is_primary}
                  onChange={(e) => updateRow(row.id, { is_primary: e.target.checked })}
                />
                Primary address
              </label>
              <div className="flex gap-2">
                <button type="button" className="btn-ghost text-rose-600" onClick={() => deleteRow(row)}>
                  Delete
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={savingId === row.id}
                  onClick={() => saveRow(row)}
                >
                  {savingId === row.id ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="btn-secondary" onClick={addRow}>
        + Add Location
      </button>
    </div>
  );
}
