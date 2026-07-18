"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmPayoutAction, queuePayoutAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import type { TransactionStatus } from "@/lib/types/database";

export function PayoutActions({ transactionId, status }: { transactionId: string; status: TransactionStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (status === "accepted") {
    return (
      <Button
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await queuePayoutAction(transactionId);
            router.refresh();
          })
        }
      >
        Queue payout
      </Button>
    );
  }

  if (status === "release_pending") {
    return (
      <Button
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await confirmPayoutAction(transactionId);
            router.refresh();
          })
        }
      >
        Confirm payout sent
      </Button>
    );
  }

  return null;
}
