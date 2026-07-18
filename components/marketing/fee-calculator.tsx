"use client";

import { useMemo, useState } from "react";
import { calculateFee } from "@/lib/domain/fees";
import { formatCurrency } from "@/lib/utils";
import { CURRENCIES, FEE_PAYER_OPTIONS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function FeeCalculator({ feePercentage, feeMinimum }: { feePercentage: number; feeMinimum: number }) {
  const [amount, setAmount] = useState("1000");
  const [currency, setCurrency] = useState("USD");
  const [feePayer, setFeePayer] = useState<"buyer" | "seller" | "split">("buyer");

  const fee = useMemo(
    () => calculateFee({ amount: Number(amount) || 0, feePercentage, feeMinimum, feePayer }),
    [amount, feePercentage, feeMinimum, feePayer]
  );

  return (
    <Card>
      <CardContent className="grid gap-6 py-6 sm:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="calc-amount">Deal amount</Label>
            <div className="flex gap-2">
              <Input id="calc-amount" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1" />
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-24">
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
            </div>
          </div>
          <div className="space-y-2">
            <Label>Who pays the fee?</Label>
            <Select value={feePayer} onValueChange={(v) => setFeePayer(v as typeof feePayer)}>
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
          </div>
          <p className="text-xs text-muted-foreground">{feePercentage}% fee, {formatCurrency(feeMinimum, currency)} minimum.</p>
        </div>

        <div className="space-y-3 rounded-md bg-secondary/50 p-5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deal amount</span>
            <span className="font-mono font-medium tabular-nums">{formatCurrency(fee.amount, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Escrow fee</span>
            <span className="font-mono font-medium tabular-nums">{formatCurrency(fee.feeAmount, currency)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base">
            <span className="font-medium">Buyer pays</span>
            <span className="font-mono font-semibold tabular-nums text-primary">{formatCurrency(fee.totalPayable, currency)}</span>
          </div>
          <div className="flex justify-between text-base">
            <span className="font-medium">Seller receives</span>
            <span className="font-mono font-semibold tabular-nums text-secured">{formatCurrency(fee.sellerReceives, currency)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
