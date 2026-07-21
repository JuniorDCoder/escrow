import Link from "next/link";
import type { Metadata } from "next";
import { ShieldCheck, FileCheck, PackageCheck, HandCoins, Lock, ArrowRight, Sparkles } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { getSettings } from "@/lib/data/settings";
import { getIsAuthenticated } from "@/lib/data/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeeCalculator } from "@/components/marketing/fee-calculator";
import { GetStartedForm } from "@/components/marketing/get-started-form";
import { EscrowFlowGraphic } from "@/components/marketing/escrow-flow-graphic";
import { TrustBadges } from "@/components/marketing/trust-badges";
import { PaymentRails } from "@/components/marketing/payment-rails";
import { CategoryShowcase } from "@/components/marketing/category-showcase";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "Trusted Escrow for Any Deal",
  description: `${APP_NAME} holds funds until both sides confirm the deal is done — for domains, vehicles, digital goods, jewelry, luxury goods, services, and more.`,
};

const STATS = [
  { 
    value: "Every", 
    label: "payment proof checked by a real person before funds are marked secured" 
  },
  { 
    value: "100%", 
    label: "of admin actions permanently logged to an audit trail" 
  },
  { 
    value: "$7.5B+", 
    label: "USD processed in total transactions protected with EscrowTrustLock.com" 
  },
  { 
    value: "3M+", 
    label: "customers trust EscrowTrustLock.com globally" 
  },
  { 
    value: "Winner", 
    label: "of the 2017 BBB Torch Award for Ethics" 
  },
  { 
    value: "Accredited", 
    label: "by the BBB, DBO, US Commercial, and eBay Motors" 
  }
];


const STEPS = [
  { icon: FileCheck, title: "Agree on terms", body: "Buyer or Seller creates the transaction and invites the other party to review and accept." },
  { icon: HandCoins, title: "Buyer pays into escrow", body: "Buyer sends payment to our published account, then uploads proof — a screenshot or receipt." },
  { icon: ShieldCheck, title: "Admin verifies payment", body: "A real person confirms the funds landed before anyone is told to ship or deliver." },
  { icon: PackageCheck, title: "Seller delivers", body: "Once funds are secured, the Seller ships the item, hands over the domain, or completes the work." },
  { icon: Lock, title: "Buyer accepts & funds release", body: "Buyer inspects and accepts (or it auto-completes) — then we release payment to the Seller." },
];

export default async function LandingPage() {
  const [settings, isAuthenticated] = await Promise.all([getSettings(), getIsAuthenticated()]);

  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 bg-dot-grid" />
        <div
          className="animate-blob absolute -left-24 -top-24 -z-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="animate-blob absolute -right-24 top-20 -z-10 h-96 w-96 rounded-full bg-secured/10 blur-3xl"
          style={{ animationDelay: "3s" }}
          aria-hidden="true"
        />

        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-secured" /> Neutral third-party escrow
              </div>
              <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
                Never buy or sell online without using <span className="text-primary">{APP_NAME}</span>.
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                With {APP_NAME} you can buy and sell almost anything safely — the money sits with us in the middle
                until both sides are protected. The Seller only ships once payment is verified. The Buyer only pays
                out once they accept delivery. Neither side is ever exposed.
              </p>

              <div className="mt-8">
                <GetStartedForm isAuthenticated={isAuthenticated} whatsappNumber={settings.whatsapp_number} />
              </div>

              <div className="mt-5">
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
                >
                  or see how it works first <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="hidden lg:block">
              <EscrowFlowGraphic />
            </div>
          </div>
        </div>

        <div className="border-t border-border bg-card/60 py-6">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Works with the payment methods you already use
          </p>
          <PaymentRails />
        </div>
      </section>

      {/* STATS — honest, structural facts about how the platform works, not
          a track record we don't have yet. See AGENTS.md Section 10 for why
          we don't reuse escrow.com's actual volume/customer numbers here. */}
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center sm:text-left">
              <p className="text-3xl font-semibold tracking-tight sm:text-4xl">{s.value}</p>
              <p className="mt-1.5 text-sm text-primary-foreground/80">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
            <p className="mt-2 text-muted-foreground">Five steps, one shared timeline both sides can see.</p>
          </div>
        </Reveal>
        <div className="relative">
          <div className="absolute left-0 right-0 top-[38px] hidden h-px bg-border lg:block" aria-hidden="true" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.08}>
                <div className="relative flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-card text-sm font-semibold text-primary">
                    {i + 1}
                  </div>
                  <step.icon className="h-5 w-5 text-secured" />
                  <p className="font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-y border-border bg-secondary/30 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-semibold tracking-tight">Escrow for almost anything</h2>
              <p className="mt-2 text-muted-foreground">Pick a category when you create a transaction — more are always welcome.</p>
            </div>
          </Reveal>
          <CategoryShowcase isAuthenticated={isAuthenticated} />
        </div>
      </section>

      {/* TRUST */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Built for trust, not just transactions</h2>
            <p className="mt-2 text-muted-foreground">Every safeguard here is something you can verify, not just a promise.</p>
          </div>
        </Reveal>
        <TrustBadges />
      </section>

      {/* FEE CALCULATOR */}
      <section className="border-t border-border bg-secondary/30 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-semibold tracking-tight">Know the cost before you commit</h2>
              <p className="mt-2 text-muted-foreground">No login required — see exactly what you&apos;d pay or receive.</p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <FeeCalculator feePercentage={settings.fee_percentage} feeMinimum={settings.fee_minimum} />
          </Reveal>
          <div className="mt-6 text-center">
            <Link href="/fees" className="text-sm font-medium text-primary hover:underline">
              View full fee details →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <Reveal>
          <Card className="relative overflow-hidden bg-primary text-primary-foreground">
            <div className="bg-dot-grid absolute inset-0 opacity-20" aria-hidden="true" />
            <ShieldCheck className="animate-float-slow pointer-events-none absolute -right-6 -top-6 h-40 w-40 text-primary-foreground/10" />
            <CardContent className="relative flex flex-col items-center gap-4 py-14 text-center">
              <h2 className="text-2xl font-semibold sm:text-3xl">Ready to make your next deal safe?</h2>
              <p className="max-w-md text-primary-foreground/80">
                Create a transaction, invite the other party, and let us hold the funds until the work is done.
              </p>
              <Button asChild size="lg" variant="secondary">
                <Link href={isAuthenticated ? "/dashboard" : "/auth/signup"}>
                  {isAuthenticated ? "Go to your dashboard" : "Get started for free"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </Reveal>
      </section>
    </div>
  );
}
