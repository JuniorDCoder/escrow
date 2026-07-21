# Escrow Trustlock

A trusted third-party escrow platform: a Buyer and Seller agree on a deal, the Buyer pays into escrow off-platform and
uploads proof, an Admin manually verifies it, the Seller delivers, and funds are released once the Buyer accepts. See
[`AGENTS.md`](./AGENTS.md) for the full product spec this build follows — read it before making product decisions.

Domain: **escrowtrustlock.online**. The name isn't hardcoded anywhere — it's read from `NEXT_PUBLIC_APP_NAME` in one
place, `lib/constants.ts`, falling back to the `settings.platform_name` DB value. Change the env var to rebrand again.

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
   - `NEXT_PUBLIC_SITE_URL` — **set this to your real deployed URL in Vercel's project settings, not just
     locally.** It's used to build every link in emails and auth redirects; left unset in production, it
     silently falls back to `http://localhost:3000` and every one of those links breaks.
   - `MAIL_HOST` / `MAIL_PORT` / `MAIL_USERNAME` / `MAIL_PASSWORD` / `MAIL_ENCRYPTION` / `MAIL_FROM_ADDRESS` /
     `MAIL_FROM_NAME` — SMTP fallback credentials for transactional email (works with Hostinger, or any SMTP
     provider). **These are only a fallback** — the primary way to configure email is Admin → Settings →
     Email (SMTP) in the running app, no redeploy needed; these env vars only kick in if that admin-configured
     row is empty. Without either one set, the app only creates in-app notifications and logs a warning
     instead of emailing. **This matters more than it sounds**: when someone creates a transaction and invites
     a counterparty who doesn't have an account yet, email is the *only* way that person finds out — there's
     no in-app notification to show someone who's never logged in. Use port `465` with `MAIL_ENCRYPTION=ssl`
     (implicit TLS) or port `587` with `MAIL_ENCRYPTION=tls` (STARTTLS) — both work. `MAIL_FROM_NAME` must be
     a literal string, not `${APP_NAME}` (that's Laravel-only syntax and won't be expanded here) — leave it
     unset to fall back to `NEXT_PUBLIC_APP_NAME` automatically.
   - `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_WHATSAPP_NUMBER` as needed.
   - **On Vercel specifically:** these all need to be added under Project Settings → Environment Variables —
     a local `.env.local` file has no effect on the deployed site.

   **On Supabase Auth email links landing on the wrong URL:** if a confirmation/reset email link takes someone
   to `localhost:3000` (or the wrong domain) instead of your deployed app, that's not this app's code — it's
   Supabase's own **Authentication → URL Configuration** settings. Supabase ignores the redirect URL your code
   asks for unless it's on the allow-list, and silently falls back to whatever **Site URL** is configured
   there (which defaults to `http://localhost:3000` on every new project). Fix it in the Supabase dashboard:
   - **Site URL** → your real deployed URL (e.g. `https://your-app.vercel.app`)
   - **Redirect URLs** → add `https://your-app.vercel.app/auth/callback` and, for flexibility across preview
     deploys, a wildcard like `https://your-app.vercel.app/**`. Keep `http://localhost:3000/**` in the list
     too so local dev keeps working.

   **Two separate email systems — don't confuse them.** The `MAIL_*` env vars / Admin → Settings → Email
   (SMTP) above only send *this app's own* transactional emails (transaction invites, payment status updates,
   etc.) via `lib/email/send.ts`. Supabase Auth's own emails — signup confirmation, password reset — are sent
   entirely by Supabase's GoTrue service and never touch this app's code, so that SMTP config has **zero**
   effect on them. Supabase's default built-in email sender is low-volume/rate-limited and can silently fail
   to deliver, especially after a burst of test signups. If confirmation emails aren't arriving at all (not
   just landing on the wrong URL), configure Supabase's *own* SMTP separately: Project Settings → Auth → SMTP
   Settings, using the same mailbox credentials — this is a second, independent settings panel from the one
   in this app.

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
