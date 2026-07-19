-- Seller payout details: where the Seller wants to be paid once a
-- transaction is funded, so Admin has the destination on hand when queuing
-- and confirming the manual payout instead of chasing it over WhatsApp.
-- One row per transaction (upserted by the Seller, read/updated by Admin).

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null unique references public.transactions (id) on delete cascade,
  seller_id uuid not null references public.profiles (id),
  method_type payment_method_type not null,
  account_details text not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  admin_note text,
  paid_by uuid references public.profiles (id),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payouts_seller_id_idx on public.payouts (seller_id);

drop trigger if exists trg_payouts_updated_at on public.payouts;
create trigger trg_payouts_updated_at
  before update on public.payouts
  for each row execute function public.set_updated_at();

alter table public.payouts enable row level security;

-- payouts: visible to the Seller who owns it + Admin.
drop policy if exists payouts_select on public.payouts;
create policy payouts_select on public.payouts
  for select using (seller_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists payouts_insert on public.payouts;
create policy payouts_insert on public.payouts
  for insert with check (
    seller_id = auth.uid()
    and exists (
      select 1 from public.transactions t
      where t.id = transaction_id and t.seller_id = auth.uid()
    )
  );

-- Sellers may edit their own payout details as long as it hasn't been paid
-- out yet; the WITH CHECK also blocks a Seller from setting status to
-- 'paid' themselves. Admin (via the service-role client) marks it paid.
drop policy if exists payouts_update on public.payouts;
create policy payouts_update on public.payouts
  for update using (
    (seller_id = auth.uid() and status = 'pending') or public.is_admin(auth.uid())
  ) with check (
    (seller_id = auth.uid() and status = 'pending') or public.is_admin(auth.uid())
  );
