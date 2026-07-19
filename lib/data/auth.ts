import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Cheap "is someone logged in" check for public pages (marketing header/CTAs)
 * that need to swap Login/Sign up for a Dashboard link. Cached per-request via
 * React's `cache()` so the layout and the page it wraps don't each hit
 * Supabase separately. Fails open (treats as logged out) if Supabase isn't
 * reachable, matching the rest of lib/data/*.
 */
export const getIsAuthenticated = cache(async (): Promise<boolean> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
});
