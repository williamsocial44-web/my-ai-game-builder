// Ollama Cloud (hosted) client — a cheap second engine for the parts of the
// pipeline that don't need Claude's full strength: the concept PLAN and small
// EDITS. Everything here is best-effort: if the key is missing, the model is
// unavailable, or the call errors/times out, callers fall back to Claude so the
// product never breaks.
//
// Uses Ollama Cloud's OpenAI-compatible endpoint. Set OLLAMA_API_KEY and
// OLLAMA_MODEL in .env.local.

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "https://ollama.com";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gpt-oss:120b";
const DEFAULT_TIMEOUT_MS = 45000;

export function isOllamaEnabled() {
  return !!process.env.OLLAMA_API_KEY;
}

export function ollamaModel() {
  return OLLAMA_MODEL;
}

// Non-streaming chat completion. Returns the assistant text, or throws on any
// failure (so the caller's try/catch can fall back to Claude).
export async function ollamaChat({ system, user, maxTokens = 1024, temperature = 0.7, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const key = process.env.OLLAMA_API_KEY;
  if (!key) throw new Error("OLLAMA_API_KEY not set");

  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: user });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${OLLAMA_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Ollama ${res.status}: ${detail.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("Ollama returned no content");
    }
    return content.trim();
  } finally {
    clearTimeout(timer);
  }
}

// Streaming chat completion. Yields text chunks as they arrive (OpenAI-style
// SSE). Throws on a failed request before streaming starts; mid-stream errors
// surface as a thrown error from the generator.
export async function* ollamaChatStream({ system, user, maxTokens = 8000, temperature = 0.7, timeoutMs = DEFAULT_TIMEOUT_MS, signal }) {
  const key = process.env.OLLAMA_API_KEY;
  if (!key) throw new Error("OLLAMA_API_KEY not set");

  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: user });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) signal.addEventListener("abort", () => controller.abort(), { once: true });

  try {
    const res = await fetch(`${OLLAMA_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) {
      const detail = res.ok ? "no body" : await res.text().catch(() => "");
      throw new Error(`Ollama ${res.status}: ${String(detail).slice(0, 200)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // OpenAI-style SSE: lines of "data: {json}" separated by blank lines.
      let nl;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const json = JSON.parse(payload);
          const delta = json?.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          /* ignore keep-alive / partial lines */
        }
      }
    }
  } finally {
    clearTimeout(timer);
  }
}
