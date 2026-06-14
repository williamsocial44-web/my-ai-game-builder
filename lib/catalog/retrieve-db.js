import { supabase } from "../supabase";

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

export async function retrieveFromDB(prompt) {
  if (!supabase) return null;

  try {
    const words = prompt.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    if (!words.length) return null;

    const { data, error } = await withTimeout(
      supabase
        .from("game_catalog")
        .select("name,genre,visual_theme,mechanic,build_hint,dimension,platform,tags,confidence")
        .gte("confidence", 7)
        .order("confidence", { ascending: false })
        .limit(200),
      3000
    );

    if (error || !data?.length) return null;

    const scored = data
      .map((row) => {
        let score = 0;
        const haystack = [
          row.name,
          row.genre,
          (row.tags || []).join(" "),
          row.mechanic,
        ]
          .join(" ")
          .toLowerCase();

        for (const word of words) {
          if (haystack.includes(word)) score += 2;
        }
        if (row.keywords) {
          for (const kw of row.keywords) {
            if (prompt.toLowerCase().includes(kw)) score += 5;
          }
        }
        return { row, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (!scored.length) return null;

    const lines = ["DB CATALOG MATCHES (from extended game knowledge base):"];
    for (const { row } of scored) {
      lines.push(
        `- ${row.name}: genre=${row.genre}, mechanic=${row.mechanic}, build=${row.build_hint}`
      );
    }
    return lines.join("\n");
  } catch {
    return null;
  }
}

export async function getDBLessons() {
  if (!supabase) return [];
  try {
    const { data, error } = await withTimeout(
      supabase
        .from("catalog_lessons")
        .select("category,lesson,genre,confidence")
        .eq("active", true)
        .order("confidence", { ascending: false })
        .limit(30),
      3000
    );

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}
