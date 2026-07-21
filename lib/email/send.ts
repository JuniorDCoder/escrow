import "server-only";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_NAME } from "@/lib/constants";

interface MailConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: string | null;
  fromAddress: string;
  fromName: string | null;
}

/**
 * SMTP config is admin-editable at runtime (see /admin/settings), so it's
 * re-read on every send rather than cached at module scope — email sending
 * isn't a hot path, and a stale cached transporter would silently keep
 * using credentials the admin just rotated or cleared.
 */
async function resolveMailConfig(): Promise<MailConfig | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("email_settings").select("*").eq("id", 1).maybeSingle();
    if (data?.mail_host && data.mail_username && data.mail_password) {
      return {
        host: data.mail_host,
        port: data.mail_port || 587,
        username: data.mail_username,
        password: data.mail_password,
        encryption: data.mail_encryption,
        fromAddress: data.mail_from_address || data.mail_username,
        fromName: data.mail_from_name,
      };
    }
  } catch {
    // Supabase unreachable/misconfigured — fall through to env vars below.
  }

  const host = process.env.MAIL_HOST;
  const username = process.env.MAIL_USERNAME;
  const password = process.env.MAIL_PASSWORD;
  if (host && username && password) {
    return {
      host,
      port: Number(process.env.MAIL_PORT) || 587,
      username,
      password,
      encryption: process.env.MAIL_ENCRYPTION || null,
      fromAddress: process.env.MAIL_FROM_ADDRESS || username,
      fromName: process.env.MAIL_FROM_NAME || null,
    };
  }

  return null;
}

function getFromHeader(config: MailConfig): string {
  // MAIL_FROM_NAME copied from a Laravel .env often looks like
  // `"${APP_NAME}"` — that's Laravel-only interpolation, Node won't expand
  // it, so treat a literal "${...}" value the same as unset.
  const name = config.fromName && !config.fromName.startsWith("${") ? config.fromName : APP_NAME;
  return `${name} <${config.fromAddress}>`;
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

interface SendEmailResult {
  ok: boolean;
  error?: string;
}

/**
 * Best-effort transactional email over SMTP. Never throws — a failed or
 * unconfigured email send must never break the underlying transaction
 * workflow (the in-app notification/message already recorded the event
 * regardless). Returns { ok, error } so callers that specifically need to
 * know delivery succeeded (e.g. the admin "send test email" action) can
 * check it; every other call site just fires-and-forgets the promise.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<SendEmailResult> {
  const config = await resolveMailConfig();
  if (!config) {
    const message = "SMTP is not configured (set it in /admin/settings or MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD).";
    console.warn(`[email] ${message} — skipped "${subject}" to ${to}`);
    return { ok: false, error: message };
  }

  const port = config.port;
  const encryption = (config.encryption || "").toLowerCase();
  const secure = encryption === "ssl" || (encryption !== "tls" && port === 465);

  const transporter = nodemailer.createTransport({
    host: config.host,
    port,
    secure,
    auth: { user: config.username, pass: config.password },
  });

  try {
    await transporter.sendMail({ from: getFromHeader(config), to, subject, html });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email.";
    console.error(`[email] send failed for "${subject}" to ${to}:`, err);
    return { ok: false, error: message };
  }
}
