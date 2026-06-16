"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { listSessions } from "../lib/games";

/* ----------------------------------------------------------------- icons --- */

function Icon({ name, className }) {
  const p = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };
  const s = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15 9-2 6-4 2 2-6 4-2Z" /></>,
    nodes: <><circle cx="6" cy="7" r="2.2" /><circle cx="18" cy="7" r="2.2" /><circle cx="12" cy="18" r="2.2" /><path d="M8 8l3 8M16 8l-3 8M8.4 7h7" /></>,
    grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
    star: <path d="m12 3 2.6 5.6 6 .7-4.4 4.2 1.1 6L12 16.8 6.7 19.5l1.1-6L3.4 9.3l6-.7L12 3Z" />,
    user: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
    users: <><path d="M16 20a5 5 0 0 0-10 0" /><circle cx="11" cy="8" r="4" /><path d="M20 19a4 4 0 0 0-3-3.9" /><path d="M17 5.2a3 3 0 0 1 0 5.6" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    send: <path d="M12 20V5m0 0-6 6m6-6 6 6" />,
    sliders: <><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0M16 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></>,
    gridView: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
    listView: <><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>,
    gift: <><rect x="3" y="9" width="18" height="12" rx="2" /><path d="M3 13h18M12 9v12" /><path d="M12 9H8.5A2.5 2.5 0 1 1 12 5.5V9Zm0 0h3.5A2.5 2.5 0 1 0 12 5.5V9Z" /></>,
    bolt: <path d="M13 2 4 14h7l-1 8 10-13h-7l1-7Z" />,
    play: <path d="M7 5v14l12-7-12-7Z" fill="currentColor" stroke="none" />,
    remix: <><path d="M4 7h11a4 4 0 0 1 0 8H9" /><path d="m12 12-3 3 3 3" /></>,
    signout: <><path d="M15 12H4m6-5-7 5 7 5" /><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /></>,
    controller: <><path d="M6 11h4m-2-2v4" /><circle cx="15.5" cy="11" r="1" fill="currentColor" stroke="none" /><circle cx="18" cy="13.5" r="1" fill="currentColor" stroke="none" /><path d="M7 6h10a4 4 0 0 1 4 4l.8 5.2a2.5 2.5 0 0 1-4.7 1.4L16 15H8l-1.1 1.6a2.5 2.5 0 0 1-4.7-1.4L3 10a4 4 0 0 1 4-4Z" /></>,
    sparkle: <path d="M12 3v4m0 10v4m9-9h-4M7 12H3m12.5-5.5-2.8 2.8m-3.4 3.4-2.8 2.8m0-9 2.8 2.8m3.4 3.4 2.8 2.8" />,
    attach: <path d="M21 11.5 12 20a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10 17a2 2 0 0 1-3-3l7.5-7.5" />,
    palette: <><circle cx="13.5" cy="6.5" r="1" fill="currentColor" stroke="none" /><circle cx="17" cy="10.5" r="1" fill="currentColor" stroke="none" /><circle cx="8.5" cy="7.5" r="1" fill="currentColor" stroke="none" /><circle cx="6.5" cy="12" r="1" fill="currentColor" stroke="none" /><path d="M12 2a10 10 0 0 0 0 20 2.5 2.5 0 0 0 2-4 2.5 2.5 0 0 1 2-4h2a4 4 0 0 0 4-4 10 10 0 0 0-10-8Z" /></>,
    arrowLeft: <path d="M19 12H5m6-7-7 7 7 7" />,
    databases: <><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    gear: <><circle cx="12" cy="12" r="3.2" /><path d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.2A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 2.6 14H2.5a2 2 0 1 1 0-4h.2A1.7 1.7 0 0 0 4.6 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4.6h.1A1.7 1.7 0 0 0 11 2.6V2.5a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1Z" /></>,
    card: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 9.5h19M6 15h4" /></>,
    check: <path d="m5 12 5 5 9-11" />,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" /></>,
    external: <><path d="M14 5h5v5" /><path d="M19 5 11 13" /><path d="M19 13v6H5V5h6" /></>,
    code: <path d="m9 8-5 4 5 4m6-8 5 4-5 4" />,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>,
    chart: <><path d="M4 20V4" /><path d="M4 20h16" /><rect x="7" y="12" width="3" height="5" rx="1" fill="currentColor" stroke="none" /><rect x="12" y="8" width="3" height="9" rx="1" fill="currentColor" stroke="none" /><rect x="17" y="5" width="3" height="12" rx="1" fill="currentColor" stroke="none" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  };
  return <svg {...p}>{s[name] || s.grid}</svg>;
}

/* ------------------------------------------------------------- templates --- */

const TEMPLATES = [
  { title: "Neon Serpent", cat: "Arcade", emoji: "🐍", desc: "Glowing snake with power-ups and boss rounds", scene: "neon", prompt: "a neon snake game with glowing trails, power-ups, and boss rounds" },
  { title: "Orbital Defense", cat: "Action", emoji: "🚀", desc: "Defend a station from meteor waves", scene: "space", prompt: "a space shooter defending a station from waves of meteors and alien ships" },
  { title: "Cookie Empire", cat: "Idle", emoji: "🍪", desc: "Idle clicker with prestige and upgrades", scene: "clicker", prompt: "a cookie-style idle clicker with upgrades, prestige, and golden cookies" },
  { title: "Daily Word", cat: "Puzzle", emoji: "🔤", desc: "Six-guess word puzzle with streaks", scene: "word", prompt: "a daily word puzzle with six guesses, on-screen keyboard, and a streak counter" },
  { title: "Dungeon Draw", cat: "Cards", emoji: "🃏", desc: "Roguelike card battler, room by room", scene: "cards", prompt: "a roguelike card battler where each draw explores a new dungeon room" },
  { title: "Coin Rush", cat: "Platformer", emoji: "🏃", desc: "One-screen platformer against the clock", scene: "platformer", prompt: "a one-screen platformer with coins, spikes, moving platforms, and a timer" },
  { title: "Crown Quest", cat: "Action", emoji: "⚔️", desc: "Fantasy quest with spells and a boss", scene: "fantasy", prompt: "a fantasy quest game with gold, magic spells, and a final boss" },
  { title: "Arcade 84", cat: "Retro", emoji: "👾", desc: "Retro cabinet with a high-score table", scene: "retro", prompt: "a retro arcade game with scanlines, classic colors, and a high-score table" },
  { title: "Brick Breaker", cat: "Arcade", emoji: "🧱", desc: "Neon paddle-and-ball with combos", scene: "neon", prompt: "a brick breaker game with neon bricks, multiball power-ups, and combos" },
  { title: "Star Dodger", cat: "Arcade", emoji: "✨", desc: "Weave through an endless asteroid storm", scene: "space", prompt: "an endless dodging game weaving through asteroids and stars with rising speed" },
  { title: "Tower Siege", cat: "Strategy", emoji: "🏰", desc: "Place towers to hold back the horde", scene: "fantasy", prompt: "a tower defense game placing towers to stop waves of enemies on a winding path" },
  { title: "Match Blitz", cat: "Puzzle", emoji: "💎", desc: "Swap gems for chain-reaction combos", scene: "word", prompt: "a match-three puzzle where you swap gems to make rows and trigger combos on a timer" },
  { title: "Tap Tycoon", cat: "Idle", emoji: "💰", desc: "Grow a tiny empire one tap at a time", scene: "clicker", prompt: "an idle tycoon where tapping earns coins to buy auto-earners and upgrades" },
  { title: "Maze Runner", cat: "Puzzle", emoji: "🌀", desc: "Escape procedurally drawn mazes", scene: "platformer", prompt: "a maze game where you navigate randomly generated mazes against a timer" },
  { title: "Pixel Knight", cat: "Platformer", emoji: "🛡️", desc: "Hop, slash, and grab the crown", scene: "fantasy", prompt: "a pixel platformer where a knight jumps over spikes and slashes slimes to reach the crown" },
  { title: "Bubble Pop", cat: "Arcade", emoji: "🫧", desc: "Aim and pop matching bubble clusters", scene: "neon", prompt: "a bubble shooter where you aim and pop clusters of matching colored bubbles" },
  { title: "Memory Match", cat: "Cards", emoji: "🧠", desc: "Flip cards and remember the pairs", scene: "cards", prompt: "a memory game flipping cards to find matching pairs against a move counter" },
  { title: "Asteroid Field", cat: "Action", emoji: "☄️", desc: "Blast rocks in zero gravity", scene: "space", prompt: "an asteroid blasting game with a rotating ship, thrust, and splitting rocks" },
  { title: "Rhythm Tap", cat: "Retro", emoji: "🎵", desc: "Hit the notes as they fall", scene: "retro", prompt: "a rhythm game where you tap falling notes in time to a beat for combos and score" },
  { title: "Block Stacker", cat: "Puzzle", emoji: "🟦", desc: "Drop and clear falling blocks", scene: "neon", prompt: "a falling-block puzzle where you rotate and drop pieces to clear full rows" },
  { title: "Sky Racer", cat: "Action", emoji: "🏎️", desc: "Dodge traffic at top speed", scene: "space", prompt: "a top-down racing game dodging traffic and collecting boosts at rising speed" },
  { title: "Idle Farm", cat: "Idle", emoji: "🌾", desc: "Plant, harvest, automate, repeat", scene: "clicker", prompt: "an idle farming game planting crops that grow and sell automatically over time" },
];

/* --------------------------------------------------------------- helpers --- */

function displayName(user) {
  const meta = user?.user_metadata || {};
  const raw = meta.full_name || meta.name || user?.email || "builder";
  return String(raw).split("@")[0].split(" ")[0];
}

function Avatar({ user, size = 28 }) {
  const meta = user?.user_metadata || {};
  const avatar = meta.avatar_url || meta.picture || null;
  const initial = displayName(user).trim()[0]?.toUpperCase() || "B";
  if (avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="ava-img" src={avatar} alt="" referrerPolicy="no-referrer" style={{ width: size, height: size }} />;
  }
  return (
    <span className="ava-init" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {initial}
    </span>
  );
}

/* ------------------------------------------------------- scene poster art --- */
/* Each genre gets its own vivid, full-bleed cover so the gallery reads like a
   shelf of real game posters instead of a grid of emoji. */

const stars = (pts) =>
  pts.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity="0.9" />);

// Per-genre palette + the gameplay subject ("motif"). The motif draws inside the
// full 0..320 x 0..200 frame so the same art can be dropped into any treatment.
const SCENES = {
  neon: {
    stops: ["#16e6b8", "#7b4dff", "#ff4d8f"],
    accent: "#39ff8b",
    motif: ({ shadow }) => (
      <>
        <g stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1">
          {[1, 2, 3, 4].map((i) => <line key={`v${i}`} x1={i * 64} y1="0" x2={i * 64} y2="200" />)}
          {[1, 2].map((i) => <line key={`h${i}`} x1="0" y1={i * 66} x2="320" y2={i * 66} />)}
        </g>
        <g fill="#eafff9" filter={shadow}>
          {[[68, 104], [100, 104], [132, 104], [132, 134], [164, 134], [164, 104]].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="26" height="26" rx="7" />
          ))}
        </g>
        <circle cx="232" cy="84" r="13" fill="#ff2d6f" stroke="#fff" strokeWidth="2" filter={shadow} />
      </>
    ),
  },
  space: {
    stops: ["#2438ff", "#7a36e0", "#190a4d"],
    accent: "#9be7ff",
    motif: ({ shadow, fill, id }) => (
      <>
        <radialGradient id={id("planet")} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#ffd76b" />
          <stop offset="1" stopColor="#ff5e8a" />
        </radialGradient>
        {stars([[40, 36, 2.2], [92, 22, 1.4], [148, 46, 1.5], [206, 28, 2.1], [284, 60, 1.5], [300, 30, 1.3], [60, 150, 1.6], [120, 96, 1.3]])}
        <circle cx="232" cy="120" r="50" fill={fill("planet")} filter={shadow} />
        <ellipse cx="232" cy="120" rx="78" ry="19" fill="none" stroke="#ffe6a6" strokeOpacity="0.8" strokeWidth="5" transform="rotate(-18 232 120)" />
        <path d="M58 152 l30 -14 -10 18 20 7 -34 9 z" fill="#9be7ff" filter={shadow} />
      </>
    ),
  },
  clicker: {
    stops: ["#ffc861", "#ff7a3d", "#7a2f12"],
    accent: "#ffe06b",
    motif: ({ shadow, fill, id }) => (
      <>
        <radialGradient id={id("cookie")} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#f6cd83" />
          <stop offset="1" stopColor="#c98a3c" />
        </radialGradient>
        <circle cx="158" cy="108" r="60" fill={fill("cookie")} stroke="#a96f2c" strokeWidth="3" filter={shadow} />
        {[[138, 84], [186, 98], [148, 132], [180, 132], [126, 116], [168, 82]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={7 - (i % 2) * 2} fill="#5a3210" />
        ))}
        <circle cx="252" cy="72" r="13" fill="#ffd76b" stroke="#c98a3c" strokeWidth="3" filter={shadow} />
        <circle cx="72" cy="150" r="11" fill="#ffd76b" stroke="#c98a3c" strokeWidth="3" filter={shadow} />
        <path d="M282 38 l4 11 11 4 -11 4 -4 11 -4 -11 -11 -4 11 -4 z" fill="#fff" opacity="0.85" />
      </>
    ),
  },
  word: {
    stops: ["#19e3a0", "#1aa6c4", "#143a6b"],
    accent: "#ffffff",
    motif: ({ shadow }) => (
      <>
        <g filter={shadow}>
          {["G", "A", "M", "E"].map((ch, i) => (
            <g key={ch} transform={`translate(${44 + i * 60} 56)`}>
              <rect width="48" height="54" rx="9" fill="#ffffff" opacity="0.96" />
              <text x="24" y="38" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="32" fontWeight="800" fill="#14315c">{ch}</text>
            </g>
          ))}
        </g>
        <g fill="#ffffff" opacity="0.4">
          {[0, 1, 2, 3].map((i) => <rect key={i} x={44 + i * 60} y="124" width="48" height="42" rx="9" />)}
        </g>
      </>
    ),
  },
  cards: {
    stops: ["#b362ff", "#6a2bd6", "#240a52"],
    accent: "#ffd54a",
    motif: ({ shadow }) => (
      <g filter={shadow}>
        {[[-16, "♠", "#1a1330"], [0, "♥", "#ff3d6e"], [16, "♦", "#ff8a3d"]].map(([rot, suit, col], i) => (
          <g key={i} transform={`translate(${116 + i * 28} 50) rotate(${rot} 40 56)`}>
            <rect width="80" height="112" rx="12" fill="#fff" stroke="#e3d6ff" strokeWidth="2" />
            <text x="40" y="74" textAnchor="middle" fontSize="46" fill={col}>{suit}</text>
          </g>
        ))}
      </g>
    ),
  },
  platformer: {
    stops: ["#54b8ff", "#3a7bd5", "#10994f"],
    accent: "#ffd233",
    motif: ({ shadow }) => (
      <>
        <circle cx="266" cy="44" r="26" fill="#ffe06b" filter={shadow} />
        <path d="M0 178 q60 -28 120 0 t120 0 t120 0 V200 H0 Z" fill="#0f7a3c" opacity="0.45" />
        <g filter={shadow}>
          <rect x="34" y="140" width="96" height="20" rx="6" fill="#1f7d3e" />
          <rect x="178" y="108" width="92" height="20" rx="6" fill="#1f7d3e" />
        </g>
        <rect x="62" y="108" width="28" height="32" rx="6" fill="#ff5c8a" filter={shadow} />
        <circle cx="214" cy="88" r="11" fill="#ffd233" stroke="#b9860a" strokeWidth="3" filter={shadow} />
      </>
    ),
  },
  fantasy: {
    stops: ["#ff5c8a", "#7a36c2", "#1c0a40"],
    accent: "#ffd54a",
    motif: ({ shadow }) => (
      <>
        {stars([[44, 40, 1.8], [120, 28, 1.4], [276, 44, 2], [300, 90, 1.4], [30, 96, 1.4]])}
        <circle cx="262" cy="48" r="16" fill="#ffe6a6" opacity="0.9" />
        <g fill="#241048" filter={shadow}>
          <rect x="88" y="118" width="144" height="62" />
          <rect x="100" y="92" width="22" height="28" />
          <rect x="149" y="82" width="22" height="38" />
          <rect x="198" y="92" width="22" height="28" />
        </g>
        <g fill="#ffd54a" filter={shadow}>
          <path d="M132 76 l12 -22 12 18 12 -18 12 22 z" />
          <rect x="132" y="76" width="48" height="9" />
        </g>
      </>
    ),
  },
  retro: {
    stops: ["#ff2db5", "#7b2dff", "#0a0a2e"],
    accent: "#39ff8b",
    motif: ({ shadow }) => (
      <>
        <g fill="#39ff8b" filter={shadow}>
          {[[140, 66], [164, 66], [128, 78], [152, 78], [176, 78], [116, 90], [140, 90], [164, 90], [188, 90], [128, 102], [176, 102], [116, 114], [188, 114]].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="14" height="12" />
          ))}
        </g>
        <g fill="#ff3d9a">
          {[[58, 142], [78, 142], [58, 154], [98, 154]].map(([x, y], i) => <rect key={i} x={x} y={y} width="12" height="10" />)}
        </g>
        <g stroke="#ffffff" strokeOpacity="0.08" strokeWidth="3">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <line key={i} x1="0" y1={18 + i * 28} x2="320" y2={18 + i * 28} />)}
        </g>
      </>
    ),
  },
};

// cover: "art" (cinematic key art) · "shot" (in-game screenshot w/ HUD) · "device"
// (game shown on a screen). Mixing them makes the gallery feel like real covers.
function ScenePoster({ scene, cover = "art" }) {
  const raw = useId();
  const uid = raw.replace(/:/g, "");
  const id = (n) => `${uid}-${n}`;
  const fill = (n) => `url(#${id(n)})`;
  const cfg = SCENES[scene] || SCENES.neon;
  const shadow = `url(#${id("shadow")})`;
  const motif = cfg.motif({ shadow, accent: cfg.accent, fill, id });

  const svgProps = {
    viewBox: "0 0 320 200",
    preserveAspectRatio: "xMidYMid slice",
    xmlns: "http://www.w3.org/2000/svg",
    className: "poster",
    "aria-hidden": true,
  };

  const defs = (
    <defs>
      <linearGradient id={id("bg")} x1="0" y1="0" x2="1" y2="1">
        {cfg.stops.map((c, i) => (
          <stop key={i} offset={i / (cfg.stops.length - 1)} stopColor={c} />
        ))}
      </linearGradient>
      <radialGradient id={id("light")} cx="0.5" cy="0.08" r="0.95">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.32" />
        <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={id("vig")} cx="0.5" cy="0.52" r="0.72">
        <stop offset="0.5" stopColor="#000000" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.5" />
      </radialGradient>
      <filter id={id("shadow")} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="3.2" floodColor="#000000" floodOpacity="0.38" />
      </filter>
    </defs>
  );

  const sceneArt = (
    <>
      <rect width="320" height="200" fill={fill("bg")} />
      <rect width="320" height="200" fill={fill("light")} />
      {motif}
      <rect width="320" height="200" fill={fill("vig")} />
    </>
  );

  if (cover === "device") {
    return (
      <svg {...svgProps}>
        {defs}
        <clipPath id={id("screen")}>
          <rect x="30" y="26" width="260" height="148" rx="9" />
        </clipPath>
        <rect width="320" height="200" fill={fill("bg")} />
        <rect width="320" height="200" fill="#05060a" opacity="0.55" />
        <rect x="18" y="14" width="284" height="172" rx="18" fill="#0c0c12" stroke="#2b2b35" strokeWidth="1.5" />
        <g clipPath={`url(#${id("screen")})`}>
          <g transform="translate(30 26) scale(0.8125 0.74)">{sceneArt}</g>
          <polygon points="30,26 148,26 70,174 30,174" fill="#ffffff" opacity="0.06" />
        </g>
      </svg>
    );
  }

  if (cover === "shot") {
    return (
      <svg {...svgProps}>
        {defs}
        {sceneArt}
        <g>
          <rect x="12" y="12" width="92" height="24" rx="12" fill="#05060a" opacity="0.42" />
          <circle cx="26" cy="24" r="6" fill={cfg.accent} />
          <text x="40" y="29" fontFamily="Inter, system-ui, sans-serif" fontSize="13" fontWeight="800" fill="#fff">1240</text>
          <g fill={cfg.accent}>
            {[0, 1, 2].map((i) => <circle key={i} cx={270 + i * 16} cy="24" r="5" />)}
          </g>
          <rect x="12" y="178" width="296" height="8" rx="4" fill="#05060a" opacity="0.4" />
          <rect x="12" y="178" width="188" height="8" rx="4" fill={cfg.accent} opacity="0.92" />
        </g>
      </svg>
    );
  }

  return (
    <svg {...svgProps}>
      {defs}
      {sceneArt}
    </svg>
  );
}

function Thumb({ scene, cover }) {
  return (
    <div className="t-thumb">
      <ScenePoster scene={scene} cover={cover} />
    </div>
  );
}

/* ---------------------------------------------------------------- sidebar --- */

const NAV = [
  { id: "home", label: "Home", icon: "home" },
  { id: "templates", label: "Templates", icon: "compass" },
  { id: "insights", label: "Insights", icon: "chart" },
  { id: "connectors", label: "Connectors", icon: "nodes" },
];

const BOTTOM_NAV = [
  { id: "settings", label: "Settings", icon: "gear" },
  { id: "plans", label: "Plans & credits", icon: "card" },
];

const PROJECT_NAV = [
  { id: "projects", label: "All projects", icon: "grid" },
  { id: "starred", label: "Starred", icon: "star" },
  { id: "created", label: "Created by me", icon: "user" },
  { id: "shared", label: "Shared with me", icon: "users" },
];

function Sidebar({ section, setSection, user, recents, onOpenProject, onSignOut, onNotify }) {
  const [menu, setMenu] = useState(false);
  const name = displayName(user);

  useEffect(() => {
    if (!menu) return;
    const close = (e) => { if (!e.target.closest(".side-id")) setMenu(false); };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menu]);

  return (
    <aside className="side">
      <div className="side-top">
        <span className="brand-logo side-logo">
          <Icon name="controller" />
        </span>
      </div>

      <div className="side-id">
        <button type="button" className="ws-switch" onClick={(e) => { e.stopPropagation(); setMenu((m) => !m); }}>
          <Avatar user={user} size={26} />
          <span>{name}&rsquo;s workspace</span>
          <Icon name="chevron" className="ws-chev" />
        </button>
        {menu && (
          <div className="side-menu" role="menu">
            <div className="side-menu-head">
              <strong>{name}</strong>
              {user?.email && <small>{user.email}</small>}
            </div>
            <button type="button" className="side-menu-item" onClick={onSignOut}>
              <Icon name="signout" /> Sign out
            </button>
          </div>
        )}
      </div>

      <nav className="side-nav">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`side-link ${section === item.id ? "is-active" : ""}`}
            onClick={() => setSection(item.id)}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="side-label">Projects</div>
      <nav className="side-nav">
        {PROJECT_NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`side-link ${section === item.id ? "is-active" : ""}`}
            onClick={() => setSection(item.id)}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {recents.length > 0 && (
        <>
          <div className="side-label">Recents</div>
          <nav className="side-nav">
            {recents.slice(0, 5).map((p) => (
              <button key={p.id} type="button" className="side-link side-recent" onClick={() => onOpenProject(p)} title={p.title}>
                <span>{p.title}</span>
              </button>
            ))}
          </nav>
        </>
      )}

      <div className="side-spacer" />

      <nav className="side-nav">
        {BOTTOM_NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`side-link ${section === item.id ? "is-active" : ""}`}
            onClick={() => setSection(item.id)}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button
        type="button"
        className="side-card"
        onClick={() => {
          navigator.clipboard?.writeText(window.location.origin).then(
            () => onNotify("Referral link copied"),
            () => onNotify("Copy failed")
          );
        }}
      >
        <span>
          <strong>Share Gamecraft</strong>
          <small>Earn build credits per referral</small>
        </span>
        <Icon name="gift" />
      </button>

      <button type="button" className="side-card side-card-pro" onClick={() => setSection("plans")}>
        <span>
          <strong>Go Pro</strong>
          <small>More builds, faster generations</small>
        </span>
        <Icon name="bolt" />
      </button>
    </aside>
  );
}

/* ------------------------------------------------------------- home view --- */

const DESIGN_STYLES = [
  { label: "Neon arcade", note: "a glowing neon arcade look" },
  { label: "Retro pixel", note: "a retro pixel-art arcade look" },
  { label: "Cozy", note: "a warm, cozy, relaxed look" },
  { label: "Fantasy", note: "an ornate fantasy look" },
  { label: "Minimal", note: "a clean, minimal look" },
];

function HomeView({ user, projects, onBuild, onOpenProject, setSection, onNotify }) {
  const [value, setValue] = useState("");
  const [tab, setTab] = useState("projects");
  const [mode, setMode] = useState("Build");
  const [modeOpen, setModeOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [plusView, setPlusView] = useState("menu"); // menu | design
  const ref = useRef(null);
  const fileRef = useRef(null);
  const name = displayName(user);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
  }, [value]);

  useEffect(() => {
    if (!plusOpen) return;
    const close = (e) => {
      if (!e.target.closest(".hp-plus-wrap")) {
        setPlusOpen(false);
        setPlusView("menu");
      }
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [plusOpen]);

  function submit() {
    if (!value.trim()) return;
    onBuild(value.trim());
  }

  function applyStyle(note) {
    setValue((v) => (v.trim() ? `${v.trim()} — give it ${note}.` : `Give it ${note}.`));
    setPlusOpen(false);
    setPlusView("menu");
    setTimeout(() => ref.current?.focus(), 0);
  }

  function onAttach(e) {
    const file = e.target.files?.[0];
    if (file) onNotify?.(`Attached ${file.name}`);
    setPlusOpen(false);
    e.target.value = "";
  }

  const tabItems =
    tab === "templates"
      ? TEMPLATES.slice(0, 6).map((t) => ({ ...t, isTemplate: true }))
      : projects;

  return (
    <div className="home">
      <div className="home-grad" aria-hidden />
      <div className="home-hero">
        <button type="button" className="home-pill" onClick={() => setSection("templates")}>
          <Icon name="sparkle" /> Browse templates <Icon name="chevron" className="pill-arrow" />
        </button>
        <h1>What are we building today, {name}?</h1>

        <div className="home-prompt">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask Gamecraft to build a game…"
            rows={1}
          />
          <div className="home-prompt-bar">
            <div className="hp-plus-wrap">
              <button
                type="button"
                className="hp-plus"
                onClick={(e) => {
                  e.stopPropagation();
                  setPlusView("menu");
                  setPlusOpen((o) => !o);
                }}
                title="Add"
              >
                <Icon name="plus" />
              </button>
              {plusOpen && (
                <div className="plus-menu" onClick={(e) => e.stopPropagation()}>
                  {plusView === "menu" ? (
                    <>
                      <button type="button" className="plus-item" onClick={() => fileRef.current?.click()}>
                        <Icon name="attach" />
                        <span>Attach files</span>
                        <Icon name="chevron" className="plus-arrow" />
                      </button>
                      <button type="button" className="plus-item" onClick={() => setPlusView("design")}>
                        <Icon name="palette" />
                        <span>Design</span>
                        <Icon name="chevron" className="plus-arrow" />
                      </button>
                      <button
                        type="button"
                        className="plus-item"
                        onClick={() => {
                          setSection("connectors");
                          setPlusOpen(false);
                        }}
                      >
                        <Icon name="nodes" />
                        <span>Connectors</span>
                        <Icon name="chevron" className="plus-arrow" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="plus-item plus-back" onClick={() => setPlusView("menu")}>
                        <Icon name="arrowLeft" />
                        <span>Design style</span>
                      </button>
                      {DESIGN_STYLES.map((s) => (
                        <button key={s.label} type="button" className="plus-item" onClick={() => applyStyle(s.note)}>
                          <Icon name="palette" />
                          <span>{s.label}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
              <input ref={fileRef} type="file" hidden onChange={onAttach} />
            </div>
            <div className="hp-right">
              <div className="hp-mode">
                <button type="button" className="hp-mode-btn" onClick={() => setModeOpen((o) => !o)}>
                  {mode} <Icon name="chevron" />
                </button>
                {modeOpen && (
                  <div className="hp-mode-menu">
                    {["Build", "Plan"].map((m) => (
                      <button key={m} type="button" onClick={() => { setMode(m); setModeOpen(false); }}>
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" className="hp-send" onClick={submit} disabled={!value.trim()} aria-label="Build">
                <Icon name="send" />
              </button>
            </div>
          </div>
        </div>

        <div className="home-scroll-hint" aria-hidden>
          <span>Your games</span>
          <Icon name="chevron" />
        </div>
      </div>

      <div className="home-shelf">
        <div className="shelf-head">
          <div className="shelf-tabs">
            <button type="button" className={tab === "projects" ? "is-active" : ""} onClick={() => setTab("projects")}>My projects</button>
            <button type="button" className={tab === "recent" ? "is-active" : ""} onClick={() => setTab("recent")}>Recently viewed</button>
            <button type="button" className={tab === "templates" ? "is-active" : ""} onClick={() => setTab("templates")}>Templates</button>
          </div>
          <button type="button" className="shelf-all" onClick={() => setSection(tab === "templates" ? "templates" : "projects")}>
            Browse all <Icon name="chevron" className="pill-arrow" />
          </button>
        </div>

        {tabItems.length === 0 ? (
          <div className="shelf-empty">
            <p>No games yet — describe one above and it’ll show up here.</p>
          </div>
        ) : (
          <div className="card-grid">
            {tabItems.slice(0, 6).map((item) => (
              <button
                key={item.id || item.title}
                type="button"
                className="card"
                onClick={() => (item.isTemplate ? onBuild(item.prompt) : onOpenProject(item))}
              >
                <Thumb scene={item.scene} />
                <div className="card-body">
                  <Avatar user={user} size={28} />
                  <span className="meta">
                    <strong>{item.title}</strong>
                    <small>{item.isTemplate ? item.desc : relativeTime(item.createdAt)}</small>
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- projects view --- */

function relativeTime(ts) {
  if (!ts) return "Edited recently";
  const diff = Date.now() - ts;
  const day = 86400000;
  if (diff < 60000) return "Edited just now";
  if (diff < day) return "Edited today";
  if (diff < 2 * day) return "Edited yesterday";
  return `Edited ${Math.floor(diff / day)} days ago`;
}

function ProjectsView({ title, user, projects, onOpenProject, setSection }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = projects.filter((p) => !q || `${p.title} ${p.prompt}`.toLowerCase().includes(q));
    list = [...list].sort((a, b) =>
      sort === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
    );
    return list;
  }, [projects, query, sort]);

  return (
    <div className="page">
      <div className="page-head">
        <h1>{title}</h1>
        <button type="button" className="btn btn-soft" onClick={() => setSection("home")}>
          <Icon name="plus" /> Create
        </button>
      </div>

      <div className="proj-filters">
        <label className="proj-search">
          <Icon name="search" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects…" />
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="proj-select">
          <option value="newest">Last edited</option>
          <option value="oldest">Oldest first</option>
        </select>
        <div className="proj-view">
          <button type="button" className={view === "grid" ? "is-active" : ""} onClick={() => setView("grid")} aria-label="Grid view">
            <Icon name="gridView" />
          </button>
          <button type="button" className={view === "list" ? "is-active" : ""} onClick={() => setView("list")} aria-label="List view">
            <Icon name="listView" />
          </button>
        </div>
      </div>

      <h2 className="proj-sub">Active in last 60 days</h2>

      {filtered.length === 0 ? (
        <div className="proj-empty">
          <div className="brand-logo" style={{ width: 48, height: 48, borderRadius: 14 }}>
            <Icon name="controller" />
          </div>
          <h3>No games here yet</h3>
          <p>Head to Home and describe a game — your builds will collect here.</p>
          <button type="button" className="btn btn-primary" onClick={() => setSection("home")}>
            <Icon name="plus" /> Create a game
          </button>
        </div>
      ) : view === "grid" ? (
        <div className="card-grid">
          {filtered.map((p) => (
            <button key={p.id} type="button" className="card" onClick={() => onOpenProject(p)}>
              <Thumb scene={p.scene} />
              <div className="card-body">
                <Avatar user={user} size={28} />
                <span className="meta">
                  <strong>{p.title}</strong>
                  <small>{relativeTime(p.createdAt)}</small>
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="proj-list">
          {filtered.map((p) => (
            <button key={p.id} type="button" className="proj-row" onClick={() => onOpenProject(p)}>
              <span className={`scene scene-${p.scene} proj-row-thumb`} />
              <span className="proj-row-main">
                <strong>{p.title}</strong>
                <small>{p.prompt}</small>
              </span>
              <span className="proj-row-time">{relativeTime(p.createdAt)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------- resources view --- */

const RES_COVERS = ["shot", "art", "device"];

function TemplatesView({ onBuild }) {
  return (
    <div className="page res-page">
      <div className="res-head">
        <h1>Game templates</h1>
        <p>Start from a template to build your next game — {TEMPLATES.length} ready-made starters across every genre. Click one to build it.</p>
      </div>

      <div className="card-grid res-grid">
        {TEMPLATES.map((t, i) => (
          <button key={t.title} type="button" className="card res-card" onClick={() => onBuild(t.prompt)}>
            <Thumb scene={t.scene} cover={RES_COVERS[i % RES_COVERS.length]} />
            <div className="res-card-body">
              <strong>{t.title}</strong>
              <small>{t.desc}</small>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------- connectors view --- */

// A curated directory of integrations that make sense for an AI game builder.
// "connected" marks what Gamecraft actually runs on today; the rest are
// catalogued and light up "coming soon" until wired.
const CONNECTOR_CATS = [
  "AI & Audio",
  "Art & Assets",
  "Backend & Data",
  "Payments",
  "Publishing",
  "Community",
  "Analytics",
  "Email",
];

const CONNECTORS = [
  // AI & Audio
  { name: "Claude", cat: "AI & Audio", c: "#d97757", desc: "Generate complete, playable games from a single sentence.", connected: true },
  { name: "ElevenLabs", cat: "AI & Audio", c: "#5b8cff", desc: "Add AI voices, narration, and sound effects to your games." },
  { name: "Replicate", cat: "AI & Audio", c: "#7c3aed", desc: "Generate sprites, art, and audio with open-source AI models." },
  { name: "HeyGen", cat: "AI & Audio", c: "#4b3df5", desc: "Make AI trailers and avatar intros to promote your games." },
  { name: "Perplexity", cat: "AI & Audio", c: "#20808d", desc: "Power trivia and quiz games with a live answer engine." },

  // Art & Assets
  { name: "Figma", cat: "Art & Assets", c: "#f24e1e", desc: "Design game UI and import frames straight into a build." },
  { name: "Canva", cat: "Art & Assets", c: "#00c4cc", desc: "Create thumbnails, key art, and promo graphics for your games." },
  { name: "AWS S3", cat: "Art & Assets", c: "#ff9900", desc: "Store and serve large game assets, sprites, and builds." },

  // Backend & Data
  { name: "Supabase", cat: "Backend & Data", c: "#3ecf8e", desc: "Cloud saves, player accounts, and global leaderboards.", connected: true },
  { name: "Airtable", cat: "Backend & Data", c: "#fcb400", desc: "Manage levels, items, and config in a visual database." },
  { name: "Google Sheets", cat: "Backend & Data", c: "#0f9d58", desc: "Drive game balancing and content from a spreadsheet." },
  { name: "BigQuery", cat: "Backend & Data", c: "#4285f4", desc: "Analyze player data and game telemetry at scale." },
  { name: "Snowflake", cat: "Backend & Data", c: "#29b5e8", desc: "Warehouse and model your player analytics." },

  // Payments
  { name: "Stripe", cat: "Payments", c: "#635bff", desc: "Sell games, season passes, and in-game items." },
  { name: "Paddle", cat: "Payments", c: "#f4c430", desc: "Sell worldwide with sales tax handled for you." },
  { name: "Polar", cat: "Payments", c: "#4f7cff", desc: "Subscriptions and creator billing for your games." },
  { name: "Shopify", cat: "Payments", c: "#95bf47", desc: "Sell merch and physical goods alongside your games." },

  // Publishing
  { name: "WordPress.com", cat: "Publishing", c: "#21759b", desc: "Embed your games on any WordPress site." },
  { name: "Notion", cat: "Publishing", c: "#8b8b94", desc: "Drop playable games right into Notion pages." },
  { name: "Twitch", cat: "Publishing", c: "#9146ff", desc: "Showcase and stream your games to viewers." },
  { name: "TikTok", cat: "Publishing", c: "#fe2c55", desc: "Share game clips and grow your audience." },

  // Community
  { name: "Discord", cat: "Community", c: "#5865f2", desc: "Player communities, drop alerts, and bot integrations." },
  { name: "Slack", cat: "Community", c: "#36c5f0", desc: "Get build, sale, and milestone notifications." },
  { name: "Telegram", cat: "Community", c: "#229ed9", desc: "Run player community bots and broadcasts." },
  { name: "Twilio", cat: "Community", c: "#f22f46", desc: "Text players about events, drops, and sales." },

  // Analytics
  { name: "PostHog", cat: "Analytics", c: "#f54e00", desc: "Player funnels, retention, and feature flags." },
  { name: "Amplitude", cat: "Analytics", c: "#1f6fff", desc: "Track how players move through your games." },
  { name: "Google Search Console", cat: "Analytics", c: "#4285f4", desc: "See how players discover your game pages." },
  { name: "Semrush", cat: "Analytics", c: "#ff642d", desc: "SEO and keyword research for your game pages." },
  { name: "Algolia", cat: "Analytics", c: "#5468ff", desc: "Fast search across your published game catalog." },

  // Email
  { name: "Resend", cat: "Email", c: "#8b8b94", desc: "Send players receipts and update emails." },
  { name: "Mailgun", cat: "Email", c: "#c02126", desc: "Reliable transactional email for your games." },
  { name: "Brevo", cat: "Email", c: "#0b996e", desc: "Email, SMS, and marketing automation in one place." },
];

function ConnectorsView({ onNotify }) {
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const map = { All: CONNECTORS.length };
    for (const c of CONNECTOR_CATS) {
      map[c] = CONNECTORS.filter((x) => x.cat === c).length;
    }
    return map;
  }, []);

  const enabledCount = useMemo(
    () => CONNECTORS.filter((c) => c.connected).length,
    []
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CONNECTORS.filter((c) => {
      if (cat !== "All" && c.cat !== cat) return false;
      if (q && !`${c.name} ${c.desc}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [cat, query]);

  return (
    <div className="page cx-page">
      <div className="page-head">
        <h1>Connectors</h1>
      </div>
      <p className="page-lead">
        Plug your games into the tools you already use. <strong>{enabledCount} connected</strong> and
        ready — the rest are on the way. Pick a category or search to explore.
      </p>

      <div className="cx-bar">
        <label className="proj-search cx-search">
          <Icon name="search" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search connectors…" />
        </label>
      </div>

      <div className="cx-cats">
        {["All", ...CONNECTOR_CATS].map((c) => (
          <button
            key={c}
            type="button"
            className={`cx-cat ${cat === c ? "is-active" : ""}`}
            onClick={() => setCat(c)}
          >
            {c} <span className="cx-cat-n">{counts[c] ?? 0}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="ins-empty">No connectors match “{query}”.</p>
      ) : (
        <div className="cx-grid">
          {list.map((c) => (
            <div key={c.name} className="cx-card">
              <span className="cx-tile" style={{ background: c.c }}>
                {c.name[0]}
              </span>
              <span className="cx-main">
                <strong>{c.name}</strong>
                <small>{c.desc}</small>
              </span>
              {c.connected ? (
                <span className="cx-pill cx-pill-on">
                  <Icon name="check" /> Connected
                </span>
              ) : (
                <button
                  type="button"
                  className="cx-connect"
                  onClick={() => onNotify?.(`${c.name} connector is coming soon`)}
                >
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="cx-foot">
        <span>
          <strong>Missing a connector?</strong>
          <small>Tell us what you’d plug your games into.</small>
        </span>
        <button type="button" className="btn btn-soft" onClick={() => onNotify?.("Thanks — we’ll consider it!")}>
          <Icon name="plus" /> Request
        </button>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- settings view --- */

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={`switch ${on ? "is-on" : ""}`}
      onClick={() => onChange(!on)}
    >
      <span className="switch-dot" />
    </button>
  );
}

function SettingsView({ user, onNotify }) {
  const meta = user?.user_metadata || {};
  const [name, setName] = useState(meta.full_name || meta.name || displayName(user));
  const [prefs, setPrefs] = useState({ summaries: true, publicProfile: false, sounds: true });
  const togglePref = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="page set-page">
      <div className="page-head">
        <h1>Settings</h1>
      </div>
      <p className="page-lead">Manage your workspace. More options are on the way — this is just the start.</p>

      <section className="set-card">
        <div className="set-card-head">
          <h2>Account</h2>
          <p>Your profile across Gamecraft.</p>
        </div>
        <div className="set-row">
          <label htmlFor="set-name">Display name</label>
          <input id="set-name" className="set-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="set-row">
          <label htmlFor="set-email">Email</label>
          <input id="set-email" className="set-input" value={user?.email || ""} readOnly />
        </div>
        <div className="set-actions">
          <button type="button" className="btn btn-primary" onClick={() => onNotify("Profile saved")}>Save changes</button>
        </div>
      </section>

      <section className="set-card">
        <div className="set-card-head">
          <h2>Preferences</h2>
          <p>Tune how Gamecraft behaves. Placeholders for now.</p>
        </div>
        {[
          { key: "summaries", label: "Email me build summaries", desc: "A recap whenever a game finishes generating." },
          { key: "publicProfile", label: "Public profile", desc: "Let others discover the games you publish." },
          { key: "sounds", label: "Interface sounds", desc: "Small clicks and chimes around the app." },
        ].map((row) => (
          <div className="set-toggle-row" key={row.key}>
            <span>
              <strong>{row.label}</strong>
              <small>{row.desc}</small>
            </span>
            <Toggle on={prefs[row.key]} onChange={() => togglePref(row.key)} />
          </div>
        ))}
      </section>

      <section className="set-card set-danger">
        <div className="set-card-head">
          <h2>Danger zone</h2>
          <p>Permanent actions. Wired up later.</p>
        </div>
        <div className="set-actions">
          <button type="button" className="btn btn-soft" onClick={() => onNotify("Account deletion isn’t available yet")}>Delete account</button>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------ plans view --- */

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cadence: "/ month",
    tagline: "For trying things out.",
    features: ["25 build credits / month", "Single-file HTML export", "Community gallery access"],
    current: true,
  },
  {
    name: "Pro",
    price: "$19",
    cadence: "/ month",
    tagline: "For builders shipping often.",
    features: ["1,000 build credits / month", "Faster generations", "Private projects", "Priority support"],
    featured: true,
  },
  {
    name: "Studio",
    price: "$49",
    cadence: "/ month",
    tagline: "For teams and power users.",
    features: ["Unlimited builds", "Team workspaces", "Custom connectors", "Early access features"],
  },
];

function PlansView({ onNotify }) {
  const used = 13;
  const total = 25;
  const pct = Math.round((used / total) * 100);

  return (
    <div className="page plans-page">
      <div className="page-head">
        <h1>Plans &amp; credits</h1>
      </div>
      <p className="page-lead">You’re on the Free plan. Upgrades aren’t live yet — these are placeholders so you can see the shape of it.</p>

      <section className="credits-card">
        <div className="credits-top">
          <span>
            <strong>{total - used} build credits left</strong>
            <small>{used} of {total} used this month · resets in 16 days</small>
          </span>
          <button type="button" className="btn btn-primary" onClick={() => onNotify("Buying credits is coming soon")}>
            <Icon name="bolt" /> Get more credits
          </button>
        </div>
        <div className="credits-bar">
          <i style={{ width: `${pct}%` }} />
        </div>
      </section>

      <div className="plan-grid">
        {PLANS.map((p) => (
          <div key={p.name} className={`plan-card ${p.featured ? "is-featured" : ""}`}>
            {p.featured && <span className="plan-badge">Most popular</span>}
            <h3>{p.name}</h3>
            <p className="plan-tag">{p.tagline}</p>
            <div className="plan-price">
              <strong>{p.price}</strong>
              <span>{p.cadence}</span>
            </div>
            <ul className="plan-features">
              {p.features.map((f) => (
                <li key={f}><Icon name="check" /> {f}</li>
              ))}
            </ul>
            <button
              type="button"
              className={`btn ${p.featured ? "btn-primary" : "btn-soft"} plan-cta`}
              disabled={p.current}
              onClick={() => onNotify(`${p.name} plan is coming soon`)}
            >
              {p.current ? "Current plan" : `Upgrade to ${p.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------- insights view --- */

const SCENE_LABELS = {
  neon: "Neon / arcade",
  space: "Space",
  clicker: "Idle / clicker",
  word: "Word & puzzle",
  cards: "Cards",
  platformer: "Platformer",
  fantasy: "Fantasy",
  retro: "Retro",
};

function fmtDuration(ms) {
  if (!ms || ms < 1000) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem ? `${m}m ${rem}s` : `${m}m`;
}

function InsightsView({ projects }) {
  const [sessions, setSessions] = useState(null); // null = loading, [] = none

  useEffect(() => {
    let active = true;
    listSessions().then((rows) => {
      if (active) setSessions(Array.isArray(rows) ? rows : []);
    });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalGames = projects.length;
    const totalPlays = projects.reduce((sum, p) => sum + (p.plays || 0), 0);
    const published = projects.filter((p) => p.visibility === "public").length;

    const byScene = {};
    for (const p of projects) {
      const key = p.scene || "neon";
      byScene[key] = (byScene[key] || 0) + 1;
    }
    const scenes = Object.entries(byScene)
      .map(([scene, count]) => ({ scene, count }))
      .sort((a, b) => b.count - a.count);

    const topGames = [...projects]
      .sort((a, b) => (b.plays || 0) - (a.plays || 0))
      .slice(0, 5);

    return { totalGames, totalPlays, published, scenes, topGames };
  }, [projects]);

  const avgSession = useMemo(() => {
    if (!sessions || !sessions.length) return 0;
    const sum = sessions.reduce((a, s) => a + (s.duration_ms || 0), 0);
    return sum / sessions.length;
  }, [sessions]);

  const maxSceneCount = stats.scenes.length ? stats.scenes[0].count : 0;

  const cards = [
    { label: "Games built", value: stats.totalGames.toLocaleString(), icon: "controller" },
    { label: "Total plays", value: stats.totalPlays.toLocaleString(), icon: "play" },
    { label: "Published", value: stats.published.toLocaleString(), icon: "external" },
    {
      label: "Avg. play time",
      value: sessions === null ? "…" : fmtDuration(avgSession),
      icon: "clock",
    },
  ];

  return (
    <div className="page ins-page">
      <div className="page-head">
        <h1>Insights</h1>
      </div>
      <p className="page-lead">
        How your games are performing. Play counts and play-time come from people playing your
        <strong> published</strong> games — publish more to see these grow.
      </p>

      <div className="ins-cards">
        {cards.map((c) => (
          <div key={c.label} className="ins-card">
            <span className="ins-card-ico"><Icon name={c.icon} /></span>
            <strong>{c.value}</strong>
            <small>{c.label}</small>
          </div>
        ))}
      </div>

      <div className="ins-grid">
        <section className="ins-panel">
          <h2>Top games by plays</h2>
          {stats.topGames.length === 0 || stats.totalPlays === 0 ? (
            <p className="ins-empty">No plays yet. Publish a game and share its link to start collecting plays.</p>
          ) : (
            <ol className="ins-top">
              {stats.topGames.map((g) => (
                <li key={g.id || g.title}>
                  <span className={`scene scene-${g.scene} ins-top-thumb`} />
                  <span className="ins-top-main">
                    <strong>{g.title}</strong>
                    <small>{(g.plays || 0).toLocaleString()} plays</small>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="ins-panel">
          <h2>What you build most</h2>
          {stats.scenes.length === 0 ? (
            <p className="ins-empty">Build a game to see your genre mix here.</p>
          ) : (
            <ul className="ins-bars">
              {stats.scenes.map(({ scene, count }) => (
                <li key={scene}>
                  <span className="ins-bar-label">{SCENE_LABELS[scene] || scene}</span>
                  <span className="ins-bar-track">
                    <i style={{ width: `${maxSceneCount ? (count / maxSceneCount) * 100 : 0}%` }} />
                  </span>
                  <span className="ins-bar-count">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/* -------------------------------------------------------- command palette --- */

function ProjectPreview({ project, user }) {
  const meta = user?.user_metadata || {};
  const author = meta.full_name || meta.name || displayName(user);
  const when = relativeTime(project.createdAt).replace(/^Edited /, "");
  return (
    <div className="cmdk-pv">
      <div className="cmdk-pv-thumb">
        <ScenePoster scene={project.scene} />
      </div>
      <h3>{project.title}</h3>
      <dl className="cmdk-pv-grid">
        <div><dt>Created by</dt><dd>{author}</dd></div>
        <div><dt>Status</dt><dd>Private</dd></div>
        <div><dt>Created</dt><dd>{when}</dd></div>
        <div><dt>Last edited</dt><dd>{when}</dd></div>
      </dl>
      {project.prompt && <p className="cmdk-pv-prompt">{project.prompt}</p>}
    </div>
  );
}

function CommandPalette({ open, onClose, recents, onOpenProject, onNavigate, onNotify, user }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    return () => clearTimeout(t);
  }, [open]);

  const run = (fn) => {
    onClose();
    fn?.();
  };

  const projItems = useMemo(
    () =>
      recents.slice(0, 8).map((p) => ({
        id: `p-${p.id}`,
        group: "Recent projects",
        label: p.title,
        icon: "play",
        project: p,
        run: () => onOpenProject(p),
      })),
    [recents, onOpenProject]
  );

  const navItems = useMemo(
    () => [
      { id: "home", group: "Navigate to", label: "Dashboard", icon: "home", desc: "Your home and build prompt", run: () => onNavigate("home") },
      { id: "new", group: "Navigate to", label: "Create new game", icon: "plus", desc: "Start a fresh build from a blank prompt", run: () => onNavigate("home") },
      { id: "projects", group: "Navigate to", label: "All projects", icon: "grid", desc: "Everything you've built", run: () => onNavigate("projects") },
      { id: "starred", group: "Navigate to", label: "Starred", icon: "star", desc: "Games you've starred", run: () => onNavigate("starred") },
      { id: "templates", group: "Navigate to", label: "Templates", icon: "compass", desc: "Ready-made games to remix", run: () => onNavigate("templates") },
      { id: "insights", group: "Navigate to", label: "Insights", icon: "chart", desc: "Plays, play-time, and your genre mix", run: () => onNavigate("insights") },
      { id: "connectors", group: "Navigate to", label: "Connectors", icon: "nodes", desc: "External integrations", run: () => onNavigate("connectors") },
      { id: "settings", group: "Settings", label: "Settings", icon: "gear", desc: "Workspace preferences", run: () => onNavigate("settings") },
      { id: "plans", group: "Settings", label: "Plans & credits", icon: "card", desc: "Upgrade for more builds and faster generations", run: () => onNavigate("plans") },
    ],
    [onNavigate]
  );

  const q = query.trim().toLowerCase();
  const items = useMemo(() => {
    const all = [...projItems, ...navItems];
    return all.filter((it) => !q || `${it.label} ${it.desc || ""} ${it.project?.prompt || ""}`.toLowerCase().includes(q));
  }, [projItems, navItems, q]);

  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, items.length - 1)));
  }, [items.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const it = items[active];
        if (it) run(it.run);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items, active]);

  if (!open) return null;

  const groups = ["Recent projects", "Navigate to", "Settings"];
  const activeItem = items[active];

  return (
    <div className="cmdk-overlay" onMouseDown={onClose}>
      <div className="cmdk" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="cmdk-search">
          <Icon name="search" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            aria-label="Search"
          />
          <button type="button" className="cmdk-close" onClick={onClose} aria-label="Close search">
            <Icon name="close" />
          </button>
        </div>

        <div className="cmdk-body">
          <div className="cmdk-list">
            {items.length === 0 ? (
              <div className="cmdk-empty">No results for “{query}”.</div>
            ) : (
              groups.map((g) => {
                const groupItems = items.filter((it) => it.group === g);
                if (!groupItems.length) return null;
                return (
                  <div className="cmdk-group" key={g}>
                    <div className="cmdk-group-label">{g}</div>
                    {groupItems.map((it) => {
                      const idx = items.indexOf(it);
                      return (
                        <button
                          key={it.id}
                          type="button"
                          className={`cmdk-item ${idx === active ? "is-active" : ""}`}
                          onMouseMove={() => setActive(idx)}
                          onClick={() => run(it.run)}
                        >
                          <span className="cmdk-item-ico"><Icon name={it.icon} /></span>
                          <span className="cmdk-item-label">{it.label}</span>
                          {it.project && <Icon name="chevron" className="cmdk-item-go" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          <div className="cmdk-preview">
            {activeItem ? (
              activeItem.project ? (
                <ProjectPreview project={activeItem.project} user={user} />
              ) : (
                <div className="cmdk-pv-nav">
                  <span className="cmdk-pv-ico"><Icon name={activeItem.icon} /></span>
                  <h3>{activeItem.label}</h3>
                  <p>{activeItem.desc}</p>
                </div>
              )
            ) : (
              <div className="cmdk-pv-nav cmdk-pv-blank">
                <span className="cmdk-pv-ico"><Icon name="search" /></span>
                <p>Search projects, pages and settings.</p>
              </div>
            )}
          </div>
        </div>

        <div className="cmdk-foot">
          <span className="cmdk-brand">
            <span className="brand-logo cmdk-logo"><Icon name="controller" /></span>
          </span>
          <span className="cmdk-hint">
            {activeItem?.project ? "Open project" : "Go"} <kbd>↵</kbd>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- dashboard --- */

const TITLES = {
  projects: "All projects",
  starred: "Starred",
  created: "Created by me",
  shared: "Shared with me",
};

export default function Dashboard({ user, projects, onBuild, onOpenProject, onSignOut, onNotify }) {
  const [section, setSection] = useState("home");
  const [paletteOpen, setPaletteOpen] = useState(false);

  const recents = useMemo(
    () => [...projects].sort((a, b) => b.createdAt - a.createdAt),
    [projects]
  );

  // "Starred / Created / Shared" reuse the project list for now.
  const sectionProjects = section === "shared" ? [] : projects;

  // Cmd/Ctrl-K toggles the command palette from anywhere in the dashboard.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app">
      <Sidebar
        section={section}
        setSection={setSection}
        user={user}
        recents={recents}
        onOpenProject={onOpenProject}
        onSignOut={onSignOut}
        onNotify={onNotify}
      />
      <main className="app-main">
        {section === "home" && (
          <HomeView user={user} projects={recents} onBuild={onBuild} onOpenProject={onOpenProject} setSection={setSection} onNotify={onNotify} />
        )}
        {["projects", "starred", "created", "shared"].includes(section) && (
          <ProjectsView
            title={TITLES[section]}
            user={user}
            projects={sectionProjects}
            onOpenProject={onOpenProject}
            setSection={setSection}
          />
        )}
        {section === "templates" && <TemplatesView onBuild={onBuild} />}
        {section === "insights" && <InsightsView projects={projects} />}
        {section === "connectors" && <ConnectorsView onNotify={onNotify} />}
        {section === "settings" && <SettingsView user={user} onNotify={onNotify} />}
        {section === "plans" && <PlansView onNotify={onNotify} />}
      </main>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        recents={recents}
        onOpenProject={onOpenProject}
        onNavigate={(s) => setSection(s)}
        onNotify={onNotify}
        user={user}
      />
    </div>
  );
}
