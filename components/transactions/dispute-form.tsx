"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { openDisputeAction } from "@/lib/actions/transactions";
import { disputeSchema, type DisputeInput } from "@/lib/validations/transaction";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DisputeForm({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DisputeInput>({
    resolver: zodResolver(disputeSchema),
    defaultValues: { transactionId },
  });

  const onSubmit = (values: DisputeInput) => {
    setFormError(null);
    startTransition(async () => {
      const result = await openDisputeAction(values);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      router.push(`/transactions/${transactionId}`);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Open a dispute</CardTitle>
        <CardDescription>
          Explain what went wrong. An Admin will review evidence from both sides and decide how to proceed — this pauses the
          transaction until it&apos;s resolved.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("transactionId")} />
          <div className="space-y-2">
            <Label htmlFor="reason">What happened?</Label>
            <Textarea id="reason" rows={6} placeholder="Be specific — include dates, what was agreed, and what didn't happen." {...register("reason")} />
            {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending ? "Submitting…" : "Open dispute"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
