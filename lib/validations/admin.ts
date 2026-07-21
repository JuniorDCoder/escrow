import { z } from "zod";

export const platformSettingsSchema = z.object({
  platformName: z.string().trim().min(2).max(80),
  feePercentage: z.coerce.number().min(0).max(50),
  feeMinimum: z.coerce.number().min(0).max(100_000),
  whatsappNumber: z.string().trim().max(20).optional().or(z.literal("")),
  supportEmail: z.string().trim().email().optional().or(z.literal("")),
  defaultInspectionDays: z.coerce.number().int().min(1).max(60),
});

export const emailSettingsSchema = z.object({
  mailHost: z.string().trim().max(255).optional().or(z.literal("")),
  mailPort: z.coerce.number().int().min(1).max(65535).optional(),
  mailUsername: z.string().trim().max(255).optional().or(z.literal("")),
  // Blank = leave the stored password unchanged; use clearPassword to remove it.
  mailPassword: z.string().trim().max(255).optional().or(z.literal("")),
  clearPassword: z.boolean().optional(),
  mailEncryption: z.enum(["ssl", "tls", "none"]).optional(),
  mailFromAddress: z.string().trim().email("Enter a valid from address").optional().or(z.literal("")),
  mailFromName: z.string().trim().max(120).optional().or(z.literal("")),
});

export const chatSettingsSchema = z.object({
  chatEnabled: z.boolean(),
  chatEmbedCode: z.string().trim().max(5000).optional().or(z.literal("")),
});

export const resolveDisputeSchema = z.object({
  disputeId: z.string().uuid(),
  resolution: z.enum(["resolved_buyer", "resolved_seller", "resolved_split"]),
  note: z.string().trim().min(5, "Explain the resolution for the audit trail").max(4000),
});

export const forceTransitionSchema = z.object({
  transactionId: z.string().uuid(),
  status: z.string(),
  note: z.string().trim().min(5, "A note is required for any forced status change").max(2000),
});

export const updateUserSchema = z.object({
  userId: z.string().uuid(),
  isSuspended: z.boolean().optional(),
  kycStatus: z.enum(["none", "pending", "verified", "rejected"]).optional(),
  isAdmin: z.boolean().optional(),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
});
