import {
  updateGenerationFeedback,
  getGenerationContext,
  extractAndSaveLesson,
} from "../../../lib/memory";

export const runtime = "nodejs";

// Records a player's reaction to a freshly generated game against the
// generation row created in /api/generate (id arrives via the X-Generation-Id
// header on that response). Best-effort: it never blocks the UI and degrades to
// a no-op if the analytics tables aren't set up.
export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) {
    return Response.json({ ok: false }, { status: 200 });
  }

  // rating: 1 = liked, -1 = disliked. Optional richer signals when offered.
  const rating = body?.rating === 1 || body?.rating === -1 ? body.rating : null;
  const funRating =
    Number.isInteger(body?.funRating) && body.funRating >= 1 && body.funRating <= 5
      ? body.funRating
      : null;
  const workedFirstTry =
    typeof body?.workedFirstTry === "boolean" ? body.workedFirstTry : null;
  const comment =
    typeof body?.comment === "string" ? body.comment.trim().slice(0, 500) : null;

  try {
    await updateGenerationFeedback(id, {
      rating,
      funRating,
      workedFirstTry,
      userFeedback: comment || null,
      notableSuccess: rating === 1 ? true : null,
    });

    // A thumbs-down is a strong signal — turn it into an "avoid this" lesson so
    // the next game of this kind comes out better. Best-effort, fire-and-forget.
    if (rating === -1) {
      const ctx = await getGenerationContext(id);
      if (ctx) {
        extractAndSaveLesson({
          prompt: ctx.prompt,
          genre: ctx.genre,
          visualTheme: ctx.visualTheme,
          success: false,
          generationId: id,
        }).catch(() => {});
      }
    }
  } catch {
    /* analytics are best-effort */
  }

  return Response.json({ ok: true }, { status: 200 });
}
