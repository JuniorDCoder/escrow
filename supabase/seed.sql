-- Optional starter data for local development / a fresh project.
-- Run after 0001_init.sql. Safe to skip or edit before running — none of
-- these values are real bank/wallet details, replace them from /admin/payment-methods.

insert into public.settings (id, platform_name, fee_percentage, fee_minimum, whatsapp_number, support_email, default_inspection_days)
values (1, 'Amana Escrow', 3.5, 10, '15550001234', 'support@example.com', 3)
on conflict (id) do update set
  platform_name = excluded.platform_name,
  fee_percentage = excluded.fee_percentage,
  fee_minimum = excluded.fee_minimum,
  whatsapp_number = excluded.whatsapp_number,
  support_email = excluded.support_email,
  default_inspection_days = excluded.default_inspection_days;

insert into public.payment_methods (type, label, network, account_details, instructions, is_active)
values
  ('bank_transfer', 'Bank Transfer (USD)', 'Wire / ACH', '{"bank_name": "Example Bank", "account_name": "Amana Escrow Ltd", "account_number": "0000000000", "swift": "EXAMPLEXXX"}', 'Include your transaction reference code in the payment description.', true),
  ('crypto', 'USDT (TRC20)', 'Tron (TRC20)', '{"address": "TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}', 'Send the exact amount shown. Underpayments/overpayments delay verification.', true),
  ('crypto', 'Bitcoin', 'BTC (on-chain)', '{"address": "bc1qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}', 'Wait for at least 1 confirmation before uploading your proof.', true),
  ('mobile_money', 'M-Pesa', 'Kenya', '{"paybill": "000000", "account_name": "Amana Escrow"}', 'Use your transaction reference code as the account number.', false)
on conflict do nothing;
