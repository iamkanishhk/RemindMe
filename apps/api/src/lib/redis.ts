import { Redis } from 'ioredis';
import { env } from '../config';

export function resolveSocketUrl(): string {
  if (env.UPSTASH_REDIS_URL) return env.UPSTASH_REDIS_URL;
  const rest = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!rest || !token) return '';
  const host = new URL(rest).hostname;
  return `rediss://default:${encodeURIComponent(token)}@${host}:6380`;
}

let redis: Redis | undefined;

export function redisConfigured(): boolean {
  return Boolean(resolveSocketUrl());
}

export function getRedis(): Redis {
  if (redis) return redis;
  const url = resolveSocketUrl();
  if (!url) throw new Error('Redis is not configured. Set UPSTASH_REDIS_URL (or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).');
  redis = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true
  });
  redis.on('error', () => {
    // BullMQ and rate-limiter surface errors per-operation; keep process alive.
  });
  return redis;
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit().catch(() => redis?.disconnect());
    redis = undefined;
  }
}