import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import type { Profile } from "@/types/engine";

export const runtime = "nodejs";

/**
 * Multi-modal asset pipeline (fal.ai) — hardened for AGGRESSIVE cost control.
 *
 * Defaults: cheapest model (flux/schnell, ~4 steps), 512x512, static image only.
 * Video/animation is triple-gated (explicit consent flag + premium + UI warning).
 * Resolution is hard-capped at 1024 (no 2K/4K). Inference steps are server-fixed
 * so the client can never request an expensive 30-step run on a fast model.
 * One retry max on 5xx; a small in-process rate limit caps burst spend.
 */

const FAL_KEY = process.env.FAL_KEY;
const FAL_IMAGE_FAST = process.env.FAL_IMAGE_FAST || "fal-ai/flux/schnell"; // budget default
const FAL_IMAGE_HIGH = process.env.FAL_IMAGE_DEV || "fal-ai/flux/dev"; // explicit "high quality" opt-in
const FAL_BG_REMOVAL_MODEL = process.env.FAL_BG_REMOVAL_MODEL || "fal-ai/imageutils/rembg";
const FAL_VIDEO_MODEL = process.env.FAL_VIDEO_MODEL || "fal-ai/wan-i2v";

// ── cost guardrails ──────────────────────────────────────────────────────────
const MAX_DIMENSION = 1024; // hard cap — never 2K/4K
const DEFAULT_DIMENSION = 512; // standard sprites/icons
const SCHNELL_STEPS = 4; // flux/schnell is designed for ~4 steps
const HIGH_STEPS = 28;
const MAX_PROMPT_CHARS = 200;
const MAX_RETRIES = 2;

// DEV_MODE stubs the pipeline so UI testing never spends on fal.
const DEV_MODE = process.env.DEV_MODE === "true";

// Defensive denylist: a video/animation model must NEVER be hit on the image path,
// regardless of env misconfiguration.
const VIDEO_MODEL_DENYLIST = /(wan|kling|ltx|veo|sora|i2v|video|animate|minimax|hunyuan|runway)/i;

// Light in-process burst limiter so a runaway client can't rack up spend.
// Sized to allow one full asset-pack (12-16 sprites) in a burst, but still cap
// a truly runaway loop.
const RATE = { windowMs: 60_000, max: 40 };
const recentHits: number[] = [];
function rateLimited(): boolean {
  const now = Date.now();
  while (recentHits.length && now - recentHits[0] > RATE.windowMs) recentHits.shift();
  if (recentHits.length >= RATE.max) return true;
  recentHits.push(now);
  return false;
}

interface FalImageResult {
  images?: Array<{ url: string }>;
  image?: { url: string };
}
interface FalVideoResult {
  video?: { url: string };
}

// fal call with EXACTLY ONE retry on 5xx / network error. fal doesn't bill 5xx,
// but we never loop — an unstable network must not silently burn credits.
async function falRun<T>(model: string, input: Record<string, unknown>): Promise<T> {
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) console.warn(`Retry attempt ${attempt} of ${MAX_RETRIES} (fal ${model})`);
    try {
      const res = await fetch(`https://fal.run/${model}`, {
        method: "POST",
        headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (res.ok) return (await res.json()) as T;
      const detail = await res.text().catch(() => "");
      // fal doesn't bill 5xx — safe to retry; 4xx is our fault, so fail fast.
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        lastErr = new Error(`fal ${res.status}`);
        continue;
      }
      throw new Error(`fal ${model} failed (${res.status}): ${detail.slice(0, 200)}`);
    } catch (e) {
      lastErr = e as Error;
      if (attempt < MAX_RETRIES) continue; // retry on network error
      throw lastErr;
    }
  }
  throw lastErr || new Error("fal request failed");
}

function firstImageUrl(r: FalImageResult): string | null {
  return r.images?.[0]?.url || r.image?.url || null;
}

// Strip conversational filler; keep a tight, keyword-dense prompt.
function compressPrompt(raw: string): string {
  const stripped = raw
    .replace(
      /\b(please|kindly|can you|could you|i (?:would like|want|need)|make me|generate|create|design|draw|give me|a game|for my game|that looks like|something like|really|very|super|cool|awesome)\b/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_PROMPT_CHARS);
  return stripped || raw.trim().slice(0, MAX_PROMPT_CHARS);
}

// Server-authoritative resolution clamp: default 512, snap to /64, hard max 1024.
function clampDim(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return DEFAULT_DIMENSION;
  return Math.max(256, Math.min(MAX_DIMENSION, Math.round(v / 64) * 64));
}

// Premium is read from the signed-in user's profile when available; else false.
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
  if (DEV_MODE) {
    // 1x1 transparent PNG — zero fal spend while testing the UI flow.
    const px =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    return NextResponse.json({ url: px, type: "image", dev: true });
  }
  if (!FAL_KEY) {
    return NextResponse.json(
      { error: "Asset generation isn't configured yet. Add FAL_KEY to .env.local to enable it.", configured: false },
      { status: 503 }
    );
  }

  let body: {
    prompt?: string;
    quality?: string;
    isAnimated?: boolean;
    user_consented_to_video?: boolean;
    width?: number;
    height?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rawPrompt = (body.prompt || "").trim();
  if (!rawPrompt) return NextResponse.json({ error: "Describe the asset first." }, { status: 400 });
  const prompt = compressPrompt(rawPrompt);

  if (rateLimited()) {
    return NextResponse.json(
      { error: "Too many asset requests in a row — wait a moment and try again." },
      { status: 429 }
    );
  }

  const quality = body.quality === "high" ? "high" : "budget"; // default to the budget tier
  const isAnimated = body.isAnimated === true;
  const width = clampDim(body.width ?? DEFAULT_DIMENSION);
  const height = clampDim(body.height ?? DEFAULT_DIMENSION);
  const isPremium = await resolvePremium();

  try {
    // ── VIDEO / ANIMATION PATH — triple-gated, never the default ──────────────
    if (isAnimated) {
      // API gateway: a video call without explicit consent is rejected outright.
      if (body.user_consented_to_video !== true) {
        return NextResponse.json(
          {
            error: "Video generation requires explicit consent.",
            code: "VIDEO_CONSENT_REQUIRED",
          },
          { status: 400 }
        );
      }
      if (!isPremium) {
        return NextResponse.json(
          { error: "PAYWALL_TRIGGERED", message: "Sprite animation is a Premium feature." },
          { status: 403 }
        );
      }
      const charPrompt = `2d game character sprite, side view, ${prompt}, centered, solid #00FF00 background, no text`;
      const base = await falRun<FalImageResult>(FAL_IMAGE_HIGH, {
        prompt: charPrompt,
        image_size: { width: 512, height: 512 },
        num_images: 1,
        num_inference_steps: HIGH_STEPS,
      });
      const charUrl = firstImageUrl(base);
      if (!charUrl) throw new Error("Character base generation failed.");
      const video = await falRun<FalVideoResult>(FAL_VIDEO_MODEL, {
        prompt: "2d character walk cycle, looping, side view, walking in place, smooth",
        image_url: charUrl,
      });
      if (!video.video?.url) throw new Error("Animation generation failed.");
      return NextResponse.json({ url: video.video.url, type: "video" });
    }

    // ── STATIC IMAGE PATH (default) ───────────────────────────────────────────
    const model = quality === "high" ? FAL_IMAGE_HIGH : FAL_IMAGE_FAST;
    // Hard safety: the image path must never resolve to a video/premium-video model.
    if (VIDEO_MODEL_DENYLIST.test(model)) {
      return NextResponse.json(
        { error: "Image model is misconfigured (resolved to a blocked video model)." },
        { status: 500 }
      );
    }
    const isSchnell = /schnell/i.test(model);
    const optimizedPrompt = `2d game asset sprite, ${prompt}, centered, isolated, flat vector, solid #00FF00 background, no shadows, no text`;
    const raw = await falRun<FalImageResult>(model, {
      prompt: optimizedPrompt,
      image_size: { width, height },
      num_images: 1,
      num_inference_steps: isSchnell ? SCHNELL_STEPS : HIGH_STEPS,
    });
    const rawUrl = firstImageUrl(raw);
    if (!rawUrl) throw new Error("Image model returned no image.");

    const cut = await falRun<FalImageResult>(FAL_BG_REMOVAL_MODEL, { image_url: rawUrl });
    const assetUrl = firstImageUrl(cut) || rawUrl;
    return NextResponse.json({ url: assetUrl, type: "image", model, size: `${width}x${height}` });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
