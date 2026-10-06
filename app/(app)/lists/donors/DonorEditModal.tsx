"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Donor } from "@/lib/types";
import { LocationLite, TagRow, CustomFieldRow } from "./DonorsClient";
import { DonorAdvancedTab } from "./DonorAdvancedTab";
import { DonorFamilyTab } from "./DonorFamilyTab";
import { DonorTagsTab } from "./DonorTagsTab";
import { DonorLocationsTab } from "./DonorLocationsTab";

type Tab = "info" | "advanced" | "family" | "tags" | "locations";

export function DonorEditModal({
  open,
  onClose,
  donor,
  orgId,
  locations,
  tags,
  customFields,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  donor: Donor;
  orgId: string;
  locations: LocationLite[];
  tags: TagRow[];
  customFields: CustomFieldRow[];
  onSaved: (donor: Donor) => void;
}) {
  const [tab, setTab] = useState<Tab>("info");
  const [form, setForm] = useState({
    acct_number: donor.acct_number ?? "",
    first_name: donor.first_name ?? "",
    last_name: donor.last_name ?? "",
    first_name_hebrew: donor.first_name_hebrew ?? "",
    last_name_hebrew: donor.last_name_hebrew ?? "",
    family_name: donor.family_name ?? "",
    address: donor.address ?? "",
    city: donor.city ?? "",
    state: donor.state ?? "",
    zip: donor.zip ?? "",
    phone: donor.phone ?? "",
    email: donor.email ?? "",
    default_location_id: donor.default_location_id ?? "",
    status: donor.status ?? "Active",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(name: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = supabaseBrowser();
    const payload: Record<string, any> = {};
    for (const [k, v] of Object.entries(form)) {
      payload[k] = v === "" ? null : v;
    }
    const { data, error: err } = await supabase
      .from("donors")
      .update(payload)
      .eq("id", donor.id)
      .eq("org_id", orgId)
      .select()
      .single();
    setSaving(false);
    if (err || !data) {
      setError(err?.message ?? "Could not save.");
      return;
    }
    onSaved(data as Donor);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "info", label: "Donor Info" },
    { key: "advanced", label: "Advanced Fields" },
    { key: "family", label: "Family Tree" },
    { key: "tags", label: "Tags" },
    { key: "locations", label: "Locations" },
  ];

  const title = [donor.first_name, donor.last_name].filter(Boolean).join(" ") || donor.acct_number || "Donor";

  return (
    <Modal open={open} onClose={onClose} title={title} wide>
      <div className="flex gap-1 border-b border-black/10 mb-4 -mt-1 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`tab-link ${tab === t.key ? "active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <form onSubmit={saveInfo} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Acct #</label>
              <input className="input" value={form.acct_number} onChange={(e) => set("acct_number", e.target.value)} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="label">Default location</label>
              <select
                className="input"
                value={form.default_location_id}
                onChange={(e) => set("default_location_id", e.target.value)}
              >
                <option value="">— None —</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
              <input
                className="input"
                value={form.first_name_hebrew}
                onChange={(e) => set("first_name_hebrew", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Last name (Hebrew)</label>
              <input
                className="input"
                value={form.last_name_hebrew}
                onChange={(e) => set("last_name_hebrew", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Family name</label>
            <input
              className="input"
              value={form.family_name}
              onChange={(e) => set("family_name", e.target.value)}
              placeholder="e.g. The Smith Family"
            />
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

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}

      {tab === "advanced" && <DonorAdvancedTab donor={donor} orgId={orgId} customFields={customFields} onSaved={onSaved} />}

      {tab === "family" && <DonorFamilyTab donor={donor} orgId={orgId} />}

      {tab === "tags" && <DonorTagsTab donor={donor} orgId={orgId} tags={tags} />}

      {tab === "locations" && <DonorLocationsTab donor={donor} orgId={orgId} />}
    </Modal>
  );
}
