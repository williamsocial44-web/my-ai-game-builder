"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const PRODUCT_LABEL = "AI Game Builder";
const DEFAULT_PROMPT =
  "a neon snake game with powerups, boss rounds, and arcade lighting";

const QUICK_PROMPTS = [
  "neon snake",
  "space shooter",
  "word puzzle",
  "brick breaker",
  "cookie clicker",
  "text adventure",
];

const WORKSPACE_NAV = [
  { id: "home", label: "Home", icon: "home" },
  { id: "search", label: "Search", icon: "search" },
  { id: "resources", label: "Resources", icon: "compass" },
  { id: "connectors", label: "Connectors", icon: "nodes" },
];

const PROJECT_NAV = [
  { id: "projects", label: "All projects", icon: "grid" },
  { id: "starred", label: "Starred", icon: "star" },
  { id: "created", label: "Created by me", icon: "user" },
  { id: "shared", label: "Shared with me", icon: "users" },
];

const PROJECTS = [
  {
    title: "Neon Snake Lab",
    prompt: "Arcade snake with luminous trails and boss rounds",
    status: "Ready",
    edited: "Edited today",
    variant: "snake",
  },
  {
    title: "Cookie Empire",
    prompt: "A cozy clicker about scaling a bakery into an empire",
    status: "Mock",
    edited: "Edited yesterday",
    variant: "clicker",
  },
  {
    title: "Word Master",
    prompt: "Daily word puzzle with keyboard scoring",
    status: "Mock",
    edited: "Edited this week",
    variant: "word",
  },
];

const TEMPLATES = [
  {
    title: "Neon arcade",
    prompt: "a neon snake game with speed boosts and electric walls",
    tag: "Canvas",
    variant: "snake",
  },
  {
    title: "Idle empire",
    prompt: "a cookie clicker game with upgrades and prestige levels",
    tag: "Clicker",
    variant: "clicker",
  },
  {
    title: "Daily word",
    prompt: "a word puzzle with six guesses, hints, and a streak counter",
    tag: "Puzzle",
    variant: "word",
  },
  {
    title: "Orbital defense",
    prompt: "a space shooter defending a station from meteor waves",
    tag: "Shooter",
    variant: "space",
  },
  {
    title: "Dungeon cards",
    prompt: "a card battler where each draw explores a dungeon room",
    tag: "Cards",
    variant: "cards",
  },
  {
    title: "Tiny platformer",
    prompt: "a one-screen platformer with coins, spikes, and a timer",
    tag: "Platformer",
    variant: "platformer",
  },
];

const METRICS = [
  { value: "48", label: "game blueprints" },
  { value: "3", label: "playable mocks" },
  { value: "1-click", label: "HTML export" },
];

function Icon({ name, className = "" }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };

  const paths = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15 9-2 6-4 2 2-6 4-2Z" />
      </>
    ),
    nodes: (
      <>
        <circle cx="6" cy="7" r="2.5" />
        <circle cx="18" cy="7" r="2.5" />
        <circle cx="12" cy="18" r="2.5" />
        <path d="M8.2 8.3 11 15.6M15.8 8.3 13 15.6M8.5 7h7" />
      </>
    ),
    grid: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1.5" />
        <rect x="14" y="4" width="6" height="6" rx="1.5" />
        <rect x="4" y="14" width="6" height="6" rx="1.5" />
        <rect x="14" y="14" width="6" height="6" rx="1.5" />
      </>
    ),
    star: <path d="m12 3 2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.2 6-.9L12 3Z" />,
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </>
    ),
    users: (
      <>
        <path d="M16 20a5 5 0 0 0-10 0" />
        <circle cx="11" cy="8" r="4" />
        <path d="M20 19a4 4 0 0 0-3-3.8" />
        <path d="M17 5.2a3 3 0 0 1 0 5.6" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    arrow: <path d="M5 12h13m-5-5 5 5-5 5" />,
    bolt: <path d="M13 2 4 14h7l-1 8 10-13h-7l1-7Z" />,
    gift: (
      <>
        <rect x="3" y="8" width="18" height="13" rx="2" />
        <path d="M3 12h18M12 8v13" />
        <path d="M12 8H8.5A2.5 2.5 0 1 1 12 4.5V8Z" />
        <path d="M12 8h3.5A2.5 2.5 0 1 0 12 4.5V8Z" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </>
    ),
    reload: (
      <>
        <path d="M20 12a8 8 0 1 1-2.3-5.7" />
        <path d="M20 4v6h-6" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || paths.grid}</svg>;
}

function LogoMark() {
  return (
    <div className="logo-mark" aria-hidden>
      <span />
    </div>
  );
}

function Sidebar({ activeView, setActiveView, hasGame, html, downloadGame }) {
  function shareBuilder() {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
  }

  return (
    <aside className="app-sidebar">
      <div className="sidebar-head">
        <LogoMark />
        <button className="workspace-switch" type="button" onClick={() => setActiveView("home")}>
          <span className="workspace-initial">A</span>
          <span>Builder workspace</span>
          <span className="workspace-chevron">v</span>
        </button>
      </div>

      <nav className="nav-stack" aria-label="Workspace">
        {WORKSPACE_NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`side-nav-button ${activeView === item.id ? "is-active" : ""}`}
            onClick={() => setActiveView(item.id)}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.id === "search" && <kbd>Ctrl K</kbd>}
          </button>
        ))}
      </nav>

      <div className="nav-label">Projects</div>
      <nav className="nav-stack" aria-label="Projects">
        {PROJECT_NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`side-nav-button ${activeView === item.id ? "is-active" : ""}`}
            onClick={() => setActiveView(item.id)}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="nav-label">Recents</div>
      <button
        type="button"
        className="recent-link"
        onClick={() => setActiveView(hasGame ? "preview" : "projects")}
      >
        Neon Snake Lab
      </button>

      <div className="sidebar-spacer" />

      <button type="button" className="sidebar-card" onClick={shareBuilder}>
        <span>
          <strong>Share builder</strong>
          <small>Copy link to this workspace</small>
        </span>
        <Icon name="gift" />
      </button>
      <button
        type="button"
        className="sidebar-card sidebar-card-accent"
        onClick={() => html ? downloadGame() : setActiveView("preview")}
      >
        <span>
          <strong>Ship faster</strong>
          <small>{html ? "Download your game now" : "Export playable HTML"}</small>
        </span>
        <Icon name="bolt" />
      </button>
    </aside>
  );
}

function MobileTopbar({ activeView, setActiveView }) {
  return (
    <header className="mobile-topbar">
      <div className="mobile-brand">
        <LogoMark />
        <span>{PRODUCT_LABEL}</span>
      </div>
      <select
        value={activeView}
        onChange={(event) => setActiveView(event.target.value)}
        aria-label="Select view"
      >
        {[...WORKSPACE_NAV, ...PROJECT_NAV, { id: "preview", label: "Preview" }].map(
          (item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          )
        )}
      </select>
    </header>
  );
}

function PromptComposer({
  prompt,
  setPrompt,
  generate,
  planGame,
  loading,
  planning,
  compact = false,
}) {
  const textareaRef = useRef(null);

  return (
    <div className={`composer ${compact ? "composer-compact" : ""}`}>
      <textarea
        ref={textareaRef}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Describe the game you want to build..."
        rows={compact ? 3 : 4}
      />
      <div className="composer-actions">
        <button
          type="button"
          className="round-icon-button"
          aria-label="Add context"
          onClick={() => textareaRef.current?.focus()}
        >
          <Icon name="plus" />
        </button>
        <div className="composer-right">
          {planGame && (
            <button
              type="button"
              onClick={() => planGame()}
              disabled={planning || !prompt.trim()}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.7)",
                borderRadius: "999px",
                padding: "10px 18px",
                fontSize: "14px",
                cursor: planning || !prompt.trim() ? "not-allowed" : "pointer",
                opacity: planning || !prompt.trim() ? 0.5 : 1,
              }}
            >
              {planning ? "Thinking..." : "Preview →"}
            </button>
          )}
          <button
            type="button"
            onClick={() => generate()}
            disabled={loading || planning}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.7)",
              borderRadius: "999px",
              padding: "10px 18px",
              fontSize: "14px",
              cursor: loading || planning ? "not-allowed" : "pointer",
              opacity: loading || planning ? 0.5 : 1,
            }}
          >
            {loading ? "Building..." : "Generate →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickPrompts({ setPrompt, generate }) {
  return (
    <div className="quick-prompt-row">
      {QUICK_PROMPTS.map((chip) => (
        <button
          key={chip}
          type="button"
          className="chip-button"
          onClick={() => {
            setPrompt(chip);
          }}
          onDoubleClick={() => generate(chip)}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

function GameThumbnail({ variant = "snake", title }) {
  return (
    <div className={`game-thumbnail thumb-${variant}`}>
      <div className="thumb-topline" />
      <div className="thumb-grid">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="thumb-title">{title}</div>
      <div className="thumb-hud">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function ProjectCard({ project, onOpen }) {
  return (
    <button type="button" className="project-card" onClick={onOpen}>
      <GameThumbnail variant={project.variant} title={project.title} />
      <div className="project-meta">
        <span className="avatar-dot">{project.title[0]}</span>
        <span>
          <strong>{project.title}</strong>
          <small>{project.edited}</small>
        </span>
        <em>{project.status}</em>
      </div>
    </button>
  );
}

function TemplateCard({ template, onUse }) {
  return (
    <article className="template-card">
      <GameThumbnail variant={template.variant} title={template.title} />
      <div className="template-copy">
        <span>{template.tag}</span>
        <h3>{template.title}</h3>
        <p>{template.prompt}</p>
      </div>
      <button type="button" className="ghost-button" onClick={() => onUse(template.prompt)}>
        Use template
      </button>
    </article>
  );
}

function PlanCard({ plan, setPlan, generate }) {
  const lines = plan.split("\n").filter((line) => line.trim());

  return (
    <div
      style={{
        maxWidth: "680px",
        margin: "24px auto 0",
        background: "rgba(13,148,136,0.08)",
        border: "1px solid rgba(13,148,136,0.3)",
        borderRadius: "16px",
        padding: "24px 28px",
      }}
    >
      <div
        style={{
          color: "#0d9488",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "2px",
          marginBottom: "16px",
        }}
      >
        GAME CONCEPT
      </div>
      {lines.map((line, index) => (
        <p
          key={index}
          style={{
            color: index === 0 ? "#fff" : "rgba(255,255,255,0.65)",
            fontSize: index === 0 ? "20px" : "14px",
            fontWeight: index === 0 ? 700 : 400,
            lineHeight: 1.7,
            margin: index === 0 ? "0 0 12px" : "0 0 8px",
          }}
        >
          {line}
        </p>
      ))}
      <button
        type="button"
        onClick={() => generate()}
        style={{
          background: "#0d9488",
          color: "#fff",
          border: "none",
          borderRadius: "999px",
          padding: "12px",
          width: "100%",
          marginTop: "20px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Build this game →
      </button>
      <button
        type="button"
        onClick={() => setPlan(null)}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.3)",
          fontSize: "12px",
          marginTop: "12px",
          cursor: "pointer",
          display: "block",
          width: "100%",
          textAlign: "center",
        }}
      >
        Clear
      </button>
    </div>
  );
}

function HomeView({
  prompt,
  setPrompt,
  generate,
  planGame,
  plan,
  setPlan,
  loading,
  planning,
  error,
  setActiveView,
  openPreview,
}) {
  return (
    <div className="view-stack">
      <section className="hero-stage">
        <div className="hero-glow" aria-hidden />
        <button type="button" className="connector-pill" onClick={() => setActiveView("connectors")}>
          <span className="mini-badges">
            <i />
            <i />
            <i />
          </span>
          Connect all your tools
          <Icon name="arrow" />
        </button>
        <h1>What should we make playable?</h1>
        <p>
          Turn a rough idea into a browser game, preview it instantly, then export
          the whole thing as one HTML file.
        </p>
        <PromptComposer
          prompt={prompt}
          setPrompt={setPrompt}
          generate={generate}
          planGame={planGame}
          loading={loading}
          planning={planning}
        />
        <QuickPrompts setPrompt={setPrompt} generate={generate} />
        {plan && <PlanCard plan={plan} setPlan={setPlan} generate={generate} />}
        {error && <div className="error-banner">{error}</div>}
      </section>

      <section className="project-shelf">
        <div className="section-head">
          <div>
            <span>Workspace</span>
            <h2>Keep building from your last idea</h2>
          </div>
          <button type="button" className="text-link" onClick={() => setActiveView("projects")}>
            Browse all
            <Icon name="arrow" />
          </button>
        </div>
        <div className="featured-project">
          <ProjectCard
            project={PROJECTS[0]}
            onOpen={openPreview}
          />
          <div className="featured-copy">
            <span className="eyebrow">Live prototype</span>
            <h3>Neon Snake Lab</h3>
            <p>
              A complete sandboxed canvas game with scoring, restart, keyboard
              controls, and a vivid arcade treatment.
            </p>
            <button type="button" className="primary-button" onClick={openPreview}>
              Open preview
            </button>
          </div>
        </div>
      </section>

      <section className="template-strip">
        <div className="section-head">
          <div>
            <span>Resources</span>
            <h2>Start from a game pattern</h2>
          </div>
          <button
            type="button"
            className="text-link"
            onClick={() => setActiveView("resources")}
          >
            View library
            <Icon name="arrow" />
          </button>
        </div>
        <div className="template-grid compact-grid">
          {TEMPLATES.slice(0, 3).map((template) => (
            <TemplateCard
              key={template.title}
              template={template}
              onUse={(nextPrompt) => {
                setPrompt(nextPrompt);
                generate(nextPrompt);
              }}
            />
          ))}
        </div>
      </section>

      <section className="numbers-band">
        {METRICS.map((metric) => (
          <div key={metric.label} className="metric-card">
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

function ProjectsView({ title = "Projects", openPreview, setActiveView }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Any status");
  const statuses = ["Any status", "Ready", "Mock"];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROJECTS.filter((p) => {
      const matchesQuery = !q || `${p.title} ${p.prompt}`.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "Any status" || p.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter]);

  return (
    <div className="page-panel">
      <div className="toolbar-head">
        <div>
          <h1>{title}</h1>
          <p>Every generated concept, mock, and playable export in one place.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => setActiveView("home")}>
          <Icon name="plus" />
          Create
        </button>
      </div>
      <div className="filter-row">
        <label className="search-field">
          <Icon name="search" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects..."
          />
        </label>
        <button type="button" style={{ opacity: 0.5 }}>Last edited</button>
        {statuses.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            style={{ opacity: statusFilter === s ? 1 : 0.5, fontWeight: statusFilter === s ? 600 : 400 }}
          >
            {s}
          </button>
        ))}
      </div>
      <h2 className="subhead">Active in last 60 days</h2>
      <div className="project-grid">
        {filtered.length > 0 ? filtered.map((project) => (
          <ProjectCard
            key={project.title}
            project={project}
            onOpen={openPreview}
          />
        )) : (
          <p style={{ color: "rgba(255,255,255,0.4)", padding: "24px 0" }}>No projects match your search.</p>
        )}
      </div>
    </div>
  );
}

function ResourcesView({ searchMode = false, query, setQuery, setPrompt, generate }) {
  const templates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TEMPLATES;
    return TEMPLATES.filter((template) =>
      `${template.title} ${template.prompt} ${template.tag}`.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="page-panel">
      <div className="toolbar-head">
        <div>
          <h1>{searchMode ? "Search" : "Resources"}</h1>
          <p>Reusable prompts and playable patterns for your next game.</p>
        </div>
      </div>
      <label className="resource-search">
        <Icon name="search" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search templates, genres, mechanics..."
        />
      </label>
      <div className="template-grid">
        {templates.map((template) => (
          <TemplateCard
            key={template.title}
            template={template}
            onUse={(nextPrompt) => {
              setPrompt(nextPrompt);
              generate(nextPrompt);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ConnectorsView() {
  const connectors = ["Design brief", "Game rules", "Art direction", "Export target"];
  return (
    <div className="page-panel connectors-panel">
      <div className="toolbar-head">
        <div>
          <h1>Connectors</h1>
          <p>Bring structured context into the game generator.</p>
        </div>
      </div>
      <div className="connector-grid">
        {connectors.map((connector) => (
          <article key={connector} className="connector-card">
            <Icon name="nodes" />
            <h2>{connector}</h2>
            <p>Ready for a future integration. For now, prompts drive the build.</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function RatingBar({ generationId, rated, setRated, setShowRating, setShowThanks }) {
  function handleRating(stars) {
    console.log("Rating submitted:", { generationId, rating: stars });
    setRated(true);
    setShowRating(false);
    setShowThanks(true);
    setTimeout(() => setShowThanks(false), 2000);
  }

  return (
    <div
      style={{
        width: "100%",
        background: "#111",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
        How was it?
      </span>
      {[1, 2, 3, 4, 5].map((stars) => (
        <button
          key={stars}
          type="button"
          onClick={() => handleRating(stars)}
          aria-label={`Rate ${stars} stars`}
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "transparent",
            color: "rgba(255,255,255,0.6)",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {stars}
        </button>
      ))}
    </div>
  );
}

function PreviewView({
  html,
  prompt,
  setPrompt,
  generatedPrompt,
  loading,
  planning,
  error,
  generate,
  planGame,
  reset,
  downloadGame,
  generationId,
  showRating,
  setShowRating,
  rated,
  setRated,
  showThanks,
  setShowThanks,
}) {
  useEffect(() => {
    if (!html || rated) return;

    const timer = setTimeout(() => {
      setShowRating(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [html, rated, setShowRating]);

  const [showFullBrief, setShowFullBrief] = useState(false);
  const briefText = generatedPrompt || prompt || DEFAULT_PROMPT;

  return (
    <div className="preview-workspace">
      <section className="build-panel">
        <div className="build-panel-head">
          <LogoMark />
          <div>
            <h1>{PRODUCT_LABEL}</h1>
            <p>Previewing last generated version</p>
          </div>
        </div>

        <article className="brief-card">
          <h2>Game brief</h2>
          <p style={{ WebkitLineClamp: showFullBrief ? "unset" : 2, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical" }}>
            {briefText}
          </p>
          <button type="button" onClick={() => setShowFullBrief((v) => !v)}>
            {showFullBrief ? "Show less" : "Show more"}
          </button>
        </article>

        <div className="build-log">
          <span>Thought for 7s</span>
          <p>
            Built a focused browser game with a complete start state, live
            controls, scoring, restart behavior, and a polished visual skin.
          </p>
        </div>

        <div className="result-card">
          <div className="result-icon">
            <Icon name="grid" />
          </div>
          <div>
            <strong>{html ? "Created playable game" : "Ready to generate"}</strong>
            <small>
              {html
                ? "Open the preview, test it, then download the HTML."
                : "Describe a game and build the first version."}
            </small>
          </div>
        </div>

        <div className="preview-composer">
          <PromptComposer
            prompt={prompt}
            setPrompt={setPrompt}
            generate={generate}
            planGame={planGame}
            loading={loading}
            planning={planning}
            compact
          />
          {error && <div className="error-banner">{error}</div>}
        </div>
      </section>

      <section className="preview-panel">
        {showRating && !rated && html && (
          <RatingBar
            generationId={generationId}
            rated={rated}
            setRated={setRated}
            setShowRating={setShowRating}
            setShowThanks={setShowThanks}
          />
        )}
        {showThanks && (
          <div
            style={{
              width: "100%",
              background: "#111",
              padding: "10px 20px",
              color: "#0d9488",
              fontSize: "13px",
              textAlign: "center",
            }}
          >
            Thanks! We&apos;ll make the next one better.
          </div>
        )}
        <header className="preview-toolbar">
          <div className="preview-url">
            <span />
            <strong>/ preview</strong>
          </div>
          <div className="preview-actions">
            <button type="button" className="icon-text-button" onClick={reset}>
              <Icon name="plus" />
              New game
            </button>
            <button type="button" className="icon-text-button" onClick={() => generate()}>
              <Icon name="reload" />
              Rebuild
            </button>
            <button
              type="button"
              className="icon-text-button is-primary"
              onClick={downloadGame}
              disabled={!html}
            >
              <Icon name="download" />
              Download
            </button>
          </div>
        </header>

        <div className="iframe-shell">
          {html ? (
            <iframe
              title="Generated game"
              srcDoc={html}
              sandbox="allow-scripts"
              className="game-frame"
            />
          ) : (
            <div className="empty-preview">
              <LogoMark />
              <h2>No game generated yet</h2>
              <p>Start with a prompt or template to fill this preview.</p>
              <button type="button" className="primary-button" onClick={() => generate(DEFAULT_PROMPT)}>
                Build starter game
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function safeFileName(value) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "generated-game";
}

export default function Home() {
  const [activeView, setActiveView] = useState("home");
  const [prompt, setPrompt] = useState("");
  const [html, setHtml] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState(null);
  const [planning, setPlanning] = useState(false);
  const [generationId, setGenerationId] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [showThanks, setShowThanks] = useState(false);

  async function planGame(overridePrompt) {
    const requestPrompt = (overridePrompt ?? prompt).trim();
    if (!requestPrompt) {
      setError("Describe a game first.");
      return;
    }

    setPrompt(requestPrompt);
    setPlanning(true);
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: requestPrompt, mode: "plan" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Planning failed.");
      }
      setPlan(data.plan);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setPlanning(false);
    }
  }

  async function generate(overridePrompt) {
    const requestPrompt = (overridePrompt ?? prompt).trim();
    if (!requestPrompt) {
      setError("Describe a game first.");
      return;
    }

    setPrompt(requestPrompt);
    setPlan(null);
    setLoading(true);
    setError("");
    setShowRating(false);
    setRated(false);
    setShowThanks(false);
    setGenerationId(null);
    const startedAt = Date.now();

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: requestPrompt, mode: "generate" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Generation failed.");
      }

      const elapsed = Date.now() - startedAt;
      if (elapsed < 650) {
        await new Promise((resolve) => setTimeout(resolve, 650 - elapsed));
      }

      setHtml(data.html);
      setGeneratedPrompt(requestPrompt);
      setActiveView("preview");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setHtml("");
    setGeneratedPrompt("");
    setPrompt("");
    setError("");
    setPlan(null);
    setShowRating(false);
    setRated(false);
    setShowThanks(false);
    setGenerationId(null);
    setActiveView("home");
  }

  function openPreview() {
    if (!html) {
      generate(DEFAULT_PROMPT);
      return;
    }
    setActiveView("preview");
  }

  function downloadGame() {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFileName(generatedPrompt || prompt)}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  const projectTitle =
    activeView === "starred"
      ? "Starred"
      : activeView === "created"
        ? "Created by me"
        : activeView === "shared"
          ? "Shared with me"
          : "Projects";

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} setActiveView={setActiveView} hasGame={!!html} html={html} downloadGame={downloadGame} />
      <div className="app-main">
        <MobileTopbar activeView={activeView} setActiveView={setActiveView} />
        {activeView === "home" && (
          <HomeView
            prompt={prompt}
            setPrompt={setPrompt}
            generate={generate}
            planGame={planGame}
            plan={plan}
            setPlan={setPlan}
            loading={loading}
            planning={planning}
            error={error}
            setActiveView={setActiveView}
            openPreview={openPreview}
          />
        )}
        {["projects", "starred", "created", "shared"].includes(activeView) && (
          <ProjectsView title={projectTitle} openPreview={openPreview} setActiveView={setActiveView} />
        )}
        {(activeView === "resources" || activeView === "search") && (
          <ResourcesView
            searchMode={activeView === "search"}
            query={query}
            setQuery={setQuery}
            setPrompt={setPrompt}
            generate={generate}
          />
        )}
        {activeView === "connectors" && <ConnectorsView />}
        {activeView === "preview" && (
          <PreviewView
            html={html}
            prompt={prompt}
            setPrompt={setPrompt}
            generatedPrompt={generatedPrompt}
            loading={loading}
            planning={planning}
            error={error}
            generate={generate}
            planGame={planGame}
            reset={reset}
            downloadGame={downloadGame}
            generationId={generationId}
            showRating={showRating}
            setShowRating={setShowRating}
            rated={rated}
            setRated={setRated}
            showThanks={showThanks}
            setShowThanks={setShowThanks}
          />
        )}
      </div>
    </div>
  );
}
