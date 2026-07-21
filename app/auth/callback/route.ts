import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/constants";

// Handles Supabase Auth email links (password recovery, email confirmation,
// magic link) that redirect back with a `code` to exchange for a session.
//
// Deliberately builds redirects from SITE_URL, not `new URL(request.url).origin`
// — behind some hosting setups the incoming request's own URL resolves to the
// server's internal bind address (e.g. 0.0.0.0:3000) rather than the public
// domain, which would silently send users back to an unreachable address
// after a correctly-configured Supabase Auth link already got them here.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const isRecovery = next.includes("reset-password");
      const redirectTo = isRecovery ? `${SITE_URL}${next}?type=recovery` : `${SITE_URL}${next}`;
      return NextResponse.redirect(redirectTo);
    }
  }

  return NextResponse.redirect(`${SITE_URL}/auth/login?error=auth_callback_failed`);
}
