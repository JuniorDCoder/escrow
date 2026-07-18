# Amana Escrow (placeholder name)

A trusted third-party escrow platform: a Buyer and Seller agree on a deal, the Buyer pays into escrow off-platform and
uploads proof, an Admin manually verifies it, the Seller delivers, and funds are released once the Buyer accepts. See
[`AGENTS.md`](./AGENTS.md) for the full product spec this build follows — read it before making product decisions.

**"Amana Escrow" is a placeholder brand.** No name/logo has been chosen by the client yet. The name is not hardcoded
anywhere — it's read from `NEXT_PUBLIC_APP_NAME` in one place, `lib/constants.ts`. Change the env var to rebrand.

## Tech stack

Next.js (App Router) + TypeScript, Supabase (Postgres, Auth, Storage), Tailwind CSS v4, react-hook-form + zod, Server
Actions for all mutations. No payment gateway — payment confirmation is a manual, human-verified step by design.

## First-time setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the schema migration** — creates every table, enum, RLS policy, trigger, and private storage bucket.

   **Automated (recommended, set up once):** `.github/workflows/supabase-migrations.yml` runs
   `supabase db push` against your linked project automatically on every push to `main` that touches
   `supabase/migrations/**` — no dashboard step, no local CLI needed after this. To turn it on:

   1. Get a personal access token: [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) → Generate new token.
   2. Get your database password: Project Settings → Database → Database password (the one you set when the
      project was created; reset it there if you don't have it).
   3. Get your project ref: it's in the project URL, `supabase.com/dashboard/project/<this-part>`.
   4. In the GitHub repo: Settings → Secrets and variables → Actions → New repository secret, add all three:
      `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_ID`.
   5. Push anything to `main` that touches `supabase/migrations/` (already true as of this commit — merging it
      is enough) — or trigger it manually once from the **Actions** tab → "Deploy Supabase migrations" → **Run
      workflow**. Watch the run; the last step's output confirms which migrations applied.

   From then on, every future migration file you add and merge to `main` deploys itself. Note this only pushes
   `supabase/migrations/` — it deliberately does **not** run `supabase/seed.sql` automatically, since that file
   has placeholder bank/wallet details you shouldn't seed into production without reviewing (configure real
   payment methods via `/admin/payment-methods` instead once you're an admin — see step 4 below).

   **Manual fallback, if you'd rather not wire up CI right now — Supabase SQL Editor.** Dashboard → SQL Editor →
   New query → paste the entire contents of `supabase/migrations/20250101000000_init.sql` → Run. This works
   immediately regardless of any CI/CLI setup, and is safe to also do once even if you set up the automated path
   above (rerunning a migration that already applied just errors on "already exists," harmless).

3. **Copy environment variables**: `cp .env.example .env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project Settings → API in Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY` — same page. **Server-only, never expose to the client or commit it.**
   - `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SITE_URL` as needed.
4. **Make yourself an admin.** Sign up through the app once, then in the Supabase SQL Editor:
   ```sql
   update public.profiles set is_admin = true where email = 'you@example.com';
   ```
5. **Install and run:**
   ```bash
   npm install
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `app/(marketing)/*` — public site: landing, how-it-works, fees, FAQ, contact, legal.
- `app/auth/*` — login, signup, password reset (Supabase Auth).
- `app/(app)/*` — authenticated Buyer/Seller app: dashboard, transaction creation/detail, settings.
- `app/admin/*` — admin console (payment review queue, disputes, users, payment methods, settings), gated by
  `profiles.is_admin`.
- `lib/domain/` — the transaction state machine (`state-machine.ts`), fee calculator (`fees.ts`), permissions,
  notification copy. Business rules live here, not scattered through components.
- `lib/actions/` — all Server Actions (mutations). Every status-changing action validates the caller via the
  request-scoped Supabase client (which respects Row Level Security) before writing through the service-role client
  in `lib/actions/_shared.ts`.
- `lib/supabase/` — browser client, server (per-request) client, and the service-role admin client.
- `supabase/migrations/20250101000000_init.sql` — the entire schema, RLS policies, and storage bucket setup.
- `supabase/config.toml` — CLI project config (from `supabase init`); needed for `supabase link`/`db push` to work,
  including in the CI workflow above. Don't rename or delete it.
- `.github/workflows/supabase-migrations.yml` — auto-deploys new migrations on push to `main`, see setup above.

## Security notes

- RLS is enabled on every table — see the migration for the exact policies. The service-role key bypasses RLS and is
  only ever imported in server-only files (`lib/actions/_shared.ts`, `lib/supabase/admin.ts`).
- Payment proof and KYC files live in private Storage buckets, served only via short-lived signed URLs generated
  server-side (`lib/data/storage.ts`). Sellers never see a Buyer's uploaded payment proof file — only the resulting
  "funded" status.
- Every admin mutation is written to `admin_actions` for an audit trail.

## Deploying

Push to GitHub and import the repo in [Vercel](https://vercel.com/new). Add the same environment variables from
`.env.example` in the Vercel project settings. No other configuration is required — there's no background job runner;
an expired inspection window is auto-accepted lazily the next time the transaction is loaded (see
`reconcileInspectionWindow` in `lib/actions/transactions.ts`).

## What's still open

See AGENTS.md Section 13 — exact payment methods/networks to support, final fee structure, KYC depth, and the
WhatsApp number(s) are all client decisions that need to be set in `/admin/settings` and `/admin/payment-methods`
before launch. The brand name and logo also still need to be chosen (Section 10 has candidate directions).
