const crypto = require("crypto");

// Verifies the data payload from the Telegram Login Widget.
// https://core.telegram.org/widgets/login#checking-authorization
function verifyTelegramAuth(data, botToken) {
  const { hash, ...fields } = data;
  if (!hash) return false;

  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== hash) return false;

  // Reject stale auth payloads (older than 24h)
  const authDate = Number(fields.auth_date) * 1000;
  if (!authDate || Date.now() - authDate > 24 * 60 * 60 * 1000) return false;

  return true;
}

module.exports = { verifyTelegramAuth };
