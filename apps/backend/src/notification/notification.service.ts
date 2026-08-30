import { Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType, Prisma } from "@prisma/client";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import type { NotificationQueryDto } from "./dto/notification-query.dto";

const notificationSelect = {
  id: true,
  userId: true,
  type: true,
  title: true,
  message: true,
  href: true,
  readAt: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

type NotificationRecord = Prisma.NotificationGetPayload<{ select: typeof notificationSelect }>;

type CreateNotificationInput = {
  userId: string;
  type?: NotificationType;
  title: string;
  message: string;
  href?: string | null;
};

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async createForUser(input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type ?? NotificationType.SYSTEM,
        title: input.title,
        message: input.message,
        href: input.href ?? null,
      },
      select: notificationSelect,
    });

    const response = this.serialize(notification);
    const unreadCount = await this.countUnread(input.userId);

    this.realtime.emitToUser(input.userId, "notification.created", {
      notification: response,
      unreadCount,
    });
    this.realtime.emitToUser(input.userId, "notification.unreadCount", { unreadCount });

    return response;
  }

  async listForUser(authUser: AuthUser, query: NotificationQueryDto = {}) {
    const where: Prisma.NotificationWhereInput = {
      userId: authUser.userId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.unreadOnly ? { readAt: null } : {}),
    };

    const notifications = await this.prisma.notification.findMany({
      where,
      select: notificationSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: Math.min(Math.max(query.limit ?? 40, 1), 80),
    });

    return notifications.map((notification) => this.serialize(notification));
  }

  async countUnread(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  async getUnreadSummary(authUser: AuthUser) {
    return { unreadCount: await this.countUnread(authUser.userId) };
  }

  async markAsRead(authUser: AuthUser, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId: authUser.userId },
      select: notificationSelect,
    });

    if (!notification) {
      throw new NotFoundException("Cette notification est introuvable.");
    }

    if (notification.readAt) {
      return this.serialize(notification);
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
      select: notificationSelect,
    });
    const unreadCount = await this.countUnread(authUser.userId);

    this.realtime.emitToUser(authUser.userId, "notification.updated", {
      notification: this.serialize(updated),
      unreadCount,
    });
    this.realtime.emitToUser(authUser.userId, "notification.unreadCount", { unreadCount });

    return this.serialize(updated);
  }

  async markAllAsRead(authUser: AuthUser) {
    await this.prisma.notification.updateMany({
      where: {
        userId: authUser.userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    this.realtime.emitToUser(authUser.userId, "notification.readAll", { unreadCount: 0 });
    this.realtime.emitToUser(authUser.userId, "notification.unreadCount", { unreadCount: 0 });

    return { success: true, unreadCount: 0 };
  }

  private serialize(notification: NotificationRecord) {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      href: notification.href,
      readAt: notification.readAt,
      read: Boolean(notification.readAt),
      createdAt: notification.createdAt,
    };
  }
}
