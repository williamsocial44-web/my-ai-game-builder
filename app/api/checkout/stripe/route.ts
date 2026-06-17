import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Starts a Stripe Checkout subscription via the REST API (no SDK dependency)
 * and 303-redirects the browser to the hosted checkout page. The chat-pane
 * upgrade button links straight here with a GET.
 *
 * Gated: with no STRIPE_SECRET_KEY / STRIPE_PRICE_ID it bounces back to the
 * dashboard with a flag instead of erroring.
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;

  if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) {
    return NextResponse.redirect(`${origin}/?billing=unconfigured`, { status: 303 });
  }

  // Tie the session to the signed-in user so the webhook can provision them.
  let userId: string | null = null;
  let email: string | null = null;
  const sb = await createServerSupabase();
  if (sb) {
    const { data: auth } = await sb.auth.getUser();
    if (auth.user) {
      userId = auth.user.id;
      email = auth.user.email ?? null;
    }
  }
  if (!userId) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent("Sign in to upgrade.")}`, {
      status: 303,
    });
  }

  const form = new URLSearchParams();
  form.set("mode", "subscription");
  form.set("line_items[0][price]", STRIPE_PRICE_ID);
  form.set("line_items[0][quantity]", "1");
  form.set("client_reference_id", userId);
  if (email) form.set("customer_email", email);
  form.set("success_url", `${origin}/?billing=success`);
  form.set("cancel_url", `${origin}/?billing=cancelled`);
  form.set("allow_promotion_codes", "true");

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!res.ok) {
    return NextResponse.redirect(`${origin}/?billing=error`, { status: 303 });
  }
  const session = (await res.json()) as { url?: string };
  if (!session.url) {
    return NextResponse.redirect(`${origin}/?billing=error`, { status: 303 });
  }
  return NextResponse.redirect(session.url, { status: 303 });
}
