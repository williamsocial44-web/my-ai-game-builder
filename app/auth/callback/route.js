import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";

/**
 * OAuth + magic-link callback. Supabase redirects here with a `code` that we
 * exchange for a session, then send the user on to `next` (default: home).
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";
  const error = searchParams.get("error_description") || searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error)}`);
  }

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!exchangeError) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      return NextResponse.redirect(
        `${origin}/?auth_error=${encodeURIComponent(exchangeError.message)}`
      );
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
