// ─────────────────────────────────────
// 7_cursor.js — click effect only
// Used by: all pages. Self-contained (injects its own CSS).
//
// Behavior: keep the NORMAL native cursor for moving/scrolling.
// On click, show an orange dot that bursts outward and fades.
// ─────────────────────────────────────

(function () {
  // Respect reduced motion: keep the native cursor, show no burst animation.
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  const style = document.createElement("style");
  style.textContent = `
    .click-dot {
      position: fixed; left: 0; top: 0;
      width: 16px; height: 16px; border-radius: 50%;
      background: rgb(245, 158, 11);
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.85);
      pointer-events: none; z-index: 9999;
      transform: translate(-50%, -50%) scale(0.4);
      animation: click-dot-burst 0.5s ease-out forwards;
    }
    @keyframes click-dot-burst {
      0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(2.6); opacity: 0; }
    }
  `;

  function mount() { document.head.appendChild(style); }

  // Don't burst when clicking a form field (the "filling" controls) or a toggle switch
  const FORM_FIELD = 'input, textarea, select, [contenteditable="true"], .toggle-switch, .toggle, [role="switch"]';

  window.addEventListener("mousedown", function (e) {
    if (e.target.closest && e.target.closest(FORM_FIELD)) return;
    const dot = document.createElement("div");
    dot.className = "click-dot";
    dot.style.left = e.clientX + "px";
    dot.style.top  = e.clientY + "px";
    document.body.appendChild(dot);
    dot.addEventListener("animationend", function () { dot.remove(); });
  }, { passive: true });

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
