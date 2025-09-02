// Simple cache handler for development ISR
const { CacheHandler } = require('@neshca/cache-handler');
CacheHandler.onCreation(async () => {
  const client = new Map();

  return {
    async get(key) {
      return client.get(key) || null;
    },
    async set(key, data) {
      client.set(key, data);
    },
    async revalidateTag(tag) {
      // Simple implementation - clear all cache
      client.clear();
    },
  };
});

module.exports = CacheHandler;
