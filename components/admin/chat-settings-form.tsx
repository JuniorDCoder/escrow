"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateChatSettingsAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Settings } from "@/lib/types/database";

export function ChatSettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(settings.chat_enabled);
  const [embedCode, setEmbedCode] = useState(settings.chat_embed_code ?? "");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateChatSettingsAction({ chatEnabled: enabled, chatEmbedCode: embedCode });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live chat</CardTitle>
        <CardDescription>
          Paste the embed snippet from a free live-chat provider — Tawk.to, Crisp, Tidio, or similar. This replaces
          the floating WhatsApp button site-wide with the provider&apos;s own chat bubble, on every page.
        </CardDescription>
      </CardHeader>
      <CardContent className="max-w-lg space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Show the live chat widget
        </label>
        <div className="space-y-2">
          <Label htmlFor="chatEmbedCode">Embed code</Label>
          <Textarea
            id="chatEmbedCode"
            rows={8}
            value={embedCode}
            onChange={(e) => setEmbedCode(e.target.value)}
            placeholder={`Paste the whole <script>...</script> block your provider gives you — e.g. from Tawk.to's Admin → Chat Widget → the "Add script" page. It's fine to include the <script> tags, they're stripped automatically.`}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Free options: tawk.to, crisp.chat, tidio.com. Create an account, add this site, and copy the widget code
            it gives you here.
          </p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-success">Live chat settings saved.</p>}
        <Button onClick={submit} disabled={isPending}>
          {isPending ? "Saving…" : "Save live chat settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
