import http from 'http';
import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { connectDatabase, disconnectDatabase } from './database/prisma';
import { initSocketServer } from './sockets/socket.server';
import { initQueues, startBackgroundWorkers } from './jobs/queue.service';

async function bootstrap() {
  logger.info('🚀 Starting OpsFlow Enterprise Server initialization...');

  // 1. Connect to PostgreSQL
  await connectDatabase();

  // 2. Create Express application
  const app = createApp();
  const httpServer = http.createServer(app);

  // 3. Initialize Socket.IO Real-time Server
  initSocketServer(httpServer);
  logger.info('⚡ Socket.IO real-time server mounted.');

  // 4. Initialize Background Queues & Workers
  initQueues();
  startBackgroundWorkers();

  // 5. Start listening
  httpServer.listen(config.PORT, () => {
    logger.info(`=======================================================`);
    logger.info(`🌐 OpsFlow Core REST API running on port ${config.PORT}`);
    logger.info(`📖 OpenAPI / Swagger Docs: http://localhost:${config.PORT}/api-docs`);
    logger.info(`🩺 Health Check: http://localhost:${config.PORT}${config.API_PREFIX}/health`);
    logger.info(`🏢 Environment: ${config.NODE_ENV}`);
    logger.info(`=======================================================`);
  });

  // Graceful Shutdown Handlers
  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Initiating graceful shutdown...`);

    httpServer.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDatabase();
      logger.info('OpsFlow shutdown complete. Bye!');
      process.exit(0);
    });

    // Force close after 10s if hanging
    setTimeout(() => {
      logger.error('Forcefully shutting down due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('❌ Fatal error during server bootstrap:', err);
  process.exit(1);
});
