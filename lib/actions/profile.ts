"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserAndProfile, getAdminClient, insertSystemMessage, toActionError, ValidationError } from "./_shared";
import { updateProfileSchema, ratingSchema } from "@/lib/validations/profile";
import type { ActionResult } from "./transactions";

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const values = parsed.data;

    const { supabase, user } = await getCurrentUserAndProfile();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: values.fullName,
        phone: values.phone || null,
        whatsapp_number: values.whatsappNumber || null,
      })
      .eq("id", user.id);
    if (error) throw error;

    revalidatePath("/settings/profile");
    revalidatePath("/dashboard", "layout");
    return {};
  } catch (err) {
    return toActionError(err);
  }
}

export async function submitRatingAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = ratingSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    const values = parsed.data;

    const { supabase, user } = await getCurrentUserAndProfile();
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", values.transactionId)
      .single();
    if (txError || !tx) throw new ValidationError("Transaction not found.");
    if (tx.status !== "released" && tx.status !== "refunded") {
      throw new ValidationError("You can only rate a completed transaction.");
    }
    if (tx.buyer_id !== user.id && tx.seller_id !== user.id) {
      throw new ValidationError("You're not a party to this transaction.");
    }

    const { error } = await supabase.from("ratings").insert({
      transaction_id: values.transactionId,
      rated_by: user.id,
      rated_user: values.ratedUser,
      score: values.score,
      comment: values.comment || null,
    });
    if (error) throw error;

    const admin = getAdminClient();
    await insertSystemMessage(admin, values.transactionId, "A rating was left for this transaction.");

    revalidatePath(`/transactions/${values.transactionId}`);
    return {};
  } catch (err) {
    return toActionError(err);
  }
}
