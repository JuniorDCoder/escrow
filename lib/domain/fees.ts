import type { FeePayer } from "@/lib/types/database";

export interface FeeInputs {
  amount: number;
  feePercentage: number;
  feeMinimum: number;
  feePayer: FeePayer;
}

export interface FeeBreakdown {
  amount: number;
  feeAmount: number;
  buyerFeeShare: number;
  sellerFeeShare: number;
  /** What the Buyer must pay into escrow, including whatever fee share falls on them. */
  totalPayable: number;
  /** What the Seller receives at payout, net of whatever fee share falls on them. */
  sellerReceives: number;
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * The public fee calculator (and the one used at transaction-creation time)
 * — a simple percentage fee with a floor, split according to who's paying
 * it. See AGENTS.md Section 8/13: flat % for v1, configurable in
 * /admin/settings, tiering is a future enhancement.
 */
export function calculateFee({ amount, feePercentage, feeMinimum, feePayer }: FeeInputs): FeeBreakdown {
  const safeAmount = Math.max(0, amount || 0);
  const rawFee = (safeAmount * feePercentage) / 100;
  const feeAmount = round2(Math.max(rawFee, safeAmount > 0 ? feeMinimum : 0));

  let buyerFeeShare = 0;
  let sellerFeeShare = 0;
  if (feePayer === "buyer") {
    buyerFeeShare = feeAmount;
  } else if (feePayer === "seller") {
    sellerFeeShare = feeAmount;
  } else {
    buyerFeeShare = round2(feeAmount / 2);
    sellerFeeShare = round2(feeAmount - buyerFeeShare);
  }

  return {
    amount: safeAmount,
    feeAmount,
    buyerFeeShare,
    sellerFeeShare,
    totalPayable: round2(safeAmount + buyerFeeShare),
    sellerReceives: round2(safeAmount - sellerFeeShare),
  };
}
