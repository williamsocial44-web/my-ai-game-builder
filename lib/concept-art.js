// Free concept art via Pollinations.ai (no API key, effectively unlimited).
// We generate one or more reference images for the requested game and hand them
// to the multimodal game generator so its canvas/HTML code matches a real
// palette, mood, and composition. This is pure art DIRECTION — the model
// recreates the feel in code, it never loads the image at runtime (games stay
// self-contained).
//
// Multi-shot: a single overview image can MISLEAD for games defined by what you
// can't see (Among Us, stealth, horror, dungeons). For those we also generate a
// "what the player actually sees" shot — limited vision, the rest in shadow — so
// the model builds the real, vision-limited game instead of a fully-lit map.
//
// Best-effort throughout: a slow/down free service, a timeout, or any odd
// response yields fewer images (or none) and generation proceeds regardless.

// flux looks markedly better than turbo but is slower; the free tier reliably
// returns ~1 image, so we spend that budget on ONE high-quality flux primary
// (with a fast turbo fallback so we never end up with zero), then try a turbo
// secondary shot sequentially if the service and budget allow.
const FLUX_TIMEOUT_MS = 20000; // primary, quality model
const TURBO_TIMEOUT_MS = 9000; // fallback + secondary shots, fast model
const TOTAL_BUDGET_MS = 34000; // across all shots (fetched one after another)
const MIN_IMAGE_BYTES = 3000; // reject blank/error placeholder responses
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_SHOTS = 2; // overview + (for visibility genres) the player-view shot
const ALLOWED_MEDIA = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// Genres defined by limited visibility — they get the extra "player view" shot.
const VISIBILITY_GENRES = new Set([
  "social_deduction", "horror", "roguelike", "stealth", "3d_fps",
  "isometric", "metroidvania", "rpg", "top_down_rpg",
]);

// Genres where readable character design matters enough for a character shot.
const CHARACTER_GENRES = new Set([
  "social_deduction", "rpg", "top_down_rpg", "fighting", "visual_novel",
]);

const VISION_HINT_RE =
  /\b(among us|impostor|imposter|stealth|sneak|horror|scary|dark|fog|vision|line of sight|shadow|dungeon|maze|flashlight|night)\b/;

// Short palette/mood cue per visual theme so the art lands in the right world.
const THEME_HINT = {
  neon: "neon arcade palette, glowing electric colors on near-black",
  nature: "soft earthy organic palette, calm greens blues and warm light",
  space: "deep space palette, cosmic purples golds and a starfield",
  cozy: "warm cozy palette, soft oranges creams and gentle shadows",
  horror: "dark desaturated horror palette, blood red and bone white",
  retro: "retro arcade palette, classic primary colors, pixel feel",
  minimal: "minimal flat palette, one bold accent color on white",
  fantasy: "rich fantasy palette, gold royal purple and emerald",
};

function buildImagePrompt(prompt, visualTheme, framing) {
  const themeHint = THEME_HINT[visualTheme] || "vibrant polished game palette";
  return (
    `${framing} for a 2D video game: ${prompt}. ${themeHint}. ` +
    `Professional game art, clean crisp shapes, strong readable composition, ` +
    `appealing color grading, game screenshot style, highly detailed, cohesive. ` +
    `No text, no words, no letters, no UI, no HUD, no watermark, no logo.`
  );
}

// Decide which shots to generate for this game (1–3).
function buildShots(prompt, visualTheme, archetype) {
  const p = (prompt || "").toLowerCase();
  const shots = [
    {
      caption: "overall look — layout, palette, and environment design",
      framing: "wide establishing shot of the whole scene and its layout",
    },
  ];

  if (VISIBILITY_GENRES.has(archetype) || VISION_HINT_RE.test(p)) {
    shots.push({
      caption:
        "what the player ACTUALLY sees in play — limited vision, the rest in darkness/shadow",
      framing:
        "close player's-eye view with a small lit circle of vision around the character, " +
        "the rest of the area in darkness and soft shadow, walls blocking line of sight, " +
        "moody atmospheric lighting and a vignette",
    });
  }

  if (CHARACTER_GENRES.has(archetype)) {
    shots.push({
      caption: "character design — readable silhouettes and detail",
      framing:
        "character design sheet of the main characters, clear readable silhouettes, " +
        "front view, simple shapes with a highlight and shadow",
    });
  }

  return shots.slice(0, MAX_SHOTS);
}

// Fetch one image with the given model. Returns { media_type, data } or null.
// Never throws. An optional free POLLINATIONS_TOKEN raises the rate limit
// (register at auth.pollinations.ai) — without it the anonymous tier reliably
// returns ~1 image per build.
async function fetchPollinations(imgPrompt, model, timeoutMs) {
  const token = process.env.POLLINATIONS_TOKEN;
  const url =
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(imgPrompt) +
    `?width=768&height=512&nologo=true&model=${model}&seed=` +
    Math.floor(Math.random() * 1_000_000) +
    (token ? `&token=${encodeURIComponent(token)}` : "");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) return null;

    const media_type = (res.headers.get("content-type") || "image/jpeg")
      .split(";")[0]
      .trim();
    if (!ALLOWED_MEDIA.includes(media_type)) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    // Reject empty, oversized, or suspiciously tiny (blank/error) responses.
    if (buf.length < MIN_IMAGE_BYTES || buf.length > MAX_IMAGE_BYTES) return null;

    return { media_type, data: buf.toString("base64") };
  } catch {
    return null; // timeout / network / abort — degrade silently
  } finally {
    clearTimeout(timer);
  }
}

// Returns an array of { media_type, data, caption }. Empty array on failure.
// Fetched SEQUENTIALLY (one fully completes before the next starts): the free
// service throttles concurrent requests, so parallel shots time out. The first
// shot uses the high-quality flux model with a fast turbo fallback so we get a
// good image and never zero; later shots use fast turbo within the budget.
export async function generateConceptArt({ prompt, visualTheme, archetype }) {
  if (!prompt || typeof prompt !== "string") return [];

  const shots = buildShots(prompt, visualTheme, archetype);
  const out = [];
  const deadline = Date.now() + TOTAL_BUDGET_MS;

  for (let i = 0; i < shots.length; i++) {
    const remaining = deadline - Date.now();
    if (remaining < 5000) break; // not enough time left for another fetch
    const imgPrompt = buildImagePrompt(prompt, visualTheme, shots[i].framing);

    let img = null;
    if (i === 0) {
      // Primary: best quality, then fall back to fast turbo if flux is slow/down.
      img = await fetchPollinations(
        imgPrompt,
        "flux",
        Math.min(FLUX_TIMEOUT_MS, remaining)
      ).catch(() => null);
      if (!img) {
        const left = deadline - Date.now();
        if (left > 4000) {
          img = await fetchPollinations(
            imgPrompt,
            "turbo",
            Math.min(TURBO_TIMEOUT_MS, left)
          ).catch(() => null);
        }
      }
    } else {
      // Secondary shots: fast model so they fit the remaining budget.
      img = await fetchPollinations(
        imgPrompt,
        "turbo",
        Math.min(TURBO_TIMEOUT_MS, remaining)
      ).catch(() => null);
    }

    if (img) out.push({ ...img, caption: shots[i].caption });
  }

  return out;
}
