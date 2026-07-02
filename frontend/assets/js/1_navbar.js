// ─────────────────────────────────────
// 1_navbar.js — Used by ALL HTML files
// ─────────────────────────────────────

// ── Theme: light / dark / auto (applied to <html> AND <body>) ──
function ermsThemeMode() { return localStorage.getItem("erms_theme") || "auto"; }
function ermsSystemDark() {
  return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
}
function ermsApplyTheme(mode) {
  const dark = mode === "dark" || (mode === "auto" && ermsSystemDark());
  document.documentElement.classList.toggle("dark", dark);
  if (document.body) document.body.classList.toggle("dark", dark);
}
function ermsSyncThemeControl() {
  const seg = document.getElementById("themeSeg");
  if (!seg) return;
  const mode = ermsThemeMode();
  seg.querySelectorAll("button[data-mode]").forEach(function (b) {
    const on = b.dataset.mode === mode;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });
}
function ermsSetTheme(mode) {
  localStorage.setItem("erms_theme", mode);
  ermsApplyTheme(mode);
  ermsSyncThemeControl();
}
ermsApplyTheme(ermsThemeMode());
// Live-follow the OS while in "auto" mode
if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    if (ermsThemeMode() === "auto") ermsApplyTheme("auto");
  });
}

// Mobile hamburger
const hamburger = document.getElementById("hamburger");
const navLinks  = document.getElementById("navLinks");

if (hamburger && navLinks) {
  const closeMenu = () => {
    navLinks.classList.remove("open");
    hamburger.classList.remove("active");
  };

  hamburger.addEventListener("click", (e) => {
    e.stopPropagation();
    navLinks.classList.toggle("open");
    hamburger.classList.toggle("active");   // morph bars into an X
  });

  // Close menu when clicking a link
  navLinks.querySelectorAll(".btn").forEach(btn => {
    btn.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (e) => {
    if (!hamburger.contains(e.target) &&
        !navLinks.contains(e.target)) {
      closeMenu();
    }
  });
}

// ── Dark-mode on/off (used by the dashboard Appearance toggle) ──
function toggleDarkMode(btn) {
  const goDark = !document.documentElement.classList.contains("dark");
  ermsSetTheme(goDark ? "dark" : "light");
  if (btn) btn.classList.toggle("on", goDark);
}
window.toggleDarkMode = toggleDarkMode;

// ── Get current user ──
function getCurrentUser() {
  const u = localStorage.getItem("erms_user");
  return u ? JSON.parse(u) : null;
}

// ── Get current role ──
function getCurrentRole() {
  return localStorage.getItem("erms_role") || null;
}

// ── Logout ──
function logout() {
  localStorage.removeItem("erms_user");
  localStorage.removeItem("erms_role");
  localStorage.removeItem("erms_token");
  window.location.href = "/pages/2_login.html";
}

// ── Go to dashboard based on role ──
function goToDashboard() {
  const role = getCurrentRole();
  if (!role) {
    window.location.href = "/pages/2_login.html";
    return;
  }
  var dest = { "Supervisor": "/pages/7_superadmin-dashboard.html", "Admin": "/pages/6_admin-dashboard.html", "Organizer": "/pages/5_organizer-dashboard.html", "Attendee": "/pages/4_attendee-dashboard.html" };
  window.location.href = dest[role] || "/pages/dashboard.html";
}

// ── Protect page — must be logged in ──
function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "/pages/2_login.html";
    return null;
  }
  return user;
}

// ── Protect by role ──
function requireRole(allowed = []) {
  const role = getCurrentRole();
  if (!role || !allowed.includes(role)) {
    alert("You don't have permission to view this page.");
    window.location.href = "/pages/2_login.html";
  }
}

// ─────────────────────────────────────
// Hero Slideshow — Infinite forward loop
// ─────────────────────────────────────

const TOTAL_SLIDES = 4;
const SLIDE_SPEED  = 850;
const SLIDE_DELAY  = 4500;

let slideIndex     = 0;
let slideAnimating = false;
let slideInterval  = null;

function moveTrack(position, animate) {
  const track = document.querySelector(".hero-slides");
  if (!track) return;
  track.style.transition = animate
    ? `transform ${SLIDE_SPEED}ms cubic-bezier(0.645,0.045,0.355,1.000)`
    : "none";
  track.style.transform = `translateX(-${position * 20}%)`;
}

function updateDots(index) {
  document.querySelectorAll(".hero-dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });
}

function nextSlide() {
  if (slideAnimating) return;
  slideAnimating = true;
  const next = slideIndex + 1;

  if (next < TOTAL_SLIDES) {
    slideIndex = next;
    moveTrack(slideIndex, true);
    updateDots(slideIndex);
    setTimeout(() => { slideAnimating = false; }, SLIDE_SPEED);
  } else {
    // Move to clone of slide 1
    moveTrack(4, true);
    updateDots(0);
    setTimeout(() => {
      slideIndex = 0;
      moveTrack(0, false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const track = document.querySelector(".hero-slides");
          if (track) {
            track.style.transition =
              `transform ${SLIDE_SPEED}ms cubic-bezier(0.645,0.045,0.355,1.000)`;
          }
        });
      });
      slideAnimating = false;
    }, SLIDE_SPEED + 50);
  }
}

function goToSlide(index) {
  if (slideAnimating || index === slideIndex) return;
  slideAnimating = true;
  slideIndex = index;
  moveTrack(slideIndex, true);
  updateDots(slideIndex);
  clearInterval(slideInterval);
  slideInterval = setInterval(nextSlide, SLIDE_DELAY);
  setTimeout(() => { slideAnimating = false; }, SLIDE_SPEED);
}

function initSwipe() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  let startX = 0;
  hero.addEventListener("touchstart",
    (e) => { startX = e.touches[0].clientX; },
    { passive: true }
  );
  hero.addEventListener("touchend", (e) => {
    const delta = startX - e.changedTouches[0].clientX;
    if (delta > 50) {
      nextSlide();                                       // swipe left → next
    } else if (delta < -50) {
      const prev = (slideIndex - 1 + TOTAL_SLIDES) % TOTAL_SLIDES;
      goToSlide(prev);                                   // swipe right → previous
    }
  }, { passive: true });
}

// ─────────────────────────────────────
// Smooth Search
// ─────────────────────────────────────

function handleSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;
  window.currentSearch = input.value.trim().toLowerCase();
  if (typeof applyFilters === "function") applyFilters();
}

// ─────────────────────────────────────
// Initialize
// ─────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {

  // Slideshow
  const track = document.querySelector(".hero-slides");
  if (track) {
    track.style.transition = "none";
    track.style.transform  = "translateX(0%)";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        track.style.transition =
          `transform ${SLIDE_SPEED}ms cubic-bezier(0.645,0.045,0.355,1.000)`;
      });
    });
    slideInterval = setInterval(nextSlide, SLIDE_DELAY);
    initSwipe();
  }

  // Search
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchInput._debounce);
      searchInput._debounce = setTimeout(() => {
        window.currentSearch = searchInput.value.trim().toLowerCase();
        if (typeof applyFilters === "function") applyFilters();
      }, 300);
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSearch();
    });
  }

  // Show user name in navbar if logged in
  const user = getCurrentUser();
  const navLinksEl = document.getElementById("navLinks");
  if (user && navLinksEl) {
    const greeting = document.createElement("span");
    greeting.className = "nav-greeting";
    greeting.textContent = "Hi, " + user.firstName + "!";
    navLinksEl.prepend(greeting);
  }

  // Theme segmented control: Light | Auto | Dark
  if (navLinksEl && !document.getElementById("themeSeg")) {
    const seg = document.createElement("div");
    seg.id = "themeSeg";
    seg.className = "theme-seg";
    seg.setAttribute("role", "group");
    seg.setAttribute("aria-label", "Theme");
    seg.innerHTML =
      '<button type="button" data-mode="light" aria-label="Light theme"  title="Light"><i class="ri-sun-line"></i></button>' +
      '<button type="button" data-mode="auto"  aria-label="Match system" title="System"><i class="ri-computer-line"></i></button>' +
      '<button type="button" data-mode="dark"  aria-label="Dark theme"   title="Dark"><i class="ri-moon-line"></i></button>';
    seg.addEventListener("click", function (e) {
      const b = e.target.closest("button[data-mode]");
      if (b) ermsSetTheme(b.dataset.mode);
    });
    navLinksEl.appendChild(seg);
    ermsSyncThemeControl();
  }

  // ── Reflect saved theme on any dark-mode toggle present on the page ──
  if (document.body.classList.contains("dark")) {
    const dmToggle = document.getElementById("darkModeToggle");
    if (dmToggle) dmToggle.classList.add("on");
  }

  // ── Scroll-to-top button (injected on every page) ──
  const navbar = document.querySelector(".navbar");
  const topBtn = document.createElement("button");
  topBtn.className = "scroll-top-btn";
  topBtn.setAttribute("aria-label", "Scroll to top");
  topBtn.innerHTML = '<i class="ri-arrow-up-line"></i>';
  topBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  document.body.appendChild(topBtn);

  const onScroll = () => {
    const y = window.scrollY;
    if (navbar) navbar.classList.toggle("scrolled", y > 8);
    topBtn.classList.toggle("visible", y > 320);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ── Ripple effect on buttons ──
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
    ripple.style.top  = (e.clientY - rect.top  - size / 2) + "px";
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });

});
