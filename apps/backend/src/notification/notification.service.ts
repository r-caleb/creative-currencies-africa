import { Injectable, NotFoundException } from "@nestjs/common";
import { NotificationFrequency, NotificationType, Prisma } from "@prisma/client";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import type { NotificationQueryDto } from "./dto/notification-query.dto";
import type { UpdateNotificationPreferencesDto } from "./dto/update-notification-preferences.dto";

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

const notificationPreferenceSelect = {
  id: true,
  userId: true,
  type: true,
  platform: true,
  email: true,
  whatsapp: true,
  push: true,
  frequency: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NotificationPreferenceSelect;

type NotificationRecord = Prisma.NotificationGetPayload<{ select: typeof notificationSelect }>;
type NotificationPreferenceRecord = Prisma.NotificationPreferenceGetPayload<{ select: typeof notificationPreferenceSelect }>;

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
    const type = input.type ?? NotificationType.SYSTEM;
    const preference = await this.getPreference(input.userId, type);

    if (!preference.platform || preference.frequency === NotificationFrequency.DISABLED) {
      return null;
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type,
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

  async listPreferences(authUser: AuthUser) {
    const preferences = await this.ensurePreferences(authUser.userId);

    return preferences.map((preference) => this.serializePreference(preference));
  }

  async updatePreferences(authUser: AuthUser, input: UpdateNotificationPreferencesDto) {
    await this.ensurePreferences(authUser.userId);

    const updated = await Promise.all(
      input.preferences.map((preference) =>
        this.prisma.notificationPreference.update({
          where: {
            userId_type: {
              userId: authUser.userId,
              type: preference.type,
            },
          },
          data: {
            platform: preference.platform,
            email: preference.email,
            whatsapp: preference.whatsapp,
            push: preference.push,
            frequency: preference.frequency,
          },
          select: notificationPreferenceSelect,
        }),
      ),
    );

    return updated.map((preference) => this.serializePreference(preference));
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

  async getSmartSummary(authUser: AuthUser) {
    const [notifications, preferences] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId: authUser.userId },
        select: notificationSelect,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 120,
      }),
      this.ensurePreferences(authUser.userId),
    ]);
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const byType = Object.values(NotificationType).map((type) => {
      const items = notifications.filter((notification) => notification.type === type);

      return {
        type,
        total: items.length,
        unread: items.filter((notification) => !notification.readAt).length,
        lastAt: items[0]?.createdAt ?? null,
      };
    });

    const activeDigestPreferences = preferences
      .filter((preference) => preference.frequency !== NotificationFrequency.IMMEDIATE && preference.frequency !== NotificationFrequency.DISABLED)
      .map((preference) => this.serializePreference(preference));

    return {
      total: notifications.length,
      unread: notifications.filter((notification) => !notification.readAt).length,
      last7Days: notifications.filter((notification) => notification.createdAt >= sevenDaysAgo).length,
      last30Days: notifications.filter((notification) => notification.createdAt >= thirtyDaysAgo).length,
      byType,
      latest: notifications.slice(0, 8).map((notification) => this.serialize(notification)),
      digestPreview: {
        enabled: activeDigestPreferences.length > 0,
        preferences: activeDigestPreferences,
        dailyEligible: notifications.filter((notification) => notification.createdAt >= new Date(now - 24 * 60 * 60 * 1000)).length,
        weeklyEligible: notifications.filter((notification) => notification.createdAt >= sevenDaysAgo).length,
      },
      channels: {
        platform: preferences.some((preference) => preference.platform),
        email: preferences.some((preference) => preference.email),
        whatsapp: preferences.some((preference) => preference.whatsapp),
        push: preferences.some((preference) => preference.push),
      },
    };
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

  private async getPreference(userId: string, type: NotificationType) {
    const preference = await this.prisma.notificationPreference.findUnique({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
      select: notificationPreferenceSelect,
    });

    if (preference) {
      return preference;
    }

    return this.prisma.notificationPreference.create({
      data: this.defaultPreference(userId, type),
      select: notificationPreferenceSelect,
    });
  }

  private async ensurePreferences(userId: string) {
    await Promise.all(
      Object.values(NotificationType).map((type) =>
        this.prisma.notificationPreference.upsert({
          where: {
            userId_type: {
              userId,
              type,
            },
          },
          create: this.defaultPreference(userId, type),
          update: {},
          select: { id: true },
        }),
      ),
    );

    return this.prisma.notificationPreference.findMany({
      where: { userId },
      select: notificationPreferenceSelect,
      orderBy: { type: "asc" },
    });
  }

  private defaultPreference(userId: string, type: NotificationType) {
    return {
      userId,
      type,
      platform: true,
      email: false,
      whatsapp: false,
      push: false,
      frequency: NotificationFrequency.IMMEDIATE,
    } satisfies Prisma.NotificationPreferenceUncheckedCreateInput;
  }

  private serializePreference(preference: NotificationPreferenceRecord) {
    return {
      id: preference.id,
      userId: preference.userId,
      type: preference.type,
      platform: preference.platform,
      email: preference.email,
      whatsapp: preference.whatsapp,
      push: preference.push,
      frequency: preference.frequency,
      createdAt: preference.createdAt,
      updatedAt: preference.updatedAt,
    };
  }
}
