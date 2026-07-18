import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: placeholder — replace once legal counsel has reviewed this document.</p>

      <div className="prose-sm mt-10 space-y-6 text-sm leading-relaxed text-foreground">
        <p className="rounded-md border border-warning/40 bg-warning-soft p-4 text-warning">
          <strong>Placeholder notice:</strong> this page is a starting draft for engineering purposes only and should be
          reviewed by legal counsel, particularly for the jurisdiction(s) {APP_NAME} operates in, before launch.
        </p>

        <section>
          <h2 className="text-lg font-semibold">1. What we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Account details: name, email, phone, WhatsApp number.</li>
            <li>Transaction details: what&apos;s being bought/sold, amounts, counterparties, messages, and status history.</li>
            <li>Payment proof files (receipts, screenshots) and, if collected, KYC identity documents.</li>
            <li>Basic technical data (IP address, device/browser) for security and fraud prevention.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. How we use it</h2>
          <p className="mt-2 text-muted-foreground">
            To operate the escrow service: verifying payments, mediating disputes, preventing fraud and abuse, and
            communicating with you about your transactions. We do not sell your personal data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Who can see what</h2>
          <p className="mt-2 text-muted-foreground">
            Your counterparty on a transaction sees your name and the transaction details, but never your uploaded
            payment proof file or bank/wallet screenshots — those are visible only to you and to Admins, who verify
            payments and review disputes. Payment proof and identity documents are stored in private storage and served
            only via short-lived signed links generated on request.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Data retention</h2>
          <p className="mt-2 text-muted-foreground">
            We retain transaction records, messages, and payment proofs for as long as needed for dispute resolution,
            accounting, and legal compliance, and may retain minimal records after account deletion where required by
            law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Your rights</h2>
          <p className="mt-2 text-muted-foreground">
            You can request a copy of your data, ask us to correct it, or request deletion of your account (subject to
            records we must legally retain) by contacting us through the <a className="text-primary hover:underline" href="/contact">Contact page</a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Security</h2>
          <p className="mt-2 text-muted-foreground">
            Access to your data is protected by row-level security policies enforced at the database layer, and
            sensitive files are never exposed via public URLs. No system is perfectly secure, and we encourage using a
            strong, unique password.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Changes</h2>
          <p className="mt-2 text-muted-foreground">
            We may update this policy from time to time. Material changes will be reflected by the &quot;last
            updated&quot; date above.
          </p>
        </section>
      </div>
    </div>
  );
}
