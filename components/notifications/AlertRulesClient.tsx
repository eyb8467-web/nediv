"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";

type AlertRule = {
  id: string;
  name: string;
  assignee: string | null;
  cc_emails: string[] | null;
  created_at: string;
};

export function AlertRulesClient({ orgId, initialRules }: { orgId: string; initialRules: AlertRule[] }) {
  const router = useRouter();
  const [name, setName] = useState("default notification");
  const [ccEmails, setCcEmails] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const cc = ccEmails
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const supabase = supabaseBrowser();
    const { error: err } = await supabase.from("alert_rules").insert({
      org_id: orgId,
      name: name.trim(),
      cc_emails: cc,
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setName("default notification");
    setCcEmails("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = supabaseBrowser();
    await supabase.from("alert_rules").delete().eq("id", id);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="card p-4 space-y-4">
        <h2 className="text-sm font-semibold text-ink/60 uppercase tracking-wide">New Rule</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">CC Emails (comma-separated)</label>
            <input
              className="input"
              placeholder="office@shul.org, treasurer@shul.org"
              value={ccEmails}
              onChange={(e) => setCcEmails(e.target.value)}
            />
          </div>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save Rule"}
          </button>
        </div>
      </form>

      <div className="card overflow-auto max-h-[55vh]">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Assignee</th>
              <th>CC Emails</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialRules.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-ink/40 py-10">
                  No notification rules yet.
                </td>
              </tr>
            )}
            {initialRules.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.assignee ?? "—"}</td>
                <td>{r.cc_emails && r.cc_emails.length > 0 ? r.cc_emails.join(", ") : "—"}</td>
                <td className="text-right">
                  <button
                    className="btn-ghost text-rose-600"
                    disabled={deletingId === r.id}
                    onClick={() => handleDelete(r.id)}
                  >
                    <Icon name="x" className="w-4 h-4" /> {deletingId === r.id ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
