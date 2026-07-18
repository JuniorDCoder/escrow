import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTransactionDetail } from "@/lib/data/transactions";
import { DisputeForm } from "@/components/transactions/dispute-form";

export const metadata: Metadata = { title: "Open a dispute" };

export default async function DisputePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getTransactionDetail(id);
  if (!detail) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{detail.transaction.reference_code}</h1>
        <p className="text-sm text-muted-foreground">{detail.transaction.title}</p>
      </div>
      <DisputeForm transactionId={detail.transaction.id} />
    </div>
  );
}
