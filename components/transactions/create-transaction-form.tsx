"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createTransactionAction } from "@/lib/actions/transactions";
import {
  createTransactionSchema,
  type CreateTransactionFormInput,
  type CreateTransactionInput,
} from "@/lib/validations/transaction";
import { calculateFee } from "@/lib/domain/fees";
import { CURRENCIES, FEE_PAYER_OPTIONS, TRANSACTION_CATEGORIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface CreateTransactionFormProps {
  feePercentage: number;
  feeMinimum: number;
  defaultInspectionDays: number;
}

export function CreateTransactionForm({ feePercentage, feeMinimum, defaultInspectionDays }: CreateTransactionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateTransactionFormInput, unknown, CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      currency: "USD",
      feePayer: "buyer",
      role: "buyer",
      inspectionPeriodDays: defaultInspectionDays,
    },
  });

  const amount = watch("amount");
  const feePayer = watch("feePayer");
  const role = watch("role");

  const fee = useMemo(
    () =>
      calculateFee({
        amount: Number(amount) || 0,
        feePercentage,
        feeMinimum,
        feePayer: feePayer || "buyer",
      }),
    [amount, feePayer, feePercentage, feeMinimum]
  );

  const onSubmit = (values: CreateTransactionInput) => {
    setFormError(null);
    startTransition(async () => {
      const result = await createTransactionAction(values);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      if (result.data) {
        router.push(`/transactions/${result.data.id}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Deal details</CardTitle>
            <CardDescription>What&apos;s being bought and sold.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="e.g. Sale of example.com domain" {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" rows={4} placeholder="Add any details both parties should agree on." {...register("description")} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSACTION_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your role & counterparty</CardTitle>
            <CardDescription>Who you are in this deal, and who you&apos;re inviting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>I am the...</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["buyer", "seller"] as const).map((r) => (
                  <label
                    key={r}
                    className={`cursor-pointer rounded-md border px-4 py-3 text-sm font-medium capitalize transition-colors ${
                      role === r ? "border-primary bg-secondary" : "border-input"
                    }`}
                  >
                    <input type="radio" value={r} className="sr-only" {...register("role")} />
                    {r}
                  </label>
                ))}
              </div>
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="counterpartyEmail">{role === "seller" ? "Buyer's" : "Seller's"} email</Label>
              <Input id="counterpartyEmail" type="email" placeholder="name@example.com" {...register("counterpartyEmail")} />
              {errors.counterpartyEmail && <p className="text-sm text-destructive">{errors.counterpartyEmail.message}</p>}
              <p className="text-xs text-muted-foreground">
                We&apos;ll invite them to review and accept these terms. If they don&apos;t have an account yet, they can sign up with this
                email to claim the invite.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amount & fees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" step="0.01" min="0" {...register("amount")} />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Who pays the escrow fee?</Label>
              <Controller
                control={control}
                name="feePayer"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FEE_PAYER_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inspectionPeriodDays">Inspection period (days)</Label>
              <Input id="inspectionPeriodDays" type="number" min={1} max={60} {...register("inspectionPeriodDays")} />
              <p className="text-xs text-muted-foreground">
                How long the Buyer has to inspect and accept after delivery before it auto-completes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>Fee estimate</CardTitle>
            <CardDescription>Recalculates as you type.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deal amount</span>
              <span className="font-medium">{formatCurrency(fee.amount, watch("currency") || "USD")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Escrow fee</span>
              <span className="font-medium">{formatCurrency(fee.feeAmount, watch("currency") || "USD")}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Buyer pays into escrow</span>
              <span className="font-semibold">{formatCurrency(fee.totalPayable, watch("currency") || "USD")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Seller receives</span>
              <span className="font-semibold">{formatCurrency(fee.sellerReceives, watch("currency") || "USD")}</span>
            </div>
            {formError && <p className="pt-2 text-sm text-destructive">{formError}</p>}
            <Button type="submit" className="mt-2 w-full" disabled={isPending}>
              {isPending ? "Creating…" : "Create & send invite"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
