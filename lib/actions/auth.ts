"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginSchema, requestResetSchema, signupSchema, updatePasswordSchema } from "@/lib/validations/auth";

export interface ActionResult {
  error?: string;
}

export async function signUpAction(input: unknown): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { fullName, email, password } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    return { error: error.message };
  }

  // Claim any transactions this person was invited to before they had an account.
  if (data.user) {
    await claimInvitedTransactions(data.user.id, email);
  }

  return {};
}

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { email, password } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Incorrect email or password." };
  }

  if (data.user) {
    await claimInvitedTransactions(data.user.id, email);
  }

  return {};
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordResetAction(input: unknown): Promise<ActionResult> {
  const parsed = requestResetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }
  return {};
}

export async function updatePasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: error.message };
  }
  return {};
}

/**
 * When someone signs up or logs in, link any transactions where they were
 * invited by email (buyer_email/seller_email) but no account existed yet.
 * Uses the service-role client because this write touches rows the user
 * doesn't already own via buyer_id/seller_id.
 */
async function claimInvitedTransactions(userId: string, email: string) {
  const admin = createAdminClient();
  const lowerEmail = email.toLowerCase();

  const { data: asBuyer } = await admin
    .from("transactions")
    .update({ buyer_id: userId })
    .is("buyer_id", null)
    .eq("buyer_email", lowerEmail)
    .select("id");

  const { data: asSeller } = await admin
    .from("transactions")
    .update({ seller_id: userId })
    .is("seller_id", null)
    .eq("seller_email", lowerEmail)
    .select("id");

  return { linked: (asBuyer?.length ?? 0) + (asSeller?.length ?? 0) };
}
