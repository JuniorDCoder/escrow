import type { Notification } from "@/lib/types/database";

export function getNotificationCopy(n: Notification): { text: string; href: string | null } {
  const p = n.payload as Record<string, unknown>;
  const ref = typeof p.referenceCode === "string" ? p.referenceCode : "";
  const title = typeof p.title === "string" ? p.title : "";
  const transactionId = typeof p.transactionId === "string" ? p.transactionId : null;
  const href = transactionId ? `/transactions/${transactionId}` : null;

  switch (n.type) {
    case "transaction_invite":
      return { text: `You were invited to "${title}" (${ref}).`, href };
    case "transaction_accepted":
      return { text: `The other party accepted "${title}" (${ref}).`, href };
    case "transaction_cancelled":
      return { text: `"${title}" (${ref}) was cancelled.`, href };
    case "payment_submitted":
      return { text: `New payment proof submitted for "${title}" (${ref}).`, href };
    case "payment_verified":
      return { text: `Payment verified for "${title}" (${ref}) — funds are secured.`, href };
    case "payment_rejected":
      return { text: `Your payment proof for "${title}" (${ref}) was rejected.`, href };
    case "delivery_marked":
      return { text: `"${title}" (${ref}) was marked delivered — inspect and accept.`, href };
    case "buyer_accepted":
      return { text: `Delivery accepted for "${title}" (${ref}).`, href };
    case "payout_ready":
      return { text: `"${title}" (${ref}) is ready for payout.`, href };
    case "dispute_opened":
      return { text: `A dispute was opened on "${title}" (${ref}).`, href };
    case "dispute_resolved":
      return { text: `The dispute on "${title}" (${ref}) was resolved.`, href };
    case "payout_released":
      return { text: `Payout released for "${title}" (${ref}). Transaction complete.`, href };
    case "new_message":
      return { text: `New message on "${title}" (${ref}).`, href };
    default:
      return { text: `Update on "${title}" (${ref}).`, href };
  }
}
