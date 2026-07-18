/**
 * Single source of truth for the platform name/branding.
 * Change NEXT_PUBLIC_APP_NAME in the environment to rebrand — never hardcode
 * the name elsewhere in the app. See AGENTS.md Section 10: no name/logo has
 * been chosen by the client yet, "Amana Escrow" is a placeholder default.
 */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Amana Escrow";

export const DEFAULT_INSPECTION_DAYS = 3;
export const DEFAULT_FEE_PERCENTAGE = 3.5;
export const DEFAULT_FEE_MINIMUM = 10;
export const DEFAULT_SUPPORT_EMAIL = "support@example.com";
export const DEFAULT_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

export const CURRENCIES = ["USD", "EUR", "GBP", "NGN", "KES", "ZAR"] as const;

export const TRANSACTION_CATEGORIES = [
  { value: "domain", label: "Domain Name" },
  { value: "vehicle", label: "Vehicle" },
  { value: "digital_goods", label: "Digital Goods" },
  { value: "services", label: "Services" },
  { value: "crypto_asset", label: "Crypto Asset" },
  { value: "general_merchandise", label: "General Merchandise" },
  { value: "other", label: "Other" },
] as const;

export const FEE_PAYER_OPTIONS = [
  { value: "buyer", label: "Buyer pays the fee" },
  { value: "seller", label: "Seller pays the fee" },
  { value: "split", label: "Split 50/50" },
] as const;
