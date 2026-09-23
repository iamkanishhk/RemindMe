import { env } from './config';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { disconnectRedis } from './lib/redis';
import { createApp } from './app';
import { failStaleCallingReminders } from './services/schedulerService';
import { fireDueReminders } from './services/callService';
import { STALE_CALLING_GRACE_MS } from './lib/limits';

export async function main(): Promise<void> {
  const app = createApp();

  if (!env.DATABASE_URL) {
    logger.warn('DATABASE_URL not set yet. Server will boot, but data routes will fail until it is configured.');
  }

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, version: env.VERSION }, 'API listening');
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'shutting down');
    server.close(async () => {
      try {
        await prisma.$disconnect();
        await disconnectRedis();
        process.exit(0);
      } catch {
        process.exit(1);
      }
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  await firePass();
  setInterval(() => void firePass(), 15_000).unref();
}

async function firePass(): Promise<void> {
  try {
    const fired = await fireDueReminders();
    const failed = await failStaleCallingReminders(STALE_CALLING_GRACE_MS);
    if (fired > 0 || failed > 0) {
      logger.info({ fired, failed }, 'reminder fire pass');
    }
  } catch (err) {
    logger.warn({ err: err instanceof Error ? err.message : String(err) }, 'fire pass failed');
  }
}

if (require.main === module) {
  void main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}