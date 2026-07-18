import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles Supabase Auth email links (password recovery, email confirmation,
// magic link) that redirect back with a `code` to exchange for a session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const isRecovery = next.includes("reset-password");
      const redirectTo = isRecovery ? `${origin}${next}?type=recovery` : `${origin}${next}`;
      return NextResponse.redirect(redirectTo);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
