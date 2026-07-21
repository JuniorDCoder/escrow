-- Admin-configurable SMTP settings, editable from /admin/settings without a
-- redeploy. Deliberately NOT part of the public `settings` table (which has
-- an open `for select using (true)` policy for the public fee
-- calculator/WhatsApp button) — this table holds a mail account password,
-- so it gets its own admin-only RLS instead. lib/email/send.ts reads this
-- via the service-role client and falls back to MAIL_* env vars if this
-- row has no host configured.

do $$ begin
  create type mail_encryption as enum ('ssl', 'tls', 'none');
exception when duplicate_object then null; end $$;

create table if not exists public.email_settings (
  id int primary key default 1,
  mail_host text,
  mail_port int,
  mail_username text,
  mail_password text,
  mail_encryption mail_encryption,
  mail_from_address text,
  mail_from_name text,
  updated_at timestamptz not null default now(),
  constraint email_settings_singleton check (id = 1)
);

insert into public.email_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists trg_email_settings_updated_at on public.email_settings;
create trigger trg_email_settings_updated_at
  before update on public.email_settings
  for each row execute function public.set_updated_at();

alter table public.email_settings enable row level security;

drop policy if exists email_settings_select on public.email_settings;
create policy email_settings_select on public.email_settings
  for select using (public.is_admin(auth.uid()));

drop policy if exists email_settings_update on public.email_settings;
create policy email_settings_update on public.email_settings
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
