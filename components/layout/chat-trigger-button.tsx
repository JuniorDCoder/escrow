"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Best-effort open for whatever chat widget is currently injected by
 * ChatWidget. Tawk.to and Crisp (the two dominant free options, and what
 * Admin is pointed at in /admin/settings) both expose a global JS API for
 * this; other providers just no-op here since their own floating bubble is
 * already visible regardless.
 */
function openLiveChat() {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    Tawk_API?: { maximize?: () => void; toggle?: () => void };
    $crisp?: unknown[];
  };
  if (w.Tawk_API?.maximize) {
    w.Tawk_API.maximize();
    return;
  }
  if (w.Tawk_API?.toggle) {
    w.Tawk_API.toggle();
    return;
  }
  if (w.$crisp) {
    w.$crisp.push(["do", "chat:open"]);
  }
}

export function ChatTriggerButton({
  label = "Chat with us",
  className,
  iconClassName,
}: {
  label?: string;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={openLiveChat}
      className={cn("inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline", className)}
    >
      <MessageCircle className={cn("h-4 w-4", iconClassName)} />
      {label}
    </button>
  );
}
