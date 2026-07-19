/**
 * Single source of truth for the platform name/branding.
 * Change NEXT_PUBLIC_APP_NAME in the environment to rebrand — never hardcode
 * the name elsewhere in the app. See AGENTS.md Section 10: no name/logo has
 * been chosen by the client yet, "Amana Escrow" is a placeholder default.
 */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Amana Escrow";

/**
 * Absolute origin used to build links in emails (invites, auth redirects).
 * Set NEXT_PUBLIC_SITE_URL in every deployed environment (Vercel project
 * settings, not just .env.local) — the localhost fallback below is for
 * local dev only and will silently produce broken links in emails if it's
 * ever hit in production.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

if (!process.env.NEXT_PUBLIC_SITE_URL && process.env.NODE_ENV === "production") {
  console.warn(
    "[config] NEXT_PUBLIC_SITE_URL is not set in production — emails and auth redirects will incorrectly point at localhost. Set it in your deployment's environment variables."
  );
}

export const DEFAULT_INSPECTION_DAYS = 3;
export const DEFAULT_FEE_PERCENTAGE = 3.5;
export const DEFAULT_FEE_MINIMUM = 10;
export const DEFAULT_SUPPORT_EMAIL = "support@example.com";
export const DEFAULT_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

// Keep in sync: CURRENCIES feeds the zod enum, CURRENCY_OPTIONS adds the
// flag/label for UI pickers.
export const CURRENCIES = ["USD", "EUR", "GBP", "NGN", "KES", "ZAR"] as const;

export const CURRENCY_OPTIONS: { code: (typeof CURRENCIES)[number]; label: string; flag: string }[] = [
  { code: "USD", label: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", label: "Euro", flag: "🇪🇺" },
  { code: "GBP", label: "British Pound", flag: "🇬🇧" },
  { code: "NGN", label: "Nigerian Naira", flag: "🇳🇬" },
  { code: "KES", label: "Kenyan Shilling", flag: "🇰🇪" },
  { code: "ZAR", label: "South African Rand", flag: "🇿🇦" },
];

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

/**
 * The landing page's "get started" role picker. "broker" isn't a supported
 * transaction role yet (AGENTS.md Section 3: Broker/Affiliate is v2), so it
 * routes to WhatsApp instead of the create-transaction flow — see
 * GetStartedForm.
 */
export const GET_STARTED_ROLES = [
  { value: "buyer", label: "I'm Buying" },
  { value: "seller", label: "I'm Selling" },
  { value: "broker", label: "I'm Brokering" },
] as const;
