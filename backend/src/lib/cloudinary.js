const cloudinary = require("cloudinary").v2;

const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Uploads an in-memory file buffer and returns its permanent HTTPS URL.
// Local disk storage doesn't survive a Railway redeploy (ephemeral filesystem),
// so production image uploads (event photos, avatars) must go through this.
async function uploadBuffer(buffer, { folder = "erms" } = {}) {
  const dataUri = `data:image/octet-stream;base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, { folder, resource_type: "image" });
  return result.secure_url;
}

module.exports = { isConfigured, uploadBuffer };
