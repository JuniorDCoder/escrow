import type { Profile, Transaction } from "@/lib/types/database";

export type ViewerRole = "buyer" | "seller" | "admin" | "buyer_invitee" | "seller_invitee" | "observer";

export function getViewerRole(tx: Transaction, userId: string, profile: Profile): ViewerRole {
  if (profile.is_admin) return "admin";
  if (tx.buyer_id === userId) return "buyer";
  if (tx.seller_id === userId) return "seller";

  const email = profile.email.toLowerCase();
  if (tx.buyer_id === null && tx.buyer_email === email) return "buyer_invitee";
  if (tx.seller_id === null && tx.seller_email === email) return "seller_invitee";
  return "observer";
}

export function isBuyerSide(role: ViewerRole) {
  return role === "buyer" || role === "buyer_invitee";
}

export function isSellerSide(role: ViewerRole) {
  return role === "seller" || role === "seller_invitee";
}
