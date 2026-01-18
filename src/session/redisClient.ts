import RedisModule from 'ioredis';

const Redis = RedisModule.default || RedisModule;

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let _redis: any = null;

export function getRedis(): any {
  if (!_redis && process.env.REDIS_URL) {
    try {
      _redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });
      _redis.on('error', () => {
        // Silently ignore Redis errors for local dev
      });
    } catch {
      return null;
    }
  }
  return _redis;
}

// For backwards compatibility - but won't auto-connect
export const redis = {
  get client() {
    return getRedis();
  }
} as any;
