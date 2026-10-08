import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

let redisConnection: IORedis | null = null;

try {
  redisConnection = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('⚠️ Redis not available. Background queues will run in mock/inline mode.');
        return null; // Stop retrying
      }
      return Math.min(times * 100, 2000);
    },
  });

  redisConnection.on('error', (err) => {
    logger.warn(`Redis connection error: ${err.message}`);
  });
} catch (err: any) {
  logger.warn(`Could not initialize Redis client: ${err.message}`);
}

export interface EmailJobData {
  to: string;
  subject: string;
  template: 'welcome' | 'password_reset' | 'task_assigned' | 'task_reminder' | 'incident_assigned' | 'sla_breach';
  context: Record<string, any>;
}

export interface SlaCheckJobData {
  organizationId?: string;
}

let emailQueue: Queue<EmailJobData> | null = null;
let slaQueue: Queue<SlaCheckJobData> | null = null;

export function initQueues(): void {
  if (redisConnection && redisConnection.status === 'ready') {
    try {
      emailQueue = new Queue<EmailJobData>('emailQueue', { connection: redisConnection });
      slaQueue = new Queue<SlaCheckJobData>('slaQueue', { connection: redisConnection });
      logger.info('✅ BullMQ queues initialized with Redis');
    } catch (err: any) {
      logger.warn(`Failed to initialize BullMQ queues: ${err.message}`);
    }
  } else {
    logger.info('ℹ️ BullMQ running in direct execution fallback mode.');
  }
}

export class JobQueueService {
  public static async dispatchEmail(data: EmailJobData): Promise<void> {
    if (emailQueue) {
      await emailQueue.add('sendEmail', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
      logger.info(`[Queue] Email job queued for ${data.to} (${data.template})`);
    } else {
      // Direct mock/inline dispatch fallback
      logger.info(`📧 [DIRECT DISPATCH EMAIL] To: ${data.to} | Subject: ${data.subject} | Template: ${data.template}`);
      logger.debug(`Context: ${JSON.stringify(data.context)}`);
    }
  }

  public static async dispatchSlaCheck(data: SlaCheckJobData = {}): Promise<void> {
    if (slaQueue) {
      await slaQueue.add('checkSla', data);
    }
  }
}

export function startBackgroundWorkers(): void {
  if (!redisConnection) return;

  try {
    const emailWorker = new Worker<EmailJobData>(
      'emailQueue',
      async (job: Job<EmailJobData>) => {
        logger.info(`[Worker Processing] Sending email to ${job.data.to} (${job.data.template})`);
        // Simulate email provider delivery
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { delivered: true, timestamp: new Date() };
      },
      { connection: redisConnection }
    );

    emailWorker.on('completed', (job) => {
      logger.info(`[Worker Completed] Email job ${job.id} delivered to ${job.data.to}`);
    });

    emailWorker.on('failed', (job, err) => {
      logger.error(`[Worker Failed] Email job ${job?.id} failed: ${err.message}`);
    });
  } catch (err: any) {
    logger.warn(`Could not start BullMQ workers: ${err.message}`);
  }
}
