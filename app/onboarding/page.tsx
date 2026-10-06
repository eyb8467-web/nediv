"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [orgNumber, setOrgNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = supabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // Generate the org id client-side. The "organizations" SELECT policy only
    // allows members to read a row, and the owner's membership doesn't exist
    // yet at the moment of this insert — so we must NOT ask PostgREST to
    // return the inserted row (that would re-check the SELECT policy and fail
    // with "new row violates row-level security policy"). Insert with a
    // known id instead, and skip .select() entirely.
    const orgId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const { error: orgError } = await supabase
      .from("organizations")
      .insert({ id: orgId, name, org_number: orgNumber || null, email: user.email });

    if (orgError) {
      setError(orgError.message);
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase.from("memberships").insert({
      org_id: orgId,
      user_id: user.id,
      role: "owner",
      perms: {
        donors: true, reasons: true, campaigns: true, locations: true,
        collectors: true, users: true, seats: true, sources: true,
        dashboard: true, notifications: true, query_reports: true,
        custom_reports: true, admin: true,
      },
    });

    // seed default org_settings row
    await supabase.from("org_settings").insert({ org_id: orgId });

    setLoading(false);
    if (memberError) {
      setError(memberError.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f8f7]">
      <div className="w-full max-w-md card p-8">
        <h1 className="text-2xl font-semibold text-brand-700 mb-1">Welcome to Nediv</h1>
        <p className="text-sm text-ink/50 mb-6">
          Let's set up your organization. You'll be the owner and can invite staff later from Admin ▸ Users.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Organization name</label>
            <input className="input" required placeholder="e.g. Cong Bais Yaakov Nechamia" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Org number (optional)</label>
            <input className="input" placeholder="e.g. 1312" value={orgNumber} onChange={(e) => setOrgNumber(e.target.value)} />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button className="btn-primary w-full" disabled={loading} type="submit">
            {loading ? "Creating…" : "Create organization"}
          </button>
        </form>
      </div>
    </div>
  );
}
