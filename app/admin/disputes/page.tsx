import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Inbox } from "lucide-react";
import { getDisputesForAdmin } from "@/lib/data/admin";
import { ResolveDisputeDialog } from "@/components/admin/resolve-dispute-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Disputes" };

const STATUS_VARIANT = {
  open: "destructive",
  under_review: "warning",
  resolved_buyer: "success",
  resolved_seller: "success",
  resolved_split: "success",
} as const;

export default async function AdminDisputesPage() {
  const disputes = await getDisputesForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Disputes</h1>
        <p className="text-sm text-muted-foreground">Review evidence and decide how funds should move.</p>
      </div>

      {disputes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>No disputes have been opened.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => {
            const tx = Array.isArray(d.transactions) ? d.transactions[0] : d.transactions;
            const isOpen = d.status === "open" || d.status === "under_review";
            return (
              <Card key={d.id}>
                <CardContent className="space-y-3 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Link href={`/transactions/${d.transaction_id}`} className="flex items-center gap-1 font-medium text-primary hover:underline">
                        {tx?.reference_code} <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <p className="text-sm text-muted-foreground">{tx?.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANT[d.status]}>{d.status.replace(/_/g, " ")}</Badge>
                      {tx && <span className="text-sm font-medium">{formatCurrency(tx.amount, tx.currency)}</span>}
                    </div>
                  </div>
                  <p className="text-sm">{d.reason}</p>
                  {d.resolution_note && (
                    <div className="rounded-md bg-secondary/60 p-3 text-sm">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Resolution</p>
                      <p>{d.resolution_note}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Opened {formatDate(d.created_at)}</span>
                    {isOpen && <ResolveDisputeDialog disputeId={d.id} />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
