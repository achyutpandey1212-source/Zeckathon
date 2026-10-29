import Redis from 'ioredis';
import { env, isRealRedisConfigured } from './env';

interface CacheEntry {
  value: string;
  expiresAt: number;
}

class DualModeCacheService {
  private redisClient: Redis | null = null;
  private memoryStore: Map<string, CacheEntry> = new Map();
  private mode: 'REDIS_CLOUD' | 'IN_MEMORY_LRU' = 'IN_MEMORY_LRU';
  private hits = 0;
  private misses = 0;

  async initialize(): Promise<void> {
    if (isRealRedisConfigured()) {
      try {
        this.redisClient = new Redis(env.REDIS_URL, {
          maxRetriesPerRequest: 2,
          connectTimeout: 4000,
          lazyConnect: true,
        });
        await this.redisClient.connect();
        this.mode = 'REDIS_CLOUD';
        console.log('[Cache] Connected to Redis Cloud / Upstash successfully.');
        return;
      } catch (err) {
        console.warn('[Cache] Redis connection failed, falling back to high-speed In-Memory LRU cache:', (err as Error).message);
        this.redisClient = null;
      }
    }
    this.mode = 'IN_MEMORY_LRU';
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.mode === 'REDIS_CLOUD' && this.redisClient) {
        const raw = await this.redisClient.get(key);
        if (raw) {
          this.hits++;
          return JSON.parse(raw) as T;
        }
        this.misses++;
        return null;
      }

      const entry = this.memoryStore.get(key);
      if (!entry) {
        this.misses++;
        return null;
      }
      if (Date.now() > entry.expiresAt) {
        this.memoryStore.delete(key);
        this.misses++;
        return null;
      }
      this.hits++;
      return JSON.parse(entry.value) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = env.CACHE_TTL_SECONDS): Promise<void> {
    const serialized = JSON.stringify(value);
    try {
      if (this.mode === 'REDIS_CLOUD' && this.redisClient) {
        await this.redisClient.set(key, serialized, 'EX', ttlSeconds);
        return;
      }
      if (this.memoryStore.size > 1500) {
        const firstKey = this.memoryStore.keys().next().value;
        if (firstKey) this.memoryStore.delete(firstKey);
      }
      this.memoryStore.set(key, {
        value: serialized,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    } catch {
      // Ignore cache write errors
    }
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    for (const key of this.memoryStore.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryStore.delete(key);
      }
    }
  }

  getStats() {
    return {
      mode: this.mode,
      keysCached: this.memoryStore.size,
      hits: this.hits,
      misses: this.misses,
    };
  }
}

export const cacheService = new DualModeCacheService();
