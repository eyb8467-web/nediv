"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Modal } from "@/components/Modal";
import { DataTable, Column } from "@/components/DataTable";
import { Icon } from "@/components/Icon";

type Alert = {
  id: string;
  subject: string;
  message: string | null;
  created_at: string;
  campaign: { name: string } | null;
  source: { name: string } | null;
};

export function AlertsClient({ orgId, initialAlerts }: { orgId: string; initialAlerts: Alert[] }) {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return initialAlerts.filter((a) => {
      const created = a.created_at ? a.created_at.slice(0, 10) : "";
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    });
  }, [initialAlerts, from, to]);

  const columns: Column<Alert>[] = [
    { key: "subject", header: "Subject" },
    {
      key: "created_at",
      header: "Date & Time",
      render: (r) => (r.created_at ? new Date(r.created_at).toLocaleString() : "—"),
    },
    { key: "message", header: "Message", render: (r) => r.message ?? "—" },
    { key: "campaign", header: "Campaign", render: (r) => r.campaign?.name ?? "—" },
    { key: "source", header: "Source", render: (r) => r.source?.name ?? "—" },
  ];

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) {
      setError("Subject is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error: err } = await supabase.from("alerts").insert({
      org_id: orgId,
      subject: subject.trim(),
      message: message.trim() || null,
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setModalOpen(false);
    setSubject("");
    setMessage("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        {(from || to) && (
          <button
            className="btn-ghost"
            onClick={() => {
              setFrom("");
              setTo("");
            }}
          >
            Clear
          </button>
        )}
        <div className="flex-1" />
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Icon name="plus" className="w-4 h-4" /> New Alert
        </button>
      </div>

      <DataTable columns={columns} rows={filtered} emptyLabel="No alerts found." />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Alert">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Subject</label>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save Alert"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
