import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { StatTile } from "@/components/StatTile";
import Link from "next/link";

function money(n: number | null | undefined) {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default async function DashboardPage() {
  const { org } = await requireOrgContext();
  const supabase = supabaseServer();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceISO = since.toISOString().slice(0, 10);

  const [
    { data: recentPayments },
    { data: pendingPledges },
    { count: donorCount },
    { count: locationCount },
    { count: collectorCount },
    { count: campaignCount },
    { count: reasonCount },
    { count: sourceCount },
    { data: reminders },
  ] = await Promise.all([
    supabase.from("payments").select("amount,status,payment_date,payment_type").eq("org_id", org.id).gte("payment_date", sinceISO),
    supabase.from("pledges").select("amount,paid_amount,status").eq("org_id", org.id).eq("status", "Open"),
    supabase.from("donors").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase.from("locations").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase.from("collectors").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase.from("reasons").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase.from("sources").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase.from("reminders").select("*").eq("org_id", org.id).order("due_at", { ascending: true }).limit(5),
  ]);

  const successPayments = (recentPayments ?? []).filter((p) => p.status === "Success");
  const totalPaid = successPayments.reduce((s, p) => s + Number(p.amount), 0);
  const pendingCount = (recentPayments ?? []).filter((p) => p.status === "Pending").length;
  const canceledCount = (recentPayments ?? []).filter((p) => p.status === "Canceled").length;
  const pendingPledgeTotal = (pendingPledges ?? []).reduce((s, p) => s + (Number(p.amount) - Number(p.paid_amount)), 0);

  const byType: Record<string, number> = {};
  for (const p of successPayments) {
    byType[p.payment_type] = (byType[p.payment_type] ?? 0) + Number(p.amount);
  }

  const lists = [
    { label: "Donors", href: "/lists/donors", count: donorCount ?? 0 },
    { label: "Locations", href: "/lists/locations", count: locationCount ?? 0 },
    { label: "Collectors", href: "/lists/collectors", count: collectorCount ?? 0 },
    { label: "Campaigns", href: "/lists/campaigns", count: campaignCount ?? 0 },
    { label: "Reasons", href: "/lists/reasons", count: reasonCount ?? 0 },
    { label: "Sources", href: "/lists/sources", count: sourceCount ?? 0 },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Dashboard</h1>
        <p className="text-sm text-ink/45 mt-0.5">Here's what's happening with {org.name} right now.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h2 className="section-title mb-3">Total Recent — Last 30 Days</h2>
            <div className="flex flex-wrap gap-4">
              <StatTile
                icon="banknote"
                label="Payments"
                value={money(totalPaid)}
                sub={`${successPayments.length} transactions`}
                trend="up"
              />
              <StatTile icon="wallet" label="Pending payments" value={String(pendingCount)} />
              <StatTile
                icon="x"
                label="Canceled payments"
                value={String(canceledCount)}
                trend={canceledCount > 0 ? "down" : "flat"}
              />
              <StatTile
                icon="bar-chart-2"
                label="Pledges outstanding"
                value={money(pendingPledgeTotal)}
                sub={`${pendingPledges?.length ?? 0} open`}
              />
            </div>
          </section>

          <section className="card p-5">
            <h2 className="section-title mb-4">Recent Payments by Type</h2>
            {Object.keys(byType).length === 0 ? (
              <div className="empty-state py-6">
                <p className="text-sm text-ink/40">No payments recorded in the last 30 days yet.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {Object.entries(byType).map(([type, amt]) => {
                  const pct = totalPaid ? Math.round((amt / totalPaid) * 100) : 0;
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-ink/70 font-medium">{type}</span>
                        <span className="text-ink/50">{money(amt)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-brand-50 overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="section-title mb-3">Total Lists</h2>
            <ul className="divide-y divide-black/[0.05]">
              {lists.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="flex justify-between items-center text-sm py-2.5 text-ink/75 hover:text-brand-700 transition-colors"
                  >
                    <span>{l.label}</span>
                    <span className="font-semibold text-ink">{l.count.toLocaleString()}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="section-title mb-3">Reminders</h2>
            {(!reminders || reminders.length === 0) ? (
              <p className="text-sm text-ink/40">
                No reminders.{" "}
                <Link href="/notifications/reminders" className="text-brand-600 hover:text-brand-700 font-medium">
                  Add one →
                </Link>
              </p>
            ) : (
              <ul className="space-y-3">
                {reminders.map((r) => (
                  <li key={r.id} className="text-sm flex justify-between gap-3">
                    <span className="text-ink/80">{r.title}</span>
                    <span className="text-ink/40 shrink-0">{r.due_at ? new Date(r.due_at).toLocaleDateString() : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
