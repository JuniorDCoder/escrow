"use server";

import { revalidatePath } from "next/cache";
import {
  requireAdmin,
  getAdminClient,
  insertSystemMessage,
  notifyUser,
  logAdminAction,
  toActionError,
  NotFoundError,
  ValidationError,
} from "./_shared";
import { assertTransition, TRANSITIONS } from "@/lib/domain/state-machine";
import {
  forceTransitionSchema,
  platformSettingsSchema,
  resolveDisputeSchema,
  updateUserSchema,
} from "@/lib/validations/admin";
import { paymentMethodSchema, reviewPaymentProofSchema } from "@/lib/validations/payment";
import { APP_NAME } from "@/lib/constants";
import type { ActionResult } from "./transactions";
import type { Profile, TransactionStatus } from "@/lib/types/database";

export async function reviewPaymentProofAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = reviewPaymentProofSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const { proofId, decision, note } = parsed.data;

    const { profile } = await requireAdmin();
    const admin = getAdminClient();

    const { data: proof, error: proofError } = await admin.from("payment_proofs").select("*").eq("id", proofId).single();
    if (proofError || !proof) throw new NotFoundError("Payment proof not found.");
    if (proof.status !== "pending") throw new ValidationError("This proof has already been reviewed.");

    const { data: tx, error: txError } = await admin.from("transactions").select("*").eq("id", proof.transaction_id).single();
    if (txError || !tx) throw new NotFoundError("Transaction not found.");

    const nextStatus: TransactionStatus = decision === "verify" ? "funded" : "awaiting_payment";
    assertTransition(tx.status, nextStatus);

    const { error: updateProofError } = await admin
      .from("payment_proofs")
      .update({
        status: decision === "verify" ? "verified" : "rejected",
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
        admin_note: note || null,
      })
      .eq("id", proofId);
    if (updateProofError) throw updateProofError;

    const { error: updateTxError } = await admin.from("transactions").update({ status: nextStatus }).eq("id", tx.id);
    if (updateTxError) throw updateTxError;

    if (decision === "verify") {
      await insertSystemMessage(admin, tx.id, `Payment verified by ${APP_NAME}. Funds are now secured in escrow.`);
      if (tx.buyer_id) await notifyUser(admin, tx.buyer_id, "payment_verified", { transactionId: tx.id, referenceCode: tx.reference_code });
      if (tx.seller_id) await notifyUser(admin, tx.seller_id, "payment_verified", { transactionId: tx.id, referenceCode: tx.reference_code });
    } else {
      await insertSystemMessage(admin, tx.id, `Payment proof rejected by ${APP_NAME}${note ? `: ${note}` : "."} Please resubmit.`);
      if (tx.buyer_id) await notifyUser(admin, tx.buyer_id, "payment_rejected", { transactionId: tx.id, referenceCode: tx.reference_code, note });
    }

    await logAdminAction(admin, profile.id, `payment_proof_${decision}`, "payment_proofs", proofId, note || null);

    revalidatePath("/admin/payments");
    revalidatePath(`/transactions/${tx.id}`);
    return {};
  } catch (err) {
    return toActionError(err);
  }
}

export async function queuePayoutAction(transactionId: string): Promise<ActionResult> {
  try {
    const { profile } = await requireAdmin();
    const admin = getAdminClient();

    const { data: tx, error } = await admin.from("transactions").select("*").eq("id", transactionId).single();
    if (error || !tx) throw new NotFoundError("Transaction not found.");
    assertTransition(tx.status, "release_pending");

    const { error: updateError } = await admin.from("transactions").update({ status: "release_pending" }).eq("id", tx.id);
    if (updateError) throw updateError;

    await insertSystemMessage(admin, tx.id, `Payout to the Seller has been queued by ${APP_NAME}.`);
    await logAdminAction(admin, profile.id, "queue_payout", "transactions", tx.id);

    revalidatePath("/admin/transactions");
    revalidatePath(`/transactions/${tx.id}`);
    return {};
  } catch (err) {
    return toActionError(err);
  }
}

export async function confirmPayoutAction(transactionId: string): Promise<ActionResult> {
  try {
    const { profile } = await requireAdmin();
    const admin = getAdminClient();

    const { data: tx, error } = await admin.from("transactions").select("*").eq("id", transactionId).single();
    if (error || !tx) throw new NotFoundError("Transaction not found.");
    assertTransition(tx.status, "released");

    const { error: updateError } = await admin.from("transactions").update({ status: "released" }).eq("id", tx.id);
    if (updateError) throw updateError;

    await insertSystemMessage(admin, tx.id, `Payout confirmed by ${APP_NAME}. This transaction is complete.`);
    if (tx.seller_id) await notifyUser(admin, tx.seller_id, "payout_released", { transactionId: tx.id, referenceCode: tx.reference_code });
    if (tx.buyer_id) await notifyUser(admin, tx.buyer_id, "payout_released", { transactionId: tx.id, referenceCode: tx.reference_code });
    await logAdminAction(admin, profile.id, "confirm_payout", "transactions", tx.id);

    revalidatePath("/admin/transactions");
    revalidatePath(`/transactions/${tx.id}`);
    return {};
  } catch (err) {
    return toActionError(err);
  }
}

export async function resolveDisputeAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = resolveDisputeSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const { disputeId, resolution, note } = parsed.data;

    const { profile } = await requireAdmin();
    const admin = getAdminClient();

    const { data: dispute, error: disputeError } = await admin.from("disputes").select("*").eq("id", disputeId).single();
    if (disputeError || !dispute) throw new NotFoundError("Dispute not found.");
    if (dispute.status !== "open" && dispute.status !== "under_review") {
      throw new ValidationError("This dispute has already been resolved.");
    }

    const { data: tx, error: txError } = await admin.from("transactions").select("*").eq("id", dispute.transaction_id).single();
    if (txError || !tx) throw new NotFoundError("Transaction not found.");
    assertTransition(tx.status, resolution);

    const { error: updateDisputeError } = await admin
      .from("disputes")
      .update({ status: resolution, resolution_note: note, resolved_by: profile.id, resolved_at: new Date().toISOString() })
      .eq("id", disputeId);
    if (updateDisputeError) throw updateDisputeError;

    const { error: updateTxError } = await admin.from("transactions").update({ status: resolution }).eq("id", tx.id);
    if (updateTxError) throw updateTxError;

    await insertSystemMessage(admin, tx.id, `Dispute resolved by ${APP_NAME}: ${note}`);
    if (tx.buyer_id) await notifyUser(admin, tx.buyer_id, "dispute_resolved", { transactionId: tx.id, referenceCode: tx.reference_code, resolution });
    if (tx.seller_id) await notifyUser(admin, tx.seller_id, "dispute_resolved", { transactionId: tx.id, referenceCode: tx.reference_code, resolution });
    await logAdminAction(admin, profile.id, `dispute_${resolution}`, "disputes", disputeId, note);

    revalidatePath("/admin/disputes");
    revalidatePath(`/transactions/${tx.id}`);
    return {};
  } catch (err) {
    return toActionError(err);
  }
}

export async function forceTransitionAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = forceTransitionSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const { transactionId, status, note } = parsed.data;

    if (!(status in TRANSITIONS)) return { error: "Unknown status." };

    const { profile } = await requireAdmin();
    const admin = getAdminClient();

    const { data: tx, error } = await admin.from("transactions").select("*").eq("id", transactionId).single();
    if (error || !tx) throw new NotFoundError("Transaction not found.");

    const nextStatus = status as TransactionStatus;
    const { error: updateError } = await admin.from("transactions").update({ status: nextStatus }).eq("id", tx.id);
    if (updateError) throw updateError;

    await insertSystemMessage(admin, tx.id, `${APP_NAME} force-moved this transaction to "${nextStatus}". Reason: ${note}`);
    await logAdminAction(admin, profile.id, `force_transition_to_${nextStatus}`, "transactions", tx.id, note);

    revalidatePath("/admin/transactions");
    revalidatePath(`/transactions/${tx.id}`);
    return {};
  } catch (err) {
    return toActionError(err);
  }
}

export async function upsertPaymentMethodAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = paymentMethodSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const values = parsed.data;

    const { profile } = await requireAdmin();
    const admin = getAdminClient();

    let accountDetails: Record<string, string>;
    try {
      accountDetails = JSON.parse(values.accountDetails);
      if (typeof accountDetails !== "object" || Array.isArray(accountDetails)) throw new Error();
    } catch {
      return { error: "Account details must be valid JSON, e.g. {\"account_number\": \"123\"}" };
    }

    const payload = {
      type: values.type,
      label: values.label,
      network: values.network || null,
      account_details: accountDetails,
      instructions: values.instructions || null,
      is_active: values.isActive,
    };

    if (values.id) {
      const { error } = await admin.from("payment_methods").update(payload).eq("id", values.id);
      if (error) throw error;
      await logAdminAction(admin, profile.id, "update_payment_method", "payment_methods", values.id);
    } else {
      const { data: inserted, error } = await admin.from("payment_methods").insert(payload).select().single();
      if (error) throw error;
      await logAdminAction(admin, profile.id, "create_payment_method", "payment_methods", inserted.id);
    }

    revalidatePath("/admin/payment-methods");
    revalidatePath("/transactions", "layout");
    return {};
  } catch (err) {
    return toActionError(err);
  }
}

export async function togglePaymentMethodActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const { profile } = await requireAdmin();
    const admin = getAdminClient();
    const { error } = await admin.from("payment_methods").update({ is_active: isActive }).eq("id", id);
    if (error) throw error;
    await logAdminAction(admin, profile.id, isActive ? "activate_payment_method" : "deactivate_payment_method", "payment_methods", id);
    revalidatePath("/admin/payment-methods");
    return {};
  } catch (err) {
    return toActionError(err);
  }
}

export async function updatePlatformSettingsAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = platformSettingsSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const values = parsed.data;

    const { profile } = await requireAdmin();
    const admin = getAdminClient();

    const { error } = await admin
      .from("settings")
      .update({
        platform_name: values.platformName,
        fee_percentage: values.feePercentage,
        fee_minimum: values.feeMinimum,
        whatsapp_number: values.whatsappNumber || null,
        support_email: values.supportEmail || null,
        default_inspection_days: values.defaultInspectionDays,
      })
      .eq("id", 1);
    if (error) throw error;

    await logAdminAction(admin, profile.id, "update_settings", "settings", "1");
    revalidatePath("/", "layout");
    return {};
  } catch (err) {
    return toActionError(err);
  }
}

export async function updateUserAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = updateUserSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const { userId, isSuspended, kycStatus, isAdmin, note } = parsed.data;

    const { profile } = await requireAdmin();
    if (userId === profile.id && (isAdmin === false || isSuspended === true)) {
      throw new ValidationError("You can't remove your own admin access or suspend yourself.");
    }

    const admin = getAdminClient();
    const payload: Partial<Pick<Profile, "is_suspended" | "kyc_status" | "is_admin">> = {};
    if (isSuspended !== undefined) payload.is_suspended = isSuspended;
    if (kycStatus !== undefined) payload.kyc_status = kycStatus;
    if (isAdmin !== undefined) payload.is_admin = isAdmin;

    if (Object.keys(payload).length === 0) return {};

    const { error } = await admin.from("profiles").update(payload).eq("id", userId);
    if (error) throw error;

    await logAdminAction(admin, profile.id, "update_user", "profiles", userId, note || JSON.stringify(payload));
    revalidatePath("/admin/users");
    return {};
  } catch (err) {
    return toActionError(err);
  }
}
