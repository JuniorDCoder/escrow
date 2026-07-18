"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelTransactionAction } from "@/lib/actions/transactions";
import { Button } from "@/components/ui/button";

export function CancelTransactionButton({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} className="text-muted-foreground">
        Cancel transaction
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Cancel this transaction?</span>
      <Button
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await cancelTransactionAction(transactionId);
            if (result.error) setError(result.error);
            else router.refresh();
          })
        }
      >
        Yes, cancel
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Never mind
      </Button>
      {error && <p className="text-destructive">{error}</p>}
    </div>
  );
}
