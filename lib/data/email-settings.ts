import { createClient } from "@/lib/supabase/server";
import type { EmailSettings } from "@/lib/types/database";

export type EmailSettingsView = Omit<EmailSettings, "mail_password"> & { hasPassword: boolean };

/**
 * Admin-only. Deliberately strips mail_password before returning — this
 * gets passed as a prop into a Client Component, and a stored SMTP password
 * must never be serialized into the page, only a hasPassword flag so the
 * form can show "leave blank to keep the current password."
 */
export async function getEmailSettingsForAdmin(): Promise<EmailSettingsView | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("email_settings").select("*").eq("id", 1).maybeSingle();
    if (error || !data) return null;
    const { mail_password, ...rest } = data;
    return { ...rest, hasPassword: !!mail_password };
  } catch {
    return null;
  }
}
