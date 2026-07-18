"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { reviewPaymentProofAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface PaymentReviewItem {
  id: string;
  transaction_id: string;
  amount_claimed: number;
  currency: string;
  tx_hash_or_reference: string | null;
  created_at: string;
  signedUrl: string | null;
  referenceCode: string;
  title: string;
  totalPayable: number;
  methodLabel: string | null;
}

export function PaymentReviewCard({ item }: { item: PaymentReviewItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);

  const amountMismatch = Math.abs(item.amount_claimed - item.totalPayable) > 0.01;

  const submit = (decision: "verify" | "reject") => {
    if (decision === "reject" && !note.trim()) {
      setShowReject(true);
      setError("Add a note explaining the rejection.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await reviewPaymentProofAction({ proofId: item.id, decision, note });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{item.title}</CardTitle>
          <Link href={`/transactions/${item.transaction_id}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
            {item.referenceCode} <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Claimed amount</p>
            <p className={`font-medium ${amountMismatch ? "text-destructive" : ""}`}>{formatCurrency(item.amount_claimed, item.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Amount due</p>
            <p className="font-medium">{formatCurrency(item.totalPayable, item.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Method</p>
            <p className="font-medium">{item.methodLabel ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reference / tx hash</p>
            <p className="truncate font-mono text-xs">{item.tx_hash_or_reference || "—"}</p>
          </div>
        </div>
        {amountMismatch && <p className="text-xs font-medium text-destructive">Claimed amount doesn&apos;t match what&apos;s due — double-check before verifying.</p>}
        {item.signedUrl && (
          <a href={item.signedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            View uploaded proof <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        {showReject && (
          <Textarea
            placeholder="Why is this being rejected? (shown to the Buyer)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button onClick={() => submit("verify")} disabled={isPending} size="sm">
            Verify & secure funds
          </Button>
          <Button onClick={() => submit("reject")} disabled={isPending} variant="destructive" size="sm">
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
