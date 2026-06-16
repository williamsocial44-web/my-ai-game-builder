// Free concept art via Pollinations.ai (no API key, effectively unlimited).
// We generate a single reference image for the requested game and hand it to
// the multimodal game generator so its canvas/HTML code matches a real palette,
// mood, and composition. This is pure art DIRECTION — the model recreates the
// feel in code, it never loads the image at runtime (games stay self-contained).
//
// Best-effort by design: a slow/down free service, a timeout, or any odd
// response returns null and generation proceeds with no image attached.

const POLLINATIONS_TIMEOUT_MS = 14000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MEDIA = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// Short palette/mood cue per visual theme so the concept art lands in the same
// world the game prompt will be themed to.
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

function buildImagePrompt(prompt, visualTheme) {
  const themeHint = THEME_HINT[visualTheme] || "vibrant polished game palette";
  return (
    `video game concept art of: ${prompt}. ` +
    `${themeHint}. Clean readable game screen, strong layout and composition, ` +
    `polished indie game art, characters and environment clearly designed, ` +
    `no text, no UI labels, no watermark.`
  );
}

// Returns { media_type, data } (base64) on success, or null. Never throws.
export async function generateConceptImage({ prompt, visualTheme }) {
  if (!prompt || typeof prompt !== "string") return null;

  const imgPrompt = buildImagePrompt(prompt, visualTheme);
  const url =
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(imgPrompt) +
    "?width=768&height=512&nologo=true&model=flux&seed=" +
    Math.floor(Math.random() * 1_000_000);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), POLLINATIONS_TIMEOUT_MS);
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
