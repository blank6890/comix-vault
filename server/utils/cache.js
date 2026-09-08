export class MemoryCache {
  constructor(defaultTTLSeconds = 900) {
    this.cache = new Map();
    this.defaultTTL = defaultTTLSeconds * 1000;

    // Periodically clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlSeconds = null) {
    const ttl = (ttlSeconds !== null ? ttlSeconds : this.defaultTTL / 1000) * 1000;
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
      createdAt: Date.now()
    });
    return value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  size() {
    return this.cache.size;
  }
}

export const appCache = new MemoryCache(900); // 15 mins default
