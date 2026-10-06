"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Modal } from "@/components/Modal";
import { DataTable, Column } from "@/components/DataTable";
import { Icon } from "@/components/Icon";

type Reminder = {
  id: string;
  type: string | null;
  title: string;
  due_at: string | null;
  status: string | null;
  assignee: string | null;
  attached_to: string | null;
};

function emptyForm() {
  return { type: "Task", title: "", due_at: "", attached_to: "" };
}

export function RemindersClient({ orgId, initialReminders }: { orgId: string; initialReminders: Reminder[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error: err } = await supabase.from("reminders").insert({
      org_id: orgId,
      type: form.type,
      title: form.title.trim(),
      due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
      attached_to: form.attached_to.trim() || null,
      status: "Open",
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setModalOpen(false);
    setForm(emptyForm());
    router.refresh();
  }

  async function toggleStatus(r: Reminder) {
    setTogglingId(r.id);
    const nextStatus = r.status === "Done" ? "Open" : "Done";
    const supabase = supabaseBrowser();
    await supabase.from("reminders").update({ status: nextStatus }).eq("id", r.id);
    setTogglingId(null);
    router.refresh();
  }

  const columns: Column<Reminder>[] = [
    { key: "type", header: "Type", render: (r) => r.type ?? "—" },
    { key: "title", header: "Title" },
    {
      key: "due_at",
      header: "Due Date & Time",
      render: (r) => (r.due_at ? new Date(r.due_at).toLocaleString() : "—"),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <button
          onClick={() => toggleStatus(r)}
          disabled={togglingId === r.id}
          className={r.status === "Done" ? "badge-green" : "badge-amber"}
          title="Click to toggle status"
        >
          {togglingId === r.id ? "…" : r.status ?? "Open"}
        </button>
      ),
    },
    { key: "assignee", header: "Assignee", render: (r) => r.assignee ?? "—" },
    { key: "attached_to", header: "Attached To", render: (r) => r.attached_to ?? "—" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Icon name="plus" className="w-4 h-4" /> New
        </button>
      </div>

      <DataTable columns={columns} rows={initialReminders} emptyLabel="No reminders yet." />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Reminder">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="Task">Task</option>
              <option value="Call">Call</option>
              <option value="Follow-up">Follow-up</option>
            </select>
          </div>
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="label">Due Date & Time</label>
            <input
              type="datetime-local"
              className="input"
              value={form.due_at}
              onChange={(e) => setForm((f) => ({ ...f, due_at: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Attached To</label>
            <input
              className="input"
              placeholder="e.g. donor name, campaign…"
              value={form.attached_to}
              onChange={(e) => setForm((f) => ({ ...f, attached_to: e.target.value }))}
            />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save Reminder"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
