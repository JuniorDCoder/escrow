"use server";

import { revalidatePath } from "next/cache";
import {
  getCurrentUserAndProfile,
  getAdminClient,
  insertSystemMessage,
  notifyAdmins,
  toActionError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "./_shared";
import { payoutDetailsSchema } from "@/lib/validations/payment";
import { PAYOUT_ELIGIBLE_STATUSES } from "@/lib/domain/state-machine";
import { APP_NAME } from "@/lib/constants";
import type { ActionResult } from "./transactions";
import type { Payout } from "@/lib/types/database";

export async function submitPayoutDetailsAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = payoutDetailsSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const { transactionId, methodType, accountDetails, note } = parsed.data;

    const { supabase, user } = await getCurrentUserAndProfile();
    const { data: tx, error: txError } = await supabase.from("transactions").select("*").eq("id", transactionId).single();
    if (txError || !tx) throw new NotFoundError("Transaction not found.");
    if (tx.seller_id !== user.id) throw new ForbiddenError("Only the Seller can set payout details.");
    if (!PAYOUT_ELIGIBLE_STATUSES.includes(tx.status)) {
      throw new ValidationError("Payout details can be set once the transaction is funded.");
    }

    const { data: existing } = await supabase
      .from("payouts")
      .select("*")
      .eq("transaction_id", transactionId)
      .maybeSingle();
    if (existing && existing.status === "paid") {
      throw new ValidationError("This payout has already been marked as paid and can no longer be changed.");
    }

    const { error: upsertError } = await supabase.from("payouts").upsert(
      {
        transaction_id: transactionId,
        seller_id: user.id,
        method_type: methodType as Payout["method_type"],
        account_details: accountDetails,
        note: note || null,
        status: "pending",
      },
      { onConflict: "transaction_id" }
    );
    if (upsertError) throw upsertError;

    const admin = getAdminClient();
    await insertSystemMessage(
      admin,
      transactionId,
      `The Seller ${existing ? "updated" : "submitted"} their payout details. ${APP_NAME} will use this to send the payout.`
    );
    await notifyAdmins(admin, "payout_details_submitted", { transactionId, referenceCode: tx.reference_code, title: tx.title });

    revalidatePath(`/transactions/${transactionId}`);
    return {};
  } catch (err) {
    return toActionError(err);
  }
}
