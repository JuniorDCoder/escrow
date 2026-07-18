import Link from "next/link";
import type { Metadata } from "next";
import { ShieldCheck, FileCheck, PackageCheck, HandCoins, Lock, Eye, Scale } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { getSettings } from "@/lib/data/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeeCalculator } from "@/components/marketing/fee-calculator";

export const metadata: Metadata = {
  title: "Trusted Escrow for Any Deal",
  description: `${APP_NAME} holds funds until both sides confirm the deal is done — for domains, vehicles, digital goods, services, and more.`,
};

const STEPS = [
  { icon: FileCheck, title: "Agree on terms", body: "Buyer or Seller creates the transaction and invites the other party to review and accept." },
  { icon: HandCoins, title: "Buyer pays into escrow", body: "Buyer sends payment to our published account, then uploads proof — a screenshot or receipt." },
  { icon: ShieldCheck, title: "Admin verifies payment", body: "A real person confirms the funds landed before anyone is told to ship or deliver." },
  { icon: PackageCheck, title: "Seller delivers", body: "Once funds are secured, the Seller ships the item, hands over the domain, or completes the work." },
  { icon: Lock, title: "Buyer accepts & funds release", body: "Buyer inspects and accepts (or it auto-completes) — then we release payment to the Seller." },
];

const TRUST = [
  { icon: Eye, title: "Nothing happens silently", body: "Every status change, upload, and message is timestamped on one shared timeline." },
  { icon: Scale, title: "A human verifies every payment", body: "Funds are only marked secured after an Admin manually confirms your proof of payment." },
  { icon: ShieldCheck, title: "Disputes are reviewed, not automated", body: "If something goes wrong, an Admin reviews evidence from both sides before anything moves." },
];

export default async function LandingPage() {
  const settings = await getSettings();

  return (
    <div>
      <section className="border-b border-border bg-gradient-to-b from-secondary/60 to-background">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Neutral third-party escrow
            </div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Buy and sell with nothing to lose.</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {APP_NAME} holds the money in the middle. The Seller only ships once payment is verified. The Buyer only
              pays out once they accept delivery. Neither side is ever exposed.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/auth/signup">Start a transaction</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/how-it-works">See how it works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <p className="mt-2 text-muted-foreground">Five steps, one shared timeline both sides can see.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, i) => (
            <Card key={step.title}>
              <CardContent className="space-y-3 py-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {i + 1}
                  </div>
                  <step.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="font-medium">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Built for trust, not just transactions</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {TRUST.map((t) => (
              <div key={t.title} className="space-y-2 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-sm">
                  <t.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="font-medium">{t.title}</p>
                <p className="text-sm text-muted-foreground">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Know the cost before you commit</h2>
          <p className="mt-2 text-muted-foreground">No login required — see exactly what you&apos;d pay or receive.</p>
        </div>
        <FeeCalculator feePercentage={settings.fee_percentage} feeMinimum={settings.fee_minimum} />
        <div className="mt-6 text-center">
          <Link href="/fees" className="text-sm font-medium text-primary hover:underline">
            View full fee details →
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <h2 className="text-2xl font-semibold">Ready to make your next deal safe?</h2>
            <p className="max-w-md text-primary-foreground/80">
              Create a transaction, invite the other party, and let us hold the funds until the work is done.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href="/auth/signup">Get started for free</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
