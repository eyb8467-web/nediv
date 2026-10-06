"use client";

import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { DataTable, Column } from "@/components/DataTable";
import { Icon } from "@/components/Icon";
import { Donor } from "@/lib/types";
import { DonorFormModal } from "./DonorFormModal";
import { DonorEditModal } from "./DonorEditModal";

export type LocationLite = { id: string; name: string };
export type TagRow = { id: string; org_id: string; name: string };
export type CustomFieldRow = { id: string; org_id: string; name: string; field_type: string; options: string[] | null };

export function DonorsClient({
  orgId,
  initialRows,
  initialCount,
  locations,
  tags,
  customFields,
}: {
  orgId: string;
  initialRows: Donor[];
  initialCount: number;
  locations: LocationLite[];
  tags: TagRow[];
  customFields: CustomFieldRow[];
}) {
  const [rows, setRows] = useState<Donor[]>(initialRows);
  const [count, setCount] = useState<number>(initialCount);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);

  const locationsById = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of locations) m.set(l.id, l.name);
    return m;
  }, [locations]);

  async function reload() {
    setSearching(true);
    const supabase = supabaseBrowser();
    const q = search.trim();
    let query = supabase.from("donors").select("*", { count: "exact" }).eq("org_id", orgId);
    if (q) {
      const term = `%${q.replace(/[%,]/g, "")}%`;
      query = query.or(
        `first_name.ilike.${term},last_name.ilike.${term},family_name.ilike.${term},acct_number.ilike.${term}`
      );
    }
    query = query.order("created_at", { ascending: false }).limit(200);
    const { data, count: c } = await query;
    setRows((data ?? []) as Donor[]);
    setCount(c ?? 0);
    setSearching(false);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    reload();
  }

  function handleCreated(donor: Donor) {
    setRows((prev) => [donor, ...prev]);
    setCount((c) => c + 1);
    setShowCreate(false);
  }

  function handleUpdated(donor: Donor) {
    setRows((prev) => prev.map((r) => (r.id === donor.id ? { ...r, ...donor } : r)));
    setEditingDonor((prev) => (prev && prev.id === donor.id ? { ...prev, ...donor } : prev));
  }

  const columns: Column<Donor>[] = [
    { key: "acct_number", header: "Acct #", render: (d) => d.acct_number || "—" },
    {
      key: "name",
      header: "Name",
      render: (d) => (
        <div>
          <div className="font-medium text-ink">
            {[d.first_name, d.last_name].filter(Boolean).join(" ") || "—"}
          </div>
          {d.family_name && <div className="text-xs text-ink/40">{d.family_name}</div>}
        </div>
      ),
    },
    { key: "city", header: "City", render: (d) => d.city || "—" },
    { key: "phone", header: "Phone", render: (d) => d.phone || "—" },
    { key: "email", header: "Email", render: (d) => d.email || "—" },
    {
      key: "default_location_id",
      header: "Default Location",
      render: (d) => (d.default_location_id ? locationsById.get(d.default_location_id) ?? "—" : "—"),
    },
    {
      key: "status",
      header: "Status",
      render: (d) => <span className={d.status === "Active" ? "badge-green" : "badge-gray"}>{d.status ?? "—"}</span>,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-sm font-semibold text-ink/60 uppercase tracking-wide">Donors ({count.toLocaleString()})</h2>
        <div className="flex items-center gap-3 flex-1 justify-end flex-wrap">
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs">
            <Icon name="search" className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/30" />
            <input
              className="input pl-8"
              placeholder="Search name or acct #…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <button className="btn-secondary" type="button" onClick={reload} disabled={searching}>
            {searching ? "Searching…" : "Search"}
          </button>
          <button className="btn-primary" type="button" onClick={() => setShowCreate(true)}>
            <Icon name="plus" className="w-4 h-4" />+ New Donor
          </button>
        </div>
      </div>

      <DataTable columns={columns} rows={rows} onRowClick={(d) => setEditingDonor(d)} emptyLabel="No donors found." />

      <DonorFormModal open={showCreate} onClose={() => setShowCreate(false)} orgId={orgId} onCreated={handleCreated} />

      {editingDonor && (
        <DonorEditModal
          key={editingDonor.id}
          open={!!editingDonor}
          onClose={() => setEditingDonor(null)}
          donor={editingDonor}
          orgId={orgId}
          locations={locations}
          tags={tags}
          customFields={customFields}
          onSaved={handleUpdated}
        />
      )}
    </div>
  );
}
