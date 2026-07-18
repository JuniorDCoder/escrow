import type { TransactionStatus } from "@/lib/types/database";

/**
 * The transaction status graph from AGENTS.md Section 6. This is the only
 * place that says which status can move to which — every Server Action
 * that changes `transactions.status` must call `assertTransition()` before
 * writing, in addition to its own actor/role/business-rule checks. Nothing
 * else in the app should compare status strings to decide if a move is
 * legal.
 *
 * Note: the spec's `delivered` state is collapsed into `inspection_period`
 * — the seller's "mark delivered" action starts the inspection countdown
 * in the same step, so the app never leaves a transaction resting in a
 * separate `delivered` status. `delivered` is kept in the enum/graph for
 * schema fidelity and is a legal (if unused by the current UI) target.
 */
export const TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  draft: ["awaiting_acceptance", "cancelled"],
  awaiting_acceptance: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["payment_under_review", "cancelled"],
  payment_under_review: ["funded", "awaiting_payment"],
  funded: ["delivered", "inspection_period", "disputed"],
  delivered: ["inspection_period", "disputed"],
  inspection_period: ["accepted", "disputed"],
  accepted: ["release_pending"],
  disputed: ["resolved_buyer", "resolved_seller", "resolved_split"],
  resolved_buyer: ["refunded"],
  resolved_seller: ["release_pending"],
  resolved_split: ["release_pending", "refunded"],
  release_pending: ["released"],
  released: [],
  refunded: [],
  cancelled: [],
};

export class InvalidTransitionError extends Error {
  constructor(from: TransactionStatus, to: TransactionStatus) {
    super(`Cannot move a transaction from "${from}" to "${to}".`);
    this.name = "InvalidTransitionError";
  }
}

/** Admin force-moves are the one sanctioned bypass — see forceTransition in lib/actions/admin.ts. */
export function assertTransition(from: TransactionStatus, to: TransactionStatus) {
  if (!TRANSITIONS[from]?.includes(to)) {
    throw new InvalidTransitionError(from, to);
  }
}

export const STATUS_LABELS: Record<TransactionStatus, string> = {
  draft: "Draft",
  awaiting_acceptance: "Awaiting Acceptance",
  awaiting_payment: "Awaiting Payment",
  payment_under_review: "Payment Under Review",
  funded: "Funded",
  delivered: "Delivered",
  inspection_period: "Inspection Period",
  accepted: "Accepted",
  disputed: "Disputed",
  resolved_buyer: "Resolved — Buyer",
  resolved_seller: "Resolved — Seller",
  resolved_split: "Resolved — Split",
  release_pending: "Release Pending",
  released: "Released",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

/** "Whose turn is it, and what happens next" — shown on the transaction timeline. */
export const STATUS_DESCRIPTIONS: Record<TransactionStatus, string> = {
  draft: "This transaction hasn't been sent yet.",
  awaiting_acceptance: "Waiting for the other party to review and accept the terms.",
  awaiting_payment: "The Buyer needs to pay into escrow and upload proof of payment.",
  payment_under_review: "An Admin is verifying the Buyer's payment proof. This is usually quick.",
  funded: "Payment is secured in escrow. The Seller should now deliver the item or service.",
  delivered: "The Seller has marked the item as delivered.",
  inspection_period: "The Buyer can inspect the delivery and accept, or raise a dispute, before the window closes.",
  accepted: "The Buyer has accepted the delivery. Payout to the Seller is being queued.",
  disputed: "A dispute is open. An Admin is reviewing evidence from both sides.",
  resolved_buyer: "The dispute was resolved in the Buyer's favor. A refund is being processed.",
  resolved_seller: "The dispute was resolved in the Seller's favor. Payout is being processed.",
  resolved_split: "The dispute was resolved with a split outcome. An Admin is processing it manually.",
  release_pending: "An Admin is completing the payout to the Seller.",
  released: "Funds have been released to the Seller. This transaction is complete.",
  refunded: "Funds have been refunded to the Buyer. This transaction is complete.",
  cancelled: "This transaction was cancelled before any funds moved.",
};

export type StepperStage = "agreement" | "payment" | "delivery" | "acceptance" | "released";

const STAGE_BY_STATUS: Record<TransactionStatus, StepperStage> = {
  draft: "agreement",
  awaiting_acceptance: "agreement",
  awaiting_payment: "payment",
  payment_under_review: "payment",
  funded: "delivery",
  delivered: "delivery",
  inspection_period: "acceptance",
  accepted: "acceptance",
  disputed: "acceptance",
  resolved_buyer: "acceptance",
  resolved_seller: "acceptance",
  resolved_split: "acceptance",
  release_pending: "released",
  released: "released",
  refunded: "released",
  cancelled: "agreement",
};

export const STEPPER_STAGES: { key: StepperStage; label: string }[] = [
  { key: "agreement", label: "Agreement" },
  { key: "payment", label: "Payment" },
  { key: "delivery", label: "Delivery" },
  { key: "acceptance", label: "Acceptance" },
  { key: "released", label: "Payment Released" },
];

export function getStepperStage(status: TransactionStatus): StepperStage {
  return STAGE_BY_STATUS[status];
}

export function isTerminal(status: TransactionStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

export function isDisputeStatus(status: TransactionStatus): boolean {
  return status === "disputed" || status === "resolved_buyer" || status === "resolved_seller" || status === "resolved_split";
}

export function statusBadgeVariant(status: TransactionStatus): "default" | "secondary" | "outline" | "secured" | "success" | "warning" | "destructive" {
  switch (status) {
    case "funded":
      return "secured";
    case "released":
      return "success";
    case "accepted":
    case "release_pending":
      return "success";
    case "awaiting_payment":
    case "payment_under_review":
    case "delivered":
    case "inspection_period":
      return "warning";
    case "disputed":
    case "resolved_buyer":
    case "resolved_seller":
    case "resolved_split":
      return "destructive";
    case "cancelled":
    case "refunded":
      return "outline";
    default:
      return "secondary";
  }
}
