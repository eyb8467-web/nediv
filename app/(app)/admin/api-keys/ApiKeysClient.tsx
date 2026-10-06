"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { DataTable, Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { Icon } from "@/components/Icon";

export type ApiKeyRow = {
  id: string;
  account_name: string;
  api_type: string | null;
  gateway: string;
  currency: string | null;
  campaign_id: string | null;
  reason_id: string | null;
  api_key_masked: string | null;
  pin_masked: string | null;
  merchant_id: string | null;
  country: string | null;
  campaigns: { name: string } | null;
  reasons: { name: string } | null;
};

type RefOption = { id: string; name: string };

const EMPTY_FORM = {
  account_name: "",
  api_type: "Default",
  gateway: "",
  currency: "USD",
  campaign_id: "",
  reason_id: "",
  api_key_masked: "",
  pin_masked: "",
  merchant_id: "",
  country: "US",
};

export function ApiKeysClient({
  orgId,
  apiKeys,
  campaigns,
  reasons,
}: {
  orgId: string;
  apiKeys: ApiKeyRow[];
  campaigns: RefOption[];
  reasons: RefOption[];
}) {
  const router = useRouter();
  const [subTab, setSubTab] = useState<"Default Keys" | "Advanced Keys">("Default Keys");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const wantType = subTab === "Default Keys" ? "Default" : "Advanced";
    return apiKeys.filter((k) => (k.api_type || "Default") === wantType);
  }, [apiKeys, subTab]);

  const columns: Column<ApiKeyRow>[] = [
    { key: "account_name", header: "Account Name" },
    { key: "api_type", header: "API Type", render: (r) => r.api_type || "Default" },
    { key: "gateway", header: "Gateway" },
    { key: "currency", header: "Currency", render: (r) => r.currency || "USD" },
    { key: "campaign", header: "Campaign", render: (r) => r.campaigns?.name || <span className="text-ink/30">—</span> },
    { key: "reason", header: "Reason", render: (r) => r.reasons?.name || <span className="text-ink/30">—</span> },
    { key: "api_key_masked", header: "API Key", render: (r) => r.api_key_masked || <span className="text-ink/30">—</span> },
    { key: "pin_masked", header: "PIN", render: (r) => r.pin_masked || <span className="text-ink/30">—</span> },
    { key: "merchant_id", header: "Merchant ID", render: (r) => r.merchant_id || <span className="text-ink/30">—</span> },
    { key: "country", header: "Country", render: (r) => r.country || "US" },
  ];

  function openNew() {
    setForm({ ...EMPTY_FORM, api_type: subTab === "Default Keys" ? "Default" : "Advanced" });
    setError(null);
    setOpen(true);
  }

  async function handleSave() {
    if (!form.account_name || !form.gateway) {
      setError("Account name and gateway are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error: insertError } = await supabase.from("api_keys").insert({
      org_id: orgId,
      account_name: form.account_name,
      api_type: form.api_type,
      gateway: form.gateway,
      currency: form.currency || "USD",
      campaign_id: form.campaign_id || null,
      reason_id: form.reason_id || null,
      api_key_masked: form.api_key_masked || null,
      pin_masked: form.pin_masked || null,
      merchant_id: form.merchant_id || null,
      country: form.country || "US",
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 border-b border-black/10">
          {(["Default Keys", "Advanced Keys"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setSubTab(t)} className={`tab-link ${subTab === t ? "active" : ""}`}>
              {t}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={openNew}>
          <Icon name="plus" className="w-4 h-4" /> New
        </button>
      </div>

      <DataTable columns={columns} rows={filtered} emptyLabel={`No ${subTab.toLowerCase()} configured yet.`} />

      <Modal open={open} onClose={() => setOpen(false)} title="New API Key">
        <div className="space-y-3">
          <div>
            <label className="label">Account Name</label>
            <input className="input" value={form.account_name} onChange={(e) => setForm((f) => ({ ...f, account_name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">API Type</label>
              <select className="input" value={form.api_type} onChange={(e) => setForm((f) => ({ ...f, api_type: e.target.value }))}>
                <option value="Default">Default</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="label">Gateway</label>
              <input className="input" placeholder="e.g. Stripe, IATS" value={form.gateway} onChange={(e) => setForm((f) => ({ ...f, gateway: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Currency</label>
              <input className="input" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
            </div>
            <div>
              <label className="label">Country</label>
              <input className="input" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Campaign</label>
              <select className="input" value={form.campaign_id} onChange={(e) => setForm((f) => ({ ...f, campaign_id: e.target.value }))}>
                <option value="">—</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Reason</label>
              <select className="input" value={form.reason_id} onChange={(e) => setForm((f) => ({ ...f, reason_id: e.target.value }))}>
                <option value="">—</option>
                {reasons.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">API Key</label>
            <input className="input" placeholder="•••1234" value={form.api_key_masked} onChange={(e) => setForm((f) => ({ ...f, api_key_masked: e.target.value }))} />
            <p className="text-xs text-ink/40 mt-1">
              For your security, only enter a masked reference (e.g. last 4 digits) — Nediv does not store real
              gateway credentials in this preview.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">PIN</label>
              <input className="input" placeholder="••••" value={form.pin_masked} onChange={(e) => setForm((f) => ({ ...f, pin_masked: e.target.value }))} />
            </div>
            <div>
              <label className="label">Merchant ID</label>
              <input className="input" value={form.merchant_id} onChange={(e) => setForm((f) => ({ ...f, merchant_id: e.target.value }))} />
            </div>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex items-center gap-3 pt-2">
            <button className="btn-primary" type="button" disabled={saving} onClick={handleSave}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button className="btn-secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
