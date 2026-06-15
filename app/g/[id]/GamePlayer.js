"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { wrapPreviewHtml } from "../../../lib/preview";
import { recordPlay, recordSession } from "../../../lib/games";

export default function GamePlayer({ game }) {
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

  // Measure how long the player actually stays, and report it once on the way
  // out (tab hidden or component unmount) — powers the engagement dashboard.
  useEffect(() => {
    const start = Date.now();
    let reported = false;
    const report = () => {
      if (reported) return;
      reported = true;
      recordSession(game.id, Date.now() - start);
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") report();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      report();
    };
  }, [game.id]);

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
        <span className="pub-title">
          {game.title}
          <span className="pub-plays">{plays.toLocaleString()} plays</span>
        </span>
        <Link className="pub-cta" href="/">
          Made with <strong>Gamecraft</strong> — build your own →
        </Link>
      </footer>
    </div>
  );
}
