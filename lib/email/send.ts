import "server-only";
import { Resend } from "resend";
import { APP_NAME } from "@/lib/constants";

let cachedClient: Resend | null | undefined;

function getClient(): Resend | null {
  if (cachedClient !== undefined) return cachedClient;
  const apiKey = process.env.RESEND_API_KEY;
  cachedClient = apiKey ? new Resend(apiKey) : null;
  return cachedClient;
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Best-effort transactional email. Never throws — a failed or unconfigured
 * email send must never break the underlying transaction workflow (the
 * in-app notification/message already recorded the event regardless).
 * Without RESEND_API_KEY set, this just logs and no-ops, matching
 * AGENTS.md Section 4: "Resend for transactional notifications if budget
 * allows — otherwise in-app notifications only."
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const resend = getClient();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipped "${subject}" to ${to}`);
    return;
  }

  const from = process.env.EMAIL_FROM || `${APP_NAME} <onboarding@resend.dev>`;

  try {
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error) console.error(`[email] send failed for "${subject}" to ${to}:`, error);
  } catch (err) {
    console.error(`[email] send threw for "${subject}" to ${to}:`, err);
  }
}
