import type { Metadata } from "next";
import { getSettings } from "@/lib/data/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Platform Settings" };

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Fees, WhatsApp number, and defaults — no redeploy needed.</p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
