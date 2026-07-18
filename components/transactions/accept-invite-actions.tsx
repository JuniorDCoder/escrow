"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptTransactionInviteAction, declineTransactionInviteAction } from "@/lib/actions/transactions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AcceptInviteActions({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const accept = () => {
    setError(null);
    startTransition(async () => {
      const result = await acceptTransactionInviteAction(transactionId);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  };

  const decline = () => {
    setError(null);
    startTransition(async () => {
      const result = await declineTransactionInviteAction(transactionId);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>You&apos;ve been invited to this transaction</CardTitle>
        <CardDescription>Review the terms above. Accepting starts the escrow process.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-3">
          <Button onClick={accept} disabled={isPending} className="flex-1">
            Accept terms
          </Button>
          <Button onClick={decline} disabled={isPending} variant="outline" className="flex-1">
            Decline
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
