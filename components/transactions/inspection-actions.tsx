"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { acceptDeliveryAction } from "@/lib/actions/transactions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export function InspectionActions({ transactionId, inspectionEndsAt }: { transactionId: string; inspectionEndsAt: string | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const accept = () => {
    setError(null);
    startTransition(async () => {
      const result = await acceptDeliveryAction(transactionId);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inspect and accept</CardTitle>
        <CardDescription>
          {inspectionEndsAt
            ? `Review the delivery by ${formatDate(inspectionEndsAt)}, or it will auto-accept.`
            : "Review the delivery and accept, or raise a dispute."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button onClick={accept} disabled={isPending}>
          {isPending ? "Accepting…" : "Accept delivery"}
        </Button>
        <Button asChild variant="outline">
          <Link href={`/transactions/${transactionId}/dispute`}>Something&apos;s wrong — open a dispute</Link>
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
