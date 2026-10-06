-- Nediv v1 schema — multi-tenant donor management platform
-- Every business table has org_id + RLS scoped to the caller's memberships.

create extension if not exists "pgcrypto";

-- ============================================================================
-- CORE: organizations & membership
-- ============================================================================

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_number text unique, -- e.g. "1312"
  tax_id text,
  address text, city text, state text, zip text,
  phone text, email text,
  logo_url text, donate_banner_url text, kiosk_image_url text,
  created_at timestamptz not null default now()
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner','admin','staff')),
  title text, phone text,
  -- module access toggles, mirrors Admin > Users > Lists/Other
  perms jsonb not null default '{
    "donors": true, "reasons": true, "campaigns": true, "locations": true,
    "collectors": true, "users": false, "seats": true, "sources": false,
    "dashboard": true, "notifications": true, "query_reports": true,
    "custom_reports": true, "admin": false
  }'::jsonb,
  -- optional data scoping: null = all; else array of ids
  scoped_reasons uuid[], scoped_collectors uuid[], scoped_locations uuid[],
  scoped_campaigns uuid[], scoped_sources uuid[],
  created_at timestamptz not null default now(),
  unique(org_id, user_id)
);

create or replace function my_org_ids() returns setof uuid
language sql security definer stable as $$
  select org_id from memberships where user_id = auth.uid()
$$;

create or replace function is_org_admin(target_org uuid) returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from memberships
    where org_id = target_org and user_id = auth.uid() and role in ('owner','admin')
  )
$$;

alter table organizations enable row level security;
alter table memberships enable row level security;

create policy "org members can read their org" on organizations
  for select using (id in (select my_org_ids()));
create policy "org admins can update their org" on organizations
  for update using (is_org_admin(id));
create policy "authenticated users can create an org" on organizations
  for insert with check (auth.uid() is not null);

create policy "members read memberships in their org" on memberships
  for select using (org_id in (select my_org_ids()));
create policy "admins manage memberships" on memberships
  for all using (is_org_admin(org_id)) with check (is_org_admin(org_id));
create policy "user can insert own first membership" on memberships
  for insert with check (user_id = auth.uid());

-- ============================================================================
-- LISTS: reasons, campaigns, locations, collectors, sources
-- ============================================================================

create table reasons (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null, reason_number text, goal numeric(12,2), percentage numeric(5,2),
  contact_name text, contact_phone text, contact_email text,
  created_at timestamptz not null default now()
);

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null, campaign_number text, friendly_name text,
  created_at timestamptz not null default now()
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null, nusach text, address text, rabbi text, phone text,
  short_name text, type text default 'Shul',
  created_at timestamptz not null default now()
);

create table collectors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  acct_number text, full_name text not null, address text, "group" text, class text,
  phone text, email text, status text default 'Active',
  created_at timestamptz not null default now()
);

create table sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null, -- e.g. "Nediv Donate", "Nediv Pay", "Shul Kiosk - Main"
  type text not null default 'manual', -- donate, pay, phone, pocket, kiosk, scheduler, manual
  device_id text, status text default 'Active', auto_active boolean default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- DONORS
-- ============================================================================

create table donors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  acct_number text,
  first_name text, last_name text, family_name text,
  first_name_hebrew text, last_name_hebrew text,
  address text, city text, state text, zip text,
  phone text, email text,
  father_name text,
  default_location_id uuid references locations(id) on delete set null,
  "group" text, member_type text, member_since date,
  collection text, call_results text, note text,
  locker_waiting_list boolean default false, seat_waiting_list boolean default false, seat_plate text,
  status text default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index donors_org_idx on donors(org_id);
create index donors_search_idx on donors using gin (
  to_tsvector('simple', coalesce(first_name,'') || ' ' || coalesce(last_name,'') || ' ' || coalesce(family_name,'') || ' ' || coalesce(acct_number,''))
);

create table donor_locations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  donor_id uuid not null references donors(id) on delete cascade,
  label text, address text, city text, state text, zip text, is_primary boolean default false
);

create table donor_family (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  donor_id uuid not null references donors(id) on delete cascade,
  relative_id uuid references donors(id) on delete set null,
  relation text not null, -- father, father_in_law, spouse, son, etc.
  relative_name_freeform text
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table donor_tags (
  donor_id uuid not null references donors(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  primary key (donor_id, tag_id)
);

create table custom_fields (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null, field_type text not null default 'text', -- text, number, date, boolean, select
  options text[],
  created_at timestamptz not null default now()
);

create table donor_custom_values (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  donor_id uuid not null references donors(id) on delete cascade,
  field_id uuid not null references custom_fields(id) on delete cascade,
  value text,
  unique(donor_id, field_id)
);

-- ============================================================================
-- SEATS
-- ============================================================================

create table seat_seasons (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null, is_active boolean default true,
  created_at timestamptz not null default now()
);

create table seat_rates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  location_id uuid references locations(id) on delete cascade,
  section text not null, category text not null, -- e.g. First Row, Middle Row, Back Row
  price numeric(10,2) not null default 0
);

create table seats (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  season_id uuid references seat_seasons(id) on delete cascade,
  seat_number text not null,
  location_id uuid references locations(id) on delete set null,
  row_label text, section text,
  donor_id uuid references donors(id) on delete set null,
  reserved_status text default 'Available', -- Available, Reserved, Waiting
  payment_status text default 'Unpaid',
  seat_price numeric(10,2) default 0,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- TRANSACTIONS: payments, pledges, schedules
-- ============================================================================

create table payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  receipt_number text,
  payment_date date not null default current_date,
  donor_id uuid references donors(id) on delete set null,
  amount numeric(12,2) not null,
  payment_type text not null default 'Cash', -- Cash, Check, Credit Card, Matbia, ACH...
  ref_number text,
  status text not null default 'Success', -- Success, Pending, Failed, Canceled
  note text,
  campaign_id uuid references campaigns(id) on delete set null,
  reason_id uuid references reasons(id) on delete set null,
  location_id uuid references locations(id) on delete set null,
  collector_id uuid references collectors(id) on delete set null,
  source_id uuid references sources(id) on delete set null,
  applied_to_pledge_id uuid,
  created_at timestamptz not null default now()
);

create table pledges (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  pledge_number text,
  pledge_date date not null default current_date,
  donor_id uuid references donors(id) on delete set null,
  amount numeric(12,2) not null,
  paid_amount numeric(12,2) not null default 0,
  status text not null default 'Open', -- Open, Paid, Canceled
  campaign_id uuid references campaigns(id) on delete set null,
  reason_id uuid references reasons(id) on delete set null,
  email text,
  external_note text,
  created_at timestamptz not null default now()
);

alter table payments add constraint payments_pledge_fk foreign key (applied_to_pledge_id) references pledges(id) on delete set null;

create table pledge_payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  pledge_id uuid not null references pledges(id) on delete cascade,
  payment_id uuid not null references payments(id) on delete cascade,
  amount numeric(12,2) not null
);

create table schedules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  schedule_number text,
  donor_id uuid references donors(id) on delete set null,
  total_amount numeric(12,2) not null,
  scheduled_amount numeric(12,2) not null,
  frequency text not null default 'Monthly', -- Weekly, Monthly, Yearly
  next_payment_date date,
  payments_left int,
  status text not null default 'Active', -- Active, Paused, Completed, Canceled
  payment_type text default 'Credit Card',
  campaign_id uuid references campaigns(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- FINANCE: batches
-- ============================================================================

create table batches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  gateway text, gateway_batch_number text,
  status text default 'UnBatched',
  gateway_batch_date date,
  donary_batch_number text,
  note text, bank_tag text,
  transactions_count int default 0,
  fee numeric(10,2) default 0, deposited numeric(12,2) default 0, amount numeric(12,2) default 0,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- REPORTS
-- ============================================================================

create table saved_queries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  fields text[] not null default '{}',
  filters jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

create table alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  subject text not null, message text,
  campaign_id uuid references campaigns(id) on delete set null,
  source_id uuid references sources(id) on delete set null,
  created_at timestamptz not null default now()
);

create table reminders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  type text default 'Task', title text not null,
  due_at timestamptz, status text default 'Open',
  assignee uuid references auth.users(id),
  attached_to text,
  created_at timestamptz not null default now()
);

create table alert_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null default 'default notification',
  assignee uuid references auth.users(id),
  cc_emails text[],
  created_at timestamptz not null default now()
);

-- ============================================================================
-- MINYANIM
-- ============================================================================

create table minyanim (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  tefillah text not null check (tefillah in ('shacharis','mincha','maariv')),
  room text, group_name text,
  brachos_time text, hodu_time text, time_of_day time,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- ADMIN / SETTINGS
-- ============================================================================

create table org_settings (
  org_id uuid primary key references organizations(id) on delete cascade,
  preset_amounts jsonb not null default '[]'::jsonb, -- [{amount,title,has_schedule}]
  email_templates jsonb not null default '{}'::jsonb,
  sms_templates jsonb not null default '{}'::jsonb,
  batch_fee_popup boolean default false,
  updated_at timestamptz not null default now()
);

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  account_name text not null, api_type text default 'Default', gateway text not null,
  currency text default 'USD', campaign_id uuid references campaigns(id) on delete set null,
  reason_id uuid references reasons(id) on delete set null,
  api_key_masked text, pin_masked text, merchant_id text, country text default 'US',
  created_at timestamptz not null default now()
);

-- ============================================================================
-- RLS: generic org-scoped policy for the remaining tables
-- ============================================================================

do $$
declare t text;
begin
  for t in select unnest(array[
    'reasons','campaigns','locations','collectors','sources',
    'donors','donor_locations','donor_family','tags','donor_tags','custom_fields','donor_custom_values',
    'seat_seasons','seat_rates','seats',
    'payments','pledges','pledge_payments','schedules','batches',
    'saved_queries','alerts','reminders','alert_rules','minyanim',
    'org_settings','api_keys'
  ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format($f$create policy "org members read %1$s" on %1$I for select using (org_id in (select my_org_ids()))$f$, t);
    execute format($f$create policy "org members write %1$s" on %1$I for insert with check (org_id in (select my_org_ids()))$f$, t);
    execute format($f$create policy "org members update %1$s" on %1$I for update using (org_id in (select my_org_ids())) with check (org_id in (select my_org_ids()))$f$, t);
    execute format($f$create policy "org members delete %1$s" on %1$I for delete using (org_id in (select my_org_ids()))$f$, t);
  end loop;
end $$;

-- ============================================================================
-- Dashboard helper view
-- ============================================================================

create or replace view v_donor_search as
  select id, org_id, acct_number, first_name, last_name, family_name, email, phone, city
  from donors;
