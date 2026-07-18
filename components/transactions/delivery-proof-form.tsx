"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitDeliveryProofAction } from "@/lib/actions/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DeliveryProofForm({ transactionId, inspectionDays }: { transactionId: string; inspectionDays: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [trackingReference, setTrackingReference] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitDeliveryProofAction({
        transactionId,
        description,
        trackingReference,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mark as delivered</CardTitle>
        <CardDescription>
          Once you confirm delivery, the Buyer gets {inspectionDays} day(s) to inspect and accept.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Delivery notes (optional)</Label>
            <Textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you deliver and how?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trackingReference">Tracking reference (optional)</Label>
            <Input
              id="trackingReference"
              value={trackingReference}
              onChange={(e) => setTrackingReference(e.target.value)}
              placeholder="Carrier tracking number, transfer code, etc."
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Saving…" : "Confirm delivery"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
