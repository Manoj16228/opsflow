import { Router, Request, Response } from 'express';
import { prisma } from '../database/prisma';
import { sendSuccess } from '../utils/response';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  const start = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = 'healthy';
  } catch (err: any) {
    dbStatus = 'unhealthy';
  }

  const healthData = {
    status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
    service: 'OpsFlow Core API',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    checks: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      memory: {
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
    },
    responseTimeMs: Date.now() - start,
  };

  const statusCode = dbStatus === 'healthy' ? 200 : 503;
  return res.status(statusCode).json({
    success: dbStatus === 'healthy',
    data: healthData,
  });
});

export default router;
