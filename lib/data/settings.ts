import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  APP_NAME,
  DEFAULT_FEE_MINIMUM,
  DEFAULT_FEE_PERCENTAGE,
  DEFAULT_INSPECTION_DAYS,
  DEFAULT_SUPPORT_EMAIL,
  DEFAULT_WHATSAPP_NUMBER,
} from "@/lib/constants";
import type { Settings } from "@/lib/types/database";

const FALLBACK_SETTINGS: Settings = {
  id: 1,
  platform_name: APP_NAME,
  fee_percentage: DEFAULT_FEE_PERCENTAGE,
  fee_minimum: DEFAULT_FEE_MINIMUM,
  whatsapp_number: DEFAULT_WHATSAPP_NUMBER || null,
  support_email: DEFAULT_SUPPORT_EMAIL,
  default_inspection_days: DEFAULT_INSPECTION_DAYS,
};

/**
 * Reads the single-row platform settings table. Cached per-request via
 * React's `cache()` so every layout/page that needs the WhatsApp number or
 * fee config can call this freely without duplicating the query.
 * Falls back to env-var/constant defaults if the DB isn't reachable yet
 * (e.g. during initial setup before migrations have run).
 */
export const getSettings = cache(async (): Promise<Settings> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();
    if (error || !data) return FALLBACK_SETTINGS;
    return data;
  } catch {
    return FALLBACK_SETTINGS;
  }
});
