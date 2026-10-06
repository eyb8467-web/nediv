"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Modal } from "@/components/Modal";
import type { MemberRow, RefOption } from "./UsersClient";

const TABS = ["User info", "Lists", "Other", "Selected Data"] as const;
type Tab = (typeof TABS)[number];

const LIST_PERM_KEYS: { key: string; label: string }[] = [
  { key: "donors", label: "Donors" },
  { key: "reasons", label: "Reasons" },
  { key: "campaigns", label: "Campaigns" },
  { key: "locations", label: "Locations" },
  { key: "collectors", label: "Collectors" },
  { key: "users", label: "Users" },
  { key: "seats", label: "Seats" },
  { key: "sources", label: "Sources" },
];

const OTHER_PERM_KEYS: { key: string; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "notifications", label: "Notifications" },
  { key: "query_reports", label: "Query Reports" },
  { key: "custom_reports", label: "Custom Reports" },
  { key: "admin", label: "Admin" },
];

function optionLabel(o: RefOption) {
  return o.name ?? o.full_name ?? o.id;
}

export function EditUserModal({
  orgId,
  member,
  reasons,
  collectors,
  locations,
  campaigns,
  sources,
  onClose,
}: {
  orgId: string;
  member: MemberRow;
  reasons: RefOption[];
  collectors: RefOption[];
  locations: RefOption[];
  campaigns: RefOption[];
  sources: RefOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("User info");
  const [title, setTitle] = useState(member.title ?? "");
  const [phone, setPhone] = useState(member.phone ?? "");
  const [perms, setPerms] = useState<Record<string, boolean>>({ ...member.perms });
  const [scopedReasons, setScopedReasons] = useState<string[]>(member.scoped_reasons ?? []);
  const [scopedCollectors, setScopedCollectors] = useState<string[]>(member.scoped_collectors ?? []);
  const [scopedLocations, setScopedLocations] = useState<string[]>(member.scoped_locations ?? []);
  const [scopedCampaigns, setScopedCampaigns] = useState<string[]>(member.scoped_campaigns ?? []);
  const [scopedSources, setScopedSources] = useState<string[]>(member.scoped_sources ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePerm(key: string) {
    setPerms((p) => ({ ...p, [key]: !p[key] }));
  }

  function selectedValues(e: React.ChangeEvent<HTMLSelectElement>) {
    return Array.from(e.target.selectedOptions).map((o: HTMLOptionElement) => o.value);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error: updateError } = await supabase
      .from("memberships")
      .update({
        title: title || null,
        phone: phone || null,
        perms,
        scoped_reasons: scopedReasons.length ? scopedReasons : null,
        scoped_collectors: scopedCollectors.length ? scopedCollectors : null,
        scoped_locations: scopedLocations.length ? scopedLocations : null,
        scoped_campaigns: scopedCampaigns.length ? scopedCampaigns : null,
        scoped_sources: scopedSources.length ? scopedSources : null,
      })
      .eq("id", member.id)
      .eq("org_id", orgId);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={`Member ${member.user_id.slice(0, 8)}`} wide>
      <div className="flex gap-1 border-b border-black/10 mb-4">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`tab-link ${tab === t ? "active" : ""}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "User info" && (
        <div className="space-y-4 max-w-sm">
          <p className="text-xs text-ink/50">
            Name and email belong to the member's login account and aren't editable here.
          </p>
          <div>
            <label className="label">Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="label">Role</label>
            <p className="text-sm text-ink/70 capitalize">{member.role}</p>
          </div>
        </div>
      )}

      {tab === "Lists" && (
        <div className="grid grid-cols-2 gap-2">
          {LIST_PERM_KEYS.map((k) => (
            <label key={k.key} className="flex items-center gap-2 text-sm py-1">
              <input type="checkbox" checked={!!perms[k.key]} onChange={() => togglePerm(k.key)} />
              {k.label}
            </label>
          ))}
        </div>
      )}

      {tab === "Other" && (
        <div className="grid grid-cols-2 gap-2">
          {OTHER_PERM_KEYS.map((k) => (
            <label key={k.key} className="flex items-center gap-2 text-sm py-1">
              <input type="checkbox" checked={!!perms[k.key]} onChange={() => togglePerm(k.key)} />
              {k.label}
            </label>
          ))}
        </div>
      )}

      {tab === "Selected Data" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Reasons (blank = all)</label>
            <select
              multiple
              className="input h-32"
              value={scopedReasons}
              onChange={(e) => setScopedReasons(selectedValues(e))}
            >
              {reasons.map((r) => (
                <option key={r.id} value={r.id}>{optionLabel(r)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Collectors (blank = all)</label>
            <select
              multiple
              className="input h-32"
              value={scopedCollectors}
              onChange={(e) => setScopedCollectors(selectedValues(e))}
            >
              {collectors.map((r) => (
                <option key={r.id} value={r.id}>{optionLabel(r)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Locations (blank = all)</label>
            <select
              multiple
              className="input h-32"
              value={scopedLocations}
              onChange={(e) => setScopedLocations(selectedValues(e))}
            >
              {locations.map((r) => (
                <option key={r.id} value={r.id}>{optionLabel(r)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Campaigns (blank = all)</label>
            <select
              multiple
              className="input h-32"
              value={scopedCampaigns}
              onChange={(e) => setScopedCampaigns(selectedValues(e))}
            >
              {campaigns.map((r) => (
                <option key={r.id} value={r.id}>{optionLabel(r)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Sources (blank = all)</label>
            <select
              multiple
              className="input h-32"
              value={scopedSources}
              onChange={(e) => setScopedSources(selectedValues(e))}
            >
              {sources.map((r) => (
                <option key={r.id} value={r.id}>{optionLabel(r)}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-rose-600 mt-4">{error}</p>}
      <div className="flex items-center gap-3 pt-5 mt-5 border-t border-black/10">
        <button className="btn-primary" type="button" disabled={saving} onClick={handleSave}>
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button className="btn-secondary" type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
