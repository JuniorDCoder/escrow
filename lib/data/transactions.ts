import { createClient } from "@/lib/supabase/server";
import { reconcileInspectionWindow } from "@/lib/actions/transactions";
import { getSignedFileUrl } from "@/lib/data/storage";
import type { DeliveryProof, Dispute, Message, PaymentProof, Rating, Transaction } from "@/lib/types/database";

export async function getUserTransactions(): Promise<Transaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) return [];
  return data;
}

export interface TransactionDetail {
  transaction: Transaction;
  buyerName: string | null;
  sellerName: string | null;
  paymentProofs: (PaymentProof & { signedUrl: string | null; paymentMethodLabel: string | null })[];
  deliveryProofs: DeliveryProof[];
  disputes: Dispute[];
  messages: Message[];
  ratings: Rating[];
}

export async function getTransactionDetail(id: string): Promise<TransactionDetail | null> {
  const supabase = await createClient();

  const { data: txRow, error } = await supabase.from("transactions").select("*").eq("id", id).single();
  if (error || !txRow) return null;

  const transaction = await reconcileInspectionWindow(txRow as Transaction);

  const [profilesResult, paymentProofsResult, deliveryProofsResult, disputesResult, messagesResult, ratingsResult, paymentMethodsResult] =
    await Promise.all([
      supabase
        .from("profile_public")
        .select("*")
        .in("id", [transaction.buyer_id, transaction.seller_id].filter((v): v is string => !!v)),
      supabase.from("payment_proofs").select("*").eq("transaction_id", id).order("created_at", { ascending: false }),
      supabase.from("delivery_proofs").select("*").eq("transaction_id", id).order("created_at", { ascending: false }),
      supabase.from("disputes").select("*").eq("transaction_id", id).order("created_at", { ascending: false }),
      supabase.from("messages").select("*").eq("transaction_id", id).order("created_at", { ascending: true }),
      supabase.from("ratings").select("*").eq("transaction_id", id),
      supabase.from("payment_methods").select("id, label"),
    ]);

  const profileMap = new Map((profilesResult.data ?? []).map((p) => [p.id, p.full_name]));
  const methodLabelMap = new Map((paymentMethodsResult.data ?? []).map((m) => [m.id, m.label]));

  const paymentProofs = await Promise.all(
    (paymentProofsResult.data ?? []).map(async (proof) => ({
      ...proof,
      signedUrl: await getSignedFileUrl(supabase, "payment-proofs", proof.file_url),
      paymentMethodLabel: proof.payment_method_id ? methodLabelMap.get(proof.payment_method_id) ?? null : null,
    }))
  );

  return {
    transaction,
    buyerName: transaction.buyer_id ? profileMap.get(transaction.buyer_id) ?? null : null,
    sellerName: transaction.seller_id ? profileMap.get(transaction.seller_id) ?? null : null,
    paymentProofs,
    deliveryProofs: deliveryProofsResult.data ?? [],
    disputes: disputesResult.data ?? [],
    messages: messagesResult.data ?? [],
    ratings: ratingsResult.data ?? [],
  };
}

