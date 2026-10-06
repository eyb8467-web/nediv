"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Donor } from "@/lib/types";

type FamilyRow = {
  id: string;
  donor_id: string;
  relative_id: string | null;
  relation: string;
  relative_name_freeform: string | null;
};

type DonorLite = { id: string; first_name: string | null; last_name: string | null; family_name: string | null };

export function DonorFamilyTab({ donor, orgId }: { donor: Donor; orgId: string }) {
  const [rows, setRows] = useState<FamilyRow[]>([]);
  const [donorOptions, setDonorOptions] = useState<DonorLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [relation, setRelation] = useState("");
  const [relativeId, setRelativeId] = useState("");
  const [freeformName, setFreeformName] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = supabaseBrowser();
      const [familyRes, donorsRes] = await Promise.all([
        supabase
          .from("donor_family")
          .select("id,donor_id,relative_id,relation,relative_name_freeform")
          .eq("org_id", orgId)
          .eq("donor_id", donor.id),
        supabase
          .from("donors")
          .select("id,first_name,last_name,family_name")
          .eq("org_id", orgId)
          .neq("id", donor.id)
          .order("last_name", { ascending: true })
          .limit(1000),
      ]);
      if (cancelled) return;
      setRows((familyRes.data ?? []) as FamilyRow[]);
      setDonorOptions((donorsRes.data ?? []) as DonorLite[]);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donor.id]);

  const donorNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of donorOptions) m.set(d.id, [d.first_name, d.last_name].filter(Boolean).join(" ") || "(unnamed donor)");
    return m;
  }, [donorOptions]);

  function relativeLabel(row: FamilyRow) {
    if (row.relative_id) return donorNameById.get(row.relative_id) ?? "(linked donor)";
    return row.relative_name_freeform ?? "—";
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!relation.trim()) return;
    if (!relativeId && !freeformName.trim()) {
      setError("Pick a donor or enter a relative's name.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { data, error: err } = await supabase
      .from("donor_family")
      .insert({
        org_id: orgId,
        donor_id: donor.id,
        relation: relation.trim(),
        relative_id: relativeId || null,
        relative_name_freeform: relativeId ? null : freeformName.trim() || null,
      })
      .select()
      .single();
    setSaving(false);
    if (err || !data) {
      setError(err?.message ?? "Could not add family record.");
      return;
    }
    setRows((prev) => [...prev, data as FamilyRow]);
    setRelation("");
    setRelativeId("");
    setFreeformName("");
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this family relationship?")) return;
    const supabase = supabaseBrowser();
    const { error: err } = await supabase.from("donor_family").delete().eq("id", id).eq("org_id", orgId);
    if (err) {
      setError(err.message);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  if (loading) return <p className="text-sm text-ink/40 py-6">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="card divide-y divide-black/5">
        {rows.length === 0 && <p className="text-sm text-ink/40 p-4">No family relationships added yet.</p>}
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <div>
              <span className="font-medium text-ink">{row.relation}</span>
              <span className="text-ink/40"> — </span>
              <span className="text-ink/80">{relativeLabel(row)}</span>
            </div>
            <button type="button" className="btn-ghost text-rose-600 !px-2 !py-1" onClick={() => handleDelete(row.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="card p-4 space-y-3">
        <h3 className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Add Family Member</h3>
        <div>
          <label className="label">Relation</label>
          <input
            className="input"
            placeholder="e.g. Father, Father-in-law, Spouse"
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Donor (if in system)</label>
          <select className="input" value={relativeId} onChange={(e) => setRelativeId(e.target.value)}>
            <option value="">— Not a donor / enter name below —</option>
            {donorOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {[d.first_name, d.last_name].filter(Boolean).join(" ") || "(unnamed)"}
                {d.family_name ? ` (${d.family_name})` : ""}
              </option>
            ))}
          </select>
        </div>
        {!relativeId && (
          <div>
            <label className="label">Or relative's name</label>
            <input className="input" value={freeformName} onChange={(e) => setFreeformName(e.target.value)} />
          </div>
        )}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Adding…" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
