# AGENTS.md — Escrow Platform Build Guide

> This file is the single source of truth for any AI coding agent (Claude Code, Cursor, etc.) working on this repository. Read it fully before writing code. Update it whenever a decision changes.

---

## 1. What we're building

A trusted third-party escrow platform, functionally modeled on **escrow.com**, for a client who needs it live and working end-to-end. Two people (a Buyer and a Seller) agree on a deal off-platform or on-platform, create a transaction, the Buyer pays into escrow, the Seller delivers the item/service/domain/code/etc., the Buyer accepts, and the funds are released to the Seller. The platform is the neutral party that holds and controls when money moves.

**Key difference from escrow.com:** escrow.com integrates real payment rails (wire, card, PayPal) and moves money itself. This platform does **not** move money programmatically. All payment (bank transfer, mobile money, crypto, etc.) happens **off-platform, manually**, between the Buyer and the platform's designated receiving account/wallet. The Buyer then uploads **proof of payment** (screenshot, receipt, tx hash) inside the platform, and an **Admin manually verifies** it and marks the transaction as funded. Same pattern on the release side if needed. This is the single most important architectural fact — build the whole state machine around "manual payment + proof upload + admin verification," not around a payment gateway.

A WhatsApp contact button/widget must be reachable from effectively everywhere in the product (public site, dashboard, transaction pages, support) so users can reach a human immediately.

---

## 2. How escrow.com's model actually works (reference, extracted)

Escrow.com's core flow, which we are adapting:

1. **Agreement** — Buyer and Seller agree on terms: item/service, price, currency, who pays fees, inspection/delivery period.
2. **Transaction creation** — One party (usually Buyer, sometimes Seller or a Broker) creates the transaction in the platform, invites the counterparty by email, and both parties confirm/accept the terms before anything else happens.
3. **Buyer pays into escrow** — Buyer sends payment to escrow's account (in our version: uploads proof after sending to our published bank/crypto details). Funds are considered "secured" only after verification — never on the Buyer's say-so alone.
4. **Seller is notified funds are secured** and proceeds to ship/deliver/perform the work, because they now know the money exists and won't disappear.
5. **Delivery & inspection window** — Buyer receives/reviews the goods/work within an agreed inspection period and either accepts or raises a dispute.
6. **Funds released to Seller** — On acceptance (explicit "Accept" action, or automatically once the inspection period lapses with no dispute), the Seller is paid out. In our version: Admin manually pays the Seller off-platform and marks the transaction "Released," optionally with the Seller uploading their payout details and Admin uploading proof of payout too.
7. **Dispute path** — If the Buyer isn't satisfied, they open a dispute before the inspection window closes; the item may be returned, or the platform (Admin acting as escrow agent) reviews evidence from both sides and decides.
8. **Fees** — Escrow.com charges a fee (tiered by transaction size, often split or paid by one party) shown up front via a fee calculator before the transaction is created. We should replicate a simple fee calculator even though payment is manual, so both parties know the number before committing.

Escrow.com's UI patterns worth mirroring:
- A public **fee calculator** on the marketing site (no login needed) to build trust before signup.
- A **transaction detail page** that is really a timeline/stepper: Agreement → Payment → Delivery → Acceptance → Payment Released, with the current step highlighted and clear "what happens next / whose turn it is" messaging.
- **Milestones** for larger/service transactions (split a transaction into partial deliverables and partial payments) — optional v2 feature, mention in schema but don't have to build first.
- A **Messages/Activity log** per transaction (every status change, upload, and message is timestamped and visible to both parties + admin).
- Strong emphasis everywhere on trust signals: verified badges, security explainers, "how it works" pages, testimonials, support contact.

We are not copying escrow.com's trademarks, logo, brand name, or literal copy — we are copying the **mechanics and information architecture** and building original branding (see Section 10).

---

## 3. User roles & permissions

| Role | Capabilities |
|---|---|
| **Guest** | View marketing pages, fee calculator, "how it works," sign up / log in. |
| **Buyer** | Create transactions, invite a Seller, view fee estimate, upload payment proof, message counterparty + admin, accept delivery, open a dispute, rate the Seller. |
| **Seller** | Accept/decline a transaction invite, view funded status, mark item shipped/delivered, upload delivery/tracking proof, message counterparty + admin, respond to disputes, rate the Buyer. |
| **Admin** | God-mode. Verify payment proofs, manually mark transactions funded/released/refunded/cancelled, resolve disputes, manage users (suspend/verify KYC), manage supported payment methods and receiving addresses/accounts, view all transactions and messages, edit platform fee settings, respond as "Support" in any thread. |
| **(v2) Broker/Affiliate** | Optional — can create transactions on behalf of clients, earn referral fee. Not required for v1. |

A single user can be both a Buyer on one transaction and a Seller on another — role is per-transaction, not per-account. Admin is a separate account flag (`profiles.is_admin`), not a per-transaction role.

---

## 4. Tech stack (mandatory)

- **Framework:** Next.js (latest stable, App Router, TypeScript, Server Components + Server Actions where sensible — don't over-fetch client-side).
- **Hosting:** Vercel.
- **Backend/DB/Auth/Storage:** Supabase — Postgres for data, Supabase Auth for accounts (email/password + optional magic link), Supabase Storage for file uploads (payment proofs, delivery proofs, KYC docs, avatars).
- **Row Level Security is mandatory.** Every table gets RLS policies — never rely on the client or API route alone to enforce who can see/edit what. Admins bypass via a `service_role` key used only in server-side code, never exposed to the client.
- **Styling:** Tailwind CSS + a component library (shadcn/ui is fine) — clean, financial/fintech-trustworthy look, not flashy. See Section 10 for tone.
- **Forms/validation:** react-hook-form + zod.
- **Email:** Supabase Auth emails for auth flows; use Resend (or similar) for transactional notifications (funded, disputed, released, etc.) if budget allows — otherwise in-app notifications only for v1.
- **File uploads:** Supabase Storage buckets, private by default, served via signed URLs — payment proofs and KYC documents are sensitive and must never be public.
- **State/data fetching:** Server Actions + Supabase server client for mutations; React Query only if client-side polling/live updates are needed (e.g., admin queue).
- **Deployment:** Vercel project connected to GitHub, environment variables for Supabase URL/anon key/service role key, never commit secrets.

Do not introduce a payment gateway (Stripe, PayPal SDK, etc.) unless explicitly asked later — v1 is manual-proof-based by design, per the client's requirement.

---

## 5. Core data model (Supabase / Postgres)

Build these tables (names indicative, keep consistent casing/conventions):

**`profiles`**
`id (uuid, FK auth.users)`, `full_name`, `email`, `phone`, `whatsapp_number`, `is_admin (bool)`, `kyc_status (enum: none, pending, verified, rejected)`, `created_at`.

**`transactions`**
`id`, `reference_code (human readable, e.g. ESC-2026-00042)`, `title`, `description`, `category (domain, vehicle, digital_goods, services, crypto_asset, general_merchandise, other)`, `amount`, `currency`, `fee_amount`, `fee_payer (buyer, seller, split)`, `total_payable`, `buyer_id`, `seller_id`, `created_by`, `status (enum — see Section 6)`, `inspection_period_days`, `inspection_ends_at`, `created_at`, `updated_at`.

**`payment_methods`** (admin-managed, what the platform currently accepts)
`id`, `type (bank_transfer, crypto, mobile_money, other)`, `label`, `network (e.g. "USDT TRC20", "Bitcoin", "Bank: XYZ")`, `account_details (text/jsonb — account number, wallet address, etc.)`, `is_active`, `instructions`.

**`payment_proofs`**
`id`, `transaction_id`, `uploaded_by`, `payment_method_id`, `amount_claimed`, `currency`, `tx_hash_or_reference`, `file_url (storage path)`, `status (enum: pending, verified, rejected)`, `reviewed_by (admin id, nullable)`, `reviewed_at`, `admin_note`, `created_at`.

**`delivery_proofs`**
`id`, `transaction_id`, `uploaded_by (seller)`, `description`, `file_url`, `tracking_reference (nullable)`, `created_at`.

**`disputes`**
`id`, `transaction_id`, `opened_by`, `reason`, `status (enum: open, under_review, resolved_buyer, resolved_seller, resolved_split)`, `resolution_note`, `resolved_by (admin id)`, `resolved_at`, `created_at`.

**`messages`**
`id`, `transaction_id`, `sender_id (nullable if system/admin-as-support)`, `body`, `is_system_event (bool)`, `attachment_url (nullable)`, `created_at`.
System events (status changes, "Buyer uploaded payment proof," "Admin verified payment," etc.) are inserted as rows here with `is_system_event = true` so the transaction page can render one unified activity timeline.

**`notifications`**
`id`, `user_id`, `type`, `payload (jsonb)`, `read_at (nullable)`, `created_at`.

**`ratings`** (post-transaction, optional but recommended)
`id`, `transaction_id`, `rated_by`, `rated_user`, `score (1-5)`, `comment`.

**`settings`** (single-row or key/value table for admin-configurable platform settings)
`fee_percentage`, `fee_minimum`, `whatsapp_number(s)`, `support_email`, `default_inspection_days`, `platform_name`.

Design every table so an Admin query can join across all of it for the review queue and dispute center without N+1 hacks — this is the highest-traffic internal screen.

---

## 6. Transaction status state machine

This is the backbone of the whole app. Implement it as an explicit enum + a small state-transition function (server-side only, never trust the client to move status), not ad hoc string checks scattered around the code.

```
draft
  -> awaiting_acceptance   (created_by invited counterparty; waiting for them to accept terms)
awaiting_acceptance
  -> awaiting_payment       (counterparty accepted terms)
  -> cancelled              (declined or expired)
awaiting_payment
  -> payment_under_review   (buyer uploaded a payment_proof)
  -> cancelled
payment_under_review
  -> funded                 (admin verified the proof)
  -> awaiting_payment       (admin rejected the proof, buyer must retry)
funded
  -> delivered               (seller uploaded delivery_proof / marked shipped)
  -> disputed                (either party opens a dispute before delivery)
delivered
  -> inspection_period       (buyer has N days to accept or dispute)
inspection_period
  -> accepted                (buyer explicitly accepts, or period lapses with no dispute -> auto-accept)
  -> disputed
accepted
  -> release_pending         (admin queues seller payout)
release_pending
  -> released                (admin confirms seller was paid; transaction complete)
disputed
  -> resolved_buyer | resolved_seller | resolved_split -> released or refunded accordingly
```

Every transition must:
1. Be triggered by a Server Action guarded by an auth + role check (is this user allowed to cause this transition?).
2. Write a `messages` system-event row describing what happened.
3. Trigger a `notifications` row for the affected counterpart(y/ies).
4. Never be reversible except by Admin (e.g., Admin can force-move a stuck transaction, everyone else follows the arrows above).

---

## 7. Manual payment flow — build this exactly

This is the client's core requirement, so be precise:

1. Buyer reaches `awaiting_payment`. The transaction page shows: the exact amount due (including fees), the currently active `payment_methods` (bank details / crypto wallet addresses per network, pulled live from the `payment_methods` table so Admin can update them without a redeploy), and a **"I've made this payment"** action.
2. Buyer clicks it, which opens a form to submit a `payment_proofs` row: which method they used, amount, currency, an optional tx hash / reference number, and a **required file upload** (screenshot/receipt) to Supabase Storage (private bucket).
3. Transaction flips to `payment_under_review`; both the transaction timeline and the Admin queue immediately reflect a new pending proof.
4. Admin opens the review queue (`/admin/payments` — a filterable, sortable list of all `pending` `payment_proofs`, newest first, with quick links to the transaction, the uploaded file, and a Verify/Reject action with a required note on rejection).
5. Verify → transaction becomes `funded`, seller is notified, everyone sees "Payment secured" on the timeline (do **not** show the buyer's raw proof file to the seller — sellers should only see a confirmation, not the buyer's bank statement/screenshot, for privacy; admin sees everything).
6. Reject → transaction stays/reverts to `awaiting_payment` with the admin's note visible to the buyer explaining why (wrong amount, blurry proof, wrong account, etc.), and the buyer can resubmit.
7. Same manual-proof pattern applies to the **payout** side at `release_pending`: Admin manually pays the Seller externally, uploads their own proof internally for the audit trail (not necessarily buyer/seller-visible), and marks `released`.

Build the Admin review queue as a first-class screen from day one — it is the operational heart of the product, not an afterthought.

---

## 8. WhatsApp integration

Client requirement: a WhatsApp contact option must be reachable throughout the site.

- Use `https://wa.me/<number>?text=<url-encoded prefilled message>` links — no need for the paid WhatsApp Business API for v1, `wa.me` deep links are sufficient and free.
- Global floating WhatsApp button (bottom-right, standard green bubble, accessible label) present on every public page and inside the authenticated app shell.
- Contextual prefilled messages: e.g. on a transaction page, prefill `"Hi, I need help with transaction ESC-2026-00042"` so support has context immediately.
- Also place a WhatsApp link in: footer, contact/support page, "how it works" page, and the header of transaction pages ("Need help? Chat with us on WhatsApp").
- Store the number(s) in the `settings` table (or an env var if there's genuinely only ever one), never hardcode it in components, so Admin/marketing can change it without a redeploy.
- If the client later wants in-app chat instead of/alongside WhatsApp, the `messages` table already supports that — WhatsApp is for pre-signup / urgent / off-platform contact, in-app `messages` is for per-transaction communication once a deal exists.

---

## 9. Page / route map

**Public / marketing**
- `/` — landing page: value prop, how it works (3–5 step visual), trust signals, fee calculator teaser, CTA to sign up, WhatsApp bubble.
- `/how-it-works`
- `/fees` — live fee calculator (amount in → fee + total out, no login required)
- `/pricing` (can merge with `/fees`)
- `/faq`
- `/contact` (WhatsApp + email + optional form)
- `/legal/terms`, `/legal/privacy` — required for anything handling money and KYC, even manually
- `/auth/login`, `/auth/signup`, `/auth/reset-password`

**Authenticated (Buyer/Seller)**
- `/dashboard` — list of the user's transactions, status badges, quick actions
- `/transactions/new` — create a transaction (title, description, category, counterpart email, amount, currency, who pays fee, inspection period) → shows computed fee before submit
- `/transactions/[id]` — the core screen: stepper/timeline, current status, role-specific call to action (pay / upload proof / mark delivered / accept / dispute), activity + messages feed, WhatsApp help link
- `/transactions/[id]/dispute` — open/view a dispute thread
- `/settings/profile`, `/settings/security`, `/settings/notifications`

**Admin** (`/admin/*`, gated by `profiles.is_admin`)
- `/admin` — overview dashboard: counts by status, pending payment reviews, open disputes
- `/admin/transactions` — full searchable/filterable list, force-transition tool
- `/admin/payments` — the payment proof review queue (Section 7)
- `/admin/disputes` — dispute resolution workspace
- `/admin/users` — user list, KYC status, suspend/verify
- `/admin/payment-methods` — manage accepted bank/crypto details shown to buyers
- `/admin/settings` — fee %, WhatsApp number(s), support email, default inspection period

Build in this order: Auth → transaction creation/state machine → manual payment flow + admin review queue → delivery/acceptance → disputes → polish/marketing pages. A working money-holding loop end-to-end beats a beautiful landing page with a broken core flow.

---

## 10. Branding — decided: Escrow Trustlock

The client has chosen the name **Escrow Trustlock**, domain **escrowtrustlock.online**. The name is still **not hardcoded** anywhere — it's pulled from one place (`NEXT_PUBLIC_APP_NAME` env var, falling back to the `settings.platform_name` value in the DB), so a future rename stays a one-line env-var change, not a find-and-replace across the repo. Set `NEXT_PUBLIC_APP_NAME="Escrow Trustlock"` and `NEXT_PUBLIC_SITE_URL="https://escrowtrustlock.online"` in Vercel's project env vars.

**Visual identity direction (for whoever builds the actual logo):**
- Simple wordmark + a geometric mark: a shield, a lock, a handshake abstraction, or two interlocking brackets (representing "holding in the middle"). Avoid literal padlock cliché if possible — most fintech/escrow brands use it, differentiate with a shield, a knot, or an abstract "H" (hold). The current favicon/app icon is an abstract shield mark, not tied to any specific name, so it doesn't need regenerating for the rename.
- Color: deep blue/navy or teal as primary (trust, finance), a single accent (amber/green) reserved only for "funds secured / success" states — don't let the accent color leak into general UI or it loses meaning.
- Typography: a clean geometric or humanist sans (Inter, Manrope, Söhne-alike) — no display/script fonts anywhere near money.

**On matching escrow.com's look:** mirroring their layout, copy style, and "why trust us" structure is fine and intentional. Do **not** mirror their actual numbers, awards, or partner logos (transaction volume, customer counts, BBB Torch Award, U.S. Commercial Service seal, eBay partnership) — those are escrow.com's real, verifiable credentials, not this platform's. Presenting them as Escrow Trustlock's own would be fabricating trust signals, which is exactly the pattern fake-escrow scam sites use. Once this platform has real volume/testimonials, replace the honest placeholder trust section with real ones.

---

## 11. Security & compliance notes (non-negotiable)

- RLS on every table. A Buyer must never be able to query another user's transaction, and must never see another buyer's payment proof file.
- Payment proof and KYC files live in **private** Supabase Storage buckets, accessed only via short-lived signed URLs generated server-side, never public buckets.
- Admin actions (verify payment, resolve dispute, force status change) must be logged — add an `admin_actions` audit table (`admin_id`, `action`, `target_table`, `target_id`, `note`, `created_at`) so every manual override is traceable. This matters enormously for a platform that manually handles money — the audit trail is the product's credibility.
- Rate-limit transaction creation and payment-proof submission per user to prevent spam/abuse of the admin queue.
- Because payments are manual/off-platform (including crypto), be explicit in `/legal/terms` that the platform is a mediation/verification service, not a money transmitter that custodies funds itself — get the client's legal counsel to confirm the actual disclosed relationship; do not let the UI imply the platform is "holding funds in an account it controls" if it legally is not. This is a wording matter for the client/lawyer, but the engineering implication is: never claim things in copy that the manual-proof architecture doesn't actually do.
- Add basic fraud-signal fields even in v1 (flag repeat rejected proofs, flag mismatched amounts) — cheap to add to the schema now, expensive to retrofit later.

---

## 12. What "done" looks like for v1

- A Buyer and Seller can complete one full transaction end-to-end using only manual payment + proof upload + admin verification, with WhatsApp reachable at every step, and see it land in `released`.
- Admin can run the entire operation from `/admin` without touching the database directly.
- Every status change is visible on the transaction timeline to the right audience.
- Fee calculation is transparent before a transaction is created.
- The brand name/logo are swappable via one config point, not hardcoded.
- Legal pages exist even if placeholder, since real money changes hands.

---

## 13. Open questions to confirm with the client before/while building

- Exact list of payment methods to support at launch (which crypto networks specifically — e.g. BTC, USDT-TRC20, USDT-ERC20 — plus which bank rails/mobile money).
- Fee structure: flat %, tiered by amount, who pays by default.
- Does the client want automatic KYC/ID verification, or is "email + phone + admin discretion" enough for v1?
- Single admin/support WhatsApp number, or one per category/region?
- Preferred inspection period default (escrow.com commonly defaults around a few days, configurable per transaction).
