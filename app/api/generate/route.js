import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import path from "path";
import {
  detectGenre,
  detectVisualTheme,
  buildLessonsContext,
  saveGeneration,
  extractAndSaveLesson,
} from "../../../lib/memory";
import {
  buildGameBlueprint,
  CORE_GAME_KNOWLEDGE,
  assessComplexity,
} from "../../../lib/game-knowledge";
import { POPULARITY_DNA } from "../../../lib/popularity-dna";

export const runtime = "nodejs";

// Generation auto-routes by how hard the request is (see pickGenerationConfig):
// simple classics → the fast model with no thinking; ambitious/multi-system
// games → the most capable model with adaptive thinking. Thinking tokens share
// the output budget, so max_tokens is generous (streamed, so no HTTP timeout).
// Set GENERATE_MODEL / GENERATE_EFFORT to force one config and skip routing.
const MAX_GENERATE_TOKENS = 64000;
const MAX_PLAN_TOKENS = 140;
const MAX_PROMPT_LENGTH = 300;
const MAX_EDIT_INSTRUCTION_LENGTH = 300;
const MAX_EDIT_HTML_LENGTH = 60000;
const MAX_REQUESTS_PER_HOUR = 30;

const SMART_MODEL = "claude-opus-4-8"; // most capable — complex builds
const FAST_MODEL = "claude-sonnet-4-6"; // fast + cheap — simple builds
const FORCED_MODEL = process.env.GENERATE_MODEL || null; // set to pin one model
const FORCED_EFFORT = process.env.GENERATE_EFFORT || null; // low|medium|high|xhigh|max
const PLAN_MODEL = process.env.PLAN_MODEL || "claude-haiku-4-5-20251001";
const MOCK_MODE = false;

// Map a complexity score to a model + effort + whether to think first.
// Cost-tuned: the pricey Opus path is reserved for the genuinely hardest
// builds (3D worlds, deep multi-system games — score >= 4). The broad middle
// (most real games, including social deduction, RPG-lite, tower defense) runs
// great — and roughly half the cost — on Sonnet WITH thinking. Quality comes
// from the prompt, not from paying for Opus on every build.
function configForScore(score) {
  if (FORCED_MODEL) {
    return { model: FORCED_MODEL, effort: FORCED_EFFORT || "high", think: true, tier: "forced" };
  }
  if (score >= 4) return { model: SMART_MODEL, effort: "high", think: true, tier: "very-complex" };
  if (score >= 2) return { model: FAST_MODEL, effort: "high", think: true, tier: "complex" };
  return { model: FAST_MODEL, effort: "medium", think: false, tier: "simple" };
}

// An explicit quality choice from the client ("fast" / "smart") overrides the
// auto-router; "auto" (or anything else) routes by complexity.
function configForQuality(quality) {
  if (FORCED_MODEL) {
    return { model: FORCED_MODEL, effort: FORCED_EFFORT || "high", think: true, tier: "forced" };
  }
  if (quality === "fast") {
    return { model: FAST_MODEL, effort: "medium", think: false, tier: "fast" };
  }
  if (quality === "smart") {
    return { model: SMART_MODEL, effort: "high", think: true, tier: "smart" };
  }
  return null; // auto — caller falls through to score-based routing
}

// New build: explicit choice wins, else route on the prompt's complexity.
function pickGenerationConfig(prompt, quality) {
  return configForQuality(quality) || configForScore(assessComplexity(prompt).score);
}

// Edit: explicit choice wins, else route on the change request — but a big
// existing file is itself hard to rewrite correctly, so bump those up.
function pickEditConfig(instruction, htmlLength, quality) {
  const forced = configForQuality(quality);
  if (forced) return forced;
  const { score } = assessComplexity(instruction);
  const bumped = htmlLength > 9000 ? Math.max(score, 2) : score;
  return configForScore(bumped);
}

const rateLimitMap = new Map();

const VISUAL_THEME_DESCRIPTIONS = {
  neon: "neon: Black background #0a0a0a, electric colors — hot pink #ff006e, electric blue #3a86ff, lime green #06d6a0, yellow #ffbe0b. Heavy use of CSS box-shadow glow effects. Everything glows. Title text has neon glow. Game elements pulse or flicker subtly.",
  nature:
    "nature: Soft earthy background — deep forest green #1a3a2a or ocean deep blue #0d2137. Game elements in warm greens, sandy yellows, sky blues, flower pinks. Feels organic and calm. Soft gradients. Round shapes. Gentle animations.",
  space:
    "space: Deep space background — very dark navy #020818 with tiny white dot stars drawn on canvas. Game elements in bright cosmic colors — nebula purple #7209b7, star gold #ffd60a, comet white, planet blues and reds. Everything feels weightless.",
  cozy:
    "cozy: Warm cream or soft amber background #2d1b00 or #1a1208. Game elements in warm oranges, soft yellows, gentle reds, cream whites. Feels like a warm living room. Rounded corners everywhere. Soft shadows. Cheerful and inviting.",
  horror:
    "horror: Very dark desaturated background #0d0d0d. Game elements in blood red #8b0000, sickly green #2d5016, bone white #e8e8d0, shadow gray. Flickering effects. Text feels ominous. Everything is slightly unsettling.",
  retro:
    "retro: Dark background #1a1a2e with scanline effect using CSS repeating-linear-gradient. Game elements in classic arcade colors — red, yellow, cyan, white, on dark backgrounds. Pixelated feel using font-family monospace everywhere. Score display looks like old arcade cabinet.",
  minimal:
    "minimal: Pure white #ffffff or very light gray #f5f5f5 background. Game elements in one single accent color — pick one bold color and use it for everything interactive. Black for text and borders. No gradients. No effects. Brutally clean.",
  fantasy:
    "fantasy: Rich deep background — dark purple #1a0a2e or dark green #0a1a0a. Game elements in gold #ffd700, royal purple #7b2d8b, emerald #00a86b, crimson #dc143c. Ornate feel. Title text looks like it belongs on a fantasy game.",
};

// FORGE Game Studio — adapted from the Console agent (agent_01UB3sTsea4JME7gxJnR7pjf,
// claude-sonnet-4-6). That agent has no tools/MCP/skills, so its value is its prompt;
// we run it inline in this one-shot pipeline rather than as a managed-agent session.
// SIMPLE MODE is locked on; the GameCraft rules below stay authoritative on conflict.
const FORGE_PREAMBLE = `You are FORGE, a multi-mode AI game development engine — and you are the studio powering GameCraft. In this pipeline you ALWAYS operate in SIMPLE MODE: the user describes a game and you output ONE complete, self-contained, immediately-playable HTML file — nothing before it and nothing after it.

FORGE quality bar for every build:
- Title screen with a short hook/story and one clear Start button
- Polished visuals: particle effects and screen shake on impactful moments
- Procedural Web Audio API sound effects (create AudioContext on the first user interaction; never autoplay)
- Visible HUD, a clear win state, and a game-over screen with restart
- Smooth 60fps: object pooling, delta time (cap dt at 0.05), requestAnimationFrame

Never enter DIRECTOR mode (no questions, no phased planning) and never return partial code or commentary here — always ship the full playable file. The GameCraft rules that follow are absolute and override anything above if they ever conflict, especially the sandbox limits and the exact Start-button pattern.

---

`;

const GENERATE_SYSTEM_PROMPT = `You are the game generation engine powering GameCraft, an AI-powered browser game creator. Real people with no coding skills will play your output within seconds of typing their idea. Your output is the entire product — no human reviews it before it goes live. Make every person feel like a real game developer.

WHO IS USING THIS:
Non-technical creators, students, hobbyists, and people who have always wanted to make games but never could. They judge the game in the first 10 seconds. If it looks broken or plain they feel disappointed. If it looks amazing and plays well they feel genuinely amazed. Your job is to amaze them every single time.

VISUAL IDENTITY — CRITICAL — READ THIS CAREFULLY:
Every single game must have a completely unique visual identity. No two games should ever look alike. No default dark background. No template feel. The visual theme for this game is: [VISUAL_THEME_PLACEHOLDER]

Here is exactly what each theme means:

neon: Black background #0a0a0a, electric colors — hot pink #ff006e, electric blue #3a86ff, lime green #06d6a0, yellow #ffbe0b. Heavy use of CSS box-shadow glow effects. Everything glows. Title text has neon glow. Game elements pulse or flicker subtly.

nature: Soft earthy background — deep forest green #1a3a2a or ocean deep blue #0d2137. Game elements in warm greens, sandy yellows, sky blues, flower pinks. Feels organic and calm. Soft gradients. Round shapes. Gentle animations.

space: Deep space background — very dark navy #020818 with tiny white dot stars drawn on canvas. Game elements in bright cosmic colors — nebula purple #7209b7, star gold #ffd60a, comet white, planet blues and reds. Everything feels weightless.

cozy: Warm cream or soft amber background #2d1b00 or #1a1208. Game elements in warm oranges, soft yellows, gentle reds, cream whites. Feels like a warm living room. Rounded corners everywhere. Soft shadows. Cheerful and inviting.

horror: Very dark desaturated background #0d0d0d. Game elements in blood red #8b0000, sickly green #2d5016, bone white #e8e8d0, shadow gray. Flickering effects. Text feels ominous. Everything is slightly unsettling.

retro: Dark background #1a1a2e with scanline effect using CSS repeating-linear-gradient. Game elements in classic arcade colors — red, yellow, cyan, white, on dark backgrounds. Pixelated feel using font-family monospace everywhere. Score display looks like old arcade cabinet.

minimal: Pure white #ffffff or very light gray #f5f5f5 background. Game elements in one single accent color — pick one bold color and use it for everything interactive. Black for text and borders. No gradients. No effects. Brutally clean.

fantasy: Rich deep background — dark purple #1a0a2e or dark green #0a1a0a. Game elements in gold #ffd700, royal purple #7b2d8b, emerald #00a86b, crimson #dc143c. Ornate feel. Title text looks like it belongs on a fantasy game.

OUTPUT RULES — never break these:
Output raw HTML only. No markdown. No code fences. No explanation. No preamble. First character must be < and last must be >. All CSS in style tag in head. All JS in script tag at end of body. Zero external dependencies. No CDN. No imports. No fetch calls. No external images or fonts.

TECHNICAL REQUIREMENTS:
Works in sandboxed iframe with allow-scripts only. No localStorage, sessionStorage, cookies, parent access, or dialogs. Canvas for movement, physics, animation, collision. DOM for card, word, text adventure, board, turn-based. Web Audio API only for sound, procedural short tones, never autoplay.

START BUTTON — CRITICAL, READ THIS:
The Start/Play button MUST work. This is the single most important thing. Use this exact pattern — no exceptions:
  let gameStarted = false;
  function startGame() { gameStarted = true; /* show game, hide title, begin loop */ }
  document.getElementById('startBtn').addEventListener('click', startGame);
Place ALL game logic inside functions called AFTER the button is clicked. Never run game loops before startGame() fires. The script tag goes at end of body so the DOM is ready — no DOMContentLoaded needed.

GAME REQUIREMENTS:
Title screen with game name and a single clearly-labeled Start/Play button (id="startBtn"). Controls shown on screen at all times during play. Score or progress visible if game type supports it. Win or lose condition. Restart button after game over. Fun for at least 2 minutes. Difficulty increases over time for arcade games. On-screen touch buttons for mobile on any game using arrow keys or WASD. Keep output under 450 lines total.

GAME FEEL:
Every player action needs immediate feedback. Hit an enemy: flash red. Collect item: particle burst. Score point: counter animates. Game over: overlay with score and restart. Win: celebration particles. Controls must feel instant with zero lag.

FINAL SELF-CHECK — before you output, silently verify every item is TRUE and fix anything that is not:
- The Start button uses id="startBtn" and a startGame() function — clicking it actually begins play.
- There is a clear win OR lose state and a working Restart after game over.
- Something animates within the first second and the player can act within 3 seconds.
- LAYOUT: no two rooms/zones/panels/labels overlap, every actor is spread out and individually visible (none stacked on one spot), and all HUD text sits fully on-screen with margin from the edges.
- LOOKS DESIGNED: characters are built from multiple shapes with a highlight + drop shadow (not flat pills), zones/rooms have interior detail and tint (not empty boxes), backgrounds use a gradient, and the player/interactables visibly pop. A frozen frame should look like a finished game, not a wireframe.
- Every player action has instant visual feedback (flash / particle / shake / score pop) AND a sound.
- Difficulty ramps over time and the game stays genuinely fun for at least 2 minutes.
- It adapts to any window size and is playable on touch (on-screen controls if it uses keys).
- No external requests, no undefined variables, no unclosed tags — the single file runs standalone with zero console errors.
Ship a finished, polished game — never a tech demo or a stub.

LESSONS FROM PREVIOUS GENERATIONS — apply every one of these:
[LESSONS_PLACEHOLDER]

[BLUEPRINT_PLACEHOLDER]

${CORE_GAME_KNOWLEDGE}`;

// Edit mode powers the in-workspace "ask for a change" chat. Unlike generate,
// it receives the CURRENT game and returns the SAME game with only the requested
// change applied — this is the Lovable-style iterate-on-what-you-have loop.
const EDIT_SYSTEM_PROMPT = `You are the live game editor inside GameCraft. You are given a COMPLETE, working single-file HTML game and a player's plain-language change request. Apply ONLY the requested change (plus whatever small adjustments that change strictly requires) and return the ENTIRE updated HTML file.

ABSOLUTE RULES:
- Preserve everything the user did NOT ask to change — keep the existing mechanics, layout, theme, variable names, and Start-button wiring intact.
- Output raw HTML only. No markdown, no code fences, no commentary. First character must be < and last must be >.
- Keep it a single self-contained file: all CSS in a <style> tag, all JS in a <script> tag at the end of <body>. Zero external dependencies, no CDN, no fetch, no external images or fonts.
- It must keep working in a sandboxed iframe with allow-scripts only — no localStorage, sessionStorage, cookies, parent access, or dialogs.
- Keep the id="startBtn" Start button and the startGame() pattern working.
- Do not shrink or delete unrelated features. Return the full file every time, not a diff.`;

const PLAN_SYSTEM_PROMPT = `You are a game concept planner for GameCraft. The user describes a game idea — anything from 2D puzzles to 3D shooters to idle clickers to RPGs. Write a punchy 5-line concept in plain text only — no markdown, no bullets, no asterisks, no headers.

Line 1: Game name (3 words max, catchy)
Line 2: One sentence — what does the player do
Line 3: One sentence — visual style and feel (mention 2D or 3D perspective if relevant)
Line 4: Controls (10 words max, specific)
Line 5: Win or lose condition (one sentence, specific)

Under 80 words total. Present tense. Sound exciting. Never say I will or This will. If they ask for a famous game, describe your playable single-file interpretation confidently.`;

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(ip) {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  let entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetTime) {
    entry = { count: 0, resetTime: now + hourMs };
    rateLimitMap.set(ip, entry);
  }

  entry.count += 1;
  console.log(`Request from ${ip} — count: ${entry.count}`);

  if (entry.count > MAX_REQUESTS_PER_HOUR) {
    return false;
  }
  return true;
}

function estimateTokenCost(mode) {
  if (mode === "plan") {
    console.log("PLAN request — cheap mode, ~0.0005 credits estimated");
  } else {
    console.log("GENERATE request — cheap mode, ~0.01 credits estimated");
  }
}

function pickMockFile(prompt) {
  const p = (prompt || "").toLowerCase();
  if (p.includes("snake")) return "mock-snake.html";
  if (p.includes("clicker") || p.includes("cookie")) return "mock-clicker.html";
  if (p.includes("word") || p.includes("wordle")) return "mock-wordle.html";
  return "mock-snake.html";
}

function stripFences(text) {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```[a-zA-Z]*\s*\n?/, "");
    t = t.replace(/\n?```\s*$/, "");
  }
  return t.trim();
}

function buildGenerateSystemPrompt(lessonsContext, visualTheme, blueprint) {
  const themeDescription =
    VISUAL_THEME_DESCRIPTIONS[visualTheme] ||
    VISUAL_THEME_DESCRIPTIONS.neon;

  // Note: the blueprint already embeds the catalog reference games
  // (buildGameBlueprint → retrieveGameContext), so it is NOT injected again here.
  return (
    FORGE_PREAMBLE +
    GENERATE_SYSTEM_PROMPT.replace(
      "[LESSONS_PLACEHOLDER]",
      lessonsContext || "(No lessons yet — make strong creative choices.)"
    )
      .replace("[VISUAL_THEME_PLACEHOLDER]", themeDescription)
      .replace("[BLUEPRINT_PLACEHOLDER]", blueprint) +
    "\n\n" +
    POPULARITY_DNA
  );
}

export async function POST(request) {
  try {
    const ip = getClientIp(request);

    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    let prompt = body?.prompt;
    const mode =
      body?.mode === "plan"
        ? "plan"
        : body?.mode === "edit"
          ? "edit"
          : "generate";

    // Edit mode tweaks an existing game instead of describing a new one. It
    // does its own rate-limit check after validating its inputs.
    if (mode === "edit") {
      return handleEdit(body, ip);
    }

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return Response.json(
        { error: "Please describe a game first." },
        { status: 400 }
      );
    }

    // Only the expensive game build is rate-limited. The cheap concept blurb
    // (plan) and any validation failures above don't count against the budget,
    // so a build (which fires plan + generate) costs the user a single slot and
    // the chat-to-iterate loop isn't starved by it.
    if (mode === "generate" && !checkRateLimit(ip)) {
      return Response.json(
        {
          error:
            "Too many requests. Please wait before generating more games.",
        },
        { status: 429 }
      );
    }

    prompt = prompt.trim();
    if (prompt.length > MAX_PROMPT_LENGTH) {
      prompt = prompt.slice(0, MAX_PROMPT_LENGTH);
    }

    estimateTokenCost(mode);

    if (MOCK_MODE) {
      const file = pickMockFile(prompt);
      const html = await readFile(
        path.join(process.cwd(), "public", "mocks", file),
        "utf8"
      );
      return Response.json({ html });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(
        {
          error:
            "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server.",
        },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    // The concept blurb is short — keep it as a single fast JSON response.
    // (Plan returns here, before any of the generate-only knowledge work below.)
    if (mode === "plan") {
      const message = await anthropic.messages.create({
        model: PLAN_MODEL,
        max_tokens: MAX_PLAN_TOKENS,
        system: PLAN_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      });
      const text = message.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");
      return Response.json({ plan: text.trim() });
    }

    // Generate-only: assemble the genre, theme, lessons, and blueprint. None of
    // this runs for plan requests, so the concept blurb stays fast.
    const genre = detectGenre(prompt);
    const visualTheme = detectVisualTheme(prompt);
    const [lessonsContext, blueprint] = await Promise.all([
      buildLessonsContext(prompt).catch(() => ""),
      buildGameBlueprint(prompt),
    ]);
    const systemPrompt = buildGenerateSystemPrompt(
      lessonsContext,
      visualTheme,
      blueprint
    );

    // Pick the model + reasoning depth: explicit client choice, else auto from
    // the prompt's complexity.
    const cfg = pickGenerationConfig(prompt, body?.quality);
    console.log(`GENERATE routing: tier=${cfg.tier} model=${cfg.model} effort=${cfg.effort}`);

    // Log the generation up-front so its id can ride back on a header — the
    // client attaches the player's rating to it later (see /api/feedback).
    const generationId = await saveGeneration({
      prompt,
      genre,
      mode: "generate",
      outputLength: 0,
      tokenCount: null,
      model: cfg.model,
      success: null,
      visualTheme,
    }).catch(() => null);

    // A full game can take a minute. Stream the raw HTML to the client as it's
    // written so the build feels live instead of a long blank wait. When the
    // stream finishes, grow the lessons DB from what we just made (best-effort).
    return streamGameHtml({
      anthropic,
      system: systemPrompt,
      userContent: prompt,
      model: cfg.model,
      effort: cfg.effort,
      think: cfg.think,
      headers: generationId ? { "X-Generation-Id": generationId } : undefined,
      onComplete: (text, success) => {
        if (!success || !text.trim()) return;
        extractAndSaveLesson({
          prompt,
          genre,
          visualTheme,
          success: true,
          generationId,
        }).catch(() => {});
      },
    });
  } catch (error) {
    console.error("GENERATE ERROR:", error.message, error.status ?? "", error.cause?.message ?? "", error.stack?.split("\n")[1] ?? "");
    return Response.json(
      { error: error.message || "Generation failed. Please try again." },
      { status: 500 }
    );
  }
}

// Edit mode: take the current game + a change request and stream back the full
// updated file. This is the in-workspace "ask for a change" iteration loop.
async function handleEdit(body, ip) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server.",
      },
      { status: 500 }
    );
  }

  let html = typeof body?.html === "string" ? body.html : "";
  let instruction =
    typeof body?.instruction === "string" ? body.instruction.trim() : "";

  if (!html.trim() || !instruction) {
    return Response.json(
      { error: "Nothing to change yet — build a game first." },
      { status: 400 }
    );
  }

  // Charge the budget only once we know it's a real edit (not a validation miss).
  if (ip && !checkRateLimit(ip)) {
    return Response.json(
      { error: "Too many requests. Please wait before making more changes." },
      { status: 429 }
    );
  }

  if (html.length > MAX_EDIT_HTML_LENGTH) html = html.slice(0, MAX_EDIT_HTML_LENGTH);
  if (instruction.length > MAX_EDIT_INSTRUCTION_LENGTH) {
    instruction = instruction.slice(0, MAX_EDIT_INSTRUCTION_LENGTH);
  }

  const cfg = pickEditConfig(instruction, html.length, body?.quality);
  console.log(`EDIT routing: tier=${cfg.tier} model=${cfg.model} effort=${cfg.effort}`);

  const anthropic = new Anthropic({ apiKey });
  const userContent = `Here is the current game's full HTML:\n\n${html}\n\n---\n\nChange request: ${instruction}\n\nReturn the full updated HTML file with that change applied.`;

  return streamGameHtml({
    anthropic,
    system: EDIT_SYSTEM_PROMPT,
    userContent,
    model: cfg.model,
    effort: cfg.effort,
    think: cfg.think,
  });
}

// Shared streamer for generate + edit: streams the model's raw HTML to the
// client token-by-token, aborts the LLM call if the client disconnects, and
// fires onComplete(fullText, success) once the stream settles. The model,
// effort, and whether to think first are chosen per-request by the router.
function streamGameHtml({ anthropic, system, userContent, model, effort, think, onComplete, headers }) {
  const encoder = new TextEncoder();
  const llmStream = anthropic.messages.stream({
    model: model || SMART_MODEL,
    max_tokens: MAX_GENERATE_TOKENS,
    system,
    // Adaptive thinking lets the model plan the architecture and game design
    // before writing code; effort tunes how deeply. Thinking blocks stream with
    // empty content (we don't surface them) — only the HTML text is captured.
    thinking: think ? { type: "adaptive" } : { type: "disabled" },
    output_config: { effort: effort || "high" },
    messages: [{ role: "user", content: userContent }],
  });

  let cancelled = false;
  let acc = "";
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of llmStream) {
          if (cancelled) break;
          if (
            event.type === "content_block_delta" &&
            event.delta?.type === "text_delta" &&
            event.delta.text
          ) {
            acc += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        if (!cancelled) {
          controller.close();
          if (onComplete) {
            try {
              onComplete(acc, true);
            } catch {
              /* best-effort */
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("STREAM ERROR:", err?.message || String(err));
          if (onComplete) {
            try {
              onComplete(acc, false);
            } catch {
              /* best-effort */
            }
          }
          try {
            controller.error(err);
          } catch {
            /* controller already torn down */
          }
        }
      }
    },
    cancel() {
      // Client disconnected (navigated away / aborted) — stop the LLM call.
      cancelled = true;
      try {
        llmStream.abort();
      } catch {
        /* already finished */
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
      ...(headers || {}),
    },
  });
}
