import type { Metadata } from "next";
import { getSettings } from "@/lib/data/settings";
import { CreateTransactionForm } from "@/components/transactions/create-transaction-form";

export const metadata: Metadata = { title: "New Transaction" };

export default async function NewTransactionPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create a transaction</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll invite the other party to review these terms before anything is paid.
        </p>
      </div>
      <CreateTransactionForm
        feePercentage={settings.fee_percentage}
        feeMinimum={settings.fee_minimum}
        defaultInspectionDays={settings.default_inspection_days}
      />
    </div>
  );
}
