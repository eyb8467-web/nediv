"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { DataTable, Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { Icon } from "@/components/Icon";

export type FieldType = "text" | "number" | "select" | "checkbox" | "textarea";

export type FieldConfig = {
  name: string;
  label: string;
  type?: FieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
};

/**
 * Generic client-side CRUD manager for the simple /lists tables (reasons, campaigns,
 * locations, collectors, sources): a search box, a DataTable, and a create/edit Modal
 * built from a field config, all against a single named table.
 */
export function SimpleListManager({
  table,
  orgId,
  columns,
  fields,
  initialRows,
  newLabel,
  modalTitleNew,
  modalTitleEdit,
  searchPlaceholder = "Search…",
  searchKeys,
}: {
  table: string;
  orgId: string;
  columns: Column<any>[];
  fields: FieldConfig[];
  initialRows: any[];
  newLabel: string;
  modalTitleNew: string;
  modalTitleEdit: string;
  searchPlaceholder?: string;
  searchKeys?: string[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keys = searchKeys ?? fields.filter((f) => (f.type ?? "text") !== "checkbox").map((f) => f.name);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return initialRows;
    return initialRows.filter((row) =>
      keys.some((k) => String(row[k] ?? "").toLowerCase().includes(q))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, initialRows]);

  function defaultsForm() {
    const d: Record<string, any> = {};
    for (const f of fields) {
      d[f.name] = f.defaultValue ?? ((f.type ?? "text") === "checkbox" ? false : "");
    }
    return d;
  }

  function openCreate() {
    setEditingRow(null);
    setForm(defaultsForm());
    setError(null);
    setModalOpen(true);
  }

  function openEdit(row: any) {
    setEditingRow(row);
    const f: Record<string, any> = {};
    for (const fc of fields) {
      const v = row[fc.name];
      f[fc.name] = (fc.type ?? "text") === "checkbox" ? Boolean(v) : v ?? "";
    }
    setForm(f);
    setError(null);
    setModalOpen(true);
  }

  function handleChange(name: string, value: any) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function buildPayload() {
    const payload: Record<string, any> = {};
    for (const f of fields) {
      const type = f.type ?? "text";
      const raw = form[f.name];
      if (type === "checkbox") {
        payload[f.name] = Boolean(raw);
      } else if (type === "number") {
        payload[f.name] = raw === "" || raw === null || raw === undefined ? null : Number(raw);
      } else {
        payload[f.name] = raw === "" ? null : raw;
      }
    }
    return payload;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = supabaseBrowser();
    const payload = buildPayload();
    if (editingRow) {
      const { error: err } = await supabase.from(table).update(payload).eq("id", editingRow.id).eq("org_id", orgId);
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: err } = await supabase.from(table).insert({ ...payload, org_id: orgId });
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    setModalOpen(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!editingRow) return;
    if (!confirm("Delete this record? This cannot be undone.")) return;
    setSaving(true);
    const supabase = supabaseBrowser();
    const { error: err } = await supabase.from(table).delete().eq("id", editingRow.id).eq("org_id", orgId);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setModalOpen(false);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="relative flex-1 max-w-sm">
          <Icon name="search" className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            className="input pl-8"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={openCreate} type="button">
          <Icon name="plus" className="w-4 h-4" />
          {newLabel}
        </button>
      </div>

      <DataTable columns={columns} rows={filteredRows} onRowClick={openEdit} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingRow ? modalTitleEdit : modalTitleNew}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {fields.map((f) => (
            <FieldInput key={f.name} field={f} value={form[f.name]} onChange={(v) => handleChange(f.name, v)} />
          ))}
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex items-center justify-between pt-2">
            {editingRow ? (
              <button type="button" onClick={handleDelete} className="btn-ghost text-rose-600">
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: any;
  onChange: (v: any) => void;
}) {
  const type = field.type ?? "text";
  if (type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        {field.label}
      </label>
    );
  }
  if (type === "select") {
    return (
      <div>
        <label className="label">{field.label}</label>
        <select className="input" required={field.required} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">— Select —</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (type === "textarea") {
    return (
      <div>
        <label className="label">{field.label}</label>
        <textarea
          className="input"
          rows={3}
          required={field.required}
          placeholder={field.placeholder}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }
  return (
    <div>
      <label className="label">{field.label}</label>
      <input
        className="input"
        type={type === "number" ? "number" : "text"}
        step={type === "number" ? "any" : undefined}
        required={field.required}
        placeholder={field.placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
