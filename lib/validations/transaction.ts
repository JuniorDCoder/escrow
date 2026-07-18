import { z } from "zod";
import { CURRENCIES, TRANSACTION_CATEGORIES } from "@/lib/constants";

const categoryValues = TRANSACTION_CATEGORIES.map((c) => c.value) as [string, ...string[]];

export const createTransactionSchema = z.object({
  title: z.string().trim().min(3, "Give this transaction a short title").max(150),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  category: z.enum(categoryValues),
  amount: z.coerce.number().positive("Amount must be greater than 0").max(100_000_000),
  currency: z.enum(CURRENCIES),
  feePayer: z.enum(["buyer", "seller", "split"]),
  role: z.enum(["buyer", "seller"], { message: "Choose whether you're the buyer or the seller" }),
  counterpartyEmail: z.string().trim().email("Enter the other party's email address"),
  inspectionPeriodDays: z.coerce.number().int().min(1).max(60),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const disputeSchema = z.object({
  transactionId: z.string().uuid(),
  reason: z.string().trim().min(20, "Explain what went wrong in at least 20 characters").max(4000),
});

export type DisputeInput = z.infer<typeof disputeSchema>;

export const messageSchema = z.object({
  transactionId: z.string().uuid(),
  body: z.string().trim().min(1, "Message can't be empty").max(4000),
});
