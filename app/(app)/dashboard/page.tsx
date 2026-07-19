import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ArrowRight, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserTransactions } from "@/lib/data/transactions";
import { getViewerRole } from "@/lib/domain/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/transactions/status-badge";
import { formatCurrency, formatDateShort } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const ROLE_LABELS = {
  buyer: "Buyer",
  seller: "Seller",
  buyer_invitee: "Buyer (pending)",
  seller_invitee: "Seller (pending)",
  admin: "Admin",
  observer: "Party",
} as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).single()
    : { data: null };
  const transactions = await getUserTransactions();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your transactions</h1>
          <p className="text-sm text-muted-foreground">Every deal you&apos;re buying, selling, or waiting on.</p>
        </div>
        <Button asChild>
          <Link href="/transactions/new">
            <Plus className="h-4 w-4" />
            New Transaction
          </Link>
        </Button>
      </div>

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-medium">No transactions yet</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Start one as a Buyer or a Seller — we&apos;ll walk both of you through payment, delivery, and release.
            </p>
            <Button asChild className="mt-2">
              <Link href="/transactions/new">Create your first transaction</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {transactions.map((tx) => {
            const role = user && profile ? getViewerRole(tx, user.id, profile) : "observer";
            const isBuyerSide = role === "buyer" || role === "buyer_invitee";
            const counterpart = isBuyerSide ? tx.seller_email : tx.buyer_email;
            const pending = role === "buyer_invitee" || role === "seller_invitee";
            return (
              <Link key={tx.id} href={`/transactions/${tx.id}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{tx.title}</span>
                        <StatusBadge status={tx.status} />
                        {pending && <Badge variant="warning">Action needed</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{tx.reference_code}</span> · You&apos;re the {ROLE_LABELS[role]} · with{" "}
                        {counterpart ?? "unknown"} · updated {formatDateShort(tx.updated_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <span className="font-mono font-semibold tabular-nums">{formatCurrency(tx.total_payable, tx.currency)}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
