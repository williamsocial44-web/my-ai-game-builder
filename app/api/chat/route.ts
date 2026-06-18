import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getAnthropic, FAST_MODEL, SMART_MODEL, textFromMessage, extractJson } from "@/lib/anthropic";
import type { GameStateConfig, PhaserProjectState, ProjectState } from "@/types/engine";

export const runtime = "nodejs";

// DEV_MODE returns a canned game so UI/flow testing never calls Anthropic.
const DEV_MODE = process.env.DEV_MODE === "true";

/**
 * Claude state-orchestration endpoint for the DECLARATIVE (Phaser) engine.
 *
 * Turns a plain-language request into a validated GameStateConfig, then wraps it
 * into a single self-contained HTML file (Phaser from CDN + the engine inlined +
 * the state embedded). That HTML flows through the exact same preview / save /
 * publish / export pipeline as the HTML engine, so the UI never special-cases it.
 * The HTML engine keeps streaming from /api/generate.
 */

const ORCHESTRATOR_SYSTEM = `You are the GameCraft level designer. You turn a player's plain-language request into a declarative top-down 2D game described as STRICT JSON.

Respond with a SINGLE JSON object and NOTHING else — no markdown, no code fences, no commentary:
{
  "summary": "<one short, friendly sentence describing what you built or changed>",
  "game": { ...GameStateConfig... }
}

GameStateConfig schema (all coordinates in pixels):
- gameMetadata: { "title": string, "description"?: string }
- player: { "spriteKey": "default_player", "startX": number, "startY": number, "speed": number (120-320), "sprite"?: { "key": string, "color": "#RRGGBB" } }
- map: { "tileGridSize": number (32-48), "background"?: "#RRGGBB", "layout": number[][] }
- collectibles?: [{ "spriteKey": string, "x": number, "y": number, "value": number, "sprite"?: { "key": string, "color": "#RRGGBB" } }]
- enemies?: [{ "spriteKey": string, "startX": number, "startY": number, "speed": number, "behavior": "patrol" | "chase" | "static", "sprite"?: { "key": string, "color": "#RRGGBB" } }]
- settings?: { "gravityY": 0, "winCondition": "collect-all" | "reach-goal" | "survive" | "none", "surviveSeconds"?: number }

Tile codes in map.layout (row-major): 0 = empty, 1 = floor, 2 = wall, 3 = collectible, 4 = enemy, 5 = goal.

Rules:
- The layout's outer ring MUST be walls (code 2). Build an interesting interior with some inner walls, at least 6x6 of floor.
- Keep the grid at most 24 columns by 18 rows.
- PREFER placing collectibles (3), enemies (4) and the goal (5) directly in the layout grid so positions are always valid; only use the explicit arrays for fine control.
- Put player.startX/startY on a floor tile (tileGridSize * (col + 0.5), tileGridSize * (row + 0.5)).
- "reach-goal" REQUIRES a goal tile (5). "collect-all" REQUIRES at least one collectible. "survive" REQUIRES surviveSeconds and at least one chase enemy.
- Use vivid hex colors for player/enemy/collectible sprites and a dark background.
- When editing an existing game, KEEP everything the player did not ask to change.`;

interface OrchestratorResult {
  summary?: string;
  game?: GameStateConfig;
}

function clampLayout(game: GameStateConfig): GameStateConfig {
  const layout = game.map?.layout;
  if (!Array.isArray(layout) || !layout.length || !Array.isArray(layout[0])) {
    throw new Error("Model returned an invalid map layout.");
  }
  const rows = layout.slice(0, 28);
  const trimmed = rows.map((r) => (Array.isArray(r) ? r.slice(0, 36).map((c) => Number(c) || 0) : []));
  game.map.layout = trimmed as GameStateConfig["map"]["layout"];
  if (!game.player) throw new Error("Model returned a game with no player.");
  game.map.tileGridSize = Math.min(48, Math.max(24, game.map.tileGridSize || 40));
  game.player.speed = Math.min(360, Math.max(80, game.player.speed || 220));
  if (!game.settings) game.settings = { gravityY: 0, winCondition: "none" };
  game.settings.gravityY = 0;
  return game;
}

// Cache the engine source so we only hit disk once per server process.
let engineSourceCache: string | null = null;
async function engineSource(): Promise<string> {
  if (engineSourceCache == null) {
    engineSourceCache = await readFile(
      path.join(process.cwd(), "public", "game-runner", "engine.js"),
      "utf8"
    );
  }
  return engineSourceCache;
}

// Wrap a declarative game into a single self-contained, runnable HTML file.
async function wrapPhaserHtml(game: GameStateConfig): Promise<string> {
  const engine = await engineSource();
  const title = (game.gameMetadata?.title || "GameCraft Game").replace(/</g, "&lt;");
  const stateJson = JSON.stringify(game).replace(/<\/script>/gi, "<\\/script>");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<title>${title}</title>
<style>
  html,body{margin:0;padding:0;width:100%;height:100%;background:#0b0d12;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
  #game-canvas-container{width:100vw;height:100vh;display:flex;align-items:center;justify-content:center}
  #game-canvas-container canvas{max-width:100%;max-height:100%}
  #boot{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);font-size:14px}
  #boot.error{color:#ff8a8a;padding:24px;text-align:center;line-height:1.5}
</style>
</head>
<body>
<div id="boot">Loading engine…</div>
<div id="game-canvas-container"></div>
<script type="application/json" id="gc-state">${stateJson}</script>
<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js" onload="window.__phaserLoaded=true" onerror="window.__onPhaserLoadError&&window.__onPhaserLoadError()"></script>
<script>${engine}</script>
<script>
(function(){
  var game = JSON.parse(document.getElementById('gc-state').textContent);
  function send(){ window.postMessage({ type:'UPDATE_GAME_STATE_JSON', payload: game }, '*'); }
  window.addEventListener('message', function(e){ if(e.data && e.data.type==='ENGINE_READY') send(); });
  // Fallback in case the engine became ready before this listener attached.
  setTimeout(send, 1400);
})();
</script>
</body>
</html>`;
}

export async function POST(req: Request) {
  let body: { message?: string; currentState?: ProjectState; quality?: string; prebuiltGame?: GameStateConfig };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Build directly from a client-assembled game (asset-pack flow): the sprites
  // are already injected, so just validate + wrap — no model call.
  if (body.prebuiltGame) {
    try {
      const game = clampLayout(body.prebuiltGame);
      const state: PhaserProjectState = {
        engine: "phaser",
        metadata: { title: game.gameMetadata?.title || "Untitled Game", description: game.gameMetadata?.description },
        declarative: game,
      };
      const html = await wrapPhaserHtml(game);
      return NextResponse.json({ state, html, summary: "Built from your asset pack." });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  const message = (body.message || "").trim();
  if (!message) {
    return NextResponse.json({ error: "Describe a change first." }, { status: 400 });
  }

  if (DEV_MODE) {
    const game: GameStateConfig = {
      gameMetadata: { title: "Dev Mock" },
      player: { spriteKey: "default_player", startX: 120, startY: 120, speed: 200 },
      map: {
        tileGridSize: 40,
        background: "#0e1118",
        layout: [
          [2, 2, 2, 2, 2],
          [2, 1, 1, 1, 2],
          [2, 1, 3, 1, 2],
          [2, 1, 1, 1, 2],
          [2, 2, 2, 2, 2],
        ] as GameStateConfig["map"]["layout"],
      },
      settings: { gravityY: 0, winCondition: "collect-all" },
    };
    const state: PhaserProjectState = {
      engine: "phaser",
      metadata: { title: game.gameMetadata.title },
      declarative: game,
    };
    const html = await wrapPhaserHtml(game);
    return NextResponse.json({ state, html, summary: "DEV_MODE mock — no Anthropic call." });
  }

  let anthropic;
  try {
    anthropic = getAnthropic();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const current =
    body.currentState && body.currentState.engine === "phaser"
      ? (body.currentState as PhaserProjectState).declarative
      : null;

  const userContent = current
    ? `Current game JSON:\n${JSON.stringify(current)}\n\nRequest: ${message}\n\nReturn the FULL updated game.`
    : `Create a new game. Request: ${message}`;

  const model = body.quality === "smart" ? SMART_MODEL : FAST_MODEL;

  try {
    const resp = await anthropic.messages.create({
      model,
      max_tokens: 4000,
      system: ORCHESTRATOR_SYSTEM,
      messages: [{ role: "user", content: userContent }],
    });
    const parsed = extractJson<OrchestratorResult>(textFromMessage(resp));
    if (!parsed || !parsed.game) {
      throw new Error("The model didn't return a valid game. Try rephrasing.");
    }
    const game = clampLayout(parsed.game);
    const title = game.gameMetadata?.title || current?.gameMetadata?.title || "Untitled Game";
    const state: PhaserProjectState = {
      engine: "phaser",
      metadata: { title, description: game.gameMetadata?.description },
      declarative: game,
    };
    const html = await wrapPhaserHtml(game);
    return NextResponse.json({ state, html, summary: parsed.summary || "Built your game." });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
