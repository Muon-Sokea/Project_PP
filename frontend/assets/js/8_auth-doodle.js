// ─────────────────────────────────────
// 8_auth-doodle.js — hand-drawn doodle background for auth pages
// Used by: 2_login.html, 3_register.html
// Scatters low-opacity line-art icons (Remix Icon) in a pastel palette
// across a fixed background layer behind the card.
// ─────────────────────────────────────

(function () {
  const ICONS = [
    "ri-lightbulb-line", "ri-chat-3-line", "ri-arrow-right-up-line", "ri-star-line",
    "ri-heart-line", "ri-calendar-line", "ri-time-line", "ri-map-pin-line",
    "ri-camera-line", "ri-cup-line", "ri-book-open-line", "ri-pencil-line",
    "ri-cloud-line", "ri-settings-3-line", "ri-checkbox-circle-line", "ri-wifi-line",
    "ri-shopping-cart-line", "ri-mail-line", "ri-smartphone-line", "ri-global-line",
    "ri-computer-line", "ri-group-line", "ri-bar-chart-2-line", "ri-line-chart-line",
    "ri-rocket-line", "ri-ticket-2-line", "ri-music-2-line", "ri-palette-line",
    "ri-thumb-up-line", "ri-flag-line", "ri-compass-3-line", "ri-paint-brush-line"
  ];
  // sage green, terracotta orange, lavender purple, sky blue
  const COLORS = ["#9CAF88", "#E07A5F", "#9B8FC4", "#7FB5D9"];
  const COLS = 8, ROWS = 6;

  const layer = document.createElement("div");
  layer.className = "auth-doodle";
  layer.setAttribute("aria-hidden", "true");

  // Grid placement with jitter → even coverage, organic feel
  let html = "";
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const icon  = ICONS[Math.floor(Math.random() * ICONS.length)];
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const x = ((c + 0.5) / COLS) * 100 + (Math.random() * 8 - 4);
      const y = ((r + 0.5) / ROWS) * 100 + (Math.random() * 8 - 4);
      const size = 18 + Math.random() * 28;
      const rot  = Math.random() * 60 - 30;
      html +=
        '<i class="' + icon + ' doodle-icon" style="' +
        'left:' + x.toFixed(2) + '%;top:' + y.toFixed(2) + '%;' +
        'font-size:' + size.toFixed(1) + 'px;color:' + color + ';' +
        'transform:translate(-50%,-50%) rotate(' + rot.toFixed(1) + 'deg)"></i>';
    }
  }
  layer.innerHTML = html;

  function mount() { document.body.appendChild(layer); }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
