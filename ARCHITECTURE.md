# Nediv — Architecture & Build Plan

Nediv is a multi-tenant donor-relations / synagogue-management SaaS, modeled on the
Donary DRM walkthrough. Each customer is an "Organization" with its own donors,
transactions, users, and settings, fully isolated via Postgres Row Level Security.

## Stack
- **Next.js 14** (App Router, TypeScript) — single deployable app
- **Tailwind CSS** — styling
- **Supabase** — Postgres DB, Auth (email/password + org membership), Storage (logos/branding)
- **Vercel** — hosting, auto-deploy from GitHub `main`
- **No real payment gateway in v1** — payments/pledges are recorded manually (cash/check/card-on-file
  style entry), matching the "data model + UI only" decision. A `payment_type` field and an
  `api_keys` settings screen exist so a real gateway (Stripe, etc.) can be wired in later without
  a schema change.

## Multi-tenancy model
- `organizations` table = one row per customer shul.
- `memberships` table links `auth.users` to `organizations` with a `role` (owner/admin/staff) and
  per-module permission flags (mirrors Donary's Admin ▸ Users ▸ Lists/Other toggles).
- Every business table carries `org_id`. RLS policies restrict all reads/writes to rows whose
  `org_id` matches one of the caller's memberships.
- New orgs are created via a "Create your organization" onboarding step right after signup
  (this is how a new shul "signs up" for Nediv — the multi-tenant SaaS entry point).

## Module → route map (mirrors the Donary walkthrough)
- `/dashboard` — Total Recent/Upcoming panels, recent payments chart, total lists, reminders
- `/lists/donors|reasons|campaigns|locations|collectors|sources|seats` — Lists tabs
- `/transactions/payments|pledges|schedules` — Transactions tabs
- `/reports/query|custom` — Reports tabs
- `/notifications/alerts|reminders|settings` — Notifications tabs
- `/admin/profile|users|branding|api-keys|minyanim|seats|settings|advanced-fields` — Admin tabs
- `/finance/batches` — Finance
- `/onboarding` — create organization (post-signup)
- `/login`, `/signup` — Supabase auth

## Directory layout
```
nediv/
  app/
    (auth)/login, (auth)/signup, onboarding/
    (app)/dashboard, (app)/lists/..., (app)/transactions/..., (app)/reports/...,
    (app)/notifications/..., (app)/admin/..., (app)/finance/...
    api/... (server actions preferred; API routes only where needed)
  components/ (Sidebar, Topbar, DataTable, FilterPanel, Modal, forms...)
  lib/ (supabase/server.ts, supabase/client.ts, types.ts, permissions.ts)
  supabase/migrations/0001_init.sql
```

## Build order
1. Schema (`supabase/migrations/0001_init.sql`) + RLS
2. App scaffold: auth, layout, sidebar/topbar, design tokens
3. Parallel module build-out (Lists / Transactions / Dashboard+Reports / Admin+Seats+Minyanim+Notifications)
4. Wire to a real Supabase project + deploy to Vercel
5. UI test pass on the live deployment
