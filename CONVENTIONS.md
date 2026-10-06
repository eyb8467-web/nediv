# Build conventions for Nediv contributors (subagents)

Read this fully before writing any code. The scaffold already exists — do not recreate
`package.json`, `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`, `app/(app)/layout.tsx`,
`middleware.ts`, `lib/supabase/*`, `lib/org.ts`, `lib/types.ts`, `components/Sidebar.tsx`,
`components/Topbar.tsx` — those are done. You are adding new route folders + components only.

**IMPORTANT: there is no `node_modules` here and you cannot run `npm install` or `next build`
in this sandbox (no network access). Write careful, syntactically correct TypeScript/TSX by hand.
Vercel will run the actual install + build remotely.** Re-read every file you write before moving
on, checking bracket/paren/tag balance and import correctness — you get no compiler to catch typos.

## Route pattern
Every authenticated page lives under `app/(app)/<section>/<subsection>/page.tsx` and is a
Next.js **Server Component** by default (async function, no "use client").

```tsx
import { requireOrgContext } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTabs } from "@/components/PageTabs";

export default async function SomePage() {
  const { org, membership } = await requireOrgContext();
  const supabase = supabaseServer();
  const { data: rows } = await supabase.from("some_table").select("*").eq("org_id", org.id).order("created_at", { ascending: false });
  return (
    <div>
      <PageTabs title="Lists" tabs={[
        { href: "/lists/donors", label: "Donors" },
        { href: "/lists/reasons", label: "Reasons" },
        // ...
      ]} />
      {/* content */}
    </div>
  );
}
```

Interactive bits (forms, modals, filters, buttons that mutate data) go in a **separate client
component** file (e.g. `DonorFormModal.tsx`) marked `"use client"` at the top, imported into the
server page. Client components use `supabaseBrowser()` from `@/lib/supabase/client` and
`router.refresh()` (from `next/navigation`) after a mutation to re-fetch server data — do NOT use
Next.js Server Actions (keep the mental model simple: client calls Supabase directly, browser-side,
relying on RLS for security — every table already has `org_id`-scoped RLS policies).

## Always scope by org
Every query must `.eq("org_id", org.id)` even though RLS also enforces it — this uses the index
and matches team convention. Every insert must include `org_id: org.id`.

## Shared components (already built — reuse, don't rebuild)
- `<PageTabs title tabs={[{href,label}]} />` — the tab row under a module's H1
- `<DataTable columns rows onRowClick emptyLabel />` — from `@/components/DataTable`; `columns[i]` = `{key, header, render?(row), className?}`
- `<StatTile label value sub trend />` — small metric card
- `<Modal open onClose title wide? >children</Modal>` — from `@/components/Modal`, client-side only
- `<Icon name className />` — inline SVG icons; available names are listed in `components/Icon.tsx` — if you need one that's missing, ADD it to that file's `paths` map rather than pulling in an icon library

## Utility classes (already defined in app/globals.css)
`.card`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.input`, `.label`, `.badge-green/amber/red/gray`,
`.tab-link` (+ `.active`), `table.data-table`.

## Filters / search
Use a plain `<input>` bound to a client component that either (a) filters an already-fetched
array in memory (fine for lists under a few thousand rows — donors is 3,273, that's OK to fetch
with a reasonable column subset and `.limit(1000)` + a server-side `ilike` search box that
re-queries on submit) or (b) re-queries Supabase with `.ilike()` on submit. Prefer (b) for the
Donors list specifically (search box hitting the server on Enter/click), since it's the biggest
table; simple in-memory filtering is fine for the smaller lists (reasons, campaigns, locations,
collectors, sources).

## Currency & dates
Format money with `.toLocaleString("en-US", { style: "currency", currency: "USD" })`.
Format dates with `new Date(x).toLocaleDateString()`. Don't add a date-picker library; a plain
`<input type="date">` / `<input type="month">` is fine.

## What NOT to build
No real payment gateway calls. "Record a payment" / "Record a pledge payment" just inserts a row.
No SMS/email sending — the Admin settings screens for templates just save text to `org_settings`
(and are UI-only otherwise). No real kiosk hardware — Sources ▸ kiosk entries are just rows with a
`device_id` text field.

## When you're done
List every file you created or edited at the end of your final message so the coordinating
session can review them.
