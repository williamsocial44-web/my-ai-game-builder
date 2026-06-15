// Wraps a generated single-file game with a small fallback that guarantees the
// Start button works, used by both the in-app preview and the public /g/[id] page.
export function wrapPreviewHtml(html) {
  if (!html || typeof html !== "string") return html;
  const fallbackScript = `
  <script>
  (function () {
    // Gamecraft leaderboard SDK: a game can call window.gamecraft.submitScore(n)
    // at game over; the hosting page (in-app preview or /g/[id]) relays it.
    window.gamecraft = window.gamecraft || {};
    window.gamecraft.submitScore = function (score) {
      var n = Math.round(Number(score) || 0);
      try { parent.postMessage({ type: 'gamecraft:score', score: n }, '*'); } catch (e) {}
    };
    function findStartButton() {
      return document.getElementById('startBtn')
        || Array.from(document.querySelectorAll('button')).find((b) => /start|play/i.test(b.textContent || ''))
        || null;
    }
    function wire() {
      var b = findStartButton();
      if (!b) return;
      function go(e){ e.preventDefault(); e.stopPropagation();
        if (typeof window.startGame === 'function') return window.startGame();
        if (typeof window.__gamecraftStart === 'function') return window.__gamecraftStart();
      }
      b.addEventListener('click', go, false);
      b.onclick = go;
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', wire, { once: true });
    } else { setTimeout(wire, 0); }
  })();
  </script>`;
  return html.trim().endsWith("</body>")
    ? html.replace(/<\/body>/i, `${fallbackScript}</body>`)
    : `${html}\n${fallbackScript}`;
}
