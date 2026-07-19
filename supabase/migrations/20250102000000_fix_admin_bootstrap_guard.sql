-- Fix: guard_profile_updates() / guard_transaction_updates() blocked even
-- a direct SQL Editor / superuser session from setting is_admin, making it
-- impossible to bootstrap the first admin account (a raw database session
-- has no JWT, so auth.uid() is null there -- the guard treated that the
-- same as an untrusted anonymous request). RLS already fully blocks
-- anonymous/unauthenticated PostgREST requests before they ever reach
-- these triggers, so a null auth.uid() here only ever means a trusted
-- superuser connection -- safe to bypass.

create or replace function public.guard_transaction_updates()
returns trigger
language plpgsql
as $$
begin
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

create or replace function public.guard_profile_updates()
returns trigger
language plpgsql
as $$
begin
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
