-- Defense-in-depth DELETE policy for transactions. The app deletes through
-- the service-role client (lib/actions/transactions.ts:deleteTransactionAction)
-- after its own ownership/status checks, but every table in this schema
-- gets an explicit RLS policy per AGENTS.md Section 4/11 — there was no
-- DELETE policy on this table before (no policy = command denied by
-- default under RLS), this adds one so the invariant holds even for direct
-- API access, not just the app's own code path.
drop policy if exists transactions_delete on public.transactions;
create policy transactions_delete on public.transactions
  for delete using (created_by = auth.uid() or public.is_admin(auth.uid()));
