import type { Metadata } from "next";
import Link from "next/link";
import { getAllTransactionsForAdmin } from "@/lib/data/admin";
import { STATUS_LABELS } from "@/lib/domain/state-machine";
import { StatusBadge } from "@/components/transactions/status-badge";
import { ForceTransitionDialog } from "@/components/admin/force-transition-dialog";
import { PayoutActions } from "@/components/admin/payout-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateShort } from "@/lib/utils";

export const metadata: Metadata = { title: "All Transactions" };

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const transactions = await getAllTransactionsForAdmin(status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">All transactions</h1>
        <p className="text-sm text-muted-foreground">{transactions.length} shown (most recently updated first, max 200).</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Link
          href="/admin/transactions"
          className={`rounded-full border px-3 py-1 text-xs font-medium ${!status || status === "all" ? "border-primary bg-secondary" : "border-border text-muted-foreground"}`}
        >
          All
        </Link>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <Link
            key={value}
            href={`/admin/transactions?status=${value}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${status === value ? "border-primary bg-secondary" : "border-border text-muted-foreground"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>
                  <Link href={`/transactions/${tx.id}`} className="font-medium text-primary hover:underline">
                    {tx.reference_code}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[220px] truncate">{tx.title}</TableCell>
                <TableCell>{formatCurrency(tx.total_payable, tx.currency)}</TableCell>
                <TableCell>
                  <StatusBadge status={tx.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDateShort(tx.updated_at)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <PayoutActions transactionId={tx.id} status={tx.status} />
                    <ForceTransitionDialog transactionId={tx.id} currentStatus={tx.status} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No transactions match this filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
