"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type PresetAmount = { amount: number; title: string; has_schedule: boolean };
type EmailTemplate = { enabled: boolean; body: string };
type SmsTemplate = { en: string; yi: string };

const SECTIONS = ["Preset Amount", "Send automatic Email", "Customize SMS messages"] as const;
type Section = (typeof SECTIONS)[number];

const EMAIL_EVENTS = ["Pledge Bill Created", "Payment Receipt", "Statement Ready"];
const SMS_EVENTS = ["Receipts", "SMS Pledge bill", "SMS Statements"];

function normalizePresets(input: any[]): PresetAmount[] {
  const rows: PresetAmount[] = [];
  for (let i = 0; i < 6; i++) {
    const p = input?.[i];
    rows.push({
      amount: typeof p?.amount === "number" ? p.amount : 0,
      title: p?.title ?? "",
      has_schedule: !!p?.has_schedule,
    });
  }
  return rows;
}

export function SettingsClient({
  orgId,
  initialPresetAmounts,
  initialEmailTemplates,
  initialSmsTemplates,
  initialBatchFeePopup,
}: {
  orgId: string;
  initialPresetAmounts: any[];
  initialEmailTemplates: Record<string, EmailTemplate>;
  initialSmsTemplates: Record<string, SmsTemplate>;
  initialBatchFeePopup: boolean;
  settingsRowExists: boolean;
}) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("Preset Amount");

  const [presets, setPresets] = useState<PresetAmount[]>(normalizePresets(initialPresetAmounts));
  const [presetSaving, setPresetSaving] = useState(false);
  const [presetSaved, setPresetSaved] = useState(false);

  const [emailTemplates, setEmailTemplates] = useState<Record<string, EmailTemplate>>(() => {
    const base: Record<string, EmailTemplate> = {};
    for (const ev of EMAIL_EVENTS) {
      base[ev] = initialEmailTemplates?.[ev] ?? { enabled: false, body: "" };
    }
    return base;
  });
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);

  const [smsTemplates, setSmsTemplates] = useState<Record<string, SmsTemplate>>(() => {
    const base: Record<string, SmsTemplate> = {};
    for (const ev of SMS_EVENTS) {
      base[ev] = initialSmsTemplates?.[ev] ?? { en: "", yi: "" };
    }
    return base;
  });
  const [batchFeePopup, setBatchFeePopup] = useState(initialBatchFeePopup);
  const [smsSaving, setSmsSaving] = useState(false);
  const [smsSaved, setSmsSaved] = useState(false);

  function updatePreset(i: number, patch: Partial<PresetAmount>) {
    setPresets((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
    setPresetSaved(false);
  }

  async function savePresets() {
    setPresetSaving(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase
      .from("org_settings")
      .upsert({ org_id: orgId, preset_amounts: presets }, { onConflict: "org_id" });
    setPresetSaving(false);
    if (!error) {
      setPresetSaved(true);
      router.refresh();
    }
  }

  async function saveEmailTemplates() {
    setEmailSaving(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase
      .from("org_settings")
      .upsert({ org_id: orgId, email_templates: emailTemplates }, { onConflict: "org_id" });
    setEmailSaving(false);
    if (!error) {
      setEmailSaved(true);
      router.refresh();
    }
  }

  async function saveSmsTemplates() {
    setSmsSaving(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase
      .from("org_settings")
      .upsert(
        { org_id: orgId, sms_templates: smsTemplates, batch_fee_popup: batchFeePopup },
        { onConflict: "org_id" }
      );
    setSmsSaving(false);
    if (!error) {
      setSmsSaved(true);
      router.refresh();
    }
  }

  return (
    <div className="flex gap-6">
      <nav className="w-56 shrink-0 space-y-1">
        {SECTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(s)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              section === s ? "bg-brand-50 text-brand-700" : "text-ink/60 hover:bg-black/5"
            }`}
          >
            {s}
          </button>
        ))}
      </nav>

      <div className="flex-1 min-w-0 space-y-4">
        {section === "Preset Amount" && (
          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-ink/70">Preset donation amounts</h2>
            <p className="text-xs text-ink/50">
              These six amounts appear as quick-pick buttons on the donate page.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {presets.map((p, i) => (
                <div key={i} className="border border-black/10 rounded-lg p-3 space-y-2">
                  <div className="text-xs font-medium text-ink/40">Slot {i + 1}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">Amount</label>
                      <input
                        className="input"
                        type="number"
                        value={p.amount}
                        onChange={(e) => updatePreset(i, { amount: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="label">Title</label>
                      <input className="input" value={p.title} onChange={(e) => updatePreset(i, { title: e.target.value })} />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-ink/60">
                    <input
                      type="checkbox"
                      checked={p.has_schedule}
                      onChange={(e) => updatePreset(i, { has_schedule: e.target.checked })}
                    />
                    Set Schedule
                  </label>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button className="btn-primary" type="button" disabled={presetSaving} onClick={savePresets}>
                {presetSaving ? "Saving…" : "Save"}
              </button>
              {presetSaved && <span className="text-sm text-emerald-600">Saved.</span>}
            </div>
          </div>
        )}

        {section === "Send automatic Email" && (
          <div className="card p-6 space-y-6">
            <h2 className="text-sm font-semibold text-ink/70">Automatic email notifications</h2>
            {EMAIL_EVENTS.map((ev) => (
              <div key={ev} className="border border-black/10 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{ev}</span>
                  <label className="flex items-center gap-2 text-xs text-ink/60">
                    <input
                      type="checkbox"
                      checked={emailTemplates[ev]?.enabled ?? false}
                      onChange={(e) =>
                        setEmailTemplates((t) => ({ ...t, [ev]: { ...t[ev], enabled: e.target.checked } }))
                      }
                    />
                    Enabled
                  </label>
                </div>
                <textarea
                  className="input min-h-[90px]"
                  value={emailTemplates[ev]?.body ?? ""}
                  onChange={(e) => setEmailTemplates((t) => ({ ...t, [ev]: { ...t[ev], body: e.target.value } }))}
                />
                <p className="text-xs text-ink/40">Merge fields: {"{Amount}"}, {"{Campaign}"}, {"{Document URL}"}</p>
              </div>
            ))}
            <div className="flex items-center gap-3 pt-2">
              <button className="btn-primary" type="button" disabled={emailSaving} onClick={saveEmailTemplates}>
                {emailSaving ? "Saving…" : "Save"}
              </button>
              {emailSaved && <span className="text-sm text-emerald-600">Saved.</span>}
            </div>
          </div>
        )}

        {section === "Customize SMS messages" && (
          <div className="card p-6 space-y-6">
            <h2 className="text-sm font-semibold text-ink/70">SMS message templates</h2>
            {SMS_EVENTS.map((ev) => (
              <div key={ev} className="border border-black/10 rounded-lg p-3 space-y-2">
                <span className="text-sm font-medium text-ink">{ev}</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="label">English</label>
                    <textarea
                      className="input min-h-[80px]"
                      value={smsTemplates[ev]?.en ?? ""}
                      onChange={(e) => setSmsTemplates((t) => ({ ...t, [ev]: { ...t[ev], en: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label className="label">Yiddish / Hebrew</label>
                    <textarea
                      dir="rtl"
                      className="input min-h-[80px]"
                      value={smsTemplates[ev]?.yi ?? ""}
                      onChange={(e) => setSmsTemplates((t) => ({ ...t, [ev]: { ...t[ev], yi: e.target.value } }))}
                    />
                  </div>
                </div>
                <p className="text-xs text-ink/40">Merge fields: {"{Donor}"}, {"{Statement link}"}</p>
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm pt-2">
              <input type="checkbox" checked={batchFeePopup} onChange={(e) => setBatchFeePopup(e.target.checked)} />
              Display batch fee popup in batch
            </label>
            <div className="flex items-center gap-3 pt-2">
              <button className="btn-primary" type="button" disabled={smsSaving} onClick={saveSmsTemplates}>
                {smsSaving ? "Saving…" : "Save"}
              </button>
              {smsSaved && <span className="text-sm text-emerald-600">Saved.</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
