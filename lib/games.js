// Cloud save + publish for user games, backed by the Supabase `games` table
// (see supabase/migrations/003_games.sql). All calls run through the browser
// client with the user's session; Row-Level Security enforces ownership.
// Every function degrades to null/false if Supabase isn't configured or the
// table doesn't exist yet, so the app keeps working on localStorage until the
// migration is applied.

import { createClient } from "./supabase/client";

let _client;
function client() {
  if (_client === undefined || _client === null) _client = createClient();
  return _client;
}

const COLS = "id,title,prompt,scene,html,visibility,plays,created_at";

function rowToProject(row) {
  return {
    id: row.id,
    title: row.title,
    prompt: row.prompt,
    scene: row.scene,
    html: row.html,
    visibility: row.visibility,
    plays: row.plays ?? 0,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

// Returns an array of the signed-in user's games (newest first), or null if
// cloud storage is unavailable (caller should fall back to localStorage).
export async function listGames() {
  const supabase = client();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("games")
      .select(COLS)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error || !data) return null;
    return data.map(rowToProject);
  } catch {
    return null;
  }
}

// Inserts a new private game. Returns the saved project (with the DB id) or null.
export async function createGame({ title, prompt, scene, html }) {
  const supabase = client();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("games")
      .insert({ title, prompt, scene, html })
      .select(COLS)
      .single();
    if (error || !data) return null;
    return rowToProject(data);
  } catch {
    return null;
  }
}

// Saves an edited game's HTML back to the cloud (used by the iterate loop).
export async function updateGameHtml(id, html) {
  const supabase = client();
  if (!supabase || !id || !html) return false;
  try {
    const { error } = await supabase
      .from("games")
      .update({ html, updated_at: new Date().toISOString() })
      .eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

// Flips a game to public so it can be served at /g/[id]. Returns true on success.
export async function publishGame(id) {
  const supabase = client();
  if (!supabase || !id) return false;
  try {
    const { error } = await supabase
      .from("games")
      .update({ visibility: "public", updated_at: new Date().toISOString() })
      .eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

// ── Phase 2: play counts ────────────────────────────────────────────────────

// Count a play of a published game (best-effort, fire-and-forget).
export async function recordPlay(id) {
  const supabase = client();
  if (!supabase || !id) return;
  try {
    await supabase.rpc("increment_game_plays", { gid: id });
  } catch {
    /* analytics are best-effort */
  }
}

// ── Phase 3: engagement metrics ─────────────────────────────────────────────

// Log how long a player stayed in a published game (best-effort).
export async function recordSession(id, durationMs) {
  const supabase = client();
  if (!supabase || !id) return;
  try {
    await supabase.rpc("record_game_session", {
      gid: id,
      ms: Math.max(0, Math.round(durationMs || 0)),
    });
  } catch {
    /* analytics are best-effort */
  }
}

// Returns the signed-in owner's play sessions (durations) across all their
// games, newest first, or [] if unavailable. RLS limits rows to the owner.
export async function listSessions() {
  const supabase = client();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("game_sessions")
      .select("game_id,duration_ms,created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}
