const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage: save as YYYYMMDDHHMMSS_originalname
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const now = new Date();
    const ts = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0"),
    ].join("");
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${ts}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error("Only image files (jpg, jpeg, png, gif, webp) are allowed."));
  },
});

// POST /api/upload — Upload an image (Organizer / Admin / Supervisor)
router.post(
  "/",
  requireAuth,
  requireRole("Supervisor", "Admin", "Organizer"),
  upload.single("image"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No image file provided." });
    // Relative path — resolved by the browser against whatever origin served the page
    // (works through the Vite dev proxy, tunnels, and the single-origin production server alike).
    res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
  },
);



module.exports = router;
