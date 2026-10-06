"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Donor } from "@/lib/types";
import { TagRow } from "./DonorsClient";

export function DonorTagsTab({ donor, orgId, tags }: { donor: Donor; orgId: string; tags: TagRow[] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busyTagId, setBusyTagId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = supabaseBrowser();
      const { data } = await supabase.from("donor_tags").select("tag_id").eq("org_id", orgId).eq("donor_id", donor.id);
      if (cancelled) return;
      setChecked(new Set((data ?? []).map((r) => r.tag_id)));
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donor.id]);

  async function toggle(tagId: string, isChecked: boolean) {
    setBusyTagId(tagId);
    setError(null);
    const supabase = supabaseBrowser();
    if (isChecked) {
      const { error: err } = await supabase.from("donor_tags").insert({ org_id: orgId, donor_id: donor.id, tag_id: tagId });
      if (err) {
        setError(err.message);
        setBusyTagId(null);
        return;
      }
      setChecked((prev) => new Set(prev).add(tagId));
    } else {
      const { error: err } = await supabase
        .from("donor_tags")
        .delete()
        .eq("org_id", orgId)
        .eq("donor_id", donor.id)
        .eq("tag_id", tagId);
      if (err) {
        setError(err.message);
        setBusyTagId(null);
        return;
      }
      setChecked((prev) => {
        const next = new Set(prev);
        next.delete(tagId);
        return next;
      });
    }
    setBusyTagId(null);
  }

  if (loading) return <p className="text-sm text-ink/40 py-6">Loading…</p>;

  if (tags.length === 0) {
    return <p className="text-sm text-ink/40 py-6">No tags defined for this organization yet.</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        {tags.map((t) => (
          <label key={t.id} className="flex items-center gap-2 text-sm text-ink/80 card px-3 py-2">
            <input
              type="checkbox"
              checked={checked.has(t.id)}
              disabled={busyTagId === t.id}
              onChange={(e) => toggle(t.id, e.target.checked)}
            />
            {t.name}
          </label>
        ))}
      </div>
    </div>
  );
}
