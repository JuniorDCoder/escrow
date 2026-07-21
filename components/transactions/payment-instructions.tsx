import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { ChatTriggerButton } from "@/components/layout/chat-trigger-button";
import { formatCurrency } from "@/lib/utils";
import type { PaymentMethod } from "@/lib/types/database";

function formatFieldLabel(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PaymentInstructions({
  amountDue,
  currency,
  methods,
  whatsappNumber,
  chatEnabled,
  referenceCode,
}: {
  amountDue: number;
  currency: string;
  methods: PaymentMethod[];
  whatsappNumber?: string | null;
  chatEnabled?: boolean;
  referenceCode?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-secured/30 bg-secured-soft px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-secured">Amount due</p>
        <p className="text-2xl font-semibold text-secured">{formatCurrency(amountDue, currency)}</p>
      </div>

      {methods.length === 0 ? (
        <div className="space-y-3 rounded-md border border-warning/30 bg-warning-soft px-4 py-3">
          <p className="text-sm text-warning">
            No payment methods are active right now. Reach out and we&apos;ll send you payment details directly.
          </p>
          {chatEnabled ? (
            <ChatTriggerButton
              label="Get payment details via chat"
              className="rounded-md border border-input bg-card px-4 py-2 text-warning hover:bg-secondary hover:no-underline"
            />
          ) : whatsappNumber ? (
            <WhatsAppButton
              number={whatsappNumber}
              variant="inline"
              label="Get payment details on WhatsApp"
              message={
                referenceCode
                  ? `Hi, I need payment details for my escrow transaction ${referenceCode} — I don't see any active payment methods on the page.`
                  : undefined
              }
            />
          ) : (
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Contact support
            </Link>
          )}
        </div>
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
