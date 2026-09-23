import { Worker } from 'bullmq';
import { logger } from '../lib/logger';
import { getRedis, redisConfigured } from '../lib/redis';
import { QUEUE_NAME } from '../services/schedulerService';
import { fireReminder } from '../services/callService';

interface FireJobData {
  reminderId: string;
  nextRunIso: string;
}

export function startWorker(): void {
  if (!redisConfigured()) {
    logger.info('Redis not configured; worker exiting. Add UPSTASH_REDIS_URL (or REST URL + TOKEN) to enable.');
    return;
  }

  const worker = new Worker<FireJobData>(
    QUEUE_NAME,
    async (job) => {
      logger.info({ jobId: job.id, reminderId: job.data.reminderId }, 'processing reminder call job');
      const result = await fireReminder(job.data.reminderId, job.data.nextRunIso);
      logger.info({ jobId: job.id, outcome: result.outcome }, 'reminder job finished');
      return result;
    },
    {
      connection: getRedis(),
      concurrency: 5,
      lockDuration: 30_000,
      maxStalledCount: 3
    }
  );

  worker.on('failed', (job, err) => {
    logger.error(
      { jobId: job?.id, reminderId: job?.data?.reminderId, err: err.message },
      'reminder job failed'
    );
  });

  worker.on('error', (err) => {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, 'worker error');
  });
}

if (require.main === module) {
  startWorker();
  const shutdown = (signal: string) => {
    logger.info({ signal }, 'stopping worker');
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}