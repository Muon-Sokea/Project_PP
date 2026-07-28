const Redis = require("ioredis");

let redis;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    connectTimeout: 1000,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy: (times) => Math.min(times * 500, 5000),
  });
  let warned = false;
  redis.on("error", (err) => {
    // Non-fatal — app works without Redis (token blacklist disabled).
    // Only log once so a down Redis doesn't spam the console per-request.
    if (process.env.NODE_ENV !== "test" && !warned) {
      warned = true;
      console.warn("Redis unavailable, continuing without it:", err.message);
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
