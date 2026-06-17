import { readFile } from "fs/promises";
import path from "path";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createZip, type ZipEntry } from "@/lib/zip";
import { wrapPreviewHtml } from "@/lib/preview";
import type { ProjectState } from "@/types/engine";

export const runtime = "nodejs";

/**
 * Download the open project as a runnable .zip.
 *  - HTML engine  → a single self-contained index.html.
 *  - Phaser engine → index.html + engine.js + game.json (a standalone build
 *    that self-injects its declarative state on load).
 */

function slug(s: string): string {
  return (
    (s || "game")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "gamecraft-game"
  );
}

function phaserExportIndex(title: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title.replace(/</g, "&lt;")}</title>
    <style>html,body{margin:0;height:100%;background:#0b0d12}#game-canvas-container{width:100vw;height:100vh;display:flex;align-items:center;justify-content:center}</style>
  </head>
  <body>
    <div id="game-canvas-container"></div>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js" onload="window.__phaserLoaded=true"></script>
    <script src="./engine.js"></script>
    <script>
      // Standalone build: load the bundled game and feed it to the engine once ready.
      fetch('./game.json').then(function (r) { return r.json(); }).then(function (game) {
        function send() { window.postMessage({ type: 'UPDATE_GAME_STATE_JSON', payload: game }, '*'); }
        window.addEventListener('message', function (e) {
          if (e.data && e.data.type === 'ENGINE_READY') send();
        });
        // In case the engine was already ready before this listener attached.
        setTimeout(send, 1200);
      });
    </script>
  </body>
</html>
`;
}

const README = (title: string, engine: string) => `${title} — built with GameCraft
Engine: ${engine}

HOW TO RUN
  Serve this folder with any static web server, e.g.:
    npx serve .
  then open the printed URL. (Opening index.html directly via file:// may be
  blocked by the browser for the Phaser build because it fetches game.json.)

Made with GameCraft.
`;

export async function GET(req: Request) {
  const projectId = new URL(req.url).searchParams.get("projectId");
  if (!projectId) {
    return new Response(JSON.stringify({ error: "projectId is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sb = await createServerSupabase();
  if (!sb) {
    return new Response(JSON.stringify({ error: "Storage isn't configured." }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) {
    return new Response(JSON.stringify({ error: "Sign in to export." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data, error } = await sb
    .from("projects")
    .select("title,current_state_json")
    .eq("id", projectId)
    .single();
  if (error || !data) {
    return new Response(JSON.stringify({ error: "Project not found." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const title = (data.title as string) || "Untitled Game";
  const state = data.current_state_json as ProjectState;
  const entries: ZipEntry[] = [];

  if (state?.engine === "phaser") {
    const engineJs = await readFile(
      path.join(process.cwd(), "public", "game-runner", "engine.js"),
      "utf8"
    );
    entries.push(
      { name: "index.html", content: phaserExportIndex(title) },
      { name: "engine.js", content: engineJs },
      { name: "game.json", content: JSON.stringify(state.declarative, null, 2) },
      { name: "README.txt", content: README(title, "Phaser (declarative)") }
    );
  } else {
    const html = state?.engine === "html" ? state.html : "";
    entries.push(
      { name: "index.html", content: wrapPreviewHtml(html || "<!doctype html><title>Empty</title>") },
      { name: "README.txt", content: README(title, "HTML (single file)") }
    );
  }

  const zip = createZip(entries);
  // Copy into a fresh ArrayBuffer so the Response body is a clean BodyInit.
  const body = zip.slice().buffer;
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug(title)}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
