"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginSchema, requestResetSchema, signupSchema, updatePasswordSchema } from "@/lib/validations/auth";
import { SITE_URL } from "@/lib/constants";

export interface ActionResult {
  error?: string;
}

export interface SignUpResult extends ActionResult {
  /** True if Supabase requires email confirmation before a session exists. */
  needsConfirmation?: boolean;
}

export async function signUpAction(input: unknown): Promise<SignUpResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { fullName, email, password, next } = parsed.data;

  const supabase = await createClient();
  const emailRedirectTo = `${SITE_URL}/auth/callback?next=${encodeURIComponent(next || "/dashboard")}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo },
  });

  if (error) {
    return { error: error.message };
  }

  return { needsConfirmation: !data.session };
}

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { email, password } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Incorrect email or password." };
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

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/auth/reset-password`,
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
 * Self-service account deletion. A genuine hard delete only works when
 * nothing else in the database references this profile — the moment a
 * transaction, message, or admin action points at this user's profile id,
 * Postgres' foreign key constraints (deliberately not cascading — deleting
 * your account shouldn't erase the other party's or Admin's record of a
 * real transaction) would reject it. So: check for any such history first,
 * and if there is none, delete outright; otherwise scrub the user-facing
 * PII (name/phone/WhatsApp) and permanently lock the account instead,
 * leaving the transaction history intact for whoever they dealt with —
 * the same "[deleted user]" pattern most marketplaces use.
 */
export async function deleteAccountAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to do that." };

  const admin = createAdminClient();

  const [txResult, adminActionResult, messageResult] = await Promise.all([
    admin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id},created_by.eq.${user.id}`),
    admin.from("admin_actions").select("id", { count: "exact", head: true }).eq("admin_id", user.id),
    admin.from("messages").select("id", { count: "exact", head: true }).eq("sender_id", user.id),
  ]);
  const hasHistory = (txResult.count ?? 0) > 0 || (adminActionResult.count ?? 0) > 0 || (messageResult.count ?? 0) > 0;

  if (!hasHistory) {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) return { error: "Couldn't delete your account. Please try again or contact support." };
  } else {
    const { error: profileError } = await admin
      .from("profiles")
      .update({ full_name: "Deleted user", phone: null, whatsapp_number: null, is_suspended: true })
      .eq("id", user.id);
    if (profileError) return { error: "Couldn't delete your account. Please try again or contact support." };

    // Lock the account out entirely — is_suspended above only blocks Server
    // Actions, it doesn't kill an existing session or future logins.
    const { error: banError } = await admin.auth.admin.updateUserById(user.id, { ban_duration: "876000h" });
    if (banError) return { error: "Couldn't delete your account. Please try again or contact support." };
  }

  try {
    await supabase.auth.signOut();
  } catch {
    // Best-effort — the account is already deleted/locked either way.
  }

  return {};
}
