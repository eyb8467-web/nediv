# Nediv

A multi-tenant donor-relations / synagogue-management platform (donor CRM, payments, pledges,
seats, minyanim scheduling, reports, notifications, admin) built with Next.js + Supabase.

## Local development
```
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

## Database
Run `supabase/migrations/0001_init.sql` against your Supabase project's SQL editor (or via the
Supabase CLI) before first use. It creates every table plus row-level-security policies scoping
all data to the caller's organization.

## Deployment
Push to `main` on GitHub; import the repo into Vercel and set the two environment variables from
`.env.example`. See `ARCHITECTURE.md` for the module → route map and `CONVENTIONS.md` for the
coding conventions used throughout.
