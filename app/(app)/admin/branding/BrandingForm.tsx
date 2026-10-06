"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Organization } from "@/lib/types";

const FIELDS: { key: "logo_url" | "donate_banner_url" | "kiosk_image_url"; label: string }[] = [
  { key: "logo_url", label: "Organization Logo URL" },
  { key: "donate_banner_url", label: "Donate Banner URL" },
  { key: "kiosk_image_url", label: "Shul Kiosk Main Image URL" },
];

export function BrandingForm({ initialOrg }: { initialOrg: Organization }) {
  const router = useRouter();
  const [form, setForm] = useState({
    logo_url: initialOrg.logo_url ?? "",
    donate_banner_url: initialOrg.donate_banner_url ?? "",
    kiosk_image_url: initialOrg.kiosk_image_url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        logo_url: form.logo_url || null,
        donate_banner_url: form.donate_banner_url || null,
        kiosk_image_url: form.kiosk_image_url || null,
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
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-ink/50">
        Paste a public image URL for each asset below. Real file upload via Supabase Storage is a fast follow —
        not wired up in this pass.
      </p>
      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="label">{f.label}</label>
            <input
              className="input"
              placeholder="https://…"
              value={form[f.key]}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, [f.key]: e.target.value }));
                setSaved(false);
              }}
            />
            {form[f.key] && (
              <div className="mt-2 border border-black/10 rounded-lg p-2 bg-black/[0.02] inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form[f.key]} alt={f.label} className="max-h-32 max-w-full rounded" />
              </div>
            )}
          </div>
        ))}

        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex items-center gap-3">
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          {saved && <span className="text-sm text-emerald-600">Saved.</span>}
        </div>
      </form>
    </div>
  );
}
