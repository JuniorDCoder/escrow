import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { getIsAuthenticated } from "@/lib/data/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "How It Works" };

const STAGES = [
  {
    title: "1. Agreement",
    who: "Buyer & Seller",
    body: "One party creates the transaction — the item or service, the price, who pays the fee, and the inspection period — and invites the other by email. Nothing moves until both sides accept the terms.",
  },
  {
    title: "2. Payment into escrow",
    who: "Buyer",
    body: `The Buyer sends payment (bank transfer, Zelle, Cash App, Chime, Apple Pay, or crypto) directly to ${APP_NAME}'s published account, then uploads a screenshot or receipt as proof inside the platform.`,
  },
  {
    title: "3. Payment verification",
    who: "Admin",
    body: "A real person checks the proof against the amount due. Only once it's confirmed does the transaction flip to \"Funded\" — the Seller is notified the money is secured.",
  },
  {
    title: "4. Delivery",
    who: "Seller",
    body: "Knowing the funds are safely held, the Seller ships the item, transfers the domain, hands over access, or completes the work — and marks it delivered.",
  },
  {
    title: "5. Inspection & acceptance",
    who: "Buyer",
    body: "The Buyer has an agreed number of days to inspect and accept. If they don't raise a dispute in that window, it auto-completes.",
  },
  {
    title: "6. Funds released",
    who: "Admin",
    body: "Once accepted, an Admin pays the Seller and marks the transaction released. Everyone can see it on the shared timeline.",
  },
];

export default async function HowItWorksPage() {
  const isAuthenticated = await getIsAuthenticated();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">How {APP_NAME} works</h1>
        <p className="mt-3 text-muted-foreground">
          We don&apos;t move money automatically — we verify it. Here&apos;s the full process, step by step.
        </p>
      </div>

      <div className="space-y-4">
        {STAGES.map((stage) => (
          <Card key={stage.title}>
            <CardContent className="flex flex-col gap-1 py-6 sm:flex-row sm:items-start sm:gap-6">
              <div className="flex items-center gap-2 sm:w-40 sm:shrink-0">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stage.who}</span>
              </div>
              <div>
                <p className="font-medium">{stage.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stage.body}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-10 border-warning/40 bg-warning-soft">
        <CardContent className="py-5 text-sm text-warning">
          <strong>If something goes wrong:</strong> either party can open a dispute before the inspection window closes. An
          Admin reviews the evidence from both sides and decides how funds should move — nothing is automated.
        </CardContent>
      </Card>

      <div className="mt-10 text-center">
        <Button asChild size="lg">
          <Link href={isAuthenticated ? "/dashboard" : "/auth/signup"}>
            {isAuthenticated ? "Go to your dashboard" : "Start your first transaction"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
