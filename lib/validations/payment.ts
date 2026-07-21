import { z } from "zod";
import { PAYMENT_METHOD_TYPES } from "@/lib/constants";

const paymentMethodTypeValues = PAYMENT_METHOD_TYPES.map((t) => t.value) as [string, ...string[]];

export const submitPaymentProofSchema = z.object({
  transactionId: z.string().uuid(),
  paymentMethodId: z.string().uuid({ message: "Choose the payment method you used" }),
  amountClaimed: z.coerce.number().positive("Enter the amount you sent"),
  currency: z.string().min(1),
  txHashOrReference: z.string().trim().max(200).optional().or(z.literal("")),
});

export type SubmitPaymentProofInput = z.infer<typeof submitPaymentProofSchema>;

export const reviewPaymentProofSchema = z.object({
  proofId: z.string().uuid(),
  decision: z.enum(["verify", "reject"]),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const submitDeliveryProofSchema = z.object({
  transactionId: z.string().uuid(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  trackingReference: z.string().trim().max(200).optional().or(z.literal("")),
});

export const payoutDetailsSchema = z.object({
  transactionId: z.string().uuid(),
  methodType: z.enum(paymentMethodTypeValues),
  accountDetails: z.string().trim().min(3, "Provide the account or wallet details to pay you out to").max(1000),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export type PayoutDetailsInput = z.infer<typeof payoutDetailsSchema>;

export const paymentMethodSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(paymentMethodTypeValues),
  label: z.string().trim().min(2).max(120),
  network: z.string().trim().max(120).optional().or(z.literal("")),
  accountDetails: z.string().trim().min(2, "Provide the account/wallet details"),
  instructions: z.string().trim().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});
