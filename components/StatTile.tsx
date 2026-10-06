export function StatTile({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "flat";
}) {
  const trendColor = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-ink/40";
  const trendSymbol = trend === "up" ? "▲" : trend === "down" ? "▼" : "";
  return (
    <div className="card p-4 flex-1 min-w-[160px]">
      <div className="text-xs font-medium text-ink/50 uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-ink">{value}</div>
      {sub && (
        <div className={`mt-1 text-xs ${trendColor}`}>
          {trendSymbol} {sub}
        </div>
      )}
    </div>
  );
}
