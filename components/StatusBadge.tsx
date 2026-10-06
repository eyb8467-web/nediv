const GREEN = new Set(["success", "paid", "active", "completed", "deposited", "reconciled"]);
const AMBER = new Set(["pending", "open", "unbatched", "batched", "paused"]);
const RED = new Set(["failed", "canceled", "cancelled"]);

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = (status ?? "").toLowerCase();
  let cls = "badge-gray";
  if (GREEN.has(s)) cls = "badge-green";
  else if (AMBER.has(s)) cls = "badge-amber";
  else if (RED.has(s)) cls = "badge-red";
  return <span className={cls}>{status || "—"}</span>;
}
