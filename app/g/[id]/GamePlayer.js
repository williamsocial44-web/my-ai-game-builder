"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { wrapPreviewHtml } from "../../../lib/preview";
import { recordPlay, submitScore, topScores } from "../../../lib/games";

function getPlayerName() {
  let n = null;
  try {
    n = window.localStorage.getItem("gamecraft.player");
  } catch {
    /* ignore */
  }
  if (!n) {
    const entered = window.prompt
      ? window.prompt("Enter a name for the leaderboard:", "")
      : "";
    n = ((entered || "anon").trim() || "anon").slice(0, 24);
    try {
      window.localStorage.setItem("gamecraft.player", n);
    } catch {
      /* ignore */
    }
  }
  return n;
}

export default function GamePlayer({ game, initialScores }) {
  const iframeRef = useRef(null);
  const [scores, setScores] = useState(initialScores || []);
  const [plays, setPlays] = useState(game.plays || 0);

  // Count one play per browser session.
  useEffect(() => {
    const key = "gamecraft.played." + game.id;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    recordPlay(game.id);
    setPlays((p) => p + 1);
  }, [game.id]);

  // Relay scores reported by the sandboxed game to the leaderboard.
  useEffect(() => {
    async function onMessage(e) {
      const d = e.data;
      if (!d || d.type !== "gamecraft:score") return;
      if (iframeRef.current && e.source !== iframeRef.current.contentWindow) return;
      const score = Math.round(Number(d.score) || 0);
      if (!Number.isFinite(score) || score < 0) return;
      const ok = await submitScore(game.id, getPlayerName(), score);
      if (ok) setScores(await topScores(game.id, 10));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [game.id]);

  return (
    <div className="pub-game">
      <div className="pub-main">
        <div className="pub-stage">
          <iframe
            ref={iframeRef}
            title={game.title}
            srcDoc={wrapPreviewHtml(game.html)}
            sandbox="allow-scripts"
          />
        </div>
        <aside className="pub-board">
          <div className="pub-board-head">
            <span>Leaderboard</span>
            <span className="pub-plays">{plays.toLocaleString()} plays</span>
          </div>
          {scores.length === 0 ? (
            <p className="pub-board-empty">No scores yet — be the first!</p>
          ) : (
            <ol className="pub-board-list">
              {scores.map((s, i) => (
                <li key={i}>
                  <span className="pub-rank">{i + 1}</span>
                  <span className="pub-name">{s.name}</span>
                  <span className="pub-score">{Number(s.score).toLocaleString()}</span>
                </li>
              ))}
            </ol>
          )}
        </aside>
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
