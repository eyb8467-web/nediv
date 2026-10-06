"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Modal } from "@/components/Modal";
import { Icon } from "@/components/Icon";

export type SeasonRow = { id: string; name: string; is_active: boolean | null };
export type RateRow = {
  id: string;
  location_id: string | null;
  section: string;
  category: string;
  price: number;
  locations: { name: string } | null;
};
type RefOption = { id: string; name: string };

const SUB_TABS = ["Maps", "Rates", "Settings"] as const;
type SubTab = (typeof SUB_TABS)[number];

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function SeatsClient({
  orgId,
  seasons,
  rates,
  locations,
}: {
  orgId: string;
  seasons: SeasonRow[];
  rates: RateRow[];
  locations: RefOption[];
}) {
  const router = useRouter();
  const [subTab, setSubTab] = useState<SubTab>("Rates");

  const [seasonOpen, setSeasonOpen] = useState(false);
  const [seasonName, setSeasonName] = useState("");
  const [seasonActive, setSeasonActive] = useState(true);
  const [seasonSaving, setSeasonSaving] = useState(false);
  const [seasonError, setSeasonError] = useState<string | null>(null);

  const [rateOpen, setRateOpen] = useState(false);
  const [rateForm, setRateForm] = useState({ location_id: "", section: "", category: "", price: "" });
  const [rateSaving, setRateSaving] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  const ratesByLocation = useMemo(() => {
    const groups: Record<string, { label: string; rows: RateRow[] }> = {};
    for (const r of rates) {
      const key = r.location_id ?? "none";
      const label = r.locations?.name ?? "Unassigned";
      if (!groups[key]) groups[key] = { label, rows: [] };
      groups[key].rows.push(r);
    }
    return Object.values(groups);
  }, [rates]);

  async function handleCreateSeason() {
    if (!seasonName.trim()) {
      setSeasonError("Season name is required.");
      return;
    }
    setSeasonSaving(true);
    setSeasonError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.from("seat_seasons").insert({
      org_id: orgId,
      name: seasonName,
      is_active: seasonActive,
    });
    setSeasonSaving(false);
    if (error) {
      setSeasonError(error.message);
      return;
    }
    setSeasonOpen(false);
    setSeasonName("");
    setSeasonActive(true);
    router.refresh();
  }

  function openRateModal() {
    setRateForm({ location_id: "", section: "", category: "", price: "" });
    setRateError(null);
    setRateOpen(true);
  }

  async function handleSaveRate() {
    if (!rateForm.section || !rateForm.category) {
      setRateError("Section and category are required.");
      return;
    }
    setRateSaving(true);
    setRateError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.from("seat_rates").insert({
      org_id: orgId,
      location_id: rateForm.location_id || null,
      section: rateForm.section,
      category: rateForm.category,
      price: Number(rateForm.price) || 0,
    });
    setRateSaving(false);
    if (error) {
      setRateError(error.message);
      return;
    }
    setRateOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 border-b border-black/10">
          {SUB_TABS.map((t) => (
            <button key={t} type="button" onClick={() => setSubTab(t)} className={`tab-link ${subTab === t ? "active" : ""}`}>
              {t}
            </button>
          ))}
        </div>
        <button className="btn-secondary" onClick={() => setSeasonOpen(true)}>
          <Icon name="plus" className="w-4 h-4" /> Create new Season
        </button>
      </div>

      {seasons.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {seasons.map((s) => (
            <span key={s.id} className={s.is_active ? "badge-green" : "badge-gray"}>
              {s.name}{s.is_active ? " (active)" : ""}
            </span>
          ))}
        </div>
      )}

      {subTab === "Maps" && (
        <div className="card p-8 text-center text-ink/50">
          No seat maps configured yet. Seat maps are managed from Lists ▸ Seats for now.
        </div>
      )}

      {subTab === "Rates" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary" onClick={openRateModal}>
              <Icon name="plus" className="w-4 h-4" /> Add category
            </button>
          </div>
          {ratesByLocation.length === 0 ? (
            <div className="card p-8 text-center text-ink/50">No seat rates configured yet.</div>
          ) : (
            ratesByLocation.map((group) => (
              <div key={group.label} className="card p-4">
                <h3 className="text-sm font-semibold text-ink/70 mb-3">{group.label}</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Section</th>
                      <th>Category</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.section}</td>
                        <td>{r.category}</td>
                        <td>{money(Number(r.price))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}

      {subTab === "Settings" && (
        <div className="card p-8 text-center text-ink/50">Setting Works here!</div>
      )}

      <Modal open={seasonOpen} onClose={() => setSeasonOpen(false)} title="Create new Season">
        <div className="space-y-3">
          <div>
            <label className="label">Season name</label>
            <input className="input" value={seasonName} onChange={(e) => setSeasonName(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={seasonActive} onChange={(e) => setSeasonActive(e.target.checked)} />
            Active season
          </label>
          {seasonError && <p className="text-sm text-rose-600">{seasonError}</p>}
          <div className="flex items-center gap-3 pt-2">
            <button className="btn-primary" type="button" disabled={seasonSaving} onClick={handleCreateSeason}>
              {seasonSaving ? "Saving…" : "Create"}
            </button>
            <button className="btn-secondary" type="button" onClick={() => setSeasonOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={rateOpen} onClose={() => setRateOpen(false)} title="Add category">
        <div className="space-y-3">
          <div>
            <label className="label">Location</label>
            <select className="input" value={rateForm.location_id} onChange={(e) => setRateForm((f) => ({ ...f, location_id: e.target.value }))}>
              <option value="">—</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Section</label>
            <input className="input" value={rateForm.section} onChange={(e) => setRateForm((f) => ({ ...f, section: e.target.value }))} />
          </div>
          <div>
            <label className="label">Category</label>
            <input className="input" placeholder="e.g. First Row" value={rateForm.category} onChange={(e) => setRateForm((f) => ({ ...f, category: e.target.value }))} />
          </div>
          <div>
            <label className="label">Price</label>
            <input className="input" type="number" step="0.01" value={rateForm.price} onChange={(e) => setRateForm((f) => ({ ...f, price: e.target.value }))} />
          </div>
          {rateError && <p className="text-sm text-rose-600">{rateError}</p>}
          <div className="flex items-center gap-3 pt-2">
            <button className="btn-primary" type="button" disabled={rateSaving} onClick={handleSaveRate}>
              {rateSaving ? "Saving…" : "Save"}
            </button>
            <button className="btn-secondary" type="button" onClick={() => setRateOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
