import type { Metadata } from "next";
import { ShieldCheck, FileLock2, ScrollText, UserCheck, KeyRound, EyeOff } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = { title: "Security" };

const PRINCIPLES = [
  {
    icon: UserCheck,
    title: "A human verifies every payment",
    body: "Nothing is marked \"funded\" automatically. An Admin manually checks each proof of payment against what's actually due before the Seller is told to proceed.",
  },
  {
    icon: ShieldCheck,
    title: "Row-level security on every table",
    body: "Access control is enforced at the database layer, not just in the app. A Buyer's queries can only ever return rows they're actually party to — even if a request bypassed our UI entirely.",
  },
  {
    icon: EyeOff,
    title: "Payment proofs stay private",
    body: "A Seller sees that a payment was verified — never the Buyer's bank statement or wallet screenshot. Only the Buyer who uploaded it and Admins reviewing it can see the file.",
  },
  {
    icon: FileLock2,
    title: "No public file URLs",
    body: "Payment proofs and identity documents live in private storage and are only ever served through short-lived signed links generated on request.",
  },
  {
    icon: KeyRound,
    title: "Privileged actions are locked down",
    body: "Only a verified Admin account can verify payments, resolve disputes, or force a transaction's status — every one of those actions requires the account to carry admin privileges at the database level, not just in the interface.",
  },
  {
    icon: ScrollText,
    title: "Every admin action is logged",
    body: "Verifications, dispute resolutions, and forced status changes are written to a permanent audit trail — who did what, when, and why.",
  },
];

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Security & trust</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          {APP_NAME}{" "}is built around one idea: nothing about your money should be silent or automatic. Here&apos;s exactly
          how we protect your transactions and your data.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PRINCIPLES.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.06}>
            <Card className="h-full">
              <CardContent className="py-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <p.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-medium">{p.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{p.body}</p>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.2}>
        <div className="mt-10 rounded-xl border border-warning/40 bg-warning-soft p-5 text-sm text-warning">
          <strong>Being precise about what we are:</strong> {APP_NAME}{" "}verifies payments and mediates disputes — we do not
          custody funds in an account we control. Payment happens directly between you and our published account or
          wallet; our role is verification and mediation. See our{" "}
          <a className="underline" href="/legal/terms">
            Terms of Service
          </a>{" "}
          for the exact relationship.
        </div>
      </Reveal>
    </div>
  );
}
