"use server";

import { revalidatePath } from "next/cache";
import {
  getCurrentUserAndProfile,
  getAdminClient,
  insertSystemMessage,
  notifyUser,
  notifyAdmins,
  toActionError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "./_shared";
import { assertTransition } from "@/lib/domain/state-machine";
import { calculateFee } from "@/lib/domain/fees";
import {
  createTransactionSchema,
  disputeSchema,
  messageSchema,
} from "@/lib/validations/transaction";
import { submitDeliveryProofSchema } from "@/lib/validations/payment";
import { getSettings } from "@/lib/data/settings";
import { SITE_URL } from "@/lib/constants";
import { sendEmail } from "@/lib/email/send";
import { transactionInviteEmail } from "@/lib/email/templates";
import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/lib/types/database";

export interface ActionResult<T = undefined> {
  error?: string;
  data?: T;
}

export async function createTransactionAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = createTransactionSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const values = parsed.data;

    const { user, profile } = await getCurrentUserAndProfile();
    const counterpartyEmail = values.counterpartyEmail.trim().toLowerCase();
    if (counterpartyEmail === profile.email.toLowerCase()) {
      throw new ValidationError("You can't invite yourself as the counterparty.");
    }

    const settings = await getSettings();
    const fee = calculateFee({
      amount: values.amount,
      feePercentage: settings.fee_percentage,
      feeMinimum: settings.fee_minimum,
      feePayer: values.feePayer,
    });

    const admin = getAdminClient();
    const isBuyer = values.role === "buyer";

    const { data: inserted, error } = await admin
      .from("transactions")
      .insert({
        title: values.title,
        description: values.description || null,
        category: values.category as Transaction["category"],
        amount: fee.amount,
        currency: values.currency,
        fee_amount: fee.feeAmount,
        fee_payer: values.feePayer,
        total_payable: fee.totalPayable,
        buyer_id: isBuyer ? user.id : null,
        seller_id: isBuyer ? null : user.id,
        buyer_email: isBuyer ? profile.email.toLowerCase() : counterpartyEmail,
        seller_email: isBuyer ? counterpartyEmail : profile.email.toLowerCase(),
        created_by: user.id,
        status: "awaiting_acceptance",
        inspection_period_days: values.inspectionPeriodDays,
      })
      .select()
      .single();

    if (error || !inserted) throw error ?? new Error("Failed to create transaction");

    await insertSystemMessage(
      admin,
      inserted.id,
      `${profile.full_name || profile.email} created this transaction as the ${values.role} and invited ${counterpartyEmail}.`
    );

    const { data: counterpartyProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", counterpartyEmail)
      .maybeSingle();

    const inviteTargetUrl = `/transactions/${inserted.id}`;

    if (counterpartyProfile) {
      // notifyUser also emails them — see lib/actions/_shared.ts.
      await notifyUser(admin, counterpartyProfile.id, "transaction_invite", {
        transactionId: inserted.id,
        referenceCode: inserted.reference_code,
        title: inserted.title,
      });
    } else {
      // No account yet: there's nowhere to attach an in-app notification,
      // so this email is the only way they find out about the invite —
      // send it directly with a signup link that lands them right back on
      // this transaction once they've created an account.
      await sendEmail({
        to: counterpartyEmail,
        subject: `You're invited to an escrow transaction — ${inserted.reference_code}`,
        html: transactionInviteEmail({
          role: isBuyer ? "seller" : "buyer",
          title: inserted.title,
          referenceCode: inserted.reference_code,
          amountFormatted: formatCurrency(inserted.amount, inserted.currency),
          inviterName: profile.full_name || profile.email,
          actionUrl: `${SITE_URL}/auth/signup?next=${encodeURIComponent(inviteTargetUrl)}`,
          hasAccount: false,
        }),
      });
    }

    revalidatePath("/dashboard");
    return { data: { id: inserted.id } };
  } catch (err) {
    return toActionError(err);
  }
}

async function loadOwnedTransaction(transactionId: string) {
  const { supabase, user, profile } = await getCurrentUserAndProfile();
  const { data: tx, error } = await supabase.from("transactions").select("*").eq("id", transactionId).single();
  if (error || !tx) throw new NotFoundError("Transaction not found.");
  return { user, profile, tx: tx as Transaction };
}

export async function acceptTransactionInviteAction(transactionId: string): Promise<ActionResult> {
  try {
    const { user, profile, tx } = await loadOwnedTransaction(transactionId);
    assertTransition(tx.status, "awaiting_payment");

    const email = profile.email.toLowerCase();
    const isBuyerInvite = tx.buyer_id === null && tx.buyer_email === email;
    const isSellerInvite = tx.seller_id === null && tx.seller_email === email;
    if (!isBuyerInvite && !isSellerInvite) {
      throw new ForbiddenError("This invite isn't addressed to you.");
    }

    const admin = getAdminClient();
    const { error } = await admin
      .from("transactions")
      .update({
        status: "awaiting_payment",
        buyer_id: isBuyerInvite ? user.id : tx.buyer_id,
        seller_id: isSellerInvite ? user.id : tx.seller_id,
      })
      .eq("id", transactionId);
    if (error) throw error;

    await insertSystemMessage(admin, transactionId, `${profile.full_name || profile.email} accepted the transaction terms.`);
    await notifyUser(admin, tx.created_by, "transaction_accepted", {
      transactionId,
      referenceCode: tx.reference_code,
      title: tx.title,
    });

    revalidatePath(`/transactions/${transactionId}`);
    revalidatePath("/dashboard");
    return {};
  } catch (err) {
    return toActionError(err);
  }
}

export async function declineTransactionInviteAction(transactionId: string): Promise<ActionResult> {
  try {
    const { user, profile, tx } = await loadOwnedTransaction(transactionId);
    assertTransition(tx.status, "cancelled");

    const email = profile.email.toLowerCase();
    const isParty =
      tx.created_by === user.id ||
      (tx.buyer_id === null && tx.buyer_email === email) ||
      (tx.seller_id === null && tx.seller_email === email);
    if (!isParty) throw new ForbiddenError("You're not a party to this transaction.");

    const admin = getAdminClient();
    const { error } = await admin.from("transactions").update({ status: "cancelled" }).eq("id", transactionId);
    if (error) throw error;

    await insertSystemMessage(admin, transactionId, `${profile.full_name || profile.email} cancelled the transaction before it was funded.`);
    const notifyId = tx.created_by === user.id ? null : tx.created_by;
    if (notifyId) {
      await notifyUser(admin, notifyId, "transaction_cancelled", {
        transactionId,
        referenceCode: tx.reference_code,
        title: tx.title,
      });
    }

    revalidatePath(`/transactions/${transactionId}`);
    revalidatePath("/dashboard");
    return {};
  } catch (err) {
    return toActionError(err);
  }
}

export async function cancelTransactionAction(transactionId: string): Promise<ActionResult> {
  try {
    const { user, profile, tx } = await loadOwnedTransaction(transactionId);
    if (tx.buyer_id !== user.id && tx.seller_id !== user.id) {
      throw new ForbiddenError("You're not a party to this transaction.");
    }
    assertTransition(tx.status, "cancelled");

    const admin = getAdminClient();
    const { error } = await admin.from("transactions").update({ status: "cancelled" }).eq("id", tx.id);
    if (error) throw error;

    await insertSystemMessage(admin, tx.id, `${profile.full_name || profile.email} cancelled this transaction. No funds had moved.`);
    const otherPartyId = tx.buyer_id === user.id ? tx.seller_id : tx.buyer_id;
    if (otherPartyId) {
      await notifyUser(admin, otherPartyId, "transaction_cancelled", { transactionId: tx.id, referenceCode: tx.reference_code, title: tx.title });
    }

    revalidatePath(`/transactions/${tx.id}`);
    revalidatePath("/dashboard");
    return {};
  } catch (err) {
    return toActionError(err);
  }
}

export async function submitDeliveryProofAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = submitDeliveryProofSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const values = parsed.data;

    const { user, profile, tx } = await loadOwnedTransaction(values.transactionId);
    if (tx.seller_id !== user.id) throw new ForbiddenError("Only the Seller can mark this as delivered.");
    assertTransition(tx.status, "inspection_period");

    const admin = getAdminClient();
    const inspectionEndsAt = new Date(Date.now() + tx.inspection_period_days * 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await admin.from("delivery_proofs").insert({
      transaction_id: tx.id,
      uploaded_by: user.id,
      description: values.description || null,
      tracking_reference: values.trackingReference || null,
    });
    if (insertError) throw insertError;

    const { error: updateError } = await admin
      .from("transactions")
      .update({ status: "inspection_period", inspection_ends_at: inspectionEndsAt })
      .eq("id", tx.id);
    if (updateError) throw updateError;

    await insertSystemMessage(
      admin,
      tx.id,
      `${profile.full_name || profile.email} marked the item as delivered. The Buyer has ${tx.inspection_period_days} day(s) to inspect and accept.`
    );
    if (tx.buyer_id) {
      await notifyUser(admin, tx.buyer_id, "delivery_marked", {
        transactionId: tx.id,
        referenceCode: tx.reference_code,
        title: tx.title,
        inspectionEndsAt,
      });
    }

    revalidatePath(`/transactions/${tx.id}`);
    return {};
  } catch (err) {
    return toActionError(err);
  }
}

export async function acceptDeliveryAction(transactionId: string): Promise<ActionResult> {
  try {
    const { user, profile, tx } = await loadOwnedTransaction(transactionId);
    if (tx.buyer_id !== user.id) throw new ForbiddenError("Only the Buyer can accept delivery.");
    assertTransition(tx.status, "accepted");

    const admin = getAdminClient();
    const { error } = await admin.from("transactions").update({ status: "accepted" }).eq("id", tx.id);
    if (error) throw error;

    await insertSystemMessage(admin, tx.id, `${profile.full_name || profile.email} accepted the delivery. Payout to the Seller is being queued.`);
    if (tx.seller_id) {
      await notifyUser(admin, tx.seller_id, "buyer_accepted", { transactionId: tx.id, referenceCode: tx.reference_code, title: tx.title });
    }
    await notifyAdmins(admin, "payout_ready", { transactionId: tx.id, referenceCode: tx.reference_code, title: tx.title });

    revalidatePath(`/transactions/${tx.id}`);
    return {};
  } catch (err) {
    return toActionError(err);
  }
}

export async function openDisputeAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = disputeSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const values = parsed.data;

    const { user, profile, tx } = await loadOwnedTransaction(values.transactionId);
    if (tx.buyer_id !== user.id && tx.seller_id !== user.id) {
      throw new ForbiddenError("You're not a party to this transaction.");
    }
    assertTransition(tx.status, "disputed");

    const admin = getAdminClient();
    const { error: insertError } = await admin.from("disputes").insert({
      transaction_id: tx.id,
      opened_by: user.id,
      reason: values.reason,
    });
    if (insertError) throw insertError;

    const { error: updateError } = await admin.from("transactions").update({ status: "disputed" }).eq("id", tx.id);
    if (updateError) throw updateError;

    await insertSystemMessage(admin, tx.id, `${profile.full_name || profile.email} opened a dispute. An Admin will review the case.`);
    const otherPartyId = tx.buyer_id === user.id ? tx.seller_id : tx.buyer_id;
    if (otherPartyId) {
      await notifyUser(admin, otherPartyId, "dispute_opened", { transactionId: tx.id, referenceCode: tx.reference_code, title: tx.title });
    }
    await notifyAdmins(admin, "dispute_opened", { transactionId: tx.id, referenceCode: tx.reference_code, title: tx.title });

    revalidatePath(`/transactions/${tx.id}`);
    return {};
  } catch (err) {
    return toActionError(err);
  }
}

export async function postMessageAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = messageSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const values = parsed.data;

    const { user, profile, tx } = await loadOwnedTransaction(values.transactionId);
    const isParty = tx.buyer_id === user.id || tx.seller_id === user.id || profile.is_admin;
    if (!isParty) throw new ForbiddenError("You're not a party to this transaction.");

    const admin = getAdminClient();
    const { error } = await admin.from("messages").insert({
      transaction_id: tx.id,
      sender_id: user.id,
      body: values.body,
      is_system_event: false,
    });
    if (error) throw error;

    const recipients = [tx.buyer_id, tx.seller_id].filter((id): id is string => !!id && id !== user.id);
    for (const recipientId of recipients) {
      await notifyUser(admin, recipientId, "new_message", { transactionId: tx.id, referenceCode: tx.reference_code, title: tx.title });
    }

    revalidatePath(`/transactions/${tx.id}`);
    return {};
  } catch (err) {
    return toActionError(err);
  }
}

/**
 * Lazily auto-accepts a transaction whose inspection window has lapsed
 * with no dispute — called from the transaction detail page's data
 * loader (lib/data/transactions.ts) on every read, since there's no
 * background job runner in this deployment. See AGENTS.md Section 6:
 * "buyer explicitly accepts, or period lapses with no dispute -> auto-accept".
 */
export async function reconcileInspectionWindow(tx: Transaction): Promise<Transaction> {
  if (tx.status !== "inspection_period" || !tx.inspection_ends_at) return tx;
  if (new Date(tx.inspection_ends_at).getTime() > Date.now()) return tx;

  try {
    const admin = getAdminClient();
    const { data: updated, error } = await admin
      .from("transactions")
      .update({ status: "accepted" })
      .eq("id", tx.id)
      .eq("status", "inspection_period")
      .select()
      .single();
    if (error || !updated) return tx;

    await insertSystemMessage(admin, tx.id, "The inspection period ended with no dispute raised — the delivery was automatically accepted.");
    if (tx.seller_id) {
      await notifyUser(admin, tx.seller_id, "buyer_accepted", { transactionId: tx.id, referenceCode: tx.reference_code, title: tx.title });
    }
    await notifyAdmins(admin, "payout_ready", { transactionId: tx.id, referenceCode: tx.reference_code, title: tx.title });

    return updated as Transaction;
  } catch {
    return tx;
  }
}
