import type { Metadata } from "next";
import { getSettings } from "@/lib/data/settings";
import { CURRENCIES, TRANSACTION_CATEGORIES } from "@/lib/constants";
import { CreateTransactionForm } from "@/components/transactions/create-transaction-form";

export const metadata: Metadata = { title: "New Transaction" };

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; category?: string; currency?: string }>;
}) {
  const [settings, params] = await Promise.all([getSettings(), searchParams]);

  const initialRole = params.role === "seller" ? "seller" : params.role === "buyer" ? "buyer" : undefined;
  const initialCategory = TRANSACTION_CATEGORIES.some((c) => c.value === params.category) ? params.category : undefined;
  const initialCurrency = CURRENCIES.includes(params.currency as (typeof CURRENCIES)[number]) ? params.currency : undefined;

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
        initialRole={initialRole}
        initialCategory={initialCategory}
        initialCurrency={initialCurrency}
      />
    </div>
  );
}
