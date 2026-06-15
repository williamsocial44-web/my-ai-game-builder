import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";
import GamePlayer from "./GamePlayer";

export const runtime = "nodejs";

async function loadGame(id) {
  const supabase = await createClient();
  if (!supabase) return { game: null, scores: [] };
  try {
    const { data: game } = await supabase
      .from("games")
      .select("id,title,html,visibility,plays")
      .eq("id", id)
      .eq("visibility", "public")
      .single();
    if (!game) return { game: null, scores: [] };

    const { data: scores } = await supabase
      .from("scores")
      .select("name,score")
      .eq("game_id", id)
      .order("score", { ascending: false })
      .limit(10);

    return { game, scores: scores || [] };
  } catch {
    return { game: null, scores: [] };
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { game } = await loadGame(id);
  return {
    title: game ? `${game.title} — Gamecraft` : "Game not found — Gamecraft",
    description: game
      ? `Play ${game.title}, a game built with Gamecraft. Build your own in seconds.`
      : "This game isn't available.",
  };
}

export default async function PublicGame({ params }) {
  const { id } = await params;
  const { game, scores } = await loadGame(id);

  if (!game) {
    return (
      <div className="pub-missing">
        <div className="brand-logo" style={{ width: 52, height: 52, borderRadius: 16 }}>
          <span style={{ fontWeight: 800, fontSize: 22 }}>G</span>
        </div>
        <h1>Game not found</h1>
        <p>This game is private or no longer exists.</p>
        <Link className="btn btn-primary" href="/">Build your own game</Link>
      </div>
    );
  }

  return <GamePlayer game={game} initialScores={scores} />;
}
