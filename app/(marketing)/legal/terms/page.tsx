import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: placeholder — replace once legal counsel has reviewed this document.</p>

      <div className="prose-sm mt-10 space-y-6 text-sm leading-relaxed text-foreground">
        <p className="rounded-md border border-warning/40 bg-warning-soft p-4 text-warning">
          <strong>Placeholder notice:</strong> this page is a starting draft for engineering purposes only. It must be
          reviewed and finalized by qualified legal counsel — particularly the description of {APP_NAME}&apos;s legal
          relationship to funds below — before this platform handles real transactions.
        </p>

        <section>
          <h2 className="text-lg font-semibold">1. What {APP_NAME} is</h2>
          <p className="mt-2 text-muted-foreground">
            {APP_NAME}{" "}(&quot;we&quot;, &quot;us&quot;) is a mediation and verification service that helps a Buyer and a
            Seller complete a transaction safely. We are <strong>not a bank, payment processor, or money transmitter</strong>,
            and we do not custody funds in an account we control. All payments happen directly between the Buyer and our
            published receiving account or wallet, off-platform. Our role is to verify that a payment has occurred, hold
            back delivery/release instructions until it is confirmed, and mediate if a dispute arises.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. How a transaction works</h2>
          <p className="mt-2 text-muted-foreground">
            A Buyer and Seller agree on terms and create a transaction on the platform. The Buyer sends payment to our
            published account and uploads proof. An Admin manually verifies that proof. Once verified, the Seller is
            informed the funds are secured and proceeds with delivery. The Buyer then has an agreed inspection period to
            accept or dispute. On acceptance (explicit or automatic after the inspection period), we instruct payout to
            the Seller and confirm once it has been sent.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Fees</h2>
          <p className="mt-2 text-muted-foreground">
            Our fee is disclosed before a transaction is created, on the Fees page and in the transaction creation flow.
            Fees are not refundable once a transaction has been funded, except at our discretion in connection with a
            dispute resolution.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Disputes</h2>
          <p className="mt-2 text-muted-foreground">
            Either party may open a dispute before the inspection period closes. We will review evidence submitted by
            both sides and make a determination in good faith. Our decision on a dispute is final within the scope of
            this platform. We are not a court or arbitrator and nothing here limits either party&apos;s legal rights.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Prohibited use</h2>
          <p className="mt-2 text-muted-foreground">
            You may not use {APP_NAME} for illegal goods or services, fraud, money laundering, or to circumvent
            sanctions. We reserve the right to suspend accounts or transactions we reasonably believe violate this
            policy, and to report suspected illegal activity to relevant authorities.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Limitation of liability</h2>
          <p className="mt-2 text-muted-foreground">
            {APP_NAME}{" "}verifies payment proofs and mediates disputes on a best-effort basis but cannot guarantee the
            condition, legality, or delivery of any goods or services exchanged between Buyer and Seller. To the maximum
            extent permitted by law, our liability is limited to the fees you paid for the transaction in question.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Changes</h2>
          <p className="mt-2 text-muted-foreground">
            We may update these terms from time to time. Material changes will be reflected by the &quot;last
            updated&quot; date above.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Contact</h2>
          <p className="mt-2 text-muted-foreground">
            Questions about these terms can be sent through the <a className="text-primary hover:underline" href="/contact">Contact page</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
