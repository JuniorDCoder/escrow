import type { Metadata } from "next";
import { getSettings } from "@/lib/data/settings";
import { getActivePaymentMethods } from "@/lib/data/payment-methods";
import { FeeCalculator } from "@/components/marketing/fee-calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Fees & Pricing" };

export default async function FeesPage() {
  const [settings, methods] = await Promise.all([getSettings(), getActivePaymentMethods()]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Simple, transparent fees</h1>
        <p className="mt-3 text-muted-foreground">
          {settings.fee_percentage}% of the deal amount, {settings.fee_minimum > 0 ? `with a minimum of $${settings.fee_minimum}` : "no minimum"}. You see the exact number before you create a transaction — no surprises.
        </p>
      </div>

      <FeeCalculator feePercentage={settings.fee_percentage} feeMinimum={settings.fee_minimum} />

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-6 text-sm">
            <p className="font-medium">Buyer pays</p>
            <p className="mt-1 text-muted-foreground">The fee is added on top of the deal amount for the Buyer to pay into escrow.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-sm">
            <p className="font-medium">Seller pays</p>
            <p className="mt-1 text-muted-foreground">The fee is deducted from the deal amount before it&apos;s paid out to the Seller.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-sm">
            <p className="font-medium">Split 50/50</p>
            <p className="mt-1 text-muted-foreground">Half is added to what the Buyer pays, half is deducted from what the Seller receives.</p>
          </CardContent>
        </Card>
      </div>

      {methods.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-4 text-center text-xl font-semibold">Accepted payment methods</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {methods.map((m) => (
              <Card key={m.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">{m.label}</CardTitle>
                  {m.network && <Badge variant="outline">{m.network}</Badge>}
                </CardHeader>
                {m.instructions && <CardContent className="pt-0 text-xs text-muted-foreground">{m.instructions}</CardContent>}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
