"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertPaymentMethodAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAYMENT_METHOD_TYPES } from "@/lib/constants";
import type { PaymentMethod } from "@/lib/types/database";

export function PaymentMethodDialog({ method, trigger }: { method?: PaymentMethod; trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(method?.type ?? "bank_transfer");
  const [label, setLabel] = useState(method?.label ?? "");
  const [network, setNetwork] = useState(method?.network ?? "");
  const [accountDetails, setAccountDetails] = useState(
    method?.account_details ? JSON.stringify(method.account_details, null, 2) : '{\n  "account_number": ""\n}'
  );
  const [instructions, setInstructions] = useState(method?.instructions ?? "");
  const [isActive, setIsActive] = useState(method?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await upsertPaymentMethodAction({
        id: method?.id,
        type,
        label,
        network,
        accountDetails,
        instructions,
        isActive,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{method ? "Edit payment method" : "Add payment method"}</DialogTitle>
          <DialogDescription>Shown to Buyers at the payment step. Changes apply immediately, no redeploy needed.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Network / label detail</Label>
              <Input value={network} onChange={(e) => setNetwork(e.target.value)} placeholder="e.g. USDT TRC20" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Display label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Bank Transfer (USD)" />
          </div>
          <div className="space-y-2">
            <Label>Account details (JSON key/value shown to Buyers)</Label>
            <Textarea value={accountDetails} onChange={(e) => setAccountDetails(e.target.value)} rows={5} className="font-mono text-xs" />
          </div>
          <div className="space-y-2">
            <Label>Instructions (optional)</Label>
            <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={2} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active (visible to Buyers)
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={isPending || !label}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
