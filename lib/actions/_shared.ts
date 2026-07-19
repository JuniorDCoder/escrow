import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getNotificationCopy, getNotificationEmailSubject } from "@/lib/domain/notifications";
import { notificationEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { SITE_URL } from "@/lib/constants";
import type { Profile } from "@/lib/types/database";

export class AuthError extends Error {}
export class ForbiddenError extends Error {}
export class NotFoundError extends Error {}
export class ValidationError extends Error {}

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Identifies the caller using the request-scoped (RLS-respecting) client.
 * Every mutating Server Action calls this first — it doubles as the
 * authorization check, since a subsequent RLS-protected read of a
 * transaction/proof/etc. will come back empty for rows the caller isn't
 * actually party to.
 */
export async function getCurrentUserAndProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError("You must be logged in to do that.");

  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error || !profile) throw new AuthError("We couldn't find your profile. Try logging in again.");
  if (profile.is_suspended) throw new ForbiddenError("Your account has been suspended. Contact support for help.");

  return { supabase, user, profile: profile as Profile };
}

export async function requireAdmin() {
  const ctx = await getCurrentUserAndProfile();
  if (!ctx.profile.is_admin) throw new ForbiddenError("Admin access required.");
  return ctx;
}

/**
 * Writes that cross user boundaries (status transitions with side effects
 * for the other party, system-event messages, admin actions) go through
 * this service-role client rather than the caller's own RLS-scoped one —
 * see AGENTS.md Section 4/11. Never import this into a Client Component.
 */
export function getAdminClient(): AdminClient {
  return createAdminClient();
}

export async function insertSystemMessage(admin: AdminClient, transactionId: string, body: string) {
  const { error } = await admin
    .from("messages")
    .insert({ transaction_id: transactionId, body, is_system_event: true, sender_id: null });
  if (error) throw error;
}

/**
 * Best-effort — never lets an email hiccup fail the caller's DB write,
 * since the in-app notification row is the source of truth either way.
 */
async function emailNotificationRecipient(email: string, type: string, payload: Record<string, unknown>) {
  const { text, href } = getNotificationCopy({ type, payload });
  await sendEmail({
    to: email,
    subject: getNotificationEmailSubject(type),
    html: notificationEmail({
      headline: getNotificationEmailSubject(type),
      body: text,
      actionUrl: href ? `${SITE_URL}${href}` : SITE_URL,
    }),
  });
}

export async function notifyUser(
  admin: AdminClient,
  userId: string,
  type: string,
  payload: Record<string, unknown>
) {
  const { error } = await admin.from("notifications").insert({ user_id: userId, type, payload });
  if (error) throw error;

  const { data: recipient } = await admin.from("profiles").select("email").eq("id", userId).single();
  if (recipient?.email) {
    await emailNotificationRecipient(recipient.email, type, payload);
  }
}

export async function notifyAdmins(admin: AdminClient, type: string, payload: Record<string, unknown>) {
  const { data: admins } = await admin.from("profiles").select("id, email").eq("is_admin", true);
  if (admins?.length) {
    const { error } = await admin
      .from("notifications")
      .insert(admins.map((a) => ({ user_id: a.id, type, payload })));
    if (error) throw error;

    await Promise.all(admins.map((a) => (a.email ? emailNotificationRecipient(a.email, type, payload) : undefined)));
  }
}

export async function logAdminAction(
  admin: AdminClient,
  adminId: string,
  action: string,
  targetTable: string,
  targetId: string,
  note?: string | null
) {
  const { error } = await admin
    .from("admin_actions")
    .insert({ admin_id: adminId, action, target_table: targetTable, target_id: targetId, note: note || null });
  if (error) throw error;
}

export function toActionError(err: unknown): { error: string } {
  if (err instanceof AuthError || err instanceof ForbiddenError || err instanceof NotFoundError || err instanceof ValidationError) {
    return { error: err.message };
  }
  if (err instanceof Error && "name" in err && err.name === "InvalidTransitionError") {
    return { error: err.message };
  }
  console.error(err);
  return { error: "Something went wrong. Please try again." };
}
