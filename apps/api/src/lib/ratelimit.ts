import { Redis } from 'ioredis';
import { resolveSocketUrl } from './redis';
import { logger } from './logger';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const CONNECT_TIMEOUT_MS = 2000;
const COMMAND_TIMEOUT_MS = 2000;

let client: Redis | null = null;
let warned = false;

function getRateLimitRedis(): Redis | null {
  const url = resolveSocketUrl();
  if (!url) return null;
  if (client) return client;

  const redis = new Redis(url, {
    lazyConnect: true,
    enableReadyCheck: false,
    // Never queue commands indefinitely while Redis is unreachable.
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: CONNECT_TIMEOUT_MS,
    commandTimeout: COMMAND_TIMEOUT_MS,
    retryStrategy: (times) => Math.min(500 * 2 ** times, 30_000)
  });
  redis.on('error', () => {
    // Rate limiting is best-effort; command errors are caught in check().
  });
  client = redis;
  return redis;
}

function warnOnce(): void {
  if (warned) return;
  warned = true;
  logger.warn('Redis unavailable; phone-call rate limits are NOT being enforced.');
}

export class RateLimiter {
  constructor(
    private readonly defaultWindowSeconds: number,
    private readonly defaultLimit: number
  ) {}

  async check(key: string, limit?: number, windowSeconds?: number): Promise<RateLimitResult> {
    const win = windowSeconds ?? this.defaultWindowSeconds;
    const cap = limit ?? this.defaultLimit;
    const bucket = Math.floor(Date.now() / 1000 / win);
    const rk = `rl:${win}:${bucket}:${key}`;

    try {
      const redis = getRateLimitRedis();
      if (!redis) return RateLimiter.allow(win, cap);

      const multi = redis.multi();
      multi.incr(rk);
      multi.expire(rk, win + 1);
      const results = await multi.exec();

      const count = Number(results?.[0]?.[1] ?? 0);
      return {
        allowed: count <= cap,
        remaining: Math.max(0, cap - count),
        retryAfterSeconds: win
      };
    } catch {
      // Fail open: an unavailable rate limiter must never block a user request.
      warnOnce();
      return RateLimiter.allow(win, cap);
    }
  }

  private static allow(win: number, cap: number): RateLimitResult {
    return { allowed: true, remaining: cap, retryAfterSeconds: win };
  }
}