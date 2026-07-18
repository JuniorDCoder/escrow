import type { Metadata } from "next";
import { getPendingPaymentProofs } from "@/lib/data/admin";
import { PaymentReviewCard, type PaymentReviewItem } from "@/components/admin/payment-review-card";
import { Card, CardContent } from "@/components/ui/card";
import { Inbox } from "lucide-react";

export const metadata: Metadata = { title: "Payment Review Queue" };

export default async function AdminPaymentsPage() {
  const proofs = await getPendingPaymentProofs();

  const items: PaymentReviewItem[] = proofs.map((p) => {
    const tx = Array.isArray(p.transactions) ? p.transactions[0] : p.transactions;
    const method = Array.isArray(p.payment_methods) ? p.payment_methods[0] : p.payment_methods;
    return {
      id: p.id,
      transaction_id: p.transaction_id,
      amount_claimed: p.amount_claimed,
      currency: p.currency,
      tx_hash_or_reference: p.tx_hash_or_reference,
      created_at: p.created_at,
      signedUrl: p.signedUrl,
      referenceCode: tx?.reference_code ?? "—",
      title: tx?.title ?? "Untitled transaction",
      totalPayable: tx?.total_payable ?? p.amount_claimed,
      methodLabel: method?.label ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payment review queue</h1>
        <p className="text-sm text-muted-foreground">Newest submissions first. Verify secures escrow funds immediately.</p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>No payment proofs pending review.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <PaymentReviewCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
