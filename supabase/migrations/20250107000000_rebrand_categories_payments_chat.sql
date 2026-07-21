-- Batch migration for the Escrow Trustlock rebrand + product changes:
--   1. Default platform name -> "Escrow Trustlock" (only overwrites the row
--      if it still holds the old placeholder default, never clobbers a
--      value Admin already customized via /admin/settings).
--   2. New transaction categories: Jewelry, Luxury Goods.
--   3. New payment/payout method types: Zelle, Cash App, Chime, Apple Pay.
--      Postgres enums can't drop a value once added, so 'mobile_money'
--      stays a valid (unused going forward) value at the DB level — it's
--      simply no longer offered in the app's UI. See lib/constants.ts /
--      lib/validations/payment.ts for where it was removed from selection.
--   4. Admin-configurable live chat widget embed on the `settings` table
--      (public-read, same as whatsapp_number — needs to load on anonymous
--      marketing pages too), replacing the floating WhatsApp button.

-- 1. Rebrand -----------------------------------------------------------
alter table public.settings alter column platform_name set default 'Escrow Trustlock';
update public.settings set platform_name = 'Escrow Trustlock' where platform_name = 'Amana Escrow';

-- 2. New categories ------------------------------------------------------
alter type transaction_category add value if not exists 'jewelry';
alter type transaction_category add value if not exists 'luxury_goods';

-- 3. New payment method types --------------------------------------------
alter type payment_method_type add value if not exists 'zelle';
alter type payment_method_type add value if not exists 'cash_app';
alter type payment_method_type add value if not exists 'chime';
alter type payment_method_type add value if not exists 'apple_pay';

-- 4. Live chat widget ------------------------------------------------------
alter table public.settings add column if not exists chat_enabled boolean not null default false;
alter table public.settings add column if not exists chat_embed_code text;
