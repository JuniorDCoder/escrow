import { createClient } from "@/lib/supabase/server";
import { getSignedFileUrl } from "@/lib/data/storage";
import type { TransactionStatus } from "@/lib/types/database";

export async function getAdminOverview() {
  const supabase = await createClient();

  const [{ data: statusCounts }, { count: pendingPayments }, { count: openDisputes }, { count: totalUsers }] = await Promise.all([
    supabase.from("transactions").select("status"),
    supabase.from("payment_proofs").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("disputes").select("*", { count: "exact", head: true }).in("status", ["open", "under_review"]),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  const counts: Partial<Record<TransactionStatus, number>> = {};
  for (const row of statusCounts ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }

  return {
    counts,
    pendingPayments: pendingPayments ?? 0,
    openDisputes: openDisputes ?? 0,
    totalUsers: totalUsers ?? 0,
    totalTransactions: statusCounts?.length ?? 0,
  };
}

export async function getPendingPaymentProofs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_proofs")
    .select("*, transactions(reference_code, title, total_payable, currency, buyer_id), payment_methods(label)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error || !data) return [];

  return Promise.all(
    data.map(async (proof) => ({
      ...proof,
      signedUrl: await getSignedFileUrl(supabase, "payment-proofs", proof.file_url),
    }))
  );
}

export async function getAllTransactionsForAdmin(statusFilter?: string) {
  const supabase = await createClient();
  let query = supabase.from("transactions").select("*").order("updated_at", { ascending: false }).limit(200);
  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter as TransactionStatus);
  }
  const { data, error } = await query;
  if (error) return [];
  return data;
}

export async function getDisputesForAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("disputes")
    .select("*, transactions(reference_code, title, amount, currency)")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data;
}

export async function getAllUsers() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return data;
}

export async function getAllPaymentMethods() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("payment_methods").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return data;
}

export async function getAdminActionsForTarget(targetTable: string, targetId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admin_actions")
    .select("*")
    .eq("target_table", targetTable)
    .eq("target_id", targetId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data;
}
