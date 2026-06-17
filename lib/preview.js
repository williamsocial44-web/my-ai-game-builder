// Wraps a generated single-file game with small fallbacks, used by both the
// in-app preview and the public /g/[id] page:
//   1. a storage SHIELD injected at the very top, and
//   2. a Start-button fallback injected at the very end.
export function wrapPreviewHtml(html) {
  if (!html || typeof html !== "string") return html;

  // Games run in an iframe sandboxed with allow-scripts only (no allow-same-origin),
  // so the document has an opaque origin: touching localStorage / sessionStorage /
  // document.cookie throws SecurityError and kills the game's script before it can
  // draw — the HUD shows but the canvas stays blank. The model is told not to use
  // them, but it sometimes does (e.g. a high-score read). This shim runs FIRST and
  // swaps in safe in-memory stores so the game keeps running instead of dying.
  const shieldScript = `<script>
  (function () {
    function store() {
      var m = {};
      return {
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
        setItem: function (k, v) { m[k] = String(v); },
        removeItem: function (k) { delete m[k]; },
        clear: function () { m = {}; },
        key: function (i) { return Object.keys(m)[i] || null; },
        get length() { return Object.keys(m).length; }
      };
    }
    function shield(name) {
      try { var s = window[name]; if (s) { s.getItem; return; } } catch (e) {}
      try { Object.defineProperty(window, name, { configurable: true, value: store() }); } catch (e) {}
    }
    shield('localStorage');
    shield('sessionStorage');
    try { var c = document.cookie; } catch (e) {
      try { Object.defineProperty(document, 'cookie', { configurable: true, get: function () { return ''; }, set: function () {} }); } catch (e2) {}
    }
  })();
  </script>`;

  const fallbackScript = `
  <script>
  (function () {
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
  // Inject the shield as early as possible so it runs before the game's own
  // <script> (which sits at the end of <body>).
  let out = html.trim();
  if (/<head[^>]*>/i.test(out)) out = out.replace(/<head[^>]*>/i, (m) => m + shieldScript);
  else if (/<body[^>]*>/i.test(out)) out = out.replace(/<body[^>]*>/i, (m) => m + shieldScript);
  else if (/<html[^>]*>/i.test(out)) out = out.replace(/<html[^>]*>/i, (m) => m + shieldScript);
  else out = shieldScript + out;

  // Wire the Start button last, just before </body> (even if a </html> follows).
  if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, `${fallbackScript}</body>`);
  else out = `${out}\n${fallbackScript}`;
  return out;
}
