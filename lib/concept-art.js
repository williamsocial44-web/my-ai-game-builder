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

const POLLINATIONS_TIMEOUT_MS = 10000; // per image
const TOTAL_BUDGET_MS = 16000; // across all shots (fetched sequentially)
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
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
    `video game concept art of: ${prompt}. ${framing}. ${themeHint}. ` +
    `Polished indie game art, clearly designed characters and environment, ` +
    `no text, no UI labels, no watermark.`
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

// Fetch one image. Returns { media_type, data } or null. Never throws.
async function fetchPollinations(imgPrompt, timeoutMs = POLLINATIONS_TIMEOUT_MS) {
  // turbo (SDXL-turbo) is far faster than flux. Quality is lower, but this is
  // only art DIRECTION — the model recreates the look in code.
  const url =
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(imgPrompt) +
    "?width=768&height=512&nologo=true&model=turbo&seed=" +
    Math.floor(Math.random() * 1_000_000);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;

    const media_type = (res.headers.get("content-type") || "image/jpeg")
      .split(";")[0]
      .trim();
    if (!ALLOWED_MEDIA.includes(media_type)) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length || buf.length > MAX_IMAGE_BYTES) return null;

    return { media_type, data: buf.toString("base64") };
  } catch {
    return null; // timeout / network / abort — degrade silently
  } finally {
    clearTimeout(timer);
  }
}

// Returns an array of { media_type, data, caption }. Empty array on failure.
// Fetched SEQUENTIALLY: the free service throttles concurrent requests per IP,
// so parallel shots time out. A total budget caps the added latency — we always
// try the primary overview, and add the player-view shot only if time remains.
export async function generateConceptArt({ prompt, visualTheme, archetype }) {
  if (!prompt || typeof prompt !== "string") return [];

  const shots = buildShots(prompt, visualTheme, archetype);
  const out = [];
  const deadline = Date.now() + TOTAL_BUDGET_MS;

  for (const shot of shots) {
    const remaining = deadline - Date.now();
    if (remaining < 4000) break; // not enough time left for another fetch
    const img = await fetchPollinations(
      buildImagePrompt(prompt, visualTheme, shot.framing),
      Math.min(POLLINATIONS_TIMEOUT_MS, remaining)
    ).catch(() => null);
    if (img) out.push({ ...img, caption: shot.caption });
  }

  return out;
}
