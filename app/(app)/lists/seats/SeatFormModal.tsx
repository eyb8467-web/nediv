"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { supabaseBrowser } from "@/lib/supabase/client";

type SeasonLite = { id: string; name: string };
type LocationLite = { id: string; name: string };
type DonorLite = { id: string; first_name: string | null; last_name: string | null };

export function SeatFormModal({
  open,
  onClose,
  orgId,
  seasons,
  locations,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  orgId: string;
  seasons: SeasonLite[];
  locations: LocationLite[];
  onCreated: (seat: any) => void;
}) {
  const [seatNumber, setSeatNumber] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [rowLabel, setRowLabel] = useState("");
  const [section, setSection] = useState("");
  const [donorId, setDonorId] = useState("");
  const [reservedStatus, setReservedStatus] = useState("Available");
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");
  const [seatPrice, setSeatPrice] = useState("");
  const [donors, setDonors] = useState<DonorLite[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("donors")
        .select("id,first_name,last_name")
        .eq("org_id", orgId)
        .order("last_name", { ascending: true })
        .limit(1000);
      if (!cancelled) setDonors((data ?? []) as DonorLite[]);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open, orgId]);

  function reset() {
    setSeatNumber("");
    setSeasonId("");
    setLocationId("");
    setRowLabel("");
    setSection("");
    setDonorId("");
    setReservedStatus("Available");
    setPaymentStatus("Unpaid");
    setSeatPrice("");
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!seatNumber.trim()) {
      setError("Seat number is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { data, error: err } = await supabase
      .from("seats")
      .insert({
        org_id: orgId,
        seat_number: seatNumber.trim(),
        season_id: seasonId || null,
        location_id: locationId || null,
        row_label: rowLabel || null,
        section: section || null,
        donor_id: donorId || null,
        reserved_status: reservedStatus,
        payment_status: paymentStatus,
        seat_price: seatPrice === "" ? 0 : Number(seatPrice),
      })
      .select("*, donors(first_name,last_name), locations(name), seat_seasons(name)")
      .single();
    setSaving(false);
    if (err || !data) {
      setError(err?.message ?? "Could not create seat.");
      return;
    }
    onCreated(data);
    reset();
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Seat">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Seat number</label>
          <input className="input" required value={seatNumber} onChange={(e) => setSeatNumber(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Season</label>
            <select className="input" value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
              <option value="">— None —</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <select className="input" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
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
            <label className="label">Row</label>
            <input className="input" value={rowLabel} onChange={(e) => setRowLabel(e.target.value)} />
          </div>
          <div>
            <label className="label">Section</label>
            <input className="input" value={section} onChange={(e) => setSection(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Donor</label>
          <select className="input" value={donorId} onChange={(e) => setDonorId(e.target.value)}>
            <option value="">— Unassigned —</option>
            {donors.map((d) => (
              <option key={d.id} value={d.id}>
                {[d.first_name, d.last_name].filter(Boolean).join(" ") || "(unnamed)"}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Reserved status</label>
            <select className="input" value={reservedStatus} onChange={(e) => setReservedStatus(e.target.value)}>
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
              <option value="Waiting">Waiting</option>
            </select>
          </div>
          <div>
            <label className="label">Payment status</label>
            <select className="input" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
            </select>
          </div>
          <div>
            <label className="label">Price ($)</label>
            <input className="input" type="number" step="any" value={seatPrice} onChange={(e) => setSeatPrice(e.target.value)} />
          </div>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Create Seat"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
