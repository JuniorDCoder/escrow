import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { ChatTriggerButton } from "@/components/layout/chat-trigger-button";

export function SiteFooter({
  appName,
  whatsappNumber,
  chatEnabled = false,
  isAuthenticated = false,
}: {
  appName: string;
  whatsappNumber: string | null;
  chatEnabled?: boolean;
  isAuthenticated?: boolean;
}) {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {appName}
            </div>
            <p className="text-sm text-muted-foreground">
              A trusted third party that holds funds until both sides confirm the deal is done.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Product</p>
            <FooterLink href="/how-it-works">How it works</FooterLink>
            <FooterLink href="/security">Security</FooterLink>
            <FooterLink href="/fees">Fees</FooterLink>
            <FooterLink href="/faq">FAQ</FooterLink>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Company</p>
            <FooterLink href="/contact">Contact</FooterLink>
            {isAuthenticated ? (
              <FooterLink href="/dashboard">Dashboard</FooterLink>
            ) : (
              <>
                <FooterLink href="/auth/login">Log in</FooterLink>
                <FooterLink href="/auth/signup">Sign up</FooterLink>
              </>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Legal</p>
            <FooterLink href="/legal/terms">Terms of Service</FooterLink>
            <FooterLink href="/legal/privacy">Privacy Policy</FooterLink>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {appName}. All rights reserved.
          </p>
          {chatEnabled ? (
            <ChatTriggerButton />
          ) : (
            whatsappNumber && <WhatsAppButton number={whatsappNumber} variant="inline" label="Chat with us" />
          )}
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block text-sm text-muted-foreground hover:text-foreground">
      {children}
    </Link>
  );
}
