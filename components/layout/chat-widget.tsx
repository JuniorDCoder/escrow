"use client";

import Script from "next/script";

/**
 * Injects whatever live-chat embed script Admin pasted in
 * /admin/settings (Tawk.to, Crisp, Tidio — anything that hands you a
 * script snippet works). Renders its own floating bubble, so this
 * replaces the old floating WhatsApp button site-wide.
 */
export function ChatWidget({ embedCode }: { embedCode: string | null }) {
  if (!embedCode) return null;
  return <Script id="chat-widget" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: embedCode }} />;
}
