"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps {
  number: string | null;
  className?: string;
  variant?: "floating" | "inline";
  message?: string;
  label?: string;
}

function buildHref(number: string, message: string) {
  const digits = number.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function WhatsAppButton({ number, className, variant = "floating", message, label }: WhatsAppButtonProps) {
  const pathname = usePathname();

  if (!number) return null;

  const referenceMatch = pathname?.match(/transactions\/([a-zA-Z0-9-]+)/);
  const defaultMessage =
    message ??
    (referenceMatch
      ? `Hi, I need help with a transaction (${referenceMatch[1]}).`
      : "Hi, I have a question about escrow transactions.");

  const href = buildHref(number, defaultMessage);

  if (variant === "inline") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-input bg-card px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors",
          className
        )}
      >
        <MessageCircle className="h-4 w-4 text-[#25D366]" />
        {label ?? "Chat with us on WhatsApp"}
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={cn(
        "fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D366]",
        className
      )}
    >
      <MessageCircle className="h-7 w-7" fill="currentColor" strokeWidth={0} />
    </a>
  );
}
