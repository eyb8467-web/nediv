"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { DataTable, Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { Icon } from "@/components/Icon";

export type CustomFieldRow = {
  id: string;
  name: string;
  field_type: string;
  options: string[] | null;
};
export type TagRow = { id: string; name: string };

const SUB_TABS = ["Custom fields", "Tags"] as const;
type SubTab = (typeof SUB_TABS)[number];

const FIELD_TYPES = ["text", "number", "date", "boolean", "select"];

export function AdvancedFieldsClient({
  orgId,
  customFields,
  tags,
}: {
  orgId: string;
  customFields: CustomFieldRow[];
  tags: TagRow[];
}) {
  const router = useRouter();
  const [subTab, setSubTab] = useState<SubTab>("Custom fields");

  const [fieldOpen, setFieldOpen] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [fieldOptions, setFieldOptions] = useState("");
  const [fieldSaving, setFieldSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const [tagOpen, setTagOpen] = useState(false);
  const [tagName, setTagName] = useState("");
  const [tagSaving, setTagSaving] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);

  const fieldColumns: Column<CustomFieldRow>[] = [
    { key: "name", header: "Name" },
    { key: "field_type", header: "Type", render: (r) => <span className="capitalize">{r.field_type}</span> },
    {
      key: "options",
      header: "Options",
      render: (r) => (r.options && r.options.length ? r.options.join(", ") : <span className="text-ink/30">—</span>),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <button
          className="text-rose-600 text-xs hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            deleteCustomField(r.id);
          }}
        >
          Delete
        </button>
      ),
    },
  ];

  const tagColumns: Column<TagRow>[] = [
    { key: "name", header: "Name" },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <button
          className="text-rose-600 text-xs hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            deleteTag(r.id);
          }}
        >
          Delete
        </button>
      ),
    },
  ];

  function openFieldModal() {
    setFieldName("");
    setFieldType("text");
    setFieldOptions("");
    setFieldError(null);
    setFieldOpen(true);
  }

  async function handleSaveField() {
    if (!fieldName.trim()) {
      setFieldError("Name is required.");
      return;
    }
    setFieldSaving(true);
    setFieldError(null);
    const supabase = supabaseBrowser();
    const options =
      fieldType === "select"
        ? fieldOptions.split(",").map((o) => o.trim()).filter(Boolean)
        : null;
    const { error } = await supabase.from("custom_fields").insert({
      org_id: orgId,
      name: fieldName,
      field_type: fieldType,
      options,
    });
    setFieldSaving(false);
    if (error) {
      setFieldError(error.message);
      return;
    }
    setFieldOpen(false);
    router.refresh();
  }

  async function deleteCustomField(id: string) {
    const supabase = supabaseBrowser();
    await supabase.from("custom_fields").delete().eq("id", id).eq("org_id", orgId);
    router.refresh();
  }

  function openTagModal() {
    setTagName("");
    setTagError(null);
    setTagOpen(true);
  }

  async function handleSaveTag() {
    if (!tagName.trim()) {
      setTagError("Name is required.");
      return;
    }
    setTagSaving(true);
    setTagError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.from("tags").insert({ org_id: orgId, name: tagName });
    setTagSaving(false);
    if (error) {
      setTagError(error.message);
      return;
    }
    setTagOpen(false);
    router.refresh();
  }

  async function deleteTag(id: string) {
    const supabase = supabaseBrowser();
    await supabase.from("tags").delete().eq("id", id).eq("org_id", orgId);
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
        {subTab === "Custom fields" ? (
          <button className="btn-primary" onClick={openFieldModal}>
            <Icon name="plus" className="w-4 h-4" /> Add Field
          </button>
        ) : (
          <button className="btn-primary" onClick={openTagModal}>
            <Icon name="plus" className="w-4 h-4" /> Add tag
          </button>
        )}
      </div>

      {subTab === "Custom fields" ? (
        <DataTable columns={fieldColumns} rows={customFields} emptyLabel="No custom fields yet." />
      ) : (
        <DataTable columns={tagColumns} rows={tags} emptyLabel="No tags yet." />
      )}

      <Modal open={fieldOpen} onClose={() => setFieldOpen(false)} title="Add Field">
        <div className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={fieldName} onChange={(e) => setFieldName(e.target.value)} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={fieldType} onChange={(e) => setFieldType(e.target.value)}>
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {fieldType === "select" && (
            <div>
              <label className="label">Options (comma-separated)</label>
              <input className="input" placeholder="e.g. Gold, Silver, Bronze" value={fieldOptions} onChange={(e) => setFieldOptions(e.target.value)} />
            </div>
          )}
          {fieldError && <p className="text-sm text-rose-600">{fieldError}</p>}
          <div className="flex items-center gap-3 pt-2">
            <button className="btn-primary" type="button" disabled={fieldSaving} onClick={handleSaveField}>
              {fieldSaving ? "Saving…" : "Save"}
            </button>
            <button className="btn-secondary" type="button" onClick={() => setFieldOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={tagOpen} onClose={() => setTagOpen(false)} title="Add tag">
        <div className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={tagName} onChange={(e) => setTagName(e.target.value)} />
          </div>
          {tagError && <p className="text-sm text-rose-600">{tagError}</p>}
          <div className="flex items-center gap-3 pt-2">
            <button className="btn-primary" type="button" disabled={tagSaving} onClick={handleSaveTag}>
              {tagSaving ? "Saving…" : "Save"}
            </button>
            <button className="btn-secondary" type="button" onClick={() => setTagOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
