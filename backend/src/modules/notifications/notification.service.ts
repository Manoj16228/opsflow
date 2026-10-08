import { prisma } from '../../database/prisma';
import { NotFoundError } from '../../utils/errors';

export class NotificationService {
  public static async getUserNotifications(
    userId: string,
    organizationId: string,
    query: { page?: number; limit?: number; unreadOnly?: boolean }
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      organizationId,
    };

    if (query.unreadOnly) {
      where.isRead = false;
    }

    const [totalCount, unreadCount, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, organizationId, isRead: false } }),
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      notifications,
      totalCount,
      unreadCount,
      page,
      limit,
    };
  }

  public static async markAsRead(userId: string, id: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundError('Notification', id);
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  public static async markAllAsRead(userId: string, organizationId: string) {
    return prisma.notification.updateMany({
      where: { userId, organizationId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  public static async deleteNotification(userId: string, id: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundError('Notification', id);
    }

    return prisma.notification.delete({ where: { id } });
  }
}
