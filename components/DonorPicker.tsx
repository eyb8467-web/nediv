"use client";

import { useMemo, useState } from "react";

export type DonorOption = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

export function donorLabel(d: DonorOption | null | undefined) {
  if (!d) return "—";
  return `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() || "(unnamed donor)";
}

/**
 * Simple searchable donor picker: a text filter over an already-fetched donor list
 * (first 200 donors, per CONVENTIONS) narrowed down to a <select>.
 */
export function DonorPicker({
  donors,
  value,
  onChange,
  required = false,
}: {
  donors: DonorOption[];
  value: string;
  onChange: (donorId: string) => void;
  required?: boolean;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return donors;
    return donors.filter((d) => donorLabel(d).toLowerCase().includes(q));
  }, [donors, query]);

  return (
    <div className="space-y-1">
      <input
        type="text"
        className="input"
        placeholder="Search donor by name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">Select donor…</option>
        {filtered.map((d) => (
          <option key={d.id} value={d.id}>
            {donorLabel(d)}
          </option>
        ))}
      </select>
    </div>
  );
}
