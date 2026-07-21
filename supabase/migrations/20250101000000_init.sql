-- Escrow Trustlock — initial schema
-- Manual-payment escrow platform: money never moves programmatically through
-- this database. Buyers upload proof of an off-platform payment; Admins
-- manually verify it. See AGENTS.md for the full product spec this mirrors.
--
-- Run via the Supabase CLI: `supabase db push`, or paste into the SQL editor
-- of a fresh Supabase project. Idempotent-ish (uses IF NOT EXISTS / OR
-- REPLACE where practical) but intended to run once against a clean DB.

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists "pgcrypto";

-- ============================================================================
-- Enums
-- ============================================================================
do $$ begin
  create type kyc_status as enum ('none', 'pending', 'verified', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_status as enum (
    'draft',
    'awaiting_acceptance',
    'awaiting_payment',
    'payment_under_review',
    'funded',
    'delivered',
    'inspection_period',
    'accepted',
    'disputed',
    'resolved_buyer',
    'resolved_seller',
    'resolved_split',
    'release_pending',
    'released',
    'refunded',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_category as enum (
    'domain', 'vehicle', 'digital_goods', 'services', 'crypto_asset', 'general_merchandise', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type fee_payer as enum ('buyer', 'seller', 'split');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method_type as enum ('bank_transfer', 'crypto', 'mobile_money', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type proof_status as enum ('pending', 'verified', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type dispute_status as enum ('open', 'under_review', 'resolved_buyer', 'resolved_seller', 'resolved_split');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- Tables
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text not null,
  phone text,
  whatsapp_number text,
  is_admin boolean not null default false,
  kyc_status kyc_status not null default 'none',
  is_suspended boolean not null default false,
  created_at timestamptz not null default now()
);

create sequence if not exists public.transactions_ref_seq start 1;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  reference_code text unique,
  title text not null,
  description text,
  category transaction_category not null default 'other',
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'USD',
  fee_amount numeric(14, 2) not null default 0,
  fee_payer fee_payer not null default 'buyer',
  total_payable numeric(14, 2) not null,
  buyer_id uuid references public.profiles (id),
  seller_id uuid references public.profiles (id),
  buyer_email text,
  seller_email text,
  created_by uuid not null references public.profiles (id),
  status transaction_status not null default 'draft',
  inspection_period_days int not null default 3,
  inspection_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint buyer_or_seller_present check (buyer_email is not null or seller_email is not null)
);

create index if not exists transactions_buyer_id_idx on public.transactions (buyer_id);
create index if not exists transactions_seller_id_idx on public.transactions (seller_id);
create index if not exists transactions_created_by_idx on public.transactions (created_by);
create index if not exists transactions_status_idx on public.transactions (status);
-- buyer_email/seller_email are always normalized to lowercase at the
-- application layer (see lib/actions/transactions.ts), so a plain index
-- (not a lower(...) functional one) is what queries actually hit.
create index if not exists transactions_buyer_email_idx on public.transactions (buyer_email);
create index if not exists transactions_seller_email_idx on public.transactions (seller_email);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  type payment_method_type not null,
  label text not null unique,
  network text,
  account_details jsonb not null default '{}'::jsonb,
  instructions text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  uploaded_by uuid not null references public.profiles (id),
  payment_method_id uuid references public.payment_methods (id),
  amount_claimed numeric(14, 2) not null,
  currency text not null,
  tx_hash_or_reference text,
  file_url text not null,
  status proof_status not null default 'pending',
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now()
);

create index if not exists payment_proofs_transaction_id_idx on public.payment_proofs (transaction_id);
create index if not exists payment_proofs_status_idx on public.payment_proofs (status);
create index if not exists payment_proofs_uploaded_by_idx on public.payment_proofs (uploaded_by);

create table if not exists public.delivery_proofs (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  uploaded_by uuid not null references public.profiles (id),
  description text,
  file_url text,
  tracking_reference text,
  created_at timestamptz not null default now()
);

create index if not exists delivery_proofs_transaction_id_idx on public.delivery_proofs (transaction_id);

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  opened_by uuid not null references public.profiles (id),
  reason text not null,
  status dispute_status not null default 'open',
  resolution_note text,
  resolved_by uuid references public.profiles (id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists disputes_transaction_id_idx on public.disputes (transaction_id);
create index if not exists disputes_status_idx on public.disputes (status);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  sender_id uuid references public.profiles (id),
  body text not null,
  is_system_event boolean not null default false,
  attachment_url text,
  created_at timestamptz not null default now()
);

create index if not exists messages_transaction_id_idx on public.messages (transaction_id, created_at);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id, read_at, created_at desc);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  rated_by uuid not null references public.profiles (id),
  rated_user uuid not null references public.profiles (id),
  score int not null check (score between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (transaction_id, rated_by)
);

create table if not exists public.settings (
  id int primary key default 1,
  platform_name text not null default 'Escrow Trustlock',
  fee_percentage numeric(5, 2) not null default 3.5,
  fee_minimum numeric(10, 2) not null default 10,
  whatsapp_number text,
  support_email text default 'support@example.com',
  default_inspection_days int not null default 3,
  constraint settings_singleton check (id = 1)
);

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id),
  action text not null,
  target_table text not null,
  target_id text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists admin_actions_target_idx on public.admin_actions (target_table, target_id);

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ============================================================================
-- Functions & triggers
-- ============================================================================

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = uid), false);
$$;

grant execute on function public.is_admin(uuid) to anon, authenticated;

-- Auto-create a profile row whenever a new Supabase Auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Generate a human-readable reference code (ESC-<year>-<00042>) on insert.
create or replace function public.set_reference_code()
returns trigger
language plpgsql
as $$
begin
  if new.reference_code is null then
    new.reference_code := 'ESC-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.transactions_ref_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_reference_code on public.transactions;
create trigger trg_set_reference_code
  before insert on public.transactions
  for each row execute function public.set_reference_code();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_transactions_updated_at on public.transactions;
create trigger trg_transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- Defense in depth: once a transaction has left `draft`, its commercial
-- terms are immutable for non-admins even if they hold an UPDATE grant.
create or replace function public.guard_transaction_updates()
returns trigger
language plpgsql
as $$
begin
  -- service_role (used by Server Actions for admin/cross-user writes, see
  -- lib/supabase/admin.ts), verified admins, and direct database sessions
  -- (SQL Editor, migrations, psql -- these have no JWT so auth.uid() is
  -- null) all bypass this guard. The last case is safe: RLS already fully
  -- blocks anonymous/unauthenticated PostgREST requests before they ever
  -- reach this trigger, so a null auth.uid() here only ever means a
  -- trusted superuser connection, not a public request slipping through.
  if auth.role() = 'service_role' or auth.uid() is null or public.is_admin(auth.uid()) then
    return new;
  end if;

  if old.status <> 'draft' and (
    new.amount is distinct from old.amount or
    new.currency is distinct from old.currency or
    new.fee_amount is distinct from old.fee_amount or
    new.fee_payer is distinct from old.fee_payer or
    new.total_payable is distinct from old.total_payable or
    new.created_by is distinct from old.created_by or
    new.reference_code is distinct from old.reference_code
  ) then
    raise exception 'transaction terms are immutable once accepted';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_transaction_updates on public.transactions;
create trigger trg_guard_transaction_updates
  before update on public.transactions
  for each row execute function public.guard_transaction_updates();

-- Prevent non-admins from self-promoting or altering their own trust flags.
create or replace function public.guard_profile_updates()
returns trigger
language plpgsql
as $$
begin
  -- See guard_transaction_updates() above for why a null auth.uid() (a
  -- direct database session, e.g. the SQL Editor bootstrapping the first
  -- admin) is a safe bypass here too.
  if auth.role() = 'service_role' or auth.uid() is null or public.is_admin(auth.uid()) then
    return new;
  end if;

  if new.is_admin is distinct from old.is_admin
    or new.kyc_status is distinct from old.kyc_status
    or new.is_suspended is distinct from old.is_suspended then
    raise exception 'not permitted to change privileged profile fields';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_profile_updates on public.profiles;
create trigger trg_guard_profile_updates
  before update on public.profiles
  for each row execute function public.guard_profile_updates();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.payment_methods enable row level security;
alter table public.payment_proofs enable row level security;
alter table public.delivery_proofs enable row level security;
alter table public.disputes enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.ratings enable row level security;
alter table public.settings enable row level security;
alter table public.admin_actions enable row level security;

-- profiles: users see/edit their own row; admins see/edit all.
-- Counterpart display names are exposed via the profile_public view below,
-- not via this table, so email/phone/kyc never leak to the other party.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid() or public.is_admin(auth.uid()))
  with check (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid());

-- A narrow public view so counterparties can show each other's display name
-- without exposing email/phone/KYC status.
create or replace view public.profile_public as
  select id, full_name from public.profiles;

grant select on public.profile_public to anon, authenticated;

-- transactions: visible to buyer, seller, creator, the invited counterpart
-- (matched by email before they've claimed the invite), or admin.
drop policy if exists transactions_select on public.transactions;
create policy transactions_select on public.transactions
  for select using (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or created_by = auth.uid()
    or lower(coalesce(buyer_email, '')) = lower(coalesce(auth.jwt() ->> 'email', '__none__'))
    or lower(coalesce(seller_email, '')) = lower(coalesce(auth.jwt() ->> 'email', '__none__'))
    or public.is_admin(auth.uid())
  );

drop policy if exists transactions_insert on public.transactions;
create policy transactions_insert on public.transactions
  for insert with check (created_by = auth.uid());

drop policy if exists transactions_update on public.transactions;
create policy transactions_update on public.transactions
  for update using (
    buyer_id = auth.uid() or seller_id = auth.uid() or created_by = auth.uid() or public.is_admin(auth.uid())
  ) with check (
    buyer_id = auth.uid() or seller_id = auth.uid() or created_by = auth.uid() or public.is_admin(auth.uid())
  );

-- payment_methods: active methods are public (buyers need them pre-login
-- context and the marketing site shows them for trust); full list is
-- admin-only.
drop policy if exists payment_methods_select on public.payment_methods;
create policy payment_methods_select on public.payment_methods
  for select using (is_active or public.is_admin(auth.uid()));

drop policy if exists payment_methods_write on public.payment_methods;
create policy payment_methods_write on public.payment_methods
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- payment_proofs: buyer sees their own uploads (incl. rejection notes);
-- admin sees everything. Sellers deliberately get NO row access here —
-- they only ever see the resulting transaction status, never the file.
drop policy if exists payment_proofs_select on public.payment_proofs;
create policy payment_proofs_select on public.payment_proofs
  for select using (uploaded_by = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists payment_proofs_insert on public.payment_proofs;
create policy payment_proofs_insert on public.payment_proofs
  for insert with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.transactions t
      where t.id = transaction_id and t.buyer_id = auth.uid()
    )
  );

drop policy if exists payment_proofs_update on public.payment_proofs;
create policy payment_proofs_update on public.payment_proofs
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- delivery_proofs: visible to both transaction parties + admin; only the
-- seller may upload.
drop policy if exists delivery_proofs_select on public.delivery_proofs;
create policy delivery_proofs_select on public.delivery_proofs
  for select using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    ) or public.is_admin(auth.uid())
  );

drop policy if exists delivery_proofs_insert on public.delivery_proofs;
create policy delivery_proofs_insert on public.delivery_proofs
  for insert with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.transactions t
      where t.id = transaction_id and t.seller_id = auth.uid()
    )
  );

-- disputes: visible to both transaction parties + admin.
drop policy if exists disputes_select on public.disputes;
create policy disputes_select on public.disputes
  for select using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    ) or public.is_admin(auth.uid())
  );

drop policy if exists disputes_insert on public.disputes;
create policy disputes_insert on public.disputes
  for insert with check (
    opened_by = auth.uid()
    and exists (
      select 1 from public.transactions t
      where t.id = transaction_id and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    )
  );

drop policy if exists disputes_update on public.disputes;
create policy disputes_update on public.disputes
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- messages: visible to both transaction parties + admin; only human,
-- non-system messages may be inserted directly by a party (system events
-- are written server-side with the service-role key).
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    ) or public.is_admin(auth.uid())
  );

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (
    is_system_event = false
    and sender_id = auth.uid()
    and (
      exists (
        select 1 from public.transactions t
        where t.id = transaction_id and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
      ) or public.is_admin(auth.uid())
    )
  );

-- notifications: strictly private to the recipient; only written
-- server-side (service role), so no authenticated INSERT policy exists.
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ratings: visible to the two parties on that transaction + admin; a user
-- may only rate the other party on a transaction they were part of.
drop policy if exists ratings_select on public.ratings;
create policy ratings_select on public.ratings
  for select using (
    rated_by = auth.uid() or rated_user = auth.uid() or public.is_admin(auth.uid())
  );

drop policy if exists ratings_insert on public.ratings;
create policy ratings_insert on public.ratings
  for insert with check (
    rated_by = auth.uid()
    and exists (
      select 1 from public.transactions t
      where t.id = transaction_id
        and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
        and (rated_user = t.buyer_id or rated_user = t.seller_id)
        and rated_user <> auth.uid()
    )
  );

-- settings: public read (marketing fee calculator + global WhatsApp button
-- need it pre-login), admin-only write.
drop policy if exists settings_select on public.settings;
create policy settings_select on public.settings for select using (true);

drop policy if exists settings_write on public.settings;
create policy settings_write on public.settings
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- admin_actions: the audit trail — admins only, in both directions.
drop policy if exists admin_actions_select on public.admin_actions;
create policy admin_actions_select on public.admin_actions
  for select using (public.is_admin(auth.uid()));

drop policy if exists admin_actions_insert on public.admin_actions;
create policy admin_actions_insert on public.admin_actions
  for insert with check (public.is_admin(auth.uid()) and admin_id = auth.uid());

-- ============================================================================
-- Storage buckets (private; access only via signed URLs from server code)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('delivery-proofs', 'delivery-proofs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Users may upload into their own folder (path prefix = their uid); reads
-- for the sensitive buckets happen exclusively through server-issued signed
-- URLs, so no broad SELECT policy is granted on those objects here.
drop policy if exists "payment proofs: owner insert" on storage.objects;
create policy "payment proofs: owner insert" on storage.objects
  for insert with check (
    bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "delivery proofs: owner insert" on storage.objects;
create policy "delivery proofs: owner insert" on storage.objects
  for insert with check (
    bucket_id = 'delivery-proofs' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "kyc docs: owner insert" on storage.objects;
create policy "kyc docs: owner insert" on storage.objects
  for insert with check (
    bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars: owner write" on storage.objects;
create policy "avatars: owner write" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "admins: read all private buckets" on storage.objects;
create policy "admins: read all private buckets" on storage.objects
  for select using (
    bucket_id in ('payment-proofs', 'delivery-proofs', 'kyc-documents') and public.is_admin(auth.uid())
  );

drop policy if exists "owners: read own uploads" on storage.objects;
create policy "owners: read own uploads" on storage.objects
  for select using (
    bucket_id in ('payment-proofs', 'delivery-proofs', 'kyc-documents')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
