const cache = new Map();

const CACHE_TTL = parseInt(process.env.CACHE_TIME) || 5 * 60 * 1000;

const cacheUtil = {
  set(key, value) {
    cache.set(key, {
      value,
      expires: Date.now() + CACHE_TTL,
    });
  },

  get(key) {
    const item = cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      cache.delete(key);
      return null;
    }
    return item.value;
  },

  delete(key) {
    cache.delete(key);
  },

  clear() {
    cache.clear();
  },
};

module.exports = cacheUtil;
