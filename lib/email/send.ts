import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { APP_NAME } from "@/lib/constants";

let cachedTransporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (cachedTransporter !== undefined) return cachedTransporter;

  const host = process.env.MAIL_HOST;
  const user = process.env.MAIL_USERNAME;
  const pass = process.env.MAIL_PASSWORD;
  if (!host || !user || !pass) {
    cachedTransporter = null;
    return cachedTransporter;
  }

  const port = Number(process.env.MAIL_PORT) || 587;
  // ssl (implicit TLS, typically port 465) vs tls/starttls (typically 587).
  const encryption = (process.env.MAIL_ENCRYPTION || "").toLowerCase();
  const secure = encryption === "ssl" || (encryption !== "tls" && port === 465);

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return cachedTransporter;
}

function getFromHeader(): string {
  const address = process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME || "";
  // MAIL_FROM_NAME copied from a Laravel .env often looks like
  // `"${APP_NAME}"` — that's Laravel-only interpolation, Node won't expand
  // it, so treat a literal "${...}" value the same as unset.
  const rawName = process.env.MAIL_FROM_NAME;
  const name = rawName && !rawName.startsWith("${") ? rawName : APP_NAME;
  return address ? `${name} <${address}>` : name;
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Best-effort transactional email over SMTP. Never throws — a failed or
 * unconfigured email send must never break the underlying transaction
 * workflow (the in-app notification/message already recorded the event
 * regardless). Without MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD set, this just
 * logs and no-ops.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(`[email] SMTP not configured (MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD) — skipped "${subject}" to ${to}`);
    return;
  }

  try {
    await transporter.sendMail({ from: getFromHeader(), to, subject, html });
  } catch (err) {
    console.error(`[email] send failed for "${subject}" to ${to}:`, err);
  }
}
