"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { DataTable, Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { Icon } from "@/components/Icon";

export type MinyanRow = {
  id: string;
  org_id: string;
  tefillah: "shacharis" | "mincha" | "maariv";
  room: string | null;
  group_name: string | null;
  brachos_time: string | null;
  hodu_time: string | null;
  time_of_day: string | null;
};

const TABS: { key: MinyanRow["tefillah"] | "rooms"; label: string }[] = [
  { key: "shacharis", label: "שחרית" },
  { key: "mincha", label: "מנחה" },
  { key: "maariv", label: "מעריב" },
  { key: "rooms", label: "חדרים (Rooms)" },
];

const EMPTY_FORM = { room: "", group_name: "", brachos_time: "", hodu_time: "", time_of_day: "" };

export function MinyanimClient({ orgId, minyanim }: { orgId: string; minyanim: MinyanRow[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("shacharis");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (tab === "rooms") return [];
    return minyanim.filter((m) => m.tefillah === tab);
  }, [minyanim, tab]);

  const roomCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of minyanim) {
      const room = m.room?.trim();
      if (!room) continue;
      counts[room] = (counts[room] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([room, count]) => ({ id: room, room, count }))
      .sort((a, b) => a.room.localeCompare(b.room));
  }, [minyanim]);

  const columns: Column<MinyanRow>[] = [
    { key: "room", header: "Room", render: (r) => r.room || <span className="text-ink/30">—</span> },
    { key: "group_name", header: "Group", render: (r) => r.group_name || <span className="text-ink/30">—</span> },
    { key: "brachos_time", header: "Brachos Time", render: (r) => r.brachos_time || <span className="text-ink/30">—</span> },
    { key: "hodu_time", header: "Hodu Time", render: (r) => r.hodu_time || <span className="text-ink/30">—</span> },
    { key: "time_of_day", header: "Time", render: (r) => r.time_of_day || <span className="text-ink/30">—</span> },
  ];

  const roomColumns: Column<{ id: string; room: string; count: number }>[] = [
    { key: "room", header: "Room" },
    { key: "count", header: "Minyanim using this room" },
  ];

  function openNew() {
    setForm({ ...EMPTY_FORM });
    setError(null);
    setOpen(true);
  }

  async function handleSave() {
    if (tab === "rooms") return;
    setSaving(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error: insertError } = await supabase.from("minyanim").insert({
      org_id: orgId,
      tefillah: tab,
      room: form.room || null,
      group_name: form.group_name || null,
      brachos_time: form.brachos_time || null,
      hodu_time: form.hodu_time || null,
      time_of_day: form.time_of_day || null,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 border-b border-black/10">
          {TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)} className={`tab-link ${tab === t.key ? "active" : ""}`}>
              {t.label}
            </button>
          ))}
        </div>
        {tab !== "rooms" && (
          <button className="btn-primary" onClick={openNew}>
            <Icon name="plus" className="w-4 h-4" /> New
          </button>
        )}
      </div>

      {tab === "rooms" ? (
        <DataTable columns={roomColumns} rows={roomCounts} emptyLabel="No rooms in use yet." />
      ) : (
        <DataTable columns={columns} rows={filtered} emptyLabel="No minyanim in this tefillah yet." />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`New ${tab === "rooms" ? "" : tab} minyan`}>
        <div className="space-y-3">
          <div>
            <label className="label">Room</label>
            <input className="input" value={form.room} onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))} />
          </div>
          <div>
            <label className="label">Group</label>
            <input className="input" value={form.group_name} onChange={(e) => setForm((f) => ({ ...f, group_name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Brachos Time</label>
              <input className="input" placeholder="e.g. 7:00 AM" value={form.brachos_time} onChange={(e) => setForm((f) => ({ ...f, brachos_time: e.target.value }))} />
            </div>
            <div>
              <label className="label">Hodu Time</label>
              <input className="input" placeholder="e.g. 7:10 AM" value={form.hodu_time} onChange={(e) => setForm((f) => ({ ...f, hodu_time: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Time of Day</label>
            <input className="input" type="time" value={form.time_of_day} onChange={(e) => setForm((f) => ({ ...f, time_of_day: e.target.value }))} />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex items-center gap-3 pt-2">
            <button className="btn-primary" type="button" disabled={saving} onClick={handleSave}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button className="btn-secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
