import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { getSettings } from "@/lib/data/settings";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { ChatTriggerButton } from "@/components/layout/chat-trigger-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const settings = await getSettings();
  const showWhatsApp = !settings.chat_enabled && !!settings.whatsapp_number;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Get in touch</h1>
        <p className="mt-3 text-muted-foreground">
          Questions about a transaction, a dispute, or getting started — reach a real person.
        </p>
      </div>

      <div className={`grid gap-4 sm:grid-cols-2 ${showWhatsApp ? "lg:grid-cols-3" : ""}`}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">The fastest way to reach support, especially for urgent transaction issues.</p>
            {settings.chat_enabled ? (
              <ChatTriggerButton
                label="Start a chat"
                className="w-full justify-center rounded-md border border-input px-4 py-2 hover:bg-secondary hover:no-underline"
              />
            ) : (
              <p className="text-sm text-muted-foreground">Not configured yet — use email below.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">For anything that needs more detail or attachments.</p>
            <a
              href={`mailto:${settings.support_email}`}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              <Mail className="h-4 w-4" /> {settings.support_email}
            </a>
          </CardContent>
        </Card>
        {showWhatsApp && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">WhatsApp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Reach us on WhatsApp instead, if you prefer.</p>
              <WhatsAppButton
                number={settings.whatsapp_number}
                variant="inline"
                label="Start a WhatsApp chat"
                className="w-full justify-center"
              />
            </CardContent>
          </Card>
        )}
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Already have a transaction? Sign in and use the chat link on the transaction page — a real person will help.
      </p>
    </div>
  );
}
