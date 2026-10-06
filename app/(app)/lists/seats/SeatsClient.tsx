"use client";

import { useMemo, useState } from "react";
import { DataTable, Column } from "@/components/DataTable";
import { Icon } from "@/components/Icon";
import { SeatFormModal } from "./SeatFormModal";

type SeasonLite = { id: string; name: string };
type LocationLite = { id: string; name: string };

function money(n: number | null | undefined) {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function SeatsClient({
  orgId,
  initialRows,
  seasons,
  locations,
}: {
  orgId: string;
  initialRows: any[];
  seasons: SeasonLite[];
  locations: LocationLite[];
}) {
  const [rows, setRows] = useState<any[]>(initialRows);
  const [seasonFilter, setSeasonFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (seasonFilter && r.season_id !== seasonFilter) return false;
      if (locationFilter && r.location_id !== locationFilter) return false;
      return true;
    });
  }, [rows, seasonFilter, locationFilter]);

  function handleCreated(seat: any) {
    setRows((prev) => [seat, ...prev]);
    setShowCreate(false);
  }

  const columns: Column<any>[] = [
    { key: "seat_number", header: "Seat #" },
    { key: "location", header: "Location", render: (r) => r.locations?.name ?? "—" },
    { key: "row_label", header: "Row", render: (r) => r.row_label ?? "—" },
    { key: "section", header: "Section", render: (r) => r.section ?? "—" },
    {
      key: "donor",
      header: "Donor",
      render: (r) => (r.donors ? [r.donors.first_name, r.donors.last_name].filter(Boolean).join(" ") : "—"),
    },
    {
      key: "reserved_status",
      header: "Reserved",
      render: (r) => {
        const cls = r.reserved_status === "Reserved" ? "badge-green" : r.reserved_status === "Waiting" ? "badge-amber" : "badge-gray";
        return <span className={cls}>{r.reserved_status ?? "—"}</span>;
      },
    },
    {
      key: "payment_status",
      header: "Payment",
      render: (r) => {
        const cls = r.payment_status === "Paid" ? "badge-green" : r.payment_status === "Partial" ? "badge-amber" : "badge-red";
        return <span className={cls}>{r.payment_status ?? "—"}</span>;
      },
    },
    { key: "seat_price", header: "Price", render: (r) => money(r.seat_price) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <select className="input !w-auto" value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)}>
            <option value="">All Seasons</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select className="input !w-auto" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
            <option value="">All Locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary" type="button" onClick={() => setShowCreate(true)}>
          <Icon name="plus" className="w-4 h-4" />+ New Seat
        </button>
      </div>

      <DataTable columns={columns} rows={filteredRows} emptyLabel="No seats found." />

      <SeatFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        orgId={orgId}
        seasons={seasons}
        locations={locations}
        onCreated={handleCreated}
      />
    </div>
  );
}
