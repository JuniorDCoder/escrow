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
} from "./_shared";
import { assertTransition } from "@/lib/domain/state-machine";
import { submitPaymentProofSchema } from "@/lib/validations/payment";
import type { ActionResult } from "./transactions";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function submitPaymentProofAction(formData: FormData): Promise<ActionResult> {
  try {
    const parsed = submitPaymentProofSchema.safeParse({
      transactionId: formData.get("transactionId"),
      paymentMethodId: formData.get("paymentMethodId"),
      amountClaimed: formData.get("amountClaimed"),
      currency: formData.get("currency"),
      txHashOrReference: formData.get("txHashOrReference"),
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const values = parsed.data;

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { error: "Attach a screenshot or receipt of your payment." };
    }
    if (file.size > MAX_FILE_BYTES) {
      return { error: "File is too large — the limit is 10MB." };
    }

    const { supabase, user, profile } = await getCurrentUserAndProfile();
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", values.transactionId)
      .single();
    if (txError || !tx) throw new NotFoundError("Transaction not found.");
    if (tx.buyer_id !== user.id) throw new ForbiddenError("Only the Buyer can submit payment proof.");
    assertTransition(tx.status, "payment_under_review");

    const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const path = `${user.id}/${tx.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (uploadError) throw uploadError;

    const admin = getAdminClient();
    const { error: insertError } = await admin.from("payment_proofs").insert({
      transaction_id: tx.id,
      uploaded_by: user.id,
      payment_method_id: values.paymentMethodId,
      amount_claimed: values.amountClaimed,
      currency: values.currency,
      tx_hash_or_reference: values.txHashOrReference || null,
      file_url: path,
      status: "pending",
    });
    if (insertError) throw insertError;

    const { error: updateError } = await admin
      .from("transactions")
      .update({ status: "payment_under_review" })
      .eq("id", tx.id);
    if (updateError) throw updateError;

    await insertSystemMessage(
      admin,
      tx.id,
      `${profile.full_name || profile.email} submitted proof of payment. An Admin will verify it shortly.`
    );
    await notifyAdmins(admin, "payment_submitted", {
      transactionId: tx.id,
      referenceCode: tx.reference_code,
      title: tx.title,
    });

    revalidatePath(`/transactions/${tx.id}`);
    revalidatePath("/admin/payments");
    return {};
  } catch (err) {
    return toActionError(err);
  }
}
