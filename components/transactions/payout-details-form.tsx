"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitPayoutDetailsAction } from "@/lib/actions/payouts";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PaymentMethodType, Payout } from "@/lib/types/database";

const METHOD_LABELS: Record<PaymentMethodType, string> = {
  bank_transfer: "Bank transfer",
  crypto: "Crypto",
  mobile_money: "Mobile money",
  other: "Other",
};

export function PayoutDetailsForm({ transactionId, payout }: { transactionId: string; payout: Payout | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!payout);
  const [error, setError] = useState<string | null>(null);
  const [methodType, setMethodType] = useState<PaymentMethodType>(payout?.method_type ?? "bank_transfer");
  const [accountDetails, setAccountDetails] = useState(payout?.account_details ?? "");
  const [note, setNote] = useState(payout?.note ?? "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitPayoutDetailsAction({ transactionId, methodType, accountDetails, note });
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  };

  if (payout?.status === "paid") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payout details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Badge variant="success">Paid out</Badge>
          <p className="text-muted-foreground">
            {METHOD_LABELS[payout.method_type]} — {payout.account_details}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!editing && payout) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payout details</CardTitle>
          <CardDescription>Where {APP_NAME} will send your funds once this transaction is released.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="font-medium">{METHOD_LABELS[payout.method_type]}</span> — {payout.account_details}
          </p>
          {payout.note && <p className="text-muted-foreground">{payout.note}</p>}
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set your payout details</CardTitle>
        <CardDescription>
          Tell {APP_NAME} where to send your funds once the transaction is released — a bank account, crypto wallet, or
          mobile money number.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Payout method</Label>
            <Select value={methodType} onValueChange={(v) => setMethodType(v as PaymentMethodType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="mobile_money">Mobile money</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountDetails">Account / wallet details</Label>
            <Textarea
              id="accountDetails"
              rows={3}
              value={accountDetails}
              onChange={(e) => setAccountDetails(e.target.value)}
              placeholder="e.g. bank name, account number, account holder — or a wallet address and network"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending || !accountDetails.trim()}>
              {isPending ? "Saving…" : payout ? "Save changes" : "Save payout details"}
            </Button>
            {payout && (
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
