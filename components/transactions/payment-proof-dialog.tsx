"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitPaymentProofAction } from "@/lib/actions/payments";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { PaymentMethod } from "@/lib/types/database";

interface PaymentProofDialogProps {
  transactionId: string;
  amountDue: number;
  currency: string;
  methods: PaymentMethod[];
}

export function PaymentProofDialog({ transactionId, amountDue, currency, methods }: PaymentProofDialogProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [methodId, setMethodId] = useState("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("transactionId", transactionId);
    formData.set("paymentMethodId", methodId);

    startTransition(async () => {
      const result = await submitPaymentProofAction(formData);
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
      <DialogTrigger asChild>
        <Button className="w-full">I&apos;ve made this payment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit proof of payment</DialogTitle>
          <DialogDescription>
            Upload a screenshot or receipt showing the transfer. {APP_NAME} will verify it and secure the funds.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Payment method used</Label>
            <Select value={methodId} onValueChange={setMethodId} required>
              <SelectTrigger>
                <SelectValue placeholder="Choose the method you paid with" />
              </SelectTrigger>
              <SelectContent>
                {methods.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amountClaimed">Amount sent</Label>
              <Input id="amountClaimed" name="amountClaimed" type="number" step="0.01" min="0" defaultValue={amountDue} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" name="currency" defaultValue={currency} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="txHashOrReference">Transaction hash / reference (optional)</Label>
            <Input id="txHashOrReference" name="txHashOrReference" placeholder="e.g. bank reference or crypto tx hash" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Screenshot or receipt</Label>
            <Input id="file" name="file" type="file" accept="image/*,.pdf" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending || !methodId}>
              {isPending ? "Uploading…" : "Submit proof"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
