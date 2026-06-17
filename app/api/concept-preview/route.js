// TEMPORARY dev-only route: runs the real concept-art pipeline for a prompt and
// renders the resulting image(s) as a gallery — WITHOUT generating a game (so no
// Anthropic cost). Used to eyeball what Pollinations returns. Safe to delete.
import { detectVisualTheme } from "../../../lib/memory";
import { detectGameArchetype } from "../../../lib/game-knowledge";
import { generateConceptArt } from "../../../lib/concept-art";

export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get("prompt") || "make me an among us game";
  const visualTheme = detectVisualTheme(prompt);
  const archetype = detectGameArchetype(prompt);

  const t0 = Date.now();
  const images = await generateConceptArt({ prompt, visualTheme, archetype });
  const ms = Date.now() - t0;

  const cards = images
    .map(
      (img, i) => `
      <figure>
        <img src="data:${img.media_type};base64,${img.data}" alt="shot ${i + 1}" />
        <figcaption>${i + 1}. ${img.caption}</figcaption>
      </figure>`
    )
    .join("");

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Concept art preview</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0a0a0c; color: #eee; padding: 24px; margin: 0; }
    h1 { font-size: 18px; margin: 0 0 6px; }
    .meta { color: #8a8a93; font-size: 13px; margin-bottom: 18px; }
    .grid { display: flex; flex-wrap: wrap; gap: 18px; }
    figure { margin: 0; max-width: 520px; }
    img { width: 100%; border-radius: 12px; border: 1px solid #2a2a33; display: block; background:#111; }
    figcaption { font-size: 13px; color: #b8b8c0; margin-top: 8px; }
    .empty { color:#c77; }
  </style></head>
  <body>
    <h1>Concept art for: &ldquo;${prompt.replace(/</g, "&lt;")}&rdquo;</h1>
    <div class="meta">theme = ${visualTheme} &nbsp;·&nbsp; archetype = ${archetype} &nbsp;·&nbsp; ${images.length} image(s) &nbsp;·&nbsp; ${ms} ms</div>
    <div class="grid">${cards || '<p class="empty">No images returned (free service rate-limited or down right now).</p>'}</div>
  </body></html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
