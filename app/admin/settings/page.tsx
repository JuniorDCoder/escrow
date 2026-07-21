import type { Metadata } from "next";
import { getSettings } from "@/lib/data/settings";
import { getEmailSettingsForAdmin } from "@/lib/data/email-settings";
import { SettingsForm } from "@/components/admin/settings-form";
import { EmailSettingsForm } from "@/components/admin/email-settings-form";

export const metadata: Metadata = { title: "Platform Settings" };

export default async function AdminSettingsPage() {
  const [settings, emailSettings] = await Promise.all([getSettings(), getEmailSettingsForAdmin()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Fees, WhatsApp number, email, and defaults — no redeploy needed.</p>
      </div>
      <SettingsForm settings={settings} />
      <EmailSettingsForm settings={emailSettings} />
    </div>
  );
}
