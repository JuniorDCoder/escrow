import { APP_NAME } from "@/lib/constants";
import { getSettings } from "@/lib/data/settings";
import { getIsAuthenticated } from "@/lib/data/auth";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { AuthSidePanel } from "@/components/marketing/auth-side-panel";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [settings, isAuthenticated] = await Promise.all([getSettings(), getIsAuthenticated()]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader appName={APP_NAME} isAuthenticated={isAuthenticated} />
      <main className="grid flex-1 lg:grid-cols-2">
        <AuthSidePanel />
        <div className="bg-dot-grid flex items-center justify-center px-4 py-16 sm:px-6">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
      <SiteFooter
        appName={APP_NAME}
        whatsappNumber={settings.whatsapp_number}
        chatEnabled={settings.chat_enabled}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}
