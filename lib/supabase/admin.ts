import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Service-role Supabase client. Bypasses RLS entirely — never import this
 * from a Client Component and never return its results directly to the
 * client without an explicit permission check first.
 *
 * Server Actions use this for mutations that cross user boundaries (e.g. a
 * buyer's action that must write a notification row for the seller), and
 * for every Admin mutation, after the caller's own identity/role has been
 * verified with the request-scoped client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
