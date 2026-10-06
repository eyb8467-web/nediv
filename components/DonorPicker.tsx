"use client";

import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";

export type DonorOption = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  first_name_hebrew?: string | null;
  last_name_hebrew?: string | null;
  phone?: string | null;
};

export function donorLabel(d: DonorOption | null | undefined) {
  if (!d) return "—";
  return `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() || "(unnamed donor)";
}

function donorSearchText(d: DonorOption) {
  return [d.first_name, d.last_name, d.first_name_hebrew, d.last_name_hebrew, d.phone]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const QUICK_ADD_EMPTY = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  zip: "",
};

/**
 * Simple searchable donor picker: a text filter over an already-fetched donor list
 *  (first 200 donors, per CONVENTIONS) narrowed down to a <select>.
 *
 * Also offers two optional helpers, shown when `orgId` is supplied:
 *  - "Search Genvite" opens genvite.com in a new tab using the user's own
 *    already-logged-in browser session (no Genvite credentials ever touch
 *    this app) and copies the typed name to the clipboard so it can be
 *    pasted into Genvite's own search box.
 *  - "Add as Donor" is a quick inline form so a donor found elsewhere
 *    (e.g. on Genvite) can be typed in and saved to this organization's
 *    donor list in one step, then is auto-selected.
 */
export function DonorPicker({
  donors,
  value,
  onChange,
  required = false,
  orgId,
  onDonorCreated,
}: {
  donors: DonorOption[];
  value: string;
  onChange: (donorId: string) => void;
  required?: boolean;
  orgId?: string;
  onDonorCreated?: (donor: DonorOption) => void;
}) {
  const [query, setQuery] = useState("");
  const [addedDonors, setAddedDonors] = useState<DonorOption[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ ...QUICK_ADD_EMPTY });
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [genviteNotice, setGenviteNotice] = useState<string | null>(null);

  const allDonors = useMemo(() => [...addedDonors, ...donors], [donors, addedDonors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allDonors;
    return allDonors.filter((d) => donorSearchText(d).includes(q));
  }, [allDonors, query]);

  function setField(name: keyof typeof QUICK_ADD_EMPTY, v: string) {
    setForm((prev) => ({ ...prev, [name]: v }));
  }

  async function handleSearchGenvite() {
    setGenviteNotice(null);
    const name = query.trim();
    if (name) {
      try {
        await navigator.clipboard.writeText(name);
        setGenviteNotice(`Copied "${name}" — paste it into Genvite's search.`);
      } catch {
        // Clipboard access can be blocked by the browser; Genvite still opens.
      }
    }
    window.open("https://www.genvite.com", "_blank", "noopener,noreferrer");
  }

  function openAddForm() {
    setAddError(null);
    setForm({
      ...QUICK_ADD_EMPTY,
      first_name: query.trim() && !query.includes(" ") ? query.trim() : form.first_name,
    });
    setShowAddForm(true);
  }

  async function handleQuickAdd() {
    if (!orgId) return;
    if (!form.first_name.trim() && !form.last_name.trim()) {
      setAddError("Enter at least a first or last name.");
      return;
    }
    setSaving(true);
    setAddError(null);
    const supabase = supabaseBrowser();
    const payload: Record<string, any> = { org_id: orgId };
    for (const k of Object.keys(form) as Array<keyof typeof QUICK_ADD_EMPTY>) {
      const v = (form[k] ?? "").trim();
      payload[k] = v === "" ? null : v;
    }
    const { data, error } = await supabase.from("donors").insert(payload).select().single();
    setSaving(false);
    if (error || !data) {
      setAddError(error?.message ?? "Could not create donor.");
      return;
    }
    const newDonor: DonorOption = {
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
    };
    setAddedDonors((prev) => [newDonor, ...prev]);
    onChange(newDonor.id);
    onDonorCreated?.(newDonor);
    setForm({ ...QUICK_ADD_EMPTY });
    setShowAddForm(false);
    setQuery("");
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          className="input flex-1"
          placeholder="Search donor by name, Yiddish name, or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {orgId && (
          <>
            <button
              type="button"
              className="btn-secondary whitespace-nowrap flex items-center gap-1"
              onClick={handleSearchGenvite}
              title="Search for this name on genvite.com (opens in a new tab, using your own Genvite login)"
            >
              <Icon name="external-link" className="w-4 h-4" /> Search Genvite
            </button>
            <button
              type="button"
              className="btn-secondary whitespace-nowrap flex items-center gap-1"
              onClick={() => (showAddForm ? setShowAddForm(false) : openAddForm())}
            >
              <Icon name="plus" className="w-4 h-4" /> Add as Donor
            </button>
          </>
        )}
      </div>
      {genviteNotice && <p className="text-xs text-emerald-600">{genviteNotice}</p>}

      {showAddForm && orgId && (
        <div className="border border-black/[0.06] rounded-xl p-3.5 bg-brand-50/50 space-y-2.5 animate-fade-in">
          <p className="text-xs text-ink/50">
            Paste in details you found (e.g. on Genvite) to create a new donor and select them.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              className="input"
              placeholder="First name"
              value={form.first_name}
              onChange={(e) => setField("first_name", e.target.value)}
            />
            <input
              className="input"
              placeholder="Last name"
              value={form.last_name}
              onChange={(e) => setField("last_name", e.target.value)}
            />
            <input
              className="input"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
            <input
              className="input"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
            <input
              className="input col-span-2"
              placeholder="Address"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
            />
            <input
              className="input"
              placeholder="City"
              value={form.city}
              onChange={(e) => setField("city", e.target.value)}
            />
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="State"
                value={form.state}
                onChange={(e) => setField("state", e.target.value)}
              />
              <input
                className="input"
                placeholder="Zip"
                value={form.zip}
                onChange={(e) => setField("zip", e.target.value)}
              />
            </div>
          </div>
          {addError && <p className="text-sm text-rose-600">{addError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" disabled={saving} onClick={handleQuickAdd}>
              {saving ? "Saving…" : "Save & Select Donor"}
            </button>
          </div>
        </div>
      )}

      <select
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">Select donor…</option>
        {filtered.map((d) => (
          <option key={d.id} value={d.id}>
            {donorLabel(d)}
          </option>
        ))}
      </select>
    </div>
  );
}
