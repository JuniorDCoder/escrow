"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTransactionAction } from "@/lib/actions/transactions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

interface DeleteTransactionDialogProps {
  transactionId: string;
  referenceCode: string;
  /** Shows the audit-trail reason field — only meaningful for the Admin variant. */
  isAdmin?: boolean;
  /** Admin deleting a transaction that funds have already touched needs to justify it for the audit trail. */
  requireNote?: boolean;
  trigger?: React.ReactNode;
  /** Where to navigate after a successful delete. Pass `false` to stay put (e.g. a list page) and just refresh. */
  redirectTo?: string | false;
}

export function DeleteTransactionDialog({
  transactionId,
  referenceCode,
  isAdmin = false,
  requireNote = false,
  trigger,
  redirectTo = "/dashboard",
}: DeleteTransactionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteTransactionAction(transactionId, note);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="border-destructive/40 text-destructive hover:bg-destructive/10">
            Delete transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {referenceCode}?</DialogTitle>
          <DialogDescription>
            This permanently deletes the transaction and everything attached to it — payment and delivery proofs,
            messages, disputes, and ratings. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {isAdmin && (
          <div className="space-y-2">
            <Label>{requireNote ? "Reason (required, logged to the audit trail)" : "Reason (optional, logged to the audit trail)"}</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
            Never mind
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={submit}
            disabled={isPending || (isAdmin && requireNote && !note.trim())}
          >
            {isPending ? "Deleting…" : "Yes, delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
