import { Icon } from "@/components/Icon";

export function StatTile({
  label,
  value,
  sub,
  trend,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "flat";
  icon?: string;
}) {
  const trendColor = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-ink/40";
  const trendSymbol = trend === "up" ? "▲" : trend === "down" ? "▼" : "";
  return (
    <div className="card card-hoverable p-4 flex-1 min-w-[170px]">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium text-ink/50 uppercase tracking-wide">{label}</div>
        {icon && (
          <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50 text-brand-600">
            <Icon name={icon} className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-2 text-[28px] leading-none font-semibold text-ink tracking-tight">{value}</div>
      {sub && (
        <div className={`mt-2 text-xs font-medium ${trendColor}`}>
          {trendSymbol} {sub}
        </div>
      )}
    </div>
  );
}
