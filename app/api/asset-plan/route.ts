import { NextResponse } from "next/server";
import { getAnthropic, FAST_MODEL, textFromMessage, extractJson } from "@/lib/anthropic";
import type { GameStateConfig } from "@/types/engine";

export const runtime = "nodejs";

const DEV_MODE = process.env.DEV_MODE === "true";

/**
 * Asset-pack planner. Turns a game idea into:
 *   - a shared `styleSuffix` (appended to every asset prompt so the whole pack
 *     comes back in one cohesive art style), and
 *   - an `assets[]` manifest (what to generate), and
 *   - a `game` (GameStateConfig) whose sprite.key's reference those assets.
 *
 * The client then generates each asset, composes a sheet, and injects the
 * resulting sprites back into `game` for the Phaser engine to render.
 */

const SYSTEM = `You are GameCraft's art director and level designer. Given a game idea, design a COHESIVE 2D top-down asset pack and a matching playable game.

Respond with ONE JSON object and nothing else (no markdown):
{
  "theme": "<short theme name>",
  "styleSuffix": "<concise shared art-style descriptor, 8-16 words, appended to EVERY asset prompt for cohesion: palette + shading + perspective. e.g. 'cohesive cartoon game asset, soft cel shading, top-down view, warm autumn palette, clean vector'>",
  "assets": [ { "key": "<slug>", "role": "player|enemy|collectible|wall|floor|prop", "prompt": "<3-8 word description of THIS object only, no style words>" } ],
  "game": { ...GameStateConfig... }
}

Asset rules — design a FULL pack (12 to 16 assets), covering:
- 1-2 role:"player" — the main character(s).
- 2-3 role:"enemy" — distinct enemy types.
- 2-3 role:"collectible" — pickups / items.
- 2-3 role:"wall" tiles AND 1-2 role:"floor" tiles — environment, prompt these as "seamless tileable".
- 3-5 role:"prop" — scenery/decoration (trees, rocks, barrels…); include visual VARIATIONS using _1/_2 suffixes (e.g. tree_1, tree_2).
- "key" is a lowercase slug; "prompt" describes only that one object (3-8 words); the styleSuffix carries the look.

GameStateConfig rules (coordinates in pixels):
- gameMetadata:{ "title": string }
- player:{ "spriteKey": "<player key>", "startX": n, "startY": n, "speed": 120-300, "sprite": { "key": "<player key>" } }
- map:{ "tileGridSize": 36-48, "background": "#RRGGBB", "wallSprite": { "key": "<wall key>" }, "layout": number[][] }
  layout: outer ring all 2 (wall); interior mostly 1 (floor) with several 3 (collectible); optional 4 (enemy), 5 (goal). Max 16 cols x 12 rows.
- collectibles (optional explicit ones): { "spriteKey": "<key>", "x": n, "y": n, "value": 1, "sprite": { "key": "<key>" } }
- enemies (optional): { "spriteKey": "<key>", "startX": n, "startY": n, "speed": 80-160, "behavior": "patrol"|"chase", "sprite": { "key": "<key>" } }
- settings:{ "gravityY": 0, "winCondition": "collect-all"|"reach-goal"|"survive" }
- EVERY sprite.key used in game MUST be one of the asset keys.
- Place player.startX/startY on a floor tile: tileGridSize*(col+0.5), tileGridSize*(row+0.5).`;

interface PlanResult {
  theme?: string;
  styleSuffix?: string;
  assets?: Array<{ key: string; role: string; prompt: string }>;
  game?: GameStateConfig;
}

export async function POST(req: Request) {
  let body: { idea?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const idea = (body.idea || "").trim();
  if (!idea) return NextResponse.json({ error: "Describe the game idea first." }, { status: 400 });

  if (DEV_MODE) {
    return NextResponse.json({
      theme: "dev pack",
      styleSuffix: "cohesive cartoon game asset, soft cel shading, top-down view, neon palette, clean vector",
      assets: [
        { key: "player", role: "player", prompt: "round blue hero character" },
        { key: "coin", role: "collectible", prompt: "shiny gold coin" },
        { key: "wall", role: "wall", prompt: "stone brick block tile" },
        { key: "slime", role: "enemy", prompt: "green slime monster" },
      ],
      game: {
        gameMetadata: { title: "Dev Pack" },
        player: { spriteKey: "player", startX: 100, startY: 100, speed: 200, sprite: { key: "player" } },
        map: {
          tileGridSize: 40,
          background: "#10131a",
          wallSprite: { key: "wall" },
          layout: [
            [2, 2, 2, 2, 2],
            [2, 1, 3, 1, 2],
            [2, 1, 4, 1, 2],
            [2, 3, 1, 3, 2],
            [2, 2, 2, 2, 2],
          ],
        },
        enemies: [{ spriteKey: "slime", startX: 100, startY: 100, speed: 90, behavior: "patrol", sprite: { key: "slime" } }],
        settings: { gravityY: 0, winCondition: "collect-all" },
      } as GameStateConfig,
    });
  }

  let anthropic;
  try {
    anthropic = getAnthropic();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  try {
    const resp = await anthropic.messages.create({
      model: FAST_MODEL,
      max_tokens: 4500,
      system: SYSTEM,
      messages: [{ role: "user", content: `Game idea: ${idea}` }],
    });
    const parsed = extractJson<PlanResult>(textFromMessage(resp));
    if (!parsed || !Array.isArray(parsed.assets) || !parsed.game) {
      throw new Error("Planner returned invalid data. Try rephrasing the idea.");
    }
    parsed.assets = parsed.assets.slice(0, 16);
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
