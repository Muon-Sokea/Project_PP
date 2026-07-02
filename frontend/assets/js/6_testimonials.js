// ─────────────────────────────────────
// 6_testimonials.js — dual-direction review marquee
// Used by: 1_index.html
// ─────────────────────────────────────

(function () {
  const mount = document.getElementById("testiRows");
  if (!mount) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 8 unique, specific reviews (no duplicate filler copy)
  const reviews = [
    { id: 1, name: "Sokchea Lim",  username: "@sokchea_events", role: "Event Organizer",
      body: "I ran a 2,000-seat tech summit through Planning Center. Real-time seat tracking meant we never oversold a single ticket." },
    { id: 2, name: "Dara Phon",    username: "@daraphon",       role: "Attendee",
      body: "Booked my workshop spot in under a minute and the QR ticket landed in my dashboard instantly. No printing, no queues." },
    { id: 3, name: "Mealea Sok",   username: "@mealea.k",       role: "Marketing Lead",
      body: "The category filters and search made it effortless to find every networking event in Phnom Penh this quarter." },
    { id: 4, name: "Rithy Chan",   username: "@rithy_runs",     role: "Sports Coordinator",
      body: "Managing 6,000 runners used to be chaos. Now check-in is just scanning codes at the start line — done in seconds." },
    { id: 5, name: "Bopha Nuon",   username: "@bopha.designs",  role: "UX Designer",
      body: "Honestly the cleanest event dashboard I've used. Dark mode at 11pm while finalizing my schedule? Chef's kiss." },
    { id: 6, name: "Visal Kong",   username: "@visalk",         role: "Conference Speaker",
      body: "Got my confirmation, ticket, and reminder without a single email thread. The whole flow just quietly works." },
    { id: 7, name: "Channary Ros", username: "@channary",       role: "First-time Attendee",
      body: "As a first-timer I never felt lost — the prompts told me exactly what to do at each step of registration." },
    { id: 8, name: "Pisey Hang",   username: "@pisey_h",        role: "Volunteer Lead",
      body: "Refund requests that used to take days are now handled right in the dashboard in a couple of clicks." }
  ];

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function initials(name) {
    return name.split(/\s+/).map(function (w) { return w.charAt(0); })
      .join("").slice(0, 2).toUpperCase();
  }

  // Avatar: real (DiceBear) image over an initials fallback. If the image fails
  // to load (e.g. offline), it removes itself and the initials show through.
  function avatarUrl(r) {
    return "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
      encodeURIComponent(r.username || r.name);
  }

  function cardHTML(r, isClone) {
    const a11y = isClone ? 'aria-hidden="true" tabindex="-1"' : 'tabindex="0"';
    return `
      <article class="t-card" ${a11y}>
        <span class="t-orb" aria-hidden="true"></span>
        <div class="t-head">
          <div class="t-avatar" role="img" aria-label="${escapeHtml(r.name)}">
            <span aria-hidden="true">${initials(r.name)}</span>
            <img src="${avatarUrl(r)}" alt="" loading="lazy"
              onerror="this.remove()" />
            <span class="t-online" aria-hidden="true"></span>
          </div>
          <div>
            <div class="t-name">${escapeHtml(r.name)}</div>
            <div class="t-user">${escapeHtml(r.username)}</div>
          </div>
        </div>
        <p class="t-body"><span class="t-quote" aria-hidden="true">&ldquo;</span>${escapeHtml(r.body)}</p>
        <span class="t-role">${escapeHtml(r.role)}</span>
      </article>`;
  }

  // ── Reduced motion: static grid, no animation, no clones ──
  if (reduce) {
    mount.classList.add("static");
    mount.innerHTML =
      '<div class="t-grid">' + reviews.map(function (r) { return cardHTML(r, false); }).join("") + "</div>";
    return;
  }

  // Each track holds the real set + an aria-hidden clone so translateX(-50%) loops seamlessly.
  function track(items) {
    const real  = items.map(function (r) { return cardHTML(r, false); }).join("");
    const clone = items.map(function (r) { return cardHTML(r, true);  }).join("");
    return real + clone;
  }

  const rowTop    = reviews;                 // left → right
  const rowBottom = reviews.slice().reverse(); // right → left

  mount.innerHTML = `
    <div class="marquee" role="group" aria-label="Customer testimonials, scrolling row 1">
      <div class="marquee-track">${track(rowTop)}</div>
    </div>
    <div class="marquee reverse" role="group" aria-label="Customer testimonials, scrolling row 2">
      <div class="marquee-track">${track(rowBottom)}</div>
    </div>`;
})();
