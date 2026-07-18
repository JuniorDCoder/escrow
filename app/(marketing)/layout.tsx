import { APP_NAME } from "@/lib/constants";
import { getSettings } from "@/lib/data/settings";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader appName={APP_NAME} />
      <main className="flex-1">{children}</main>
      <SiteFooter appName={APP_NAME} whatsappNumber={settings.whatsapp_number} />
    </div>
  );
}
