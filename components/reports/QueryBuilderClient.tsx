"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Modal } from "@/components/Modal";
import { DataTable, Column } from "@/components/DataTable";
import { Icon } from "@/components/Icon";
import { buildCsv, downloadCsv } from "@/lib/csv";

type SavedQuery = {
  id: string;
  name: string;
  fields: string[];
  filters: any;
  created_at: string;
};

type FilterRow = { field: string; operator: "equals" | "contains"; value: string };

const DONOR_FIELDS: { key: string; label: string }[] = [
  { key: "acct_number", label: "Account #" },
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "zip", label: "Zip" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "group", label: "Group" },
  { key: "member_type", label: "Member Type" },
  { key: "status", label: "Status" },
];

const FIELD_LABEL: Record<string, string> = Object.fromEntries(DONOR_FIELDS.map((f) => [f.key, f.label]));

function emptyForm() {
  return {
    name: "",
    checked: {} as Record<string, boolean>,
    address: "",
    city: "",
    zip: "",
    filterRows: [] as FilterRow[],
  };
}

export function QueryBuilderClient({
  orgId,
  userId,
  initialQueries,
}: {
  orgId: string;
  userId: string;
  initialQueries: SavedQuery[];
}) {
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [selectedQuery, setSelectedQuery] = useState<SavedQuery | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  function toggleField(key: string) {
    setForm((f) => ({ ...f, checked: { ...f.checked, [key]: !f.checked[key] } }));
  }

  function addFilterRow() {
    setForm((f) => ({
      ...f,
      filterRows: [...f.filterRows, { field: DONOR_FIELDS[0].key, operator: "equals", value: "" }],
    }));
  }

  function updateFilterRow(idx: number, patch: Partial<FilterRow>) {
    setForm((f) => ({
      ...f,
      filterRows: f.filterRows.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    }));
  }

  function removeFilterRow(idx: number) {
    setForm((f) => ({ ...f, filterRows: f.filterRows.filter((_, i) => i !== idx) }));
  }

  async function runQuery(q: SavedQuery) {
    setSelectedQuery(q);
    setRunning(true);
    setRunError(null);
    setResults([]);

    const displayFields = q.fields && q.fields.length ? q.fields : ["first_name", "last_name"];
    const selectFields = Array.from(new Set(["id", ...displayFields]));

    const supabase = supabaseBrowser();
    let query = supabase.from("donors").select(selectFields.join(",")).eq("org_id", orgId);

    const filters: any[] = Array.isArray(q.filters) ? q.filters : [];
    for (const f of filters) {
      if (!f || !f.field || f.value === undefined || f.value === null || f.value === "") continue;
      if (f.operator === "contains") {
        query = query.ilike(f.field, `%${f.value}%`);
      } else {
        query = query.eq(f.field, f.value);
      }
    }

    const { data, error } = await query.limit(500);
    setRunning(false);
    if (error) {
      setRunError(error.message);
      return;
    }
    setResults((data ?? []) as any[]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setSaveError("Query name is required.");
      return;
    }
    const fields = DONOR_FIELDS.filter((f) => form.checked[f.key]).map((f) => f.key);
    if (fields.length === 0) {
      setSaveError("Choose at least one field to display.");
      return;
    }

    const filters: FilterRow[] = [];
    if (form.address.trim()) filters.push({ field: "address", operator: "contains", value: form.address.trim() });
    if (form.city.trim()) filters.push({ field: "city", operator: "contains", value: form.city.trim() });
    if (form.zip.trim()) filters.push({ field: "zip", operator: "equals", value: form.zip.trim() });
    for (const row of form.filterRows) {
      if (row.field && row.value.trim()) filters.push({ field: row.field, operator: row.operator, value: row.value.trim() });
    }

    setSaving(true);
    setSaveError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.from("saved_queries").insert({
      org_id: orgId,
      name: form.name.trim(),
      fields,
      filters,
      created_by: userId,
    });
    setSaving(false);
    if (error) {
      setSaveError(error.message);
      return;
    }
    setModalOpen(false);
    setForm(emptyForm());
    router.refresh();
  }

  const columns: Column<any>[] = selectedQuery
    ? selectedQuery.fields.map((key) => ({
        key,
        header: FIELD_LABEL[key] ?? key,
      }))
    : [];

  function exportCsv() {
    if (!selectedQuery || results.length === 0) return;
    const headers = selectedQuery.fields.map((k) => FIELD_LABEL[k] ?? k);
    const rows = results.map((r) => selectedQuery.fields.map((k) => r[k] ?? ""));
    downloadCsv(`${selectedQuery.name || "query-report"}.csv`, buildCsv(headers, rows));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink/60 uppercase tracking-wide">Saved Queries</h2>
          </div>
          <button className="btn-primary w-full mb-3" onClick={() => setModalOpen(true)}>
            <Icon name="plus" className="w-4 h-4" /> New Query
          </button>
          <ul className="space-y-1">
            {initialQueries.length === 0 && <li className="text-sm text-ink/40 py-4 text-center">No saved queries yet.</li>}
            {initialQueries.map((q) => (
              <li key={q.id}>
                <button
                  onClick={() => runQuery(q)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-brand-50 ${
                    selectedQuery?.id === q.id ? "bg-brand-50 text-brand-700 font-medium" : "text-ink/80"
                  }`}
                >
                  {q.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lg:col-span-3 space-y-3">
        {!selectedQuery ? (
          <div className="card p-10 text-center text-sm text-ink/40">
            Select a saved query on the left to run it, or create a new one.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink">{selectedQuery.name}</h2>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => runQuery(selectedQuery)} disabled={running}>
                  {running ? "Running…" : "Run"}
                </button>
                <button className="btn-secondary" onClick={exportCsv} disabled={results.length === 0}>
                  <Icon name="download" className="w-4 h-4" /> Export to CSV
                </button>
              </div>
            </div>
            {runError && <p className="text-sm text-rose-600">{runError}</p>}
            <DataTable columns={columns} rows={results} emptyLabel={running ? "Running…" : "No results."} />
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Saved Query" wide>
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="label">Query Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Active donors in Brooklyn"
            />
          </div>

          <div>
            <label className="label">Fields to Be Displayed</label>
            <div className="grid grid-cols-3 gap-2">
              {DONOR_FIELDS.map((f) => (
                <label key={f.key} className="flex items-center gap-2 text-sm text-ink/80">
                  <input type="checkbox" checked={!!form.checked[f.key]} onChange={() => toggleField(f.key)} />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Quick Filters</label>
            <div className="grid grid-cols-3 gap-3">
              <input
                className="input"
                placeholder="Address contains…"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
              <input
                className="input"
                placeholder="City contains…"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Zip equals…"
                value={form.zip}
                onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Additional Filters</label>
              <button type="button" className="btn-ghost text-xs" onClick={addFilterRow}>
                <Icon name="plus" className="w-3.5 h-3.5" /> Add filter
              </button>
            </div>
            <div className="space-y-2">
              {form.filterRows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    className="input"
                    value={row.field}
                    onChange={(e) => updateFilterRow(idx, { field: e.target.value })}
                  >
                    {DONOR_FIELDS.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="input max-w-[140px]"
                    value={row.operator}
                    onChange={(e) => updateFilterRow(idx, { operator: e.target.value as FilterRow["operator"] })}
                  >
                    <option value="equals">equals</option>
                    <option value="contains">contains</option>
                  </select>
                  <input
                    className="input"
                    placeholder="Value"
                    value={row.value}
                    onChange={(e) => updateFilterRow(idx, { value: e.target.value })}
                  />
                  <button type="button" className="btn-ghost" onClick={() => removeFilterRow(idx)}>
                    <Icon name="x" className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {form.filterRows.length === 0 && <p className="text-xs text-ink/40">No additional filters.</p>}
            </div>
          </div>

          {saveError && <p className="text-sm text-rose-600">{saveError}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save Query"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
