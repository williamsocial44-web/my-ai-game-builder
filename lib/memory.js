import Anthropic from "@anthropic-ai/sdk";
import { SEED_LESSONS } from "./game-knowledge";
import { supabase } from "./supabase";

const PLAN_MODEL = "claude-haiku-4-5-20251001";
const MAX_PLAN_TOKENS = 300;

const THEME_POOL = [
  "neon",
  "nature",
  "space",
  "cozy",
  "retro",
  "minimal",
  "fantasy",
];

let lastVisualTheme = null;

export function detectGenre(prompt) {
  const p = (prompt || "").toLowerCase();
  if (/\b(3d|fps|first person|webgl|voxel|minecraft)\b/.test(p)) {
    return "3d";
  }
  if (/\b(isometric|tactics|crpg)\b/.test(p)) {
    return "strategy";
  }
  if (/\b(tower defense|td)\b/.test(p)) {
    return "tower_defense";
  }
  if (/\b(shoot|shooter|battle|fight|combat|war|gun|laser|blast)\b/.test(p)) {
    return "action";
  }
  if (/\b(puzzle|solve|match|logic|brain|teaser|riddle|tetris|sokoban)\b/.test(p)) {
    return "puzzle";
  }
  if (/\b(platform|jump|mario|run|climb|ledge|side scroll)\b/.test(p)) {
    return "platformer";
  }
  if (/\b(arcade|retro|classic|high score|brick|breakout|pong)\b/.test(p)) {
    return "arcade";
  }
  if (/\b(racing|race|driving|drift|lap)\b/.test(p)) {
    return "racing";
  }
  if (/\b(idle|clicker|cookie|incremental|tap|farm|tycoon)\b/.test(p)) {
    return "idle";
  }
  if (/\b(word|spell|letter|guess|vocabulary|crossword|wordle)\b/.test(p)) {
    return "word";
  }
  if (/\b(card|deck|poker|blackjack|solitaire|hand)\b/.test(p)) {
    return "card";
  }
  if (/\b(rhythm|music|dance|beat|guitar)\b/.test(p)) {
    return "rhythm";
  }
  if (/\b(soccer|football|basketball|tennis|golf|sports)\b/.test(p)) {
    return "sports";
  }
  if (/\b(roguelike|rogue|permadeath)\b/.test(p)) {
    return "roguelike";
  }
  if (/\b(horror|survival|escape room|haunted)\b/.test(p)) {
    return "horror";
  }
  if (/\b(sandbox|creative|craft|build|paint)\b/.test(p)) {
    return "sandbox";
  }
  if (/\b(adventure|dungeon|quest|explore|story|rpg|narrative)\b/.test(p)) {
    return "adventure";
  }
  return "other";
}

export function detectVisualTheme(prompt) {
  const p = (prompt || "").toLowerCase();

  const rules = [
    {
      theme: "neon",
      keywords: ["neon", "glow", "cyber", "synthwave", "retro"],
    },
    {
      theme: "nature",
      keywords: [
        "farm",
        "garden",
        "forest",
        "jungle",
        "ocean",
        "underwater",
      ],
    },
    {
      theme: "space",
      keywords: ["space", "star", "galaxy", "alien", "planet", "cosmic"],
    },
    {
      theme: "cozy",
      keywords: ["cozy", "cute", "pastel", "warm", "cottage", "village"],
    },
    {
      theme: "horror",
      keywords: ["horror", "dark", "spooky", "haunted", "zombie", "ghost"],
    },
    {
      theme: "retro",
      keywords: ["pixel", "8bit", "classic", "old school", "arcade"],
    },
    {
      theme: "minimal",
      keywords: ["minimal", "clean", "simple", "white", "geometric"],
    },
    {
      theme: "fantasy",
      keywords: [
        "fantasy",
        "magic",
        "wizard",
        "dragon",
        "medieval",
        "castle",
      ],
    },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((kw) => p.includes(kw))) {
      if (rule.theme === lastVisualTheme) {
        break;
      }
      lastVisualTheme = rule.theme;
      return rule.theme;
    }
  }

  let theme;
  do {
    theme = THEME_POOL[Math.floor(Math.random() * THEME_POOL.length)];
  } while (theme === lastVisualTheme);

  lastVisualTheme = theme;
  return theme;
}

export async function saveGeneration(data) {
  if (!supabase) return null;
  try {
    const { data: row, error } = await supabase
      .from("game_generations")
      .insert({
        prompt: data.prompt,
        genre: data.genre,
        mode: data.mode,
        output_length: data.outputLength,
        token_count: data.tokenCount,
        model: data.model,
        success: data.success,
        visual_theme: data.visualTheme,
      })
      .select("id")
      .single();

    if (error) {
      console.error("saveGeneration error:", error.message);
      return null;
    }
    return row?.id ?? null;
  } catch (err) {
    console.error("saveGeneration error:", err.message);
    return null;
  }
}

// Reads back the prompt/genre/theme of a logged generation so a negative
// rating can be turned into an "avoid this" lesson. Returns null if unavailable.
export async function getGenerationContext(id) {
  if (!supabase || !id) return null;
  try {
    const { data, error } = await supabase
      .from("game_generations")
      .select("prompt, genre, visual_theme")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return {
      prompt: data.prompt,
      genre: data.genre,
      visualTheme: data.visual_theme,
    };
  } catch {
    return null;
  }
}

export async function updateGenerationFeedback(id, feedback) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from("game_generations")
      .update({
        rating: feedback.rating,
        user_feedback: feedback.userFeedback,
        visual_quality: feedback.visualQuality,
        fun_rating: feedback.funRating,
        worked_first_try: feedback.workedFirstTry,
        genre_accurate: feedback.genreAccurate,
        notable_success: feedback.notableSuccess,
      })
      .eq("id", id);

    if (error) {
      console.error("updateGenerationFeedback error:", error.message);
    }
  } catch (err) {
    console.error("updateGenerationFeedback error:", err.message);
  }
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

export async function getLessons() {
  if (!supabase) return [];
  try {
    const { data, error } = await withTimeout(
      supabase
        .from("learned_lessons")
        .select("category, lesson, confidence, times_confirmed")
        .eq("active", true)
        .order("confidence", { ascending: false })
        .order("times_confirmed", { ascending: false })
        .limit(25),
      3000
    );

    if (error) {
      console.error("getLessons error:", error.message);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.error("getLessons error:", err.message);
    return [];
  }
}

// Keywords (as they appear in lesson text) that signal a lesson is relevant to
// a detected genre — used to float genre-specific wisdom up into the injected set.
const GENRE_LESSON_KEYWORDS = {
  platformer: ["platformer", "coyote", "jump", "gravity", "runner"],
  action: ["shooter", "bullet", "aim", "space invaders", "twin-stick", "aggression"],
  puzzle: ["puzzle", "match-3", "match 3", "sokoban", "cascade", "sliding tile", "zeigarnik"],
  idle: ["idle", "clicker", "prestige", "incremental", "automation"],
  word: ["word", "wordle"],
  card: ["card", "deck", "poker", "deckbuilder"],
  rhythm: ["rhythm", "bpm", "note", "combo"],
  sports: ["sports", "ball", "scoreboard"],
  roguelike: ["roguelike", "synergy", "permadeath", "dungeon", "enemy intent"],
  horror: ["horror", "scare", "dread", "tension", "silence"],
  racing: ["racing", "drift", "lap", "road", "pseudo-3d"],
  tower_defense: ["tower defense", "tower", "wave"],
  strategy: ["strategy", "rts", "turn", "auto battler"],
  adventure: ["rpg", "dungeon", "quest", "turn-based", "identity fantasy"],
  sandbox: ["sandbox", "city builder", "farming", "simulation", "cozy", "compounding"],
  arcade: ["arcade", "score", "combo", "breakout", "snake"],
  "3d": ["3d", "raycast", "fps", "webgl", "isometric"],
};

function lessonRelevance(lesson, genre) {
  const kws = GENRE_LESSON_KEYWORDS[genre];
  if (!kws) return 0;
  const text = (lesson.lesson || "").toLowerCase();
  return kws.some((k) => text.includes(k)) ? 1 : 0;
}

export async function buildLessonsContext(prompt = "") {
  const genre = detectGenre(prompt);
  const [dbLessons, catalogLessons] = await Promise.all([
    getLessons(),
    supabase
      ? withTimeout(
          supabase
            .from("catalog_lessons")
            .select("category,lesson,confidence")
            .eq("active", true)
            .order("confidence", { ascending: false })
            .limit(20)
            .then(({ data }) => data ?? []),
          3000
        ).catch(() => [])
      : Promise.resolve([]),
  ]);

  const seen = new Set();
  const merged = [];

  for (const lesson of [...dbLessons, ...catalogLessons, ...SEED_LESSONS]) {
    const key = lesson.lesson;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(lesson);
  }

  // Sort by confidence, but give genre-relevant lessons a +2 confidence bonus so
  // the most useful wisdom for THIS game rises to the top without dropping the
  // elite universal lessons.
  const score = (l) => (l.confidence ?? 0) + lessonRelevance(l, genre) * 2;
  merged.sort((a, b) => {
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    return (b.times_confirmed ?? 0) - (a.times_confirmed ?? 0);
  });

  const top = merged.slice(0, 45);
  if (!top.length) return "";

  const lines = top.map(
    (l) => `- [${l.category}] ${l.lesson} (confidence: ${l.confidence})`
  );
  return lines.join("\n");
}

function parseLessonJson(text) {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```[a-zA-Z]*\s*\n?/, "");
    t = t.replace(/\n?```\s*$/, "");
  }
  return JSON.parse(t.trim());
}

export async function extractAndSaveLesson(generationData) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return;

    const haikuPrompt = `A game was just generated on GameCraft. Prompt: ${generationData.prompt}. Genre: ${generationData.genre}. Visual theme: ${generationData.visualTheme}. Success: ${generationData.success}. Analyze this and write ONE specific actionable lesson under 150 characters about what makes this type of game work well or what to avoid. Return JSON only with no other text: {category, lesson, confidence} where category is one of: visual, gameplay, genre, prompt_interpretation, audio, performance and confidence is 1-10.`;

    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: PLAN_MODEL,
      max_tokens: MAX_PLAN_TOKENS,
      messages: [{ role: "user", content: haikuPrompt }],
    });

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    const parsed = parseLessonJson(text);
    if (!parsed?.lesson || !parsed?.category) return;

    if (!supabase) return;
    // `lesson` is uniquely indexed — ignore duplicates quietly rather than
    // logging a unique-violation every time the AI re-derives a known lesson.
    const { error } = await supabase
      .from("learned_lessons")
      .upsert(
        {
          category: parsed.category,
          lesson: parsed.lesson,
          confidence: parsed.confidence ?? 5,
          source_generation_id: generationData.generationId ?? null,
        },
        { onConflict: "lesson", ignoreDuplicates: true }
      );

    if (error) {
      console.error("extractAndSaveLesson upsert error:", error.message);
    }
  } catch (err) {
    console.error("extractAndSaveLesson error:", err.message);
  }
}
