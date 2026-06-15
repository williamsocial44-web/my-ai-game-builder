import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";
import { wrapPreviewHtml } from "../../../lib/preview";

export const runtime = "nodejs";

async function loadGame(id) {
  const supabase = await createClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from("games")
      .select("id,title,html,visibility")
      .eq("id", id)
      .eq("visibility", "public")
      .single();
    return data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const game = await loadGame(id);
  const title = game ? `${game.title} — Gamecraft` : "Game not found — Gamecraft";
  return {
    title,
    description: game
      ? `Play ${game.title}, a game built with Gamecraft. Build your own in seconds.`
      : "This game isn't available.",
  };
}

export default async function PublicGame({ params }) {
  const { id } = await params;
  const game = await loadGame(id);

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

  return (
    <div className="pub-game">
      <div className="pub-stage">
        <iframe
          title={game.title}
          srcDoc={wrapPreviewHtml(game.html)}
          sandbox="allow-scripts"
        />
      </div>
      <footer className="pub-foot">
        <span className="pub-title">{game.title}</span>
        <Link className="pub-cta" href="/">
          Made with <strong>Gamecraft</strong> — build your own →
        </Link>
      </footer>
    </div>
  );
}
