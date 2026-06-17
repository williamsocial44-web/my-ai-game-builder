import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import type { Profile } from "@/types/engine";

export const runtime = "nodejs";

/**
 * Multi-modal asset pipeline (fal.ai). Generates transparent sprite PNGs and —
 * for premium users — character walk-cycle videos.
 *
 * Fully implemented but GATED: with no FAL_KEY it returns a clear "not
 * configured" response instead of crashing. Static sprites work with just
 * FAL_KEY (no sign-in needed); animation is premium-only and the premium flag
 * is derived server-side from the user's profile when available.
 *
 * Corrected vs. the original spec: uses the SYNCHRONOUS `fal.run` endpoint (not
 * `queue.fal.run`, which is async and never returns images[] inline) and a valid
 * image_size object. Model slugs are env-overridable.
 */

const FAL_KEY = process.env.FAL_KEY;
const FAL_IMAGE_DEV = process.env.FAL_IMAGE_DEV || "fal-ai/flux/dev";
const FAL_IMAGE_FAST = process.env.FAL_IMAGE_FAST || "fal-ai/flux/schnell";
const FAL_BG_REMOVAL_MODEL = process.env.FAL_BG_REMOVAL_MODEL || "fal-ai/imageutils/rembg";
const FAL_VIDEO_MODEL = process.env.FAL_VIDEO_MODEL || "fal-ai/wan-i2v";

interface FalImageResult {
  images?: Array<{ url: string }>;
  image?: { url: string };
}
interface FalVideoResult {
  video?: { url: string };
}

async function falRun<T>(model: string, input: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`fal ${model} failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

function firstImageUrl(r: FalImageResult): string | null {
  return r.images?.[0]?.url || r.image?.url || null;
}

// Premium is read from the signed-in user's profile when Supabase + the profiles
// table are available; otherwise false (so animation stays gated until wired).
async function resolvePremium(): Promise<boolean> {
  try {
    const sb = await createServerSupabase();
    if (!sb) return false;
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) return false;
    const { data } = await sb.from("profiles").select("premium_status").eq("id", auth.user.id).single();
    return !!(data as Pick<Profile, "premium_status"> | null)?.premium_status;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!FAL_KEY) {
    return NextResponse.json(
      {
        error: "Asset generation isn't configured yet. Add FAL_KEY to .env.local to enable it.",
        configured: false,
      },
      { status: 503 }
    );
  }

  let body: { prompt?: string; isAnimated?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const prompt = (body.prompt || "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Describe the asset first." }, { status: 400 });
  }

  const isPremium = await resolvePremium();

  try {
    // Animation is premium-only.
    if (body.isAnimated) {
      if (!isPremium) {
        return NextResponse.json(
          { error: "PAYWALL_TRIGGERED", message: "Sprite animation is a Premium feature." },
          { status: 403 }
        );
      }
      const characterPrompt = `Full-body side-profile view of 2D game character: ${prompt}. Clean game sprite, centered, on a solid pure neon green #00FF00 background. No text.`;
      const base = await falRun<FalImageResult>(FAL_IMAGE_DEV, {
        prompt: characterPrompt,
        image_size: { width: 512, height: 512 },
        num_images: 1,
      });
      const characterImageUrl = firstImageUrl(base);
      if (!characterImageUrl) throw new Error("Character base image generation failed.");

      const video = await falRun<FalVideoResult>(FAL_VIDEO_MODEL, {
        prompt:
          "Side-scrolling 2D character walk cycle, looping, walking in place horizontally, flat side view, consistent character, smooth motion.",
        image_url: characterImageUrl,
      });
      if (!video.video?.url) throw new Error("Animation video generation failed.");
      return NextResponse.json({ url: video.video.url, type: "video" });
    }

    // Static sprite: premium gets the higher-quality model, free gets the fast one.
    const imageModel = isPremium ? FAL_IMAGE_DEV : FAL_IMAGE_FAST;
    const optimizedPrompt = `A flat 2D vector game asset sprite of ${prompt}, isolated game icon, crisp clean vector style, centered, on a pure solid neon green #00FF00 background. No shadows, no gradients, no text.`;
    const raw = await falRun<FalImageResult>(imageModel, {
      prompt: optimizedPrompt,
      image_size: { width: 512, height: 512 },
      num_images: 1,
    });
    const rawUrl = firstImageUrl(raw);
    if (!rawUrl) throw new Error("Image model returned no image.");

    const cut = await falRun<FalImageResult>(FAL_BG_REMOVAL_MODEL, { image_url: rawUrl });
    const assetUrl = firstImageUrl(cut) || rawUrl;
    return NextResponse.json({ url: assetUrl, type: "image" });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
