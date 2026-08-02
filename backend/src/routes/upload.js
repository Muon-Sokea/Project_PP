const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { requireAuth, requireRole } = require("../middleware/auth");
const cloudinaryLib = require("../lib/cloudinary");

const router = express.Router();

const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXT.includes(ext)) return cb(null, true);
  cb(new Error("Only image files (jpg, jpeg, png, gif, webp) are allowed."));
};
const limits = { fileSize: 10 * 1024 * 1024 }; // 10 MB

// In production (or whenever Cloudinary credentials are present), keep the
// file in memory and forward it to Cloudinary — local disk doesn't survive
// a Railway redeploy. Without Cloudinary configured (plain local dev), fall
// back to writing straight to disk so `npm run dev` keeps working with zero setup.
let upload;

if (cloudinaryLib.isConfigured) {
  upload = multer({ storage: multer.memoryStorage(), limits, fileFilter });
} else {
  const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

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
  upload = multer({ storage, limits, fileFilter });
}

// POST /api/upload — Upload an image (Organizer / Admin / Supervisor)
router.post(
  "/",
  requireAuth,
  requireRole("Supervisor", "Admin", "Organizer"),
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No image file provided." });

      if (cloudinaryLib.isConfigured) {
        const url = await cloudinaryLib.uploadBuffer(req.file.buffer, { folder: "erms" });
        return res.json({ url, filename: req.file.originalname });
      }

      // Relative path — resolved by the browser against whatever origin served the page
      // (works through the Vite dev proxy, tunnels, and the single-origin production server alike).
      res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
    } catch (err) { next(err); }
  },
);

module.exports = router;
