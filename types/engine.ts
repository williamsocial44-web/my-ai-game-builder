/**
 * Master structural definitions for the GameCraft engine.
 *
 * GameCraft supports two runtimes behind one builder:
 *   - "html"   — a complete, self-contained single-file HTML game (the streaming
 *                FORGE generator). The whole game lives in one HTML string.
 *   - "phaser" — a declarative JSON game description interpreted at runtime by
 *                the Phaser scene in public/game-runner/engine.js.
 *
 * A project's `current_state_json` column (see the supabase migration) stores a
 * `ProjectState`, which is the discriminated union of those two runtimes.
 */

export type GameEngine = "html" | "phaser";

/* ───────────────────────────── Phaser declarative model ──────────────────── */

/**
 * Tile codes used in a map layout grid:
 *   0 = empty / out of bounds
 *   1 = floor (walkable)
 *   2 = wall (solid collider)
 *   3 = collectible spawn
 *   4 = enemy spawn
 *   5 = goal / exit tile
 */
export type TileCode = 0 | 1 | 2 | 3 | 4 | 5;

export interface SpriteRef {
  /** Texture key the engine registers this sprite under. */
  key: string;
  /** Optional remote PNG (e.g. a transparent asset from /api/generate-asset). */
  url?: string;
  /** Fallback solid color (hex) drawn as a texture when no url is provided. */
  color?: string;
  /** Display size in pixels; defaults to the map tile size. */
  width?: number;
  height?: number;
}

export interface PlayerConfig {
  spriteKey: string;
  startX: number;
  startY: number;
  /** Movement speed in pixels/second. */
  speed: number;
  /** Optional remote/colored sprite definition for the player. */
  sprite?: SpriteRef;
}

export interface EnemyConfig {
  spriteKey: string;
  startX: number;
  startY: number;
  speed: number;
  /** "patrol" bounces between bounds; "chase" follows the player. */
  behavior: "patrol" | "chase" | "static";
  sprite?: SpriteRef;
}

export interface CollectibleConfig {
  spriteKey: string;
  x: number;
  y: number;
  /** Points awarded on pickup. */
  value: number;
  sprite?: SpriteRef;
}

export interface MapConfig {
  /** Square tile size in pixels. */
  tileGridSize: number;
  /** Row-major grid of TileCodes. */
  layout: TileCode[][];
  /** Background fill (hex) for the play area. */
  background?: string;
  /** Wall sprite definition (defaults to the engine's built-in wall). */
  wallSprite?: SpriteRef;
}

export interface GameSettings {
  /** World gravity on the Y axis (0 for top-down games). */
  gravityY: number;
  /** End condition. */
  winCondition: "collect-all" | "reach-goal" | "survive" | "none";
  /** Seconds to survive when winCondition === "survive". */
  surviveSeconds?: number;
}

/** The full declarative game the Phaser runner consumes. */
export interface GameStateConfig {
  gameMetadata: {
    title: string;
    description?: string;
  };
  player: PlayerConfig;
  map: MapConfig;
  enemies?: EnemyConfig[];
  collectibles?: CollectibleConfig[];
  settings?: GameSettings;
  /** Extra sprite definitions to preload (e.g. generated assets). */
  sprites?: SpriteRef[];
  /** Default sprite keys for tile-grid (code 3/4) spawns, so grid-placed
   *  collectibles/enemies use the generated pack art instead of a flat color. */
  defaults?: { collectibleKey?: string | null; enemyKey?: string | null };
}

/* ───────────────────────────── Project state union ───────────────────────── */

export interface HtmlProjectState {
  engine: "html";
  /** The complete single-file HTML game. */
  html: string;
  metadata: { title: string; description?: string };
}

export interface PhaserProjectState {
  engine: "phaser";
  declarative: GameStateConfig;
  metadata: { title: string; description?: string };
}

export type ProjectState = HtmlProjectState | PhaserProjectState;

/** An empty starter state for a brand-new project of a given engine. */
export function emptyProjectState(engine: GameEngine, title = "Untitled Game"): ProjectState {
  if (engine === "phaser") {
    return {
      engine: "phaser",
      metadata: { title },
      declarative: {
        gameMetadata: { title },
        player: { spriteKey: "default_player", startX: 400, startY: 300, speed: 240 },
        map: {
          tileGridSize: 40,
          background: "#0e1118",
          layout: [
            [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
            [2, 1, 1, 1, 1, 1, 1, 1, 1, 2],
            [2, 1, 1, 1, 1, 1, 1, 1, 1, 2],
            [2, 1, 1, 1, 1, 1, 1, 1, 1, 2],
            [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
          ],
        },
        collectibles: [],
        enemies: [],
        settings: { gravityY: 0, winCondition: "none" },
      },
    };
  }
  return { engine: "html", metadata: { title }, html: "" };
}

/* ───────────────────────────── postMessage protocol ──────────────────────── */

/** Parent (builder) → iframe (game runner). */
export type EngineInboundMessage = {
  type: "UPDATE_GAME_STATE_JSON";
  payload: GameStateConfig;
};

/** iframe (game runner) → parent (builder). */
export type EngineOutboundMessage =
  | { type: "ENGINE_READY" }
  | { type: "ENGINE_ERROR"; message: string }
  | { type: "GAME_EVENT"; event: "win" | "lose" | "score"; score?: number };

/* ───────────────────────────── DB row shapes ─────────────────────────────── */

export interface Profile {
  id: string;
  email: string;
  premium_status: boolean;
  session_generation_count: number;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  current_state_json: ProjectState | Record<string, never>;
  style_guide_url: string | null;
  created_at: string;
  updated_at: string;
}

export type GenerationType =
  | "chat_html"
  | "chat_phaser"
  | "asset_static"
  | "asset_tile"
  | "asset_animation";

export interface Generation {
  id: string;
  project_id: string;
  user_id: string;
  generation_type: GenerationType;
  cost_credits: number;
  created_at: string;
}

/* ───────────────────────────── API payloads ──────────────────────────────── */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Request body for POST /api/chat (the state-orchestration endpoint). */
export interface ChatRequest {
  projectId?: string;
  engine: GameEngine;
  message: string;
  /** Current game for iterate-on-what-you-have edits. */
  currentState?: ProjectState;
  quality?: "auto" | "fast" | "smart";
}

export type AssetType = "static_item" | "tile" | "character_animation";

export interface GenerateAssetRequest {
  projectId: string;
  assetPrompt: string;
  assetType: AssetType;
}

/** Free-tier ceiling on AI generations before the upgrade paywall triggers. */
export const FREE_GENERATION_LIMIT = 15;

/** Per-call credit costs recorded in the generations ledger. */
export const GENERATION_COSTS: Record<GenerationType, number> = {
  chat_html: 0.01,
  chat_phaser: 0.005,
  asset_static: 0.02,
  asset_tile: 0.02,
  asset_animation: 0.25,
};
