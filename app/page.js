"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./providers";
import AuthModal from "./auth-modal";
import Dashboard from "./dashboard";
import { wrapPreviewHtml } from "../lib/preview";
import { listGames, createGame, publishGame, updateGameHtml, listPublicGames } from "../lib/games";
import { QUALITY_OPTIONS } from "../lib/quality";

/* --------------------------------------------------------------- content --- */

const CYCLE_WORDS = ["playable", "addictive", "arcade", "magical", "yours"];

const SUGGESTIONS = [
  { label: "Neon snake", icon: "spark", prompt: "a neon snake game with glowing trails, power-ups, and boss rounds" },
  { label: "Space shooter", icon: "rocket", prompt: "a space shooter defending a station from waves of meteors and alien ships" },
  { label: "Idle clicker", icon: "coin", prompt: "a cookie-style idle clicker with upgrades, prestige, and satisfying numbers" },
  { label: "Word puzzle", icon: "grid", prompt: "a daily word puzzle with six guesses, hints, and a streak counter" },
  { label: "Card battler", icon: "cards", prompt: "a roguelike card battler where each draw explores a new dungeon room" },
  { label: "Platformer", icon: "flag", prompt: "a one-screen platformer with coins, spikes, moving platforms, and a timer" },
];

const COMMUNITY = [
  { title: "Neon Serpent", author: "arcadelab", remixes: "2.4k", scene: "neon", color: "#06d6a0" },
  { title: "Orbital Defense", author: "starforge", remixes: "1.8k", scene: "space", color: "#5b8cff", prompt: "a space shooter defending a station from meteor waves with upgrades" },
  { title: "Cookie Empire", author: "idlemakers", remixes: "3.1k", scene: "clicker", color: "#ffc660", prompt: "a cozy cookie clicker with upgrades, prestige levels and golden cookies" },
  { title: "Daily Word", author: "puzzlefox", remixes: "920", scene: "word", color: "#3ddc84", prompt: "a word puzzle with six guesses, on-screen keyboard, and a streak counter" },
  { title: "Dungeon Draw", author: "deckwright", remixes: "1.2k", scene: "cards", color: "#b362ff", prompt: "a roguelike card battler exploring a dungeon room by room" },
  { title: "Coin Rush", author: "pixeljump", remixes: "640", scene: "platformer", color: "#ff7a59", prompt: "a one-screen platformer with coins, spikes and a countdown timer" },
  { title: "Crown Quest", author: "mythmakers", remixes: "1.5k", scene: "fantasy", color: "#ffd700", prompt: "a fantasy quest game with gold, magic spells and a final boss" },
  { title: "Arcade 84", author: "retrowave", remixes: "880", scene: "retro", color: "#ff006e", prompt: "a retro arcade game with scanlines, classic colors and a high-score table" },
  { title: "Neon Serpent II", author: "arcadelab", remixes: "710", scene: "neon", color: "#06d6a0", prompt: "a fast neon snake with portals, combo trails and boss rounds" },
];

const TABS = ["Popular", "Discover", "Arcade", "Puzzle"];

// Which scenes each community tab surfaces (Popular/Discover show everything).
const TAB_SCENES = {
  Arcade: ["neon", "space", "platformer", "retro"],
  Puzzle: ["word", "cards"],
};

function filterByTab(items, tab) {
  const scenes = TAB_SCENES[tab];
  if (!scenes) return items; // Popular / Discover: everything
  const matched = items.filter((it) => scenes.includes(it.scene));
  return matched.length ? matched : items; // never show an empty gallery
}

const SCENE_COLORS = {
  neon: "#06d6a0",
  space: "#5b8cff",
  clicker: "#ffc660",
  word: "#3ddc84",
  cards: "#b362ff",
  platformer: "#ff7a59",
  fantasy: "#ffd700",
  retro: "#ff006e",
};

function formatK(n) {
  const v = n || 0;
  return v >= 1000 ? (v / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(v);
}

const BUILD_STEPS = [
  "Reading your idea",
  "Designing rules & goals",
  "Styling the theme & HUD",
  "Writing the playable build",
];

const DEFAULT_PROMPT = "a neon snake game with glowing trails, power-ups, and boss rounds";

/* ----------------------------------------------------------------- icons --- */

function Icon({ name, className }) {
  const p = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };
  const shapes = {
    spark: <path d="M12 3v4m0 10v4m9-9h-4M7 12H3m13.5-5.5-2.8 2.8m-3.4 3.4-2.8 2.8m0-9 2.8 2.8m3.4 3.4 2.8 2.8" />,
    rocket: <><path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2" /><path d="M9 12c2-5 5-8 11-8 0 6-3 9-8 11l-3-3Z" /><circle cx="14.5" cy="9.5" r="1.5" /></>,
    coin: <><circle cx="12" cy="12" r="8" /><path d="M9.5 9.5h3.5a2 2 0 0 1 0 4H9.5m1.5-6v2m0 6v2" /></>,
    grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
    cards: <><rect x="3" y="6" width="11" height="14" rx="2" /><path d="M9 4h8a2 2 0 0 1 2 2v10" /></>,
    flag: <><path d="M5 21V4" /><path d="M5 4h11l-2 3 2 3H5" /></>,
    send: <path d="M12 20V5m0 0-6 6m6-6 6 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    attach: <path d="M21 11.5 12 20a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10 17a2 2 0 0 1-3-3l7.5-7.5" />,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    arrowLeft: <path d="M19 12H5m6-7-7 7 7 7" />,
    refresh: <><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 4v5h-5" /></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>,
    play: <path d="M7 5v14l12-7-12-7Z" fill="currentColor" stroke="none" />,
    remix: <><path d="M4 7h11a4 4 0 0 1 0 8H9" /><path d="m12 12-3 3 3 3" /><path d="M4 7l3-3M4 7l3 3" /></>,
    check: <path d="m5 12 5 5 9-11" />,
    bolt: <path d="M13 2 4 14h7l-1 8 10-13h-7l1-7Z" />,
    controller: <><path d="M6 11h4m-2-2v4" /><circle cx="15.5" cy="11" r="1" /><circle cx="18" cy="13.5" r="1" /><path d="M7 6h10a4 4 0 0 1 4 4l.8 5.2a2.5 2.5 0 0 1-4.7 1.4L16 15H8l-1.1 1.6a2.5 2.5 0 0 1-4.7-1.4L3 10a4 4 0 0 1 4-4Z" /></>,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" /></>,
    external: <><path d="M14 5h5v5" /><path d="M19 5 11 13" /><path d="M19 13v6H5V5h6" /></>,
    code: <path d="m9 8-5 4 5 4m6-8 5 4-5 4" />,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>,
    brain: <><path d="M9 3a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8V15a3 3 0 0 0 4 2.8" /><path d="M9 3a2.5 2.5 0 0 1 3 2.4v12.2A2.5 2.5 0 0 1 9 20" /><path d="M15 3a3 3 0 0 1 3 3 3 3 0 0 1 1 5.8V15a3 3 0 0 1-4 2.8" /></>,
    gauge: <><path d="M12 14a2 2 0 1 0 0-.01" /><path d="m14 12 3-3" /><path d="M4 18a8 8 0 1 1 16 0" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.6" /><path d="m21 15-5-5L5 21" /></>,
  };
  return <svg {...p}>{shapes[name] || shapes.spark}</svg>;
}

function BrandLogo() {
  return (
    <span className="brand-logo">
      <Icon name="controller" />
    </span>
  );
}

function UserMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false);
  const meta = user.user_metadata || {};
  const name = meta.full_name || meta.name || user.email || "Player";
  const avatar = meta.avatar_url || meta.picture || null;
  const initial = name.trim()[0]?.toUpperCase() || "P";

  useEffect(() => {
    if (!open) return;
    function close(e) {
      if (!e.target.closest(".user-menu")) setOpen(false);
    }
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="user-menu">
      <button
        type="button"
        className="user-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-label="Account menu"
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="user-initial">{initial}</span>
        )}
      </button>
      {open && (
        <div className="user-pop" role="menu">
          <div className="user-pop-head">
            <strong>{name}</strong>
            {user.email && <small>{user.email}</small>}
          </div>
          <button type="button" className="user-pop-item" onClick={onSignOut}>
            <Icon name="arrowLeft" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- composer --- */

function QualitySelect({ quality, setQuality }) {
  const [open, setOpen] = useState(false);
  const current = QUALITY_OPTIONS.find((o) => o.id === quality) || QUALITY_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!e.target.closest(".qsel")) setOpen(false); };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="qsel">
      <button
        type="button"
        className="icon-pill qsel-btn"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        title="Choose build quality"
      >
        <Icon name={current.icon} />
        {current.label}
        <Icon name="chevron" />
      </button>
      {open && (
        <div className="qsel-menu" onClick={(e) => e.stopPropagation()}>
          <div className="qsel-head">Build quality</div>
          {QUALITY_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`qsel-item ${o.id === quality ? "is-active" : ""}`}
              onClick={() => { setQuality(o.id); setOpen(false); }}
            >
              <span className="qsel-item-ico"><Icon name={o.icon} /></span>
              <span className="qsel-item-text">
                <strong>{o.label} <small>· {o.short}</small></strong>
                <small>{o.desc}</small>
              </span>
              {o.id === quality && <Icon name="check" className="qsel-item-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Composer({ value, onChange, onSubmit, loading, placeholder, compact, quality, setQuality, engine, setEngine }) {
  const ref = useRef(null);
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, compact ? 120 : 220) + "px";
  }, [value, compact]);

  function handleKey(e) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className={`composer ${focus ? "is-focus" : ""}`}>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        rows={1}
      />
      <div className="composer-bar">
        <div className="composer-bar-left">
          <button type="button" className="icon-pill" title="Attach a reference (coming soon)">
            <Icon name="attach" />
          </button>
          {!compact && setEngine && (
            <button
              type="button"
              className="icon-pill"
              title="Engine for new builds — HTML (most variety) or Phaser (arcade/maze)"
              onClick={() => setEngine(engine === "phaser" ? "html" : "phaser")}
            >
              <Icon name={engine === "phaser" ? "controller" : "code"} />
              {engine === "phaser" ? "Phaser" : "HTML"}
              <Icon name="chevron" />
            </button>
          )}
        </div>
        <div className="composer-bar-right">
          {setQuality && <QualitySelect quality={quality} setQuality={setQuality} />}
          <button
            type="button"
            className={`send-btn ${loading ? "is-loading" : ""}`}
            onClick={onSubmit}
            disabled={loading || !value.trim()}
            aria-label="Build game"
          >
            <Icon name={loading ? "refresh" : "send"} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- scenes ---- */

function Scene({ scene, title }) {
  return (
    <div className={`scene scene-${scene}`}>
      <span className="scene-title">{title}</span>
    </div>
  );
}

function CommunityCard({ item, onOpen, index }) {
  return (
    <button
      type="button"
      className="card"
      style={{ animationDelay: `${0.04 * index}s` }}
      onClick={() => onOpen(item)}
    >
      <div className="card-thumb">
        <Scene scene={item.scene} title={item.title} />
        <div className="play">
          <span>
            <Icon name="play" /> {item.real ? "Play this game" : "Remix this game"}
          </span>
        </div>
      </div>
      <div className="card-body">
        <span className="card-ava" style={{ background: item.color }}>
          {item.author[0].toUpperCase()}
        </span>
        <span className="meta">
          <strong>{item.title}</strong>
          <small>by {item.author}</small>
        </span>
        <span className="remix">
          <Icon name="remix" />
          {item.remixes}
        </span>
      </div>
    </button>
  );
}

/* ----------------------------------------------------------- workspace ---- */

function Workspace({
  userPrompt,
  plan,
  html,
  streamCode,
  loading,
  stepIndex,
  percent,
  followup,
  setFollowup,
  onFollowup,
  onBack,
  onRebuild,
  onDownload,
  onPublish,
  onNotify,
  error,
  feedback,
  onFeedback,
  quality,
  setQuality,
  isPremium,
  onUsePlayer,
}) {
  const feedRef = useRef(null);
  const codeRef = useRef(null);
  const [shareOpen, setShareOpen] = useState(false);

  // AI sprite/asset generation (fal.ai) + the premium upgrade prompt.
  const [showAsset, setShowAsset] = useState(false);
  const [assetPrompt, setAssetPrompt] = useState("");
  const [assetAnimate, setAssetAnimate] = useState(false);
  const [assetBusy, setAssetBusy] = useState(false);
  const [assetNote, setAssetNote] = useState("");
  const [assetResult, setAssetResult] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [injecting, setInjecting] = useState(false);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [stepIndex, html, plan]);

  // keep the streaming code view pinned to the latest line
  useEffect(() => {
    if (codeRef.current) codeRef.current.scrollTop = codeRef.current.scrollHeight;
  }, [streamCode]);

  useEffect(() => {
    if (!shareOpen) return;
    const close = (e) => { if (!e.target.closest(".ws-share")) setShareOpen(false); };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [shareOpen]);

  function playStandalone() {
    if (!html) return;
    const blob = new Blob([wrapPreviewHtml(html)], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function copyEmbed() {
    setShareOpen(false);
    if (!html) return;
    const doc = wrapPreviewHtml(html).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    const code = `<iframe srcdoc="${doc}" width="420" height="640" style="border:0;border-radius:12px;max-width:100%;" sandbox="allow-scripts" loading="lazy" title="Made with Gamecraft"></iframe>`;
    navigator.clipboard?.writeText(code).then(
      () => onNotify?.("Embed code copied — paste it on any website"),
      () => onNotify?.("Copy failed")
    );
  }

  function copySource() {
    setShareOpen(false);
    if (!html) return;
    navigator.clipboard?.writeText(html).then(
      () => onNotify?.("Game code copied to clipboard"),
      () => onNotify?.("Copy failed")
    );
  }

  async function shareDevice() {
    setShareOpen(false);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "I built a game on Gamecraft", text: "Play the game I just made on Gamecraft!" });
      } catch {
        /* user dismissed the share sheet */
      }
    } else {
      copySource();
    }
  }

  // Generate a transparent game sprite (or, for premium, an animated one) via
  // /api/generate-asset. Degrades cleanly: a missing FAL_KEY shows an inline note,
  // and the premium-only animation routes to the upgrade prompt.
  async function generateAsset() {
    if (assetAnimate && !isPremium) {
      setShowPaywall(true);
      return;
    }
    const p = assetPrompt.trim();
    if (!p) return;
    setAssetBusy(true);
    setAssetNote("");
    setAssetResult(null);
    try {
      const res = await fetch("/api/generate-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, isAnimated: assetAnimate }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403 || data?.error === "PAYWALL_TRIGGERED") {
        setShowPaywall(true);
        return;
      }
      if (!res.ok || !data.url) {
        setAssetNote(data.error || "Generation failed. Try again.");
        return;
      }
      setAssetResult({ url: data.url, type: data.type });
    } catch {
      setAssetNote("Generation failed. Try again.");
    } finally {
      setAssetBusy(false);
    }
  }

  const canShareDevice = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="ws">
      <aside className="ws-chat">
        <div className="ws-chat-head">
          <BrandLogo />
          <span className="brand">Gamecraft</span>
          <button type="button" className="ws-back" onClick={onBack} aria-label="Back to home">
            <Icon name="arrowLeft" />
          </button>
        </div>

        <div className="ws-feed" ref={feedRef}>
          <div className="bubble bubble-user">{userPrompt}</div>

          <div className="bubble bubble-ai">
            <div className="who">
              <span className="dot-logo" /> Gamecraft
            </div>
            {plan ? plan : "On it — turning your idea into a playable build."}
            <div className="build-steps">
              {BUILD_STEPS.map((label, i) => {
                const cls =
                  html && !loading
                    ? "done"
                    : i < stepIndex
                      ? "done"
                      : i === stepIndex && loading
                        ? "active"
                        : "";
                return (
                  <div key={label} className={`build-step ${cls}`}>
                    <span className="tick">{cls === "done" && <Icon name="check" />}</span>
                    {label}
                  </div>
                );
              })}
            </div>
            {loading && (
              <div className="progress">
                <i style={{ width: `${percent}%` }} />
              </div>
            )}
          </div>

          {html && !loading && (
            <div className="bubble bubble-ai">
              <div className="who">
                <span className="dot-logo" /> Gamecraft
              </div>
              Your game is live in the preview. Want changes? Just tell me — e.g. “make it faster”, “add a boss”, or “use a retro theme”.
              <div className="fb">
                {feedback ? (
                  <span className="fb-thanks">
                    <Icon name="check" /> Thanks — that helps me learn.
                  </span>
                ) : (
                  <>
                    <span className="fb-label">How’d it turn out?</span>
                    <button type="button" className="fb-btn" onClick={() => onFeedback?.(1)} aria-label="Good">
                      <Icon name="check" /> Love it
                    </button>
                    <button type="button" className="fb-btn fb-btn-down" onClick={() => onFeedback?.(-1)} aria-label="Needs work">
                      Needs work
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {error && <div className="err">{error}</div>}
        </div>

        <div className="ws-composer">
          <Composer
            value={followup}
            onChange={setFollowup}
            onSubmit={onFollowup}
            loading={loading}
            placeholder="Ask for a change…"
            compact
            quality={quality}
            setQuality={setQuality}
          />
        </div>
      </aside>

      <section className="ws-view">
        <header className="ws-bar">
          <span className="ws-url">
            <span className="live" /> preview · gamecraft.app
          </span>
          <div className="ws-bar-actions">
            <button type="button" className="tool-btn" onClick={onRebuild} disabled={loading}>
              <Icon name="refresh" /> Rebuild
            </button>
            <button type="button" className="tool-btn" onClick={playStandalone} disabled={!html}>
              <Icon name="external" /> Play
            </button>
            <button type="button" className="tool-btn" onClick={() => setShowAsset(true)} title="Generate a game sprite with AI">
              <Icon name="image" /> Sprite
            </button>
            <div className="ws-share">
              <button
                type="button"
                className="tool-btn"
                onClick={(e) => { e.stopPropagation(); setShareOpen((o) => !o); }}
                disabled={!html}
              >
                <Icon name="share" /> Share <Icon name="chevron" />
              </button>
              {shareOpen && (
                <div className="ws-share-menu" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="ws-share-item ws-share-item-primary"
                    onClick={() => { setShareOpen(false); onPublish?.(); }}
                  >
                    <Icon name="globe" />
                    <span>
                      <strong>Publish &amp; copy link</strong>
                      <small>Put it online at a public URL</small>
                    </span>
                  </button>
                  <button type="button" className="ws-share-item" onClick={copyEmbed}>
                    <Icon name="code" />
                    <span>
                      <strong>Copy embed code</strong>
                      <small>Drop your game into any site or blog</small>
                    </span>
                  </button>
                  <button type="button" className="ws-share-item" onClick={copySource}>
                    <Icon name="copy" />
                    <span>
                      <strong>Copy game code</strong>
                      <small>The full single-file HTML</small>
                    </span>
                  </button>
                  {canShareDevice && (
                    <button type="button" className="ws-share-item" onClick={shareDevice}>
                      <Icon name="share" />
                      <span>
                        <strong>Share…</strong>
                        <small>Use your device share sheet</small>
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
            <button type="button" className="tool-btn primary" onClick={onDownload} disabled={!html}>
              <Icon name="download" /> Export
            </button>
          </div>
        </header>
        <div className="ws-stage">
          {html ? (
            <div className="frame-shell">
              <iframe title="Generated game" srcDoc={wrapPreviewHtml(html)} sandbox="allow-scripts" />
            </div>
          ) : streamCode ? (
            <div className="ws-codestream">
              <div className="ws-codestream-head">
                <span className="live" /> FORGE is writing your game…
                <span className="ws-codestream-count">{streamCode.length.toLocaleString()} chars</span>
              </div>
              <pre ref={codeRef} className="ws-codestream-body"><code>{streamCode}</code></pre>
            </div>
          ) : (
            <div className="stage-empty">
              <div>
                <div className="spinner" />
                <h3>Building your game…</h3>
                <p>{BUILD_STEPS[Math.min(stepIndex, BUILD_STEPS.length - 1)]}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {showAsset && (
        <div className="modal-overlay" onMouseDown={() => setShowAsset(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Generate a sprite"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button className="modal-close" type="button" onClick={() => setShowAsset(false)} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
            <div className="modal-logo">
              <span className="brand-logo"><Icon name="image" /></span>
            </div>
            <h2 className="modal-title">Generate a sprite</h2>
            <p className="modal-sub">Describe an asset and AI makes a transparent, game-ready sprite.</p>

            {assetResult ? (
              <div style={{ textAlign: "center" }}>
                {assetResult.type === "video" ? (
                  <video src={assetResult.url} autoPlay loop muted playsInline style={{ width: "100%", borderRadius: 12, background: "#0a0a0c" }} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={assetResult.url}
                    alt="Generated sprite"
                    style={{
                      width: 180,
                      height: 180,
                      objectFit: "contain",
                      margin: "0 auto",
                      display: "block",
                      background: "repeating-conic-gradient(#26262c 0% 25%, #1a1a20 0% 50%) 50% / 22px 22px",
                      borderRadius: 12,
                    }}
                  />
                )}
                <button
                  type="button"
                  className="btn btn-primary modal-submit"
                  style={{ width: "100%", marginTop: 16 }}
                  disabled={injecting}
                  onClick={async () => {
                    setInjecting(true);
                    try {
                      await onUsePlayer?.(assetResult.url);
                      setShowAsset(false);
                      setAssetResult(null);
                      setAssetPrompt("");
                    } finally {
                      setInjecting(false);
                    }
                  }}
                >
                  {injecting ? "Injecting…" : "Use as player"}
                </button>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <a
                    className="btn btn-ghost"
                    style={{ flex: 1, textAlign: "center", textDecoration: "none" }}
                    href={assetResult.url}
                    target="_blank"
                    rel="noreferrer"
                    download
                  >
                    Download
                  </a>
                  <button type="button" className="btn btn-ghost" style={{ flex: 1 }} disabled={injecting} onClick={() => { setAssetResult(null); setAssetPrompt(""); }}>
                    Make another
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={assetPrompt}
                  onChange={(e) => setAssetPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") generateAsset(); }}
                  placeholder="e.g. a rusty iron sword"
                  autoFocus
                  style={{
                    width: "100%",
                    background: "var(--bg-2, #0e0e12)",
                    border: "1px solid var(--border, rgba(255,255,255,0.12))",
                    borderRadius: 10,
                    padding: "11px 13px",
                    color: "var(--text, #f4f4f6)",
                    fontSize: 14,
                    outline: "none",
                    marginBottom: 12,
                    boxSizing: "border-box",
                  }}
                />
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted, #9a9aa2)", marginBottom: 16, cursor: "pointer" }}>
                  <input type="checkbox" checked={assetAnimate} onChange={(e) => setAssetAnimate(e.target.checked)} />
                  Animate sprite <span style={{ color: "var(--coral, #ff7a59)" }}>· Premium</span>
                </label>
                {assetNote && <div className="modal-notice">{assetNote}</div>}
                <button
                  type="button"
                  className="btn btn-primary modal-submit"
                  style={{ width: "100%" }}
                  onClick={generateAsset}
                  disabled={assetBusy || !assetPrompt.trim()}
                >
                  {assetBusy ? "Generating…" : "Generate sprite"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showPaywall && (
        <div className="modal-overlay" onMouseDown={() => setShowPaywall(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Upgrade to Premium" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setShowPaywall(false)} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
            <div className="modal-logo">
              <span className="brand-logo"><Icon name="bolt" /></span>
            </div>
            <h2 className="modal-title">Unlock Pro features</h2>
            <p className="modal-sub">Animate sprites with video AI, export clean source, and remove the watermark.</p>
            <button
              type="button"
              className="btn btn-primary modal-submit"
              style={{ width: "100%" }}
              onClick={() => { window.location.href = "/api/checkout/stripe"; }}
            >
              Upgrade to Premium ($49/mo)
            </button>
            <button
              type="button"
              className="modal-fine"
              style={{ background: "none", border: 0, cursor: "pointer", width: "100%", marginTop: 10 }}
              onClick={() => setShowPaywall(false)}
            >
              Keep testing in the free sandbox
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- helpers --- */

// Safety net: the model is told to emit raw HTML, but strip ``` fences if any slip in.
function stripFences(text) {
  let t = (text || "").trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```[a-zA-Z]*\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return t.trim();
}

// A Phaser (declarative-engine) game is wrapped into self-contained HTML with its
// state embedded as a JSON script tag, so it flows through the same save/preview/
// publish/export pipeline as a hand-written HTML game. These helpers tell the two
// apart and recover the declarative state for follow-up edits.
function isPhaserHtml(html) {
  return typeof html === "string" && html.includes('id="gc-state"');
}

function extractPhaserState(html) {
  const m = (html || "").match(/<script[^>]*id="gc-state"[^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

// Re-embed an updated declarative state into a wrapped Phaser game's HTML so the
// change persists and the iframe reloads with it. Function replacement avoids
// `$`-pattern issues in the JSON.
function embedPhaserState(html, state) {
  const json = JSON.stringify(state).replace(/<\/script>/gi, "<\\/script>");
  return html.replace(
    /(<script[^>]*id="gc-state"[^>]*>)[\s\S]*?(<\/script>)/i,
    (_m, open, close) => open + json + close
  );
}

function safeFileName(value) {
  const slug = (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "gamecraft-game";
}

const STOP_WORDS = new Set(["a", "an", "the", "with", "and", "of", "for", "to", "game", "that", "where", "in", "on"]);

function deriveTitle(prompt) {
  const words = (prompt || "")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w.toLowerCase()))
    .slice(0, 3);
  const title = words.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  return title || "Untitled Game";
}

// The planner returns a catchy game name on its first line — much nicer than
// chopping words off the prompt. Use it when it looks like a real title.
function titleFromPlan(plan) {
  if (!plan) return null;
  const first = (plan.split("\n").map((s) => s.trim()).filter(Boolean)[0] || "");
  const cleaned = first
    .replace(/^(line\s*1\s*[:.\-]?\s*|name\s*[:.\-]\s*|title\s*[:.\-]\s*)/i, "")
    .replace(/^["'`]+|["'`.!]+$/g, "")
    .trim();
  const words = cleaned.split(/\s+/);
  if (!cleaned || words.length > 5 || cleaned.length > 40) return null;
  return cleaned;
}

function sceneFromPrompt(prompt) {
  const p = (prompt || "").toLowerCase();
  if (/space|ship|alien|meteor|galaxy|orbital|star/.test(p)) return "space";
  if (/clicker|cookie|idle|incremental|tycoon/.test(p)) return "clicker";
  if (/word|wordle|letter|spell|crossword/.test(p)) return "word";
  if (/card|deck|dungeon|roguelike/.test(p)) return "cards";
  if (/platform|jump|coin|spike/.test(p)) return "platformer";
  if (/fantasy|magic|quest|dragon|spell|knight/.test(p)) return "fantasy";
  if (/retro|arcade|scanline|pixel|classic/.test(p)) return "retro";
  return "neon";
}

/* ------------------------------------------------------------------ page --- */

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [followup, setFollowup] = useState("");
  const [quality, setQuality] = useState("auto"); // auto | fast | smart
  const [engine, setEngine] = useState("html"); // html | phaser — engine for NEW builds
  const [activeEngine, setActiveEngine] = useState("html"); // engine of the open game
  const [isPremium] = useState(false); // unlocks sprite animation / clean export; wired via Stripe
  const [view, setView] = useState("home"); // home | workspace
  const [html, setHtml] = useState("");
  const [streamCode, setStreamCode] = useState(""); // live HTML as it streams in
  const [plan, setPlan] = useState("");
  const [activePrompt, setActivePrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Popular");
  const [toast, setToast] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const { user, loading: authLoading, signOut } = useAuth();
  const [projects, setProjects] = useState([]);
  const [activeGameId, setActiveGameId] = useState(null);
  const [activeGenId, setActiveGenId] = useState(null); // generation row id for feedback
  const [feedback, setFeedback] = useState(null); // null | "up" | "down"
  const [publicGames, setPublicGames] = useState([]); // real published games for the showcase
  const planRef = useRef(""); // latest concept text, for naming the saved game
  const declarativeRef = useRef(null); // current Phaser declarative state, for edits

  // Logged out: load games from this browser. Logged in: load from the cloud.
  useEffect(() => {
    if (user) return; // the cloud effect below owns the logged-in case
    try {
      const raw = window.localStorage.getItem("gamecraft.projects");
      if (raw) setProjects(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    listGames().then((rows) => {
      if (active && Array.isArray(rows)) setProjects(rows);
    });
    return () => {
      active = false;
    };
  }, [user]);

  // Real published games power the community showcase (falls back to the
  // curated demo set when none exist yet).
  useEffect(() => {
    let active = true;
    listPublicGames(9).then((rows) => {
      if (active && Array.isArray(rows) && rows.length) setPublicGames(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  // Save a freshly built game: to the cloud when signed in, else to localStorage.
  // Returns the id it was stored under (used for publishing).
  async function saveProject(project) {
    if (user) {
      const saved = await createGame({
        title: project.title,
        prompt: project.prompt,
        scene: project.scene,
        html: project.html,
      });
      if (saved) {
        setProjects((prev) => [saved, ...prev].slice(0, 100));
        return saved.id;
      }
    }
    setProjects((prev) => {
      const next = [project, ...prev].slice(0, 60);
      try {
        window.localStorage.setItem("gamecraft.projects", JSON.stringify(next));
      } catch {
        /* storage full or unavailable */
      }
      return next;
    });
    return project.id;
  }

  const [wordIndex, setWordIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [percent, setPercent] = useState(0);
  const stepTimer = useRef(null);

  // cycling hero word
  useEffect(() => {
    if (view !== "home") return;
    const t = setInterval(() => setWordIndex((i) => (i + 1) % CYCLE_WORDS.length), 2400);
    return () => clearInterval(t);
  }, [view]);

  // toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // surface an OAuth error redirected back from the callback, then clean the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("auth_error");
    if (authError) {
      setToast(`Sign-in failed: ${authError}`);
    }
    // Surface the result of a Stripe checkout round-trip (/api/checkout/stripe).
    const billing = params.get("billing");
    const BILLING_MSG = {
      success: "🎉 You're Premium! Animation and clean export unlocked.",
      cancelled: "Checkout cancelled — no charge was made.",
      unconfigured: "Billing isn't set up yet (add your Stripe keys).",
      error: "Couldn't start checkout. Please try again.",
    };
    if (billing && BILLING_MSG[billing]) setToast(BILLING_MSG[billing]);
    if (authError || billing) {
      params.delete("auth_error");
      params.delete("billing");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }
  }, []);

  function clearStepTimer() {
    if (stepTimer.current) {
      clearInterval(stepTimer.current);
      stepTimer.current = null;
    }
  }

  function runStepAnimation() {
    clearStepTimer();
    setStepIndex(0);
    setPercent(8);
    let i = 0;
    stepTimer.current = setInterval(() => {
      i += 1;
      setStepIndex(Math.min(i, BUILD_STEPS.length - 1));
      setPercent((p) => Math.min(94, p + 22));
    }, 720);
  }

  async function generate(rawPrompt, buildEngine = engine) {
    const requestPrompt = (rawPrompt ?? prompt).trim();
    if (!requestPrompt) {
      setError("Describe a game first.");
      return;
    }
    setActivePrompt(requestPrompt);
    setPrompt(requestPrompt);
    setView("workspace");
    setHtml("");
    setStreamCode("");
    setPlan("");
    setError("");
    setActiveGameId(null);
    setActiveGenId(null);
    setFeedback(null);
    setLoading(true);
    setActiveEngine(buildEngine);
    runStepAnimation();

    // Phaser (declarative) builds come back as one self-contained HTML file from
    // the orchestrator — no token streaming. HTML builds stream below as before.
    if (buildEngine === "phaser") {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: requestPrompt, quality }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.html) throw new Error(data?.error || "Generation failed.");
        declarativeRef.current = data.state?.declarative || null;
        setPlan(data.summary || "");
        planRef.current = data.summary || "";
        setHtml(data.html);
        setPercent(100);
        setStepIndex(BUILD_STEPS.length);
        const savedId = await saveProject({
          id: crypto?.randomUUID?.() || String(Date.now()),
          title: data.state?.metadata?.title || deriveTitle(requestPrompt),
          prompt: requestPrompt,
          html: data.html,
          scene: sceneFromPrompt(requestPrompt),
          engine: "phaser",
          declarative: data.state?.declarative || null,
          createdAt: Date.now(),
        });
        setActiveGameId(savedId || null);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        clearStepTimer();
        setLoading(false);
      }
      return;
    }

    // kick off a quick concept in parallel for the chat panel
    planRef.current = "";
    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: requestPrompt, mode: "plan" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.plan) {
          setPlan(d.plan);
          planRef.current = d.plan;
        }
      })
      .catch(() => {});

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: requestPrompt, mode: "generate", quality }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Generation failed.");
      }

      // Generation row id (for the feedback widget) rides back on a header.
      setActiveGenId(res.headers.get("X-Generation-Id") || null);

      // Stream the HTML in as it's written so the build feels live.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreamCode(acc);
        // nudge progress toward (but never to) 100 as the file grows
        setPercent(Math.min(96, 12 + Math.floor(acc.length / 180)));
      }

      const finalHtml = stripFences(acc);
      if (!finalHtml) throw new Error("Generation returned nothing. Try again.");

      setHtml(finalHtml);
      setPercent(100);
      setStepIndex(BUILD_STEPS.length);
      const savedId = await saveProject({
        id: crypto?.randomUUID?.() || String(Date.now()),
        title: titleFromPlan(planRef.current) || deriveTitle(requestPrompt),
        prompt: requestPrompt,
        html: finalHtml,
        scene: sceneFromPrompt(requestPrompt),
        createdAt: Date.now(),
      });
      setActiveGameId(savedId || null);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      clearStepTimer();
      setLoading(false);
    }
  }

  function handleFollowup() {
    const text = followup.trim();
    if (!text) return;
    setFollowup("");
    // True iteration: edit the game we already have instead of rebuilding it
    // from scratch. Falls back to a fresh build if there's nothing to edit yet.
    if (html) {
      editGame(text);
    } else {
      generate(`${activePrompt}\n\nRevision: ${text}`.slice(0, 280));
    }
  }

  // Iterate on the current game: send its HTML + the change request to the
  // editor, stream the updated file back, and persist it.
  async function editGame(instruction, postProcess) {
    const baseHtml = html;
    if (!baseHtml) return;
    setError("");
    setStreamCode("");
    setHtml("");
    setLoading(true);
    runStepAnimation();

    // Phaser edits route to the declarative orchestrator and come back as one
    // self-contained HTML file (recover the declarative state to edit against).
    if (activeEngine === "phaser") {
      try {
        const declarative = declarativeRef.current || extractPhaserState(baseHtml);
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: instruction,
            quality,
            currentState: declarative
              ? { engine: "phaser", declarative, metadata: { title: "" } }
              : undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.html) throw new Error(data?.error || "Couldn’t apply that change.");
        declarativeRef.current = data.state?.declarative || declarative;
        setHtml(data.html);
        setPercent(100);
        setStepIndex(BUILD_STEPS.length);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === activeGameId
              ? { ...p, html: data.html, declarative: declarativeRef.current }
              : p
          )
        );
        if (user && activeGameId) updateGameHtml(activeGameId, data.html).catch(() => {});
      } catch (err) {
        setError(err.message || "Something went wrong.");
        setHtml(baseHtml);
      } finally {
        clearStepTimer();
        setLoading(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "edit", html: baseHtml, instruction, quality }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Couldn’t apply that change.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreamCode(acc);
        setPercent(Math.min(96, 12 + Math.floor(acc.length / 180)));
      }

      let finalHtml = stripFences(acc);
      if (!finalHtml) throw new Error("That change came back empty. Try again.");
      // Deterministic post-processing (e.g. substituting a Base64 sprite the model
      // wired to a placeholder token) — keeps huge data out of the model itself.
      if (postProcess) finalHtml = postProcess(finalHtml);

      setHtml(finalHtml);
      setPercent(100);
      setStepIndex(BUILD_STEPS.length);

      // Keep the saved copy in sync — locally always, and in the cloud when
      // this is a signed-in user's saved game.
      setProjects((prev) =>
        prev.map((p) => (p.id === activeGameId ? { ...p, html: finalHtml } : p))
      );
      if (user && activeGameId) {
        updateGameHtml(activeGameId, finalHtml).catch(() => {});
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setHtml(baseHtml); // restore the previous game so nothing is lost
    } finally {
      clearStepTimer();
      setLoading(false);
    }
  }

  // Record whether the player liked the freshly built game (grows the AI's
  // learning loop). Optimistic — the UI updates instantly, the write is async.
  function submitFeedback(rating) {
    setFeedback(rating > 0 ? "up" : "down");
    if (!activeGenId) return;
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: activeGenId, rating }),
    }).catch(() => {});
  }

  // Inject a generated sprite as the player. The remote (fal) URL is first
  // proxied to a Base64 data URI server-side so the game stays self-contained
  // (no CORS taint, no external URLs left in the exported HTML).
  async function injectPlayerSprite(falUrl) {
    if (!falUrl) return;
    let dataUri;
    try {
      const res = await fetch("/api/proxy-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: falUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.dataUri) throw new Error(data.error || "Couldn't load the sprite.");
      dataUri = data.dataUri;
    } catch (err) {
      setToast(err.message || "Couldn't load the sprite.");
      return;
    }

    if (activeEngine === "phaser") {
      // Declarative: point the player at the inlined sprite and reload the iframe.
      const state = declarativeRef.current || extractPhaserState(html);
      if (!state || !state.player) {
        setToast("Build a game first, then add a sprite.");
        return;
      }
      state.player = {
        ...state.player,
        spriteKey: "player_custom",
        sprite: { key: "player_custom", url: dataUri },
      };
      declarativeRef.current = state;
      const newHtml = embedPhaserState(html, state);
      setHtml(newHtml);
      setProjects((prev) =>
        prev.map((p) => (p.id === activeGameId ? { ...p, html: newHtml, declarative: state } : p))
      );
      if (user && activeGameId) updateGameHtml(activeGameId, newHtml).catch(() => {});
      setToast("Sprite applied to your player");
    } else {
      // HTML: the model wires the player to a placeholder token; we substitute the
      // real Base64 afterward so the heavy data never goes through the model.
      await editGame(
        "Replace the player's drawn shape/sprite with an Image() whose src is exactly the placeholder token __PLAYER_SPRITE_URI__ (I will substitute the real data URI). Draw that image at the player's current position and size every frame. Keep all other gameplay, layout, controls and code unchanged.",
        (out) => out.split("__PLAYER_SPRITE_URI__").join(dataUri)
      );
      setToast("Sprite applied to your player");
    }
  }

  function downloadGame() {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeFileName(activePrompt)}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setToast("Game exported as a single HTML file");
  }

  function backHome() {
    setView("home");
    clearStepTimer();
  }

  function openCommunity(item) {
    generate(item.prompt || `a ${item.scene} game called ${item.title}, polished and fun`);
  }

  // Real published games play in a new tab; demo cards remix into a new build.
  function openGalleryItem(item) {
    if (item.real && item.id) {
      window.open(`/g/${item.id}`, "_blank", "noopener");
    } else {
      openCommunity(item);
    }
  }

  function openProject(project) {
    setHtml(project.html);
    const eng = project.engine || (isPhaserHtml(project.html) ? "phaser" : "html");
    setActiveEngine(eng);
    declarativeRef.current =
      project.declarative || (eng === "phaser" ? extractPhaserState(project.html) : null);
    setActivePrompt(project.prompt);
    setActiveGameId(typeof project.id === "string" ? project.id : null);
    setActiveGenId(null);
    setFeedback(null);
    setPlan("");
    setError("");
    setView("workspace");
  }

  // Publish the open game to a public URL and copy the link.
  async function publishActive() {
    if (!user) {
      setToast("Sign in to publish your game");
      return;
    }
    if (!activeGameId) {
      setToast("Give it a moment to save, then publish");
      return;
    }
    const ok = await publishGame(activeGameId);
    if (!ok) {
      setToast("Couldn’t publish — is the games table set up?");
      return;
    }
    setProjects((prev) =>
      prev.map((p) => (p.id === activeGameId ? { ...p, visibility: "public" } : p))
    );
    const url = `${window.location.origin}/g/${activeGameId}`;
    try {
      await navigator.clipboard?.writeText(url);
      setToast("Published! Public link copied");
    } catch {
      setToast(`Published at ${url}`);
    }
  }

  const cycle = CYCLE_WORDS[wordIndex];

  // Community gallery: real published games when we have them, else the curated
  // demo set — filtered by the active tab.
  const galleryItems = useMemo(() => {
    const base = publicGames.length
      ? publicGames.map((g) => ({
          id: g.id,
          title: g.title,
          scene: g.scene || "neon",
          author: "community",
          remixes: formatK(g.plays),
          color: SCENE_COLORS[g.scene] || "#06d6a0",
          prompt: g.prompt,
          real: true,
        }))
      : COMMUNITY;
    const filtered = filterByTab(base, tab);
    // "Discover" surfaces variety — flip the popularity order for fresh finds.
    return tab === "Discover" ? [...filtered].reverse() : filtered;
  }, [publicGames, tab]);

  if (view === "workspace") {
    return (
      <>
        <Workspace
          userPrompt={activePrompt}
          plan={plan}
          html={html}
          streamCode={streamCode}
          loading={loading}
          stepIndex={stepIndex}
          percent={percent}
          followup={followup}
          setFollowup={setFollowup}
          onFollowup={handleFollowup}
          onBack={backHome}
          onRebuild={() => generate(activePrompt, activeEngine)}
          onDownload={downloadGame}
          onPublish={publishActive}
          onNotify={setToast}
          error={error}
          feedback={feedback}
          onFeedback={submitFeedback}
          quality={quality}
          setQuality={setQuality}
          isPremium={isPremium}
          onUsePlayer={injectPlayerSprite}
        />
        {toast && <div className="toast">{toast}</div>}
      </>
    );
  }

  if (user) {
    return (
      <>
        <Dashboard
          user={user}
          projects={projects}
          quality={quality}
          setQuality={setQuality}
          onBuild={(p) => generate(p)}
          onOpenProject={openProject}
          onSignOut={async () => {
            await signOut();
            setView("home");
            setToast("Signed out");
          }}
          onNotify={setToast}
        />
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} mode={authMode} />
        {toast && <div className="toast">{toast}</div>}
      </>
    );
  }

  return (
    <div className="lp">
      <div className="aurora" aria-hidden>
        <span className="blob blob-1" />
        <span className="blob blob-2" />
        <span className="blob blob-3" />
      </div>

      <nav className="nav">
        <a className="brand" href="#top">
          <BrandLogo />
          Gamecraft
        </a>
        <div className="nav-links">
          <a href="#community">Community</a>
          <a href="#how">How it works</a>
          <a href="#templates">Templates</a>
          <a href="#community">Showcase</a>
        </div>
        <div className="nav-actions">
          {authLoading ? (
            <span className="user-skel" aria-hidden />
          ) : user ? (
            <UserMenu
              user={user}
              onSignOut={async () => {
                await signOut();
                setToast("Signed out");
              }}
            />
          ) : (
            <>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setAuthOpen(true);
                }}
              >
                Log in
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setAuthOpen(true);
                }}
              >
                Get started
              </button>
            </>
          )}
        </div>
      </nav>

      <header className="hero" id="top">
        <div className="hero-badge">
          <span className="dot" />
          <b>New</b> · games build in seconds, no code
        </div>
        <h1>
          Build something{" "}
          <span className="cycle">
            <span className="cycle-word" key={cycle}>{cycle}</span>
          </span>
        </h1>
        <p className="sub">
          Describe a game and watch it become a real, playable build — then tweak it
          by chatting and ship it with one click.
        </p>

        <div className="composer-wrap">
          <Composer
            value={prompt}
            onChange={setPrompt}
            onSubmit={() => generate()}
            loading={loading}
            placeholder="Ask Gamecraft to build a game…  e.g. a neon snake with boss rounds"
            quality={quality}
            setQuality={setQuality}
            engine={engine}
            setEngine={setEngine}
          />
        </div>

        <div className="chips">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              type="button"
              className="chip"
              onClick={() => {
                setPrompt(s.prompt);
                generate(s.prompt);
              }}
            >
              <Icon name={s.icon} />
              {s.label}
            </button>
          ))}
        </div>

        {error && <div className="err">{error}</div>}
      </header>

      <section className="logos">
        <p>BUILDERS EVERYWHERE ARE SHIPPING GAMES WITH GAMECRAFT</p>
        <div className="logos-row">
          <span>Arcadelab</span>
          <span>Pixeljump</span>
          <span>Starforge</span>
          <span>Mythmakers</span>
          <span>Retrowave</span>
          <span>Deckwright</span>
        </div>
      </section>

      <section className="section" id="community">
        <div className="section-top">
          <div>
            <h2>From the community</h2>
            <p>Remix a game someone already built, or start from scratch above.</p>
          </div>
          <div className="tabs">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                className={`tab ${tab === t ? "is-active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="gallery">
          {galleryItems.map((item, i) => (
            <CommunityCard key={item.id || item.title} item={item} index={i} onOpen={openGalleryItem} />
          ))}
        </div>
      </section>

      <section className="section" id="how">
        <div className="section-top">
          <div>
            <h2>From idea to playable in three steps</h2>
            <p>No engines, no setup, no boilerplate — just describe and play.</p>
          </div>
        </div>
        <div className="steps">
          {[
            ["Describe it", "Type the game you imagine — a genre, a vibe, a mechanic. Drop in as much or as little detail as you like."],
            ["Watch it build", "Gamecraft writes a complete, self-contained game and shows it running live in the preview in seconds."],
            ["Refine & ship", "Chat to tweak anything, then export the finished game as a single HTML file you can host anywhere."],
          ].map(([title, body], i) => (
            <article className="step" key={title}>
              <span className="num">{i + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta" id="templates">
        <h2>Your next game is one sentence away</h2>
        <p>Start from a blank prompt or remix a community build. It’s playable before you finish your coffee.</p>
        <button
          className="btn btn-primary"
          type="button"
          style={{ padding: "12px 22px", fontSize: 15 }}
          onClick={() => {
            setPrompt(DEFAULT_PROMPT);
            generate(DEFAULT_PROMPT);
          }}
        >
          <Icon name="bolt" /> Build a game now
        </button>
      </section>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Gamecraft</span>
        <div className="footer-links">
          <a href="#community">Community</a>
          <a href="#how">How it works</a>
          <a href="#templates">Templates</a>
          <a href="#top">Back to top</a>
        </div>
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} mode={authMode} />

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
