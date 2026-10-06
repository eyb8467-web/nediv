"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Organization } from "@/lib/types";

export function OrgProfileForm({ initialOrg }: { initialOrg: Organization }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initialOrg.name ?? "",
    tax_id: initialOrg.tax_id ?? "",
    address: initialOrg.address ?? "",
    city: initialOrg.city ?? "",
    state: initialOrg.state ?? "",
    zip: initialOrg.zip ?? "",
    phone: initialOrg.phone ?? "",
    email: initialOrg.email ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        name: form.name,
        tax_id: form.tax_id || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        zip: form.zip || null,
        phone: form.phone || null,
        email: form.email || null,
      })
      .eq("id", initialOrg.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 max-w-2xl space-y-4">
      <div>
        <label className="label">Organization name</label>
        <input className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div>
        <label className="label">Tax ID</label>
        <input className="input" value={form.tax_id} onChange={(e) => set("tax_id", e.target.value)} />
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
      <div className="flex items-center gap-3 pt-2">
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-sm text-emerald-600">Saved.</span>}
      </div>
    </form>
  );
}
