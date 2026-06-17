import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

/**
 * Premium provisioning engine. Verifies Stripe webhook signatures with the Web
 * Crypto API (no `stripe` SDK dependency) and flips profiles.premium_status.
 *
 * Gated: with no STRIPE_WEBHOOK_SECRET (or no Supabase service key to write past
 * RLS) it returns 503 rather than processing unsigned events.
 */

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Constant-time string comparison to avoid signature timing leaks.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string
): Promise<boolean> {
  const parts: Record<string, string> = {};
  for (const kv of header.split(",")) {
    const [k, v] = kv.split("=");
    if (k && v) parts[k.trim()] = v.trim();
  }
  const timestamp = parts.t;
  const expected = parts.v1;
  if (!timestamp || !expected) return false;

  // Reject events older than 5 minutes (replay protection).
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${timestamp}.${payload}`));
  return safeEqual(hex(sig), expected);
}

interface StripeEvent {
  type: string;
  data: { object: Record<string, unknown> };
}

export async function POST(req: Request) {
  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe webhooks aren't configured (set STRIPE_WEBHOOK_SECRET)." },
      { status: 503 }
    );
  }
  const service = createServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "Service role key required to provision premium (set SUPABASE_SERVICE_KEY)." },
      { status: 503 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();
  if (!signature || !(await verifyStripeSignature(rawBody, signature, STRIPE_WEBHOOK_SECRET))) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const obj = event.data.object;

  async function setPremiumByCustomer(customerId: string, premium: boolean) {
    await service!.from("profiles").update({ premium_status: premium }).eq("stripe_customer_id", customerId);
  }
  async function setPremiumByUserId(userId: string, customerId: string | null, premium: boolean) {
    const patch: Record<string, unknown> = { premium_status: premium };
    if (customerId) patch.stripe_customer_id = customerId;
    await service!.from("profiles").update(patch).eq("id", userId);
  }
  async function setPremiumByEmail(email: string, customerId: string | null, premium: boolean) {
    const patch: Record<string, unknown> = { premium_status: premium };
    if (customerId) patch.stripe_customer_id = customerId;
    await service!.from("profiles").update(patch).eq("email", email);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const userId = (obj.client_reference_id as string) || null;
      const customerId = (obj.customer as string) || null;
      const email =
        ((obj.customer_details as Record<string, unknown>)?.email as string) ||
        (obj.customer_email as string) ||
        null;
      if (userId) await setPremiumByUserId(userId, customerId, true);
      else if (email) await setPremiumByEmail(email, customerId, true);
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const customerId = (obj.customer as string) || null;
      const status = (obj.status as string) || "";
      const active = status === "active" || status === "trialing";
      if (customerId) await setPremiumByCustomer(customerId, active);
      break;
    }
    case "customer.subscription.deleted": {
      const customerId = (obj.customer as string) || null;
      if (customerId) await setPremiumByCustomer(customerId, false);
      break;
    }
    default:
      // Unhandled event types are acknowledged so Stripe stops retrying.
      break;
  }

  return NextResponse.json({ received: true });
}
