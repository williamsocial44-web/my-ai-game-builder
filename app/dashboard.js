"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  };
  return <svg {...p}>{s[name] || s.grid}</svg>;
}

/* ------------------------------------------------------------- templates --- */

const CATEGORIES = ["All", "Arcade", "Action", "Puzzle", "Idle", "Cards", "Platformer", "Strategy", "Retro"];

const SCENE_EMOJI = {
  neon: "🐍",
  space: "🚀",
  clicker: "🍪",
  word: "🔤",
  cards: "🃏",
  platformer: "🏃",
  fantasy: "⚔️",
  retro: "👾",
};

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

function Thumb({ scene, title, emoji }) {
  const glyph = emoji || SCENE_EMOJI[scene] || "🎮";
  return (
    <div className="t-thumb">
      <div className={`scene scene-${scene}`}>
        <span className="scene-emoji" aria-hidden>{glyph}</span>
        <span className="scene-title">{title}</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- sidebar --- */

const NAV = [
  { id: "home", label: "Home", icon: "home" },
  { id: "search", label: "Search", icon: "search", kbd: "Ctrl K" },
  { id: "resources", label: "Resources", icon: "compass" },
  { id: "connectors", label: "Connectors", icon: "nodes" },
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
            {item.kbd && <kbd>{item.kbd}</kbd>}
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

      <button type="button" className="side-card side-card-pro" onClick={() => onNotify("Pro plans are coming soon")}>
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
        <button type="button" className="home-pill" onClick={() => setSection("resources")}>
          <Icon name="sparkle" /> Browse the game gallery <Icon name="chevron" className="pill-arrow" />
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
          <button type="button" className="shelf-all" onClick={() => setSection(tab === "templates" ? "resources" : "projects")}>
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
                <Thumb scene={item.scene} title={item.title} emoji={item.emoji} />
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
              <Thumb scene={p.scene} title={p.title} />
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

function ResourcesView({ onBuild }) {
  const [cat, setCat] = useState("All");
  const list = cat === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.cat === cat);

  return (
    <div className="page res-page">
      <div className="page-head">
        <h1>Game gallery</h1>
      </div>
      <p className="page-lead">Pick a starting point — {TEMPLATES.length} ready-made games across every genre. Click one to build it.</p>

      <div className="cat-tabs">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={`cat-tab ${cat === c ? "is-active" : ""}`}
            onClick={() => setCat(c)}
          >
            {c}
            {c !== "All" && <span className="cat-count">{TEMPLATES.filter((t) => t.cat === c).length}</span>}
          </button>
        ))}
      </div>

      <div className="card-grid res-grid">
        {list.map((t) => (
          <button key={t.title} type="button" className="card" onClick={() => onBuild(t.prompt)}>
            <Thumb scene={t.scene} title={t.title} emoji={t.emoji} />
            <div className="card-body card-body-tpl">
              <span className="meta">
                <strong>{t.title}</strong>
                <small>{t.desc}</small>
              </span>
              <span className="card-cat">{t.cat}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------- connectors view --- */

function ConnectorsView({ onBuild, onNotify }) {
  const cards = [
    { title: "Neon arcade kit", desc: "Glow, particles, and punchy HUD feedback baked in.", prompt: "a neon arcade game with glowing HUD, particle bursts, score streaks, and three power-ups" },
    { title: "Cozy starter", desc: "Warm palette, soft animation, relaxed pacing.", prompt: "a cozy casual game with soft colors, gentle animations, and a relaxing loop" },
    { title: "Retro cabinet", desc: "Scanlines, chunky pixels, classic high-score energy.", prompt: "a retro arcade game with scanlines, pixel art, and an old-school high-score table" },
    { title: "Export target", desc: "Clean start/restart flow ready for one-file export.", prompt: "a polished HTML game with a clear start button, restart flow, and export-ready layout" },
  ];
  return (
    <div className="page">
      <div className="page-head">
        <h1>Connectors</h1>
      </div>
      <p className="page-lead">Drop a ready-made direction into the builder.</p>
      <div className="conn-grid">
        {cards.map((c) => (
          <button key={c.title} type="button" className="conn-card" onClick={() => onBuild(c.prompt)}>
            <Icon name="nodes" />
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- search view --- */

function SearchView({ projects, onOpenProject, onBuild, user }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matchedProjects = projects.filter((p) => q && `${p.title} ${p.prompt}`.toLowerCase().includes(q));
  const matchedTemplates = TEMPLATES.filter((t) => q && `${t.title} ${t.desc} ${t.prompt}`.toLowerCase().includes(q));

  return (
    <div className="page">
      <div className="page-head">
        <h1>Search</h1>
      </div>
      <label className="proj-search search-big">
        <Icon name="search" />
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your games and templates…" />
      </label>

      {!q ? (
        <p className="page-lead">Type to search across your projects and the template gallery.</p>
      ) : (
        <>
          {matchedProjects.length > 0 && (
            <>
              <h2 className="proj-sub">Your games</h2>
              <div className="card-grid">
                {matchedProjects.map((p) => (
                  <button key={p.id} type="button" className="card" onClick={() => onOpenProject(p)}>
                    <Thumb scene={p.scene} title={p.title} />
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
            </>
          )}
          <h2 className="proj-sub">Templates</h2>
          {matchedTemplates.length === 0 ? (
            <p className="page-lead">No templates match “{query}”.</p>
          ) : (
            <div className="card-grid res-grid">
              {matchedTemplates.map((t) => (
                <button key={t.title} type="button" className="card" onClick={() => onBuild(t.prompt)}>
                  <Thumb scene={t.scene} title={t.title} emoji={t.emoji} />
                  <div className="card-body card-body-tpl">
                    <span className="meta">
                      <strong>{t.title}</strong>
                      <small>{t.desc}</small>
                    </span>
                    <span className="card-cat">{t.cat}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
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

  const recents = useMemo(
    () => [...projects].sort((a, b) => b.createdAt - a.createdAt),
    [projects]
  );

  // "Starred / Created / Shared" reuse the project list for now.
  const sectionProjects = section === "shared" ? [] : projects;

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
        {section === "resources" && <ResourcesView onBuild={onBuild} />}
        {section === "connectors" && <ConnectorsView onBuild={onBuild} onNotify={onNotify} />}
        {section === "search" && (
          <SearchView projects={projects} onOpenProject={onOpenProject} onBuild={onBuild} user={user} />
        )}
      </main>
    </div>
  );
}
