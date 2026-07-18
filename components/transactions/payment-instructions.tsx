import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { PaymentMethod } from "@/lib/types/database";

function formatFieldLabel(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PaymentInstructions({
  amountDue,
  currency,
  methods,
}: {
  amountDue: number;
  currency: string;
  methods: PaymentMethod[];
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-secured/30 bg-secured-soft px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-secured">Amount due</p>
        <p className="text-2xl font-semibold text-secured">{formatCurrency(amountDue, currency)}</p>
      </div>

      {methods.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No payment methods are configured yet. Use the WhatsApp button to get payment instructions from support.
        </p>
      ) : (
        <div className="space-y-3">
          {methods.map((method) => (
            <Card key={method.id} className="bg-secondary/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">{method.label}</CardTitle>
                {method.network && <Badge variant="outline">{method.network}</Badge>}
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                {method.account_details &&
                  Object.entries(method.account_details).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{formatFieldLabel(key)}</span>
                      <span className="break-all text-right font-mono text-xs">{value}</span>
                    </div>
                  ))}
                {method.instructions && <p className="pt-1 text-xs text-muted-foreground">{method.instructions}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
