"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { DataTable, Column } from "@/components/DataTable";
import { Icon } from "@/components/Icon";
import { buildCsv, downloadCsv } from "@/lib/csv";

const REAL_REPORTS = [
  "Top Donations",
  "Payments And Gateway Details",
  "Donors Created Date",
  "Donors Missing Location",
  "Donor Campaign Total by Year",
];

const STUB_REPORTS = [
  "Wallet Expiration Date",
  "Mailing Report",
  "SMS Report",
  "Email Report",
  "Raffle Tickets",
  "Seats Report",
  "Donor Donations Compare By Campaign",
  "Donors Not Given For Campaign",
  "Donors Location",
];

function money(n: number | null | undefined) {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function donorName(d: { first_name?: string | null; last_name?: string | null } | null | undefined) {
  if (!d) return "—";
  return [d.first_name, d.last_name].filter(Boolean).join(" ") || "—";
}

export function CustomReportClient({ orgId }: { orgId: string }) {
  const [selected, setSelected] = useState(REAL_REPORTS[0]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stub, setStub] = useState(false);
  const [columns, setColumns] = useState<Column<any>[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvKeys, setCsvKeys] = useState<string[]>([]);

  async function runReport() {
    setRunning(true);
    setError(null);
    setStub(false);
    setColumns([]);
    setRows([]);

    if (!REAL_REPORTS.includes(selected)) {
      setStub(true);
      setRunning(false);
      return;
    }

    const supabase = supabaseBrowser();

    try {
      if (selected === "Top Donations") {
        const yearStart = `${new Date().getFullYear()}-01-01`;
        const yearEnd = `${new Date().getFullYear()}-12-31`;
        const { data, error: qErr } = await supabase
          .from("payments")
          .select("id, amount, payment_date, donor:donors(first_name,last_name)")
          .eq("org_id", orgId)
          .gte("payment_date", yearStart)
          .lte("payment_date", yearEnd)
          .order("amount", { ascending: false })
          .limit(25);
        if (qErr) throw qErr;
        const out = (data ?? []).map((p: any) => ({
          id: p.id,
          donor_name: donorName(p.donor),
          amount_fmt: money(p.amount),
          payment_date_fmt: p.payment_date ? new Date(p.payment_date).toLocaleDateString() : "",
        }));
        setColumns([
          { key: "donor_name", header: "Donor" },
          { key: "amount_fmt", header: "Amount" },
          { key: "payment_date_fmt", header: "Date" },
        ]);
        setCsvHeaders(["Donor", "Amount", "Date"]);
        setCsvKeys(["donor_name", "amount_fmt", "payment_date_fmt"]);
        setRows(out);
      } else if (selected === "Payments And Gateway Details") {
        const { data, error: qErr } = await supabase
          .from("payments")
          .select("id, payment_date, payment_type, ref_number, amount, source:sources(name)")
          .eq("org_id", orgId)
          .order("payment_date", { ascending: false })
          .limit(500);
        if (qErr) throw qErr;
        const out = (data ?? []).map((p: any) => ({
          id: p.id,
          payment_date_fmt: p.payment_date ? new Date(p.payment_date).toLocaleDateString() : "",
          payment_type: p.payment_type ?? "",
          ref_number: p.ref_number ?? "",
          source_name: p.source?.name ?? "—",
          amount_fmt: money(p.amount),
        }));
        setColumns([
          { key: "payment_date_fmt", header: "Date" },
          { key: "payment_type", header: "Payment Type" },
          { key: "ref_number", header: "Ref #" },
          { key: "source_name", header: "Source" },
          { key: "amount_fmt", header: "Amount" },
        ]);
        setCsvHeaders(["Date", "Payment Type", "Ref #", "Source", "Amount"]);
        setCsvKeys(["payment_date_fmt", "payment_type", "ref_number", "source_name", "amount_fmt"]);
        setRows(out);
      } else if (selected === "Donors Created Date") {
        const { data, error: qErr } = await supabase
          .from("donors")
          .select("id, first_name, last_name, created_at")
          .eq("org_id", orgId)
          .order("created_at", { ascending: false })
          .limit(500);
        if (qErr) throw qErr;
        const out = (data ?? []).map((d: any) => ({
          id: d.id,
          donor_name: donorName(d),
          created_at_fmt: d.created_at ? new Date(d.created_at).toLocaleDateString() : "",
        }));
        setColumns([
          { key: "donor_name", header: "Donor" },
          { key: "created_at_fmt", header: "Created Date" },
        ]);
        setCsvHeaders(["Donor", "Created Date"]);
        setCsvKeys(["donor_name", "created_at_fmt"]);
        setRows(out);
      } else if (selected === "Donors Missing Location") {
        const { data, error: qErr } = await supabase
          .from("donors")
          .select("id, first_name, last_name, city, state, phone, email")
          .eq("org_id", orgId)
          .is("default_location_id", null)
          .order("last_name", { ascending: true })
          .limit(500);
        if (qErr) throw qErr;
        const out = (data ?? []).map((d: any) => ({
          id: d.id,
          donor_name: donorName(d),
          city: d.city ?? "",
          state: d.state ?? "",
          phone: d.phone ?? "",
          email: d.email ?? "",
        }));
        setColumns([
          { key: "donor_name", header: "Donor" },
          { key: "city", header: "City" },
          { key: "state", header: "State" },
          { key: "phone", header: "Phone" },
          { key: "email", header: "Email" },
        ]);
        setCsvHeaders(["Donor", "City", "State", "Phone", "Email"]);
        setCsvKeys(["donor_name", "city", "state", "phone", "email"]);
        setRows(out);
      } else if (selected === "Donor Campaign Total by Year") {
        const { data, error: qErr } = await supabase
          .from("payments")
          .select("donor_id, amount, payment_date, donor:donors(first_name,last_name), campaign:campaigns(name)")
          .eq("org_id", orgId)
          .eq("status", "Success")
          .limit(5000);
        if (qErr) throw qErr;

        const groups = new Map<string, { donor_name: string; year: string; campaign_name: string; total: number }>();
        for (const p of (data ?? []) as any[]) {
          const year = p.payment_date ? String(new Date(p.payment_date).getFullYear()) : "Unknown";
          const campaignName = p.campaign?.name ?? "Uncategorized";
          const key = `${p.donor_id}|${year}|${campaignName}`;
          const existing = groups.get(key);
          if (existing) {
            existing.total += Number(p.amount);
          } else {
            groups.set(key, { donor_name: donorName(p.donor), year, campaign_name: campaignName, total: Number(p.amount) });
          }
        }
        const out = Array.from(groups.entries())
          .map(([key, g]) => ({ id: key, ...g, total_fmt: money(g.total) }))
          .sort((a, b) => b.total - a.total);
        setColumns([
          { key: "donor_name", header: "Donor" },
          { key: "year", header: "Year" },
          { key: "campaign_name", header: "Campaign" },
          { key: "total_fmt", header: "Total" },
        ]);
        setCsvHeaders(["Donor", "Year", "Campaign", "Total"]);
        setCsvKeys(["donor_name", "year", "campaign_name", "total_fmt"]);
        setRows(out);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to run report.");
    } finally {
      setRunning(false);
    }
  }

  function exportCsv() {
    if (rows.length === 0) return;
    const csvRows = rows.map((r) => csvKeys.map((k) => r[k] ?? ""));
    downloadCsv(`${selected}.csv`, buildCsv(csvHeaders, csvRows));
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[240px]">
          <label className="label">Choose Report</label>
          <select
            className="input"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setStub(false);
              setColumns([]);
              setRows([]);
              setError(null);
            }}
          >
            <optgroup label="Available Reports">
              {REAL_REPORTS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </optgroup>
            <optgroup label="Coming Soon">
              {STUB_REPORTS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <button className="btn-primary" onClick={runReport} disabled={running}>
          {running ? "Running…" : "Run"}
        </button>
        <button className="btn-secondary" onClick={exportCsv} disabled={rows.length === 0}>
          <Icon name="download" className="w-4 h-4" /> Export
        </button>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {stub ? (
        <div className="card p-10 text-center text-sm text-ink/40">This report is coming soon.</div>
      ) : (
        <DataTable columns={columns} rows={rows} emptyLabel={running ? "Running…" : "Choose a report and click Run."} />
      )}
    </div>
  );
}
