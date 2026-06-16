// Build-quality choices shown in the prompt box. "auto" lets the server pick the
// model per game (see lib/game-knowledge assessComplexity + the router in
// app/api/generate/route.js); "fast"/"smart" force the cheap or most-capable model.
export const QUALITY_OPTIONS = [
  {
    id: "auto",
    label: "Auto",
    icon: "gauge",
    short: "picks for you",
    desc: "Automatically uses the fast model for simple games and the most capable one for complex games. Best for most builds.",
  },
  {
    id: "fast",
    label: "Fast",
    icon: "bolt",
    short: "quick & cheap",
    desc: "Quicker, cheaper builds on a lighter model. Great for simple games — snake, pong, clickers, word games.",
  },
  {
    id: "smart",
    label: "Smart",
    icon: "brain",
    short: "most capable",
    desc: "The most capable model, thinking deeply before it builds. Best for complex games — 3D, RPGs, lots of systems. Slower.",
  },
];
