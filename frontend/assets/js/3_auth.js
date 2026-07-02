// ─────────────────────────────────────
// 3_auth.js — Login & Register helpers
// ─────────────────────────────────────
import { apiLogin, apiRegister } from '/assets/js/Fakedata/api.js';

// ── Show / hide messages ──
function showError(msg) {
  const el = document.getElementById("authError");
  if (!el) return;
  el.textContent    = msg;
  el.style.display  = "block";
  // Auto scroll to error
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

function hideError() {
  const el = document.getElementById("authError");
  if (el) el.style.display = "none";
}

function showSuccess(msg) {
  hideError();
  const el = document.getElementById("authSuccess");
  if (!el) return;
  el.textContent   = msg;
  el.style.display = "block";
}

function hideSuccess() {
  const el = document.getElementById("authSuccess");
  if (el) el.style.display = "none";
}

// ── Toggle password visibility ──
function togglePassword(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon  = document.getElementById(iconId);
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    if (icon) {
      icon.classList.remove("ri-eye-line");
      icon.classList.add("ri-eye-off-line");
    }
  } else {
    input.type = "password";
    if (icon) {
      icon.classList.remove("ri-eye-off-line");
      icon.classList.add("ri-eye-line");
    }
  }
}

// ── Validation helpers ──
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(pw) {
  return pw.length >= 8;
}

// ✅ More flexible phone validation
// Accepts: 012345678, 012 345 678, +855 12 345 678, 085123456
function isValidPhone(phone) {
  const cleaned = phone.replace(/[\s\-\+]/g, "");
  // Remove country code if present (855)
  const local = cleaned.startsWith("855")
    ? cleaned.substring(3)
    : cleaned;
  return /^[0-9]{8,11}$/.test(local);
}

function loadAttendees() {
  try {
    const attendees = JSON.parse(
      localStorage.getItem("erms_attendees") || "[]"
    );
    return Array.isArray(attendees) ? attendees : [];
  } catch (error) {
    localStorage.setItem("erms_attendees", "[]");
    return [];
  }
}

// ── Save session to localStorage ──
function saveSession(user) {
  localStorage.setItem("erms_user", JSON.stringify({
    id:        user.id,
    firstName: user.firstName,
    lastName:  user.lastName,
    email:     user.email,
    phone:     user.phone     || "",
    address:   user.address   || "",
    role:      user.role      || "Attendee",
  }));
  localStorage.setItem("erms_role",  user.role);
  localStorage.setItem("erms_token", "token-" + user.id);
}

// ── Redirect after login ──
function redirectAfterLogin(role) {
  var dest = {
    "Supervisor": "/pages/7_superadmin-dashboard.html",
    "Admin":      "/pages/6_admin-dashboard.html",
    "Organizer":  "/pages/5_organizer-dashboard.html",
    "Attendee":   "/pages/4_attendee-dashboard.html",
  };
  window.location.href = dest[role] || "/pages/dashboard.html";
}

// ════════════════════════════════════
// LOGIN
// ════════════════════════════════════
async function handleLogin(e) {
  e.preventDefault();
  hideError();
  hideSuccess();

  const emailEl    = document.getElementById("loginEmail");
  const passwordEl = document.getElementById("loginPassword");

  if (!emailEl || !passwordEl) return;

  const email    = emailEl.value.trim();
  const password = passwordEl.value;

  if (!email || !password) {
    showError("Please fill in all fields.");
    return;
  }
  if (!isValidEmail(email)) {
    showError("Please enter a valid email address.");
    return;
  }

  const btn = document.getElementById("loginBtn") || document.querySelector("#loginForm button[type=submit]");
  if (btn) { btn.disabled = true; btn.textContent = "Signing in…"; }

  try {
    const data = await apiLogin(email, password);
    redirectAfterLogin(data.user.role);
  } catch (err) {
    showError(err.message || String(err));
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Sign In"; }
  }
}

// ════════════════════════════════════
// REGISTER
// ════════════════════════════════════
async function handleRegister(e) {
  e.preventDefault();
  hideError();
  hideSuccess();

  // ── Get all field values ──
  const firstNameEl = document.getElementById("regFirstName");
  const lastNameEl = document.getElementById("regLastName");
  const emailEl = document.getElementById("regEmail");
  const phoneEl = document.getElementById("regPhone");
  const addressEl = document.getElementById("regAddress");
  const passwordEl = document.getElementById("regPassword");
  const confirmPasswordEl = document.getElementById("regConfirmPassword");

  const firstName = firstNameEl ? firstNameEl.value.trim() : "";
  const lastName = lastNameEl ? lastNameEl.value.trim() : "";
  const email = emailEl ? emailEl.value.trim() : "";
  const phone = phoneEl ? phoneEl.value.trim() : "";
  const address = addressEl ? addressEl.value.trim() : "";
  const password = passwordEl ? passwordEl.value : "";
  const confirmPassword = confirmPasswordEl ? confirmPasswordEl.value : "";

  // ── Validate required fields ──
  if (!firstName) {
    showError("First name is required."); return;
  }
  if (!lastName) {
    showError("Last name is required."); return;
  }
  if (!email) {
    showError("Email address is required."); return;
  }
  if (!isValidEmail(email)) {
    showError("Please enter a valid email address."); return;
  }
  if (!phone) {
    showError("Phone number is required."); return;
  }
  if (!isValidPhone(phone)) {
    showError("Please enter a valid phone number."); return;
  }
  if (!password) {
    showError("Password is required."); return;
  }
  if (!isValidPassword(password)) {
    showError("Password must be at least 8 characters."); return;
  }
  if (!confirmPassword) {
    showError("Please confirm your password."); return;
  }
  if (password !== confirmPassword) {
    showError("Passwords do not match."); return;
  }

  const btn = document.getElementById("registerBtn") || document.querySelector("#registerForm button[type=submit]");
  if (btn) { btn.disabled = true; btn.textContent = "Creating account…"; }

  try {
    await apiRegister({ firstName, lastName, email, password });
    showSuccess("✅ Account created successfully! Redirecting…");
    setTimeout(function() { redirectAfterLogin("Attendee"); }, 1200);
  } catch (err) {
    showError(err.message || String(err));
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Create Account"; }
  }
}

// ════════════════════════════════════
// Initialize on page load
// ════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {

  // ── Already logged in? Skip the auth page ──
  if (localStorage.getItem("erms_user")) {
    redirectAfterLogin(localStorage.getItem("erms_role") || "Attendee");
    return;
  }

  // Attach login form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  // Attach register form
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }

});

window.togglePassword  = togglePassword;
window.isValidEmail    = isValidEmail;
window.isValidPhone    = isValidPhone;
window.saveSession     = saveSession;
window.loadAttendees   = loadAttendees;
