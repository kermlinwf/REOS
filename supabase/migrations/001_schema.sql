-- REOS schema for Supabase (PostgreSQL)
-- Run in Supabase SQL Editor. Enables RLS so the browser client is safe.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'US',
  property_type text not null default 'residential',
  purchase_price_cents bigint,
  purchase_date date,
  status text not null default 'active'
    check (status in ('active', 'under_contract', 'sold', 'inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  beds numeric(4,1),
  baths numeric(4,1),
  sqft integer,
  market_rent_cents bigint,
  status text not null default 'vacant'
    check (status in ('vacant', 'occupied', 'maintenance', 'offline')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  unit_id uuid not null references public.units (id) on delete restrict,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'expired', 'terminated')),
  start_date date not null,
  end_date date,
  rent_cents bigint not null check (rent_cents >= 0),
  deposit_cents bigint not null default 0 check (deposit_cents >= 0),
  document_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  unit_id uuid references public.units (id) on delete set null,
  lease_id uuid references public.leases (id) on delete set null,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  amount_cents bigint not null check (amount_cents >= 0),
  occurred_on date not null default current_date,
  description text,
  receipt_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists properties_owner_idx on public.properties (owner_id);
create index if not exists units_property_idx on public.units (property_id);
create index if not exists units_owner_idx on public.units (owner_id);
create index if not exists tenants_owner_idx on public.tenants (owner_id);
create index if not exists leases_owner_idx on public.leases (owner_id);
create index if not exists leases_unit_idx on public.leases (unit_id);
create index if not exists transactions_owner_idx on public.transactions (owner_id);
create index if not exists transactions_property_idx on public.transactions (property_id);
create index if not exists transactions_occurred_on_idx on public.transactions (occurred_on);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists properties_updated_at on public.properties;
create trigger properties_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

drop trigger if exists units_updated_at on public.units;
create trigger units_updated_at
  before update on public.units
  for each row execute function public.set_updated_at();

drop trigger if exists tenants_updated_at on public.tenants;
create trigger tenants_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();

drop trigger if exists leases_updated_at on public.leases;
create trigger leases_updated_at
  before update on public.leases
  for each row execute function public.set_updated_at();

drop trigger if exists transactions_updated_at on public.transactions;
create trigger transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — owner-scoped
-- ---------------------------------------------------------------------------

alter table public.properties enable row level security;
alter table public.units enable row level security;
alter table public.tenants enable row level security;
alter table public.leases enable row level security;
alter table public.transactions enable row level security;

-- Properties
create policy "properties_select_own" on public.properties
  for select using (auth.uid() = owner_id);
create policy "properties_insert_own" on public.properties
  for insert with check (auth.uid() = owner_id);
create policy "properties_update_own" on public.properties
  for update using (auth.uid() = owner_id);
create policy "properties_delete_own" on public.properties
  for delete using (auth.uid() = owner_id);

-- Units
create policy "units_select_own" on public.units
  for select using (auth.uid() = owner_id);
create policy "units_insert_own" on public.units
  for insert with check (auth.uid() = owner_id);
create policy "units_update_own" on public.units
  for update using (auth.uid() = owner_id);
create policy "units_delete_own" on public.units
  for delete using (auth.uid() = owner_id);

-- Tenants
create policy "tenants_select_own" on public.tenants
  for select using (auth.uid() = owner_id);
create policy "tenants_insert_own" on public.tenants
  for insert with check (auth.uid() = owner_id);
create policy "tenants_update_own" on public.tenants
  for update using (auth.uid() = owner_id);
create policy "tenants_delete_own" on public.tenants
  for delete using (auth.uid() = owner_id);

-- Leases
create policy "leases_select_own" on public.leases
  for select using (auth.uid() = owner_id);
create policy "leases_insert_own" on public.leases
  for insert with check (auth.uid() = owner_id);
create policy "leases_update_own" on public.leases
  for update using (auth.uid() = owner_id);
create policy "leases_delete_own" on public.leases
  for delete using (auth.uid() = owner_id);

-- Transactions
create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = owner_id);
create policy "transactions_insert_own" on public.transactions
  for insert with check (auth.uid() = owner_id);
create policy "transactions_update_own" on public.transactions
  for update using (auth.uid() = owner_id);
create policy "transactions_delete_own" on public.transactions
  for delete using (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- Storage buckets (run after creating buckets in Dashboard, or via API)
-- Bucket names: receipts, leases — private, authenticated owners only
-- ---------------------------------------------------------------------------
-- Example storage policies (apply after buckets exist):
--
-- create policy "receipts_own" on storage.objects
--   for all using (
--     bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]
--   )
--   with check (
--     bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- create policy "leases_docs_own" on storage.objects
--   for all using (
--     bucket_id = 'leases' and auth.uid()::text = (storage.foldername(name))[1]
--   )
--   with check (
--     bucket_id = 'leases' and auth.uid()::text = (storage.foldername(name))[1]
--   );
