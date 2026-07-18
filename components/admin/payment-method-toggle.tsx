"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { togglePaymentMethodActiveAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function PaymentMethodToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await togglePaymentMethodActiveAction(id, !isActive);
          router.refresh();
        })
      }
    >
      {isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
