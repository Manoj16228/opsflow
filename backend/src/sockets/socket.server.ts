import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AuthUserPayload } from '../types/express';

let io: Server | null = null;

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: [config.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Socket Authentication Middleware
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, config.JWT_SECRET) as AuthUserPayload;
      socket.data.user = decoded;
      next();
    } catch (err: any) {
      next(new Error(`Authentication failed: ${err.message}`));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as AuthUserPayload;
    logger.info(`⚡ Socket connected: User ${user.email} (${user.userId}) in Org ${user.organizationId}`);

    // Join tenant room and user personal notification room
    socket.join(`org:${user.organizationId}`);
    socket.join(`user:${user.userId}`);

    // Room subscription events
    socket.on('join:task', (taskId: string) => {
      socket.join(`task:${taskId}`);
      logger.debug(`Socket ${socket.id} joined task room: task:${taskId}`);
    });

    socket.on('leave:task', (taskId: string) => {
      socket.leave(`task:${taskId}`);
    });

    socket.on('join:incident', (incidentId: string) => {
      socket.join(`incident:${incidentId}`);
      logger.debug(`Socket ${socket.id} joined incident room: incident:${incidentId}`);
    });

    socket.on('leave:incident', (incidentId: string) => {
      socket.leave(`incident:${incidentId}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

export function emitToOrg(organizationId: string, event: string, data: any): void {
  if (io) {
    io.to(`org:${organizationId}`).emit(event, data);
  }
}

export function emitToUser(userId: string, event: string, data: any): void {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToTask(taskId: string, event: string, data: any): void {
  if (io) {
    io.to(`task:${taskId}`).emit(event, data);
  }
}

export function emitToIncident(incidentId: string, event: string, data: any): void {
  if (io) {
    io.to(`incident:${incidentId}`).emit(event, data);
  }
}
