import Anthropic from "@anthropic-ai/sdk";

/**
 * Shared Claude configuration. Model ids are the current generation
 * (Opus 4.8 / Sonnet 4.6 / Haiku 4.5) and match the HTML generator in
 * app/api/generate/route.js so both engines speak to the same models.
 */
export const SMART_MODEL = "claude-opus-4-8"; // most capable — complex builds
export const FAST_MODEL = "claude-sonnet-4-6"; // fast + reliable structured output
export const PLAN_MODEL = "claude-haiku-4-5-20251001"; // cheap concept blurbs

/** Throws a clear, user-facing error when the key is missing. */
export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server."
    );
  }
  return new Anthropic({ apiKey });
}

/** Concatenate all text blocks from a non-streaming message response. */
export function textFromMessage(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/**
 * Pull the first balanced JSON object out of a model response, tolerating code
 * fences and incidental prose. Returns null if nothing parseable is found.
 */
export function extractJson<T = unknown>(raw: string): T | null {
  if (!raw) return null;
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```[a-zA-Z]*\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
  }
  // Fast path: already a clean object.
  try {
    return JSON.parse(text) as T;
  } catch {
    /* fall through to brace scanning */
  }
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(start, i + 1);
        try {
          return JSON.parse(candidate) as T;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}
