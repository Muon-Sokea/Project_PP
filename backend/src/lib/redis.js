const Redis = require("ioredis");

let redis;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, { lazyConnect: true });
  redis.on("error", (err) => {
    // Non-fatal — app works without Redis (token blacklist disabled)
    if (process.env.NODE_ENV !== "test") {
      console.warn("Redis unavailable:", err.message);
    }
  });
} else {
  // Stub so callers don't need to null-check redis
  redis = {
    get: async () => null,
    set: async () => null,
    del: async () => null,
  };
}

module.exports = redis;
