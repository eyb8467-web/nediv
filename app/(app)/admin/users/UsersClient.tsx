"use client";

import { useState } from "react";
import { DataTable, Column } from "@/components/DataTable";
import { EditUserModal } from "./EditUserModal";

export type MemberRow = {
  id: string;
  org_id: string;
  user_id: string;
  role: "owner" | "admin" | "staff";
  title: string | null;
  phone: string | null;
  perms: Record<string, boolean>;
  scoped_reasons: string[] | null;
  scoped_collectors: string[] | null;
  scoped_locations: string[] | null;
  scoped_campaigns: string[] | null;
  scoped_sources: string[] | null;
};

export type RefOption = { id: string; name?: string; full_name?: string };

export function UsersClient({
  orgId,
  members,
  reasons,
  collectors,
  locations,
  campaigns,
  sources,
}: {
  orgId: string;
  members: MemberRow[];
  reasons: RefOption[];
  collectors: RefOption[];
  locations: RefOption[];
  campaigns: RefOption[];
  sources: RefOption[];
}) {
  const [selected, setSelected] = useState<MemberRow | null>(null);

  const columns: Column<MemberRow>[] = [
    {
      key: "member",
      header: "Member",
      render: (row) => (
        <span className="font-medium text-ink">
          Member {row.user_id.slice(0, 8)}
        </span>
      ),
    },
    { key: "role", header: "Role", render: (row) => <span className="badge-gray capitalize">{row.role}</span> },
    { key: "title", header: "Title", render: (row) => row.title || <span className="text-ink/30">—</span> },
    { key: "phone", header: "Phone", render: (row) => row.phone || <span className="text-ink/30">—</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="card p-3 text-sm text-ink/60 bg-brand-50/40">
        To add a team member, have them sign up at <span className="font-mono">/signup</span>, then ask an
        admin to contact support to link them to this org.
      </div>

      <DataTable columns={columns} rows={members} onRowClick={(row) => setSelected(row)} emptyLabel="No team members yet." />

      {selected && (
        <EditUserModal
          key={selected.id}
          orgId={orgId}
          member={selected}
          reasons={reasons}
          collectors={collectors}
          locations={locations}
          campaigns={campaigns}
          sources={sources}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
