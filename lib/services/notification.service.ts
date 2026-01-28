import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';

interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
}

export class NotificationService {
  /**
   * Send a notification to a user
   */
  static async send(data: NotificationData) {
    return await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data || {},
      },
    });
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string) {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Get user's unread notifications
   */
  static async getUnread(userId: string) {
    return await prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });
  }

  /**
   * Get all notifications for a user
   */
  static async getAll(userId: string, limit: number = 50) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

