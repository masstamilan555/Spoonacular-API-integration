
const memCache = new Map();
/**
 * Get cached value by key, or null if missing.
 */
export async function getCache(key) {
  try {
    if (!memCache.has(key)) return null;
    const entry = memCache.get(key);
    // entry: { value, expiresAt: number | null }
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      memCache.delete(key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

/**
 * Set cache value with optional TTL in seconds.
 */
export async function setCache(key, value, ttlSeconds) {
  try {
    let expiresAt = null;
    if (Number.isFinite(ttlSeconds) && ttlSeconds > 0) {
      expiresAt = Date.now() + ttlSeconds * 1000;
      // naive TTL cleanup
      setTimeout(() => {
        const entry = memCache.get(key);
        if (entry && entry.expiresAt === expiresAt) {
          memCache.delete(key);
        }
      }, ttlSeconds * 1000).unref?.();
    }
    memCache.set(key, { value, expiresAt });
  } catch (err) {
    console.warn('In-memory cache set failed', err?.message || err);
  }
}
