import { GAME_REFERENCES } from "./games";
import {
  COLOR_PALETTES,
  MOOD_KEYWORDS,
  PLATFORM_GUIDES,
  STORY_ARCHETYPES,
} from "./taxonomy";

function tokenize(prompt) {
  return (prompt || "").toLowerCase();
}

function scoreReference(ref, p) {
  let score = 0;
  for (const kw of ref.k) {
    if (p.includes(kw)) score += kw.split(" ").length > 1 ? 12 : 6;
  }
  if (ref.g && p.includes(ref.g.replace("_", " "))) score += 3;
  return score;
}

function detectPalette(p) {
  let best = null;
  let bestScore = 0;

  for (const [id, keywords] of Object.entries(MOOD_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (p.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  }

  return best || "neon_arcade";
}

function detectStory(p) {
  const rules = [
    { id: "escape", k: ["escape", "trapped", "exit", "flee", "run away"] },
    { id: "survival", k: ["survive", "last stand", "endless", "horde", "waves"] },
    { id: "hero_journey", k: ["hero", "quest", "save", "adventure", "journey"] },
    { id: "mystery", k: ["mystery", "detective", "clue", "solve", "investigate"] },
    { id: "romance_choice", k: ["romance", "dating", "love", "relationship", "choices"] },
    { id: "heist", k: ["steal", "heist", "rob", "infiltrate", "sneak"] },
    { id: "revenge", k: ["revenge", "fight boss", "defeat", "enemy", "battle"] },
    { id: "discovery", k: ["explore", "discover", "find", "collect", "uncover"] },
    { id: "sandbox_free", k: ["sandbox", "creative", "build anything", "free play"] },
    { id: "tower_climb", k: ["climb", "ascend", "levels", "floors", "progress"] },
    { id: "corruption", k: ["dark", "curse", "corrupt", "sacrifice", "risk"] },
    { id: "time_loop", k: ["loop", "retry", "again", "rewind", "repeat"] },
    { id: "underdog", k: ["weak", "grow", "upgrade", "starter", "beginner"] },
  ];

  let best = "hero_journey";
  let bestScore = 0;
  for (const rule of rules) {
    let score = 0;
    for (const kw of rule.k) {
      if (p.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = rule.id;
    }
  }
  return best;
}

function detectPlatform(p) {
  if (/\b(mobile|phone|touch|swipe|tap|ios|android)\b/.test(p)) return "mobile";
  if (/\b(pc|computer|desktop|keyboard|mouse)\b/.test(p)) return "desktop";
  return "both";
}

function detectDimension(p) {
  if (/\b(3d|three dimensional|first person|fps|webgl|voxel)\b/.test(p)) {
    return "3D";
  }
  if (/\b(isometric|2\.5d|pseudo)\b/.test(p)) return "2.5D";
  return "2D";
}

export function retrieveGameContext(prompt) {
  const p = tokenize(prompt);
  const scored = GAME_REFERENCES.map((ref) => ({
    ref,
    score: scoreReference(ref, p),
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const topRefs = scored.length ? scored.slice(0, 5) : [];
  const paletteId = detectPalette(p);
  const palette = COLOR_PALETTES[paletteId];
  const storyId = detectStory(p);
  const story = STORY_ARCHETYPES[storyId];
  const platform = detectPlatform(p);
  const platformGuide = PLATFORM_GUIDES[platform];
  const dimension = detectDimension(p);

  const lines = [
    `CATALOG INTELLIGENCE (${GAME_REFERENCES.length} reference games indexed):`,
    `Detected dimension: ${dimension} | Platform: ${platform} | Story: ${storyId}`,
    `Color palette "${paletteId}": bg ${palette.bg}, accents ${palette.accents.join(", ")} — ${palette.mood}`,
    `Story arc: ${story}`,
    `Platform rules: ${platformGuide}`,
  ];

  if (topRefs.length) {
    lines.push("MATCHED REFERENCE GAMES — replicate their feel and mechanics:");
    for (const { ref } of topRefs) {
      lines.push(
        `- ${ref.k[0]}: genre=${ref.g}, mechanic=${ref.m}, build=${ref.b}`
      );
    }
  } else {
    lines.push(
      "No exact title match — combine closest genre patterns from catalog. Default to most fun interpretation."
    );
    const genreHints = GAME_REFERENCES.filter((ref) => {
      const genreWords = ref.g.split("_");
      return genreWords.some((w) => p.includes(w));
    }).slice(0, 3);

    if (genreHints.length) {
      lines.push("Genre-adjacent references:");
      for (const ref of genreHints) {
        lines.push(`- ${ref.k[0]}: ${ref.b}`);
      }
    }
  }

  lines.push(
    "Apply matched game DNA: copy their core loop, UI layout, color energy, and juice — not their copyrighted names or art."
  );

  return lines.join("\n");
}

export function getCatalogStats() {
  return {
    referenceGames: GAME_REFERENCES.length,
    colorPalettes: Object.keys(COLOR_PALETTES).length,
    storyArchetypes: Object.keys(STORY_ARCHETYPES).length,
    genres: new Set(GAME_REFERENCES.map((r) => r.g)).size,
  };
}
