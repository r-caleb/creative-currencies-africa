import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AccountStatus, AccountType, DirectMessageReportStatus, NotificationType, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import type { AuthUser } from "../auth/auth.types";
import { NotificationService } from "../notification/notification.service";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { StorageService } from "../storage/storage.service";
import type { BlockUserDto } from "./dto/block-user.dto";
import type { CreateDirectConversationDto } from "./dto/create-direct-conversation.dto";
import type { CreateDirectMessageDto } from "./dto/create-direct-message.dto";
import type { ModerateDirectMessageReportDto } from "./dto/moderate-direct-message-report.dto";
import type { MessageSearchQueryDto } from "./dto/message-search-query.dto";
import type { ReportDirectMessageDto } from "./dto/report-direct-message.dto";
import type { UpdateDirectMessageDto } from "./dto/update-direct-message.dto";

const messageUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  type: true,
  status: true,
  profile: {
    select: {
      publicName: true,
      avatarUrl: true,
      memberNumber: true,
      profession: true,
      discipline: true,
      city: true,
    },
  },
  organizationProfile: {
    select: {
      name: true,
      logoUrl: true,
      sector: true,
      city: true,
    },
  },
  partnerProfile: {
    select: {
      name: true,
      logoUrl: true,
      partnerType: true,
      city: true,
    },
  },
} satisfies Prisma.UserSelect;

const directMessageInclude = {
  author: {
    select: messageUserSelect,
  },
} satisfies Prisma.DirectMessageInclude;

const directConversationInclude = {
  participants: {
    include: {
      user: {
        select: messageUserSelect,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  },
  messages: {
    take: 1,
    orderBy: {
      createdAt: "desc",
    },
    include: directMessageInclude,
  },
} satisfies Prisma.DirectConversationInclude;

const directMessageReportInclude = {
  reporter: {
    select: messageUserSelect,
  },
  directMessage: {
    include: directMessageInclude,
  },
} satisfies Prisma.DirectMessageReportInclude;

type MessagingUser = Prisma.UserGetPayload<{ select: typeof messageUserSelect }>;
type DirectMessageWithAuthor = Prisma.DirectMessageGetPayload<{ include: typeof directMessageInclude }>;
type DirectConversationWithRelations = Prisma.DirectConversationGetPayload<{ include: typeof directConversationInclude }>;
type DirectMessageReportWithRelations = Prisma.DirectMessageReportGetPayload<{ include: typeof directMessageReportInclude }>;

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly notifications: NotificationService,
    private readonly storage: StorageService,
  ) {}

  async uploadMessageAttachment(authUser: AuthUser, file?: Express.Multer.File) {
    const user = await this.getCurrentUser(authUser);
    this.validateMessageAttachment(file);

    const extension = this.fileExtension(file);
    const originalName = this.safeOriginalFileName(file.originalname, extension);
    const kind = this.attachmentKind(file.mimetype, file.originalname);
    const fileName = `${kind}-${Date.now()}-${originalName}-${randomUUID()}${extension}`;
    const storedFile = await this.storage.storeFile({
      directory: `messages/${user.id}`,
      fileName,
      buffer: file.buffer,
      mimeType: file.mimetype,
      visibility: "public",
    });

    return {
      url: storedFile.url,
      name: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    };
  }

  async listConversations(authUser: AuthUser) {
    const user = await this.getCurrentUser(authUser);
    const conversations = await this.prisma.directConversation.findMany({
      where: {
        participants: {
          some: {
            userId: user.id,
            archivedAt: null,
          },
        },
        messages: {
          some: {},
        },
      },
      include: directConversationInclude,
      orderBy: [
        { lastMessageAt: "desc" },
        { createdAt: "desc" },
      ],
      take: 80,
    });

    return Promise.all(conversations.map((conversation) => this.serializeConversation(conversation, user.id)));
  }

  async listArchivedConversations(authUser: AuthUser) {
    const user = await this.getCurrentUser(authUser);
    const conversations = await this.prisma.directConversation.findMany({
      where: {
        participants: {
          some: {
            userId: user.id,
            archivedAt: { not: null },
          },
        },
      },
      include: directConversationInclude,
      orderBy: [
        { lastMessageAt: "desc" },
        { createdAt: "desc" },
      ],
      take: 80,
    });

    return Promise.all(conversations.map((conversation) => this.serializeConversation(conversation, user.id)));
  }

  async getUnreadCount(authUser: AuthUser) {
    const user = await this.getCurrentUser(authUser);

    return { unreadCount: await this.countTotalUnreadForUser(user.id) };
  }

  async searchMessages(authUser: AuthUser, query: MessageSearchQueryDto = {}) {
    const user = await this.getCurrentUser(authUser);
    const q = this.optionalText(query.q);

    if (!q) {
      return { results: [], total: 0 };
    }

    const messages = await this.prisma.directMessage.findMany({
      where: {
        deletedAt: null,
        content: { contains: q, mode: "insensitive" },
        conversation: {
          participants: {
            some: {
              userId: user.id,
            },
          },
        },
      },
      include: {
        ...directMessageInclude,
        conversation: {
          include: directConversationInclude,
        },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(query.limit ?? 30, 1), 80),
    });

    return {
      results: await Promise.all(messages.map(async (message) => ({
        message: this.serializeMessage(message, user.id),
        conversation: await this.serializeConversation(message.conversation, user.id),
      }))),
      total: messages.length,
    };
  }

  async createConversation(authUser: AuthUser, input: CreateDirectConversationDto) {
    const user = await this.getCurrentUser(authUser);
    const target = await this.getTargetUser(input);

    if (target.id === user.id) {
      throw new BadRequestException("Vous ne pouvez pas créer une conversation avec vous-même.");
    }
    await this.ensureUsersCanMessage(user.id, [target.id]);

    const participantKey = this.participantKey(user.id, target.id);
    const conversation = await this.prisma.directConversation.upsert({
      where: { participantKey },
      create: {
        participantKey,
        createdById: user.id,
        participants: {
          create: [
            { userId: user.id, lastReadAt: new Date() },
            { userId: target.id },
          ],
        },
      },
      update: {
        participants: {
          updateMany: {
            where: { userId: user.id },
            data: { archivedAt: null },
          },
        },
      },
      include: directConversationInclude,
    });

    const initialMessage = this.optionalText(input.initialMessage);

    if (initialMessage) {
      await this.createMessage(authUser, conversation.id, { content: initialMessage });
      return this.getConversation(user.id, conversation.id);
    }

    return this.serializeConversation(conversation, user.id);
  }

  async listMessages(authUser: AuthUser, conversationId: string) {
    const user = await this.getCurrentUser(authUser);
    const conversation = await this.getConversationRecord(user.id, conversationId);
    const targetLastReadAt = conversation.participants.find((participant) => participant.userId !== user.id)?.lastReadAt ?? null;
    const readAt = new Date();

    const messages = await this.prisma.directMessage.findMany({
      where: { conversationId },
      include: directMessageInclude,
      orderBy: { createdAt: "asc" },
      take: 120,
    });

    await this.prisma.directConversationParticipant.updateMany({
      where: { conversationId, userId: user.id },
      data: { lastReadAt: readAt },
    });
    await this.emitUnreadCount(user.id);
    this.realtime.emitDirectConversationRead(conversationId, user.id, readAt);

    return messages.map((message) => this.serializeMessage(message, user.id, targetLastReadAt));
  }

  async markConversationRead(authUser: AuthUser, conversationId: string) {
    const user = await this.getCurrentUser(authUser);
    await this.ensureParticipant(user.id, conversationId);
    const readAt = new Date();

    await this.prisma.directConversationParticipant.updateMany({
      where: { conversationId, userId: user.id },
      data: { lastReadAt: readAt },
    });
    const unreadCount = await this.countTotalUnreadForUser(user.id);

    this.realtime.emitToUser(user.id, "messages.unreadCount", { unreadCount });
    this.realtime.emitDirectConversationRead(conversationId, user.id, readAt);

    return { success: true, unreadCount };
  }

  async archiveConversation(authUser: AuthUser, conversationId: string) {
    const user = await this.getCurrentUser(authUser);
    await this.ensureParticipant(user.id, conversationId);

    await this.prisma.directConversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: user.id } },
      data: { archivedAt: new Date() },
    });
    await this.emitUnreadCount(user.id);

    return { success: true, conversationId, archived: true };
  }

  async unarchiveConversation(authUser: AuthUser, conversationId: string) {
    const user = await this.getCurrentUser(authUser);
    await this.ensureParticipant(user.id, conversationId);

    await this.prisma.directConversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: user.id } },
      data: { archivedAt: null },
    });

    return {
      success: true,
      conversation: await this.getConversation(user.id, conversationId),
    };
  }

  async listConversationAttachments(authUser: AuthUser, conversationId: string) {
    const user = await this.getCurrentUser(authUser);
    await this.ensureParticipant(user.id, conversationId);

    const messages = await this.prisma.directMessage.findMany({
      where: {
        conversationId,
        deletedAt: null,
        attachmentUrl: { not: null },
      },
      include: directMessageInclude,
      orderBy: { createdAt: "desc" },
      take: 120,
    });

    const attachments = messages.map((message) => ({
      id: message.id,
      url: message.attachmentUrl,
      name: message.attachmentName ?? "Pièce jointe",
      mimeType: message.attachmentMimeType,
      kind: this.attachmentKind(message.attachmentMimeType, message.attachmentUrl),
      createdAt: message.createdAt,
      author: this.serializeUser(message.author),
    }));

    return {
      attachments,
      total: attachments.length,
      images: attachments.filter((attachment) => attachment.kind === "image").length,
      documents: attachments.filter((attachment) => attachment.kind === "document").length,
    };
  }

  async createMessage(authUser: AuthUser, conversationId: string, input: CreateDirectMessageDto) {
    const user = await this.getCurrentUser(authUser);
    const conversation = await this.getConversationRecord(user.id, conversationId);
    const content = this.requiredText(input.content, "Le message est requis.");
    await this.ensureUsersCanMessage(
      user.id,
      conversation.participants.filter((participant) => participant.userId !== user.id).map((participant) => participant.userId),
    );

    const message = await this.prisma.directMessage.create({
      data: {
        conversationId,
        authorId: user.id,
        content,
        attachmentUrl: this.optionalText(input.attachmentUrl),
        attachmentName: this.optionalText(input.attachmentName),
        attachmentMimeType: this.optionalText(input.attachmentMimeType),
      },
      include: directMessageInclude,
    });

    await this.prisma.directConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    });

    const serialized = this.serializeMessage(message, user.id);
    this.realtime.emitToDirectConversation(conversationId, "direct.message.created", {
      conversationId,
      message: serialized,
    });

    const recipients = conversation.participants.filter((participant) => participant.userId !== user.id);
    await Promise.all(
      recipients.map((participant) =>
        this.notifications.createForUser({
          userId: participant.userId,
          type: NotificationType.MESSAGE,
          title: `Nouveau message de ${this.displayName(user)}`,
          message: content.length > 120 ? `${content.slice(0, 117)}...` : content,
          href: `/espace-membre/messages?conversationId=${conversationId}`,
        }),
      ),
    );

    const refreshedConversation = await this.getConversationRecord(user.id, conversationId);
    for (const participant of refreshedConversation.participants) {
      this.realtime.emitToUser(participant.userId, "direct.conversation.updated", {
        conversation: await this.serializeConversation(refreshedConversation, participant.userId),
      });
      await this.emitUnreadCount(participant.userId);
    }

    return serialized;
  }

  async updateMessage(authUser: AuthUser, conversationId: string, messageId: string, input: UpdateDirectMessageDto) {
    const user = await this.getCurrentUser(authUser);
    await this.ensureParticipant(user.id, conversationId);
    const content = this.requiredText(input.content, "Le message est requis.");
    const message = await this.prisma.directMessage.findUnique({
      where: { id: messageId },
      include: directMessageInclude,
    });

    if (!message || message.conversationId !== conversationId) {
      throw new NotFoundException("Ce message est introuvable.");
    }

    if (message.authorId !== user.id || message.deletedAt) {
      throw new ForbiddenException("Vous ne pouvez pas modifier ce message.");
    }

    const updated = await this.prisma.directMessage.update({
      where: { id: messageId },
      data: {
        content,
        editedAt: new Date(),
      },
      include: directMessageInclude,
    });
    const serialized = this.serializeMessage(updated, user.id);

    this.realtime.emitToDirectConversation(conversationId, "direct.message.updated", {
      conversationId,
      message: serialized,
    });

    return serialized;
  }

  async deleteMessage(authUser: AuthUser, conversationId: string, messageId: string) {
    const user = await this.getCurrentUser(authUser);
    await this.ensureParticipant(user.id, conversationId);
    const message = await this.prisma.directMessage.findUnique({
      where: { id: messageId },
      include: directMessageInclude,
    });

    if (!message || message.conversationId !== conversationId) {
      throw new NotFoundException("Ce message est introuvable.");
    }

    if (message.authorId !== user.id || message.deletedAt) {
      throw new ForbiddenException("Vous ne pouvez pas supprimer ce message.");
    }

    const deleted = await this.prisma.directMessage.update({
      where: { id: messageId },
      data: {
        content: "Message supprimé",
        attachmentUrl: null,
        attachmentName: null,
        attachmentMimeType: null,
        deletedAt: new Date(),
      },
      include: directMessageInclude,
    });
    const serialized = this.serializeMessage(deleted, user.id);

    this.realtime.emitToDirectConversation(conversationId, "direct.message.deleted", {
      conversationId,
      message: serialized,
    });
    const refreshedConversation = await this.getConversationRecord(user.id, conversationId);

    await Promise.all(refreshedConversation.participants.map((participant) => this.emitUnreadCount(participant.userId)));

    return serialized;
  }

  async reportMessage(authUser: AuthUser, conversationId: string, messageId: string, input: ReportDirectMessageDto) {
    const user = await this.getCurrentUser(authUser);
    await this.ensureParticipant(user.id, conversationId);
    const message = await this.prisma.directMessage.findFirst({
      where: {
        id: messageId,
        conversationId,
      },
      include: directMessageInclude,
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException("Ce message est introuvable.");
    }

    if (message.authorId === user.id) {
      throw new BadRequestException("Vous ne pouvez pas signaler votre propre message.");
    }

    const report = await this.prisma.directMessageReport.upsert({
      where: {
        messageId_reporterId: {
          messageId,
          reporterId: user.id,
        },
      },
      create: {
        messageId,
        reporterId: user.id,
        reason: input.reason,
        message: this.optionalText(input.message),
      },
      update: {
        reason: input.reason,
        message: this.optionalText(input.message),
        status: DirectMessageReportStatus.PENDING,
        reviewedAt: null,
      },
    });

    const admins = await this.prisma.user.findMany({
      where: {
        type: AccountType.ADMIN,
        status: AccountStatus.ACTIVE,
      },
      select: { id: true },
      take: 20,
    });

    await Promise.all(
      admins.map((admin) =>
        this.notifications.createForUser({
          userId: admin.id,
          type: NotificationType.SYSTEM,
          title: "Message signalé",
          message: `${this.displayName(user)} a signalé un message privé.`,
          href: "/espace-membre/admin",
        }).catch(() => undefined),
      ),
    );

    return {
      success: true,
      reportId: report.id,
      status: report.status,
    };
  }

  async blockUser(authUser: AuthUser, blockedId: string, input: BlockUserDto = {}) {
    const user = await this.getCurrentUser(authUser);
    const target = await this.prisma.user.findUnique({
      where: { id: blockedId },
      select: messageUserSelect,
    });

    if (!target || target.status !== AccountStatus.ACTIVE) {
      throw new NotFoundException("Ce membre est introuvable.");
    }

    if (target.id === user.id) {
      throw new BadRequestException("Vous ne pouvez pas bloquer votre propre compte.");
    }

    const block = await this.prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: user.id,
          blockedId: target.id,
        },
      },
      create: {
        blockerId: user.id,
        blockedId: target.id,
        reason: this.optionalText(input.reason),
      },
      update: {
        reason: this.optionalText(input.reason),
      },
    });

    return {
      success: true,
      blockId: block.id,
      blockedUser: this.serializeUser(target),
    };
  }

  async listMessageReports(authUser: AuthUser) {
    const user = await this.getCurrentUser(authUser);
    this.ensureAdmin(user);

    const reports = await this.prisma.directMessageReport.findMany({
      include: directMessageReportInclude,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 100,
    });

    return {
      reports: reports.map((report) => this.serializeMessageReport(report, user.id)),
      total: reports.length,
      pending: reports.filter((report) => report.status === DirectMessageReportStatus.PENDING).length,
    };
  }

  async moderateMessageReport(authUser: AuthUser, reportId: string, input: ModerateDirectMessageReportDto) {
    const user = await this.getCurrentUser(authUser);
    this.ensureAdmin(user);

    const report = await this.prisma.directMessageReport.findUnique({
      where: { id: reportId },
      include: directMessageReportInclude,
    });

    if (!report) {
      throw new NotFoundException("Ce signalement est introuvable.");
    }

    const updatedReport = await this.prisma.$transaction(async (tx) => {
      if (input.deleteMessage && !report.directMessage.deletedAt) {
        await tx.directMessage.update({
          where: { id: report.messageId },
          data: {
            content: "Message supprimé par la modération CCA",
            attachmentUrl: null,
            attachmentName: null,
            attachmentMimeType: null,
            deletedAt: new Date(),
          },
        });
        await tx.adminAuditLog.create({
          data: {
            adminId: user.id,
            targetUserId: report.directMessage.authorId,
            action: "MESSAGE_DELETED",
            entityType: "DirectMessage",
            entityId: report.messageId,
            message: this.optionalText(input.note),
            metadata: {
              reportId,
              reason: report.reason,
            },
          },
        });
      }

      return tx.directMessageReport.update({
        where: { id: reportId },
        data: {
          status: input.status,
          reviewedAt: new Date(),
        },
        include: directMessageReportInclude,
      });
    });

    if (input.deleteMessage) {
      const serializedMessage = this.serializeMessage(updatedReport.directMessage, user.id);
      this.realtime.emitToDirectConversation(updatedReport.directMessage.conversationId, "direct.message.deleted", {
        conversationId: updatedReport.directMessage.conversationId,
        message: serializedMessage,
      });
      await this.notifications.createForUser({
        userId: report.directMessage.authorId,
        type: NotificationType.SYSTEM,
        title: "Message modéré",
        message: "Un de vos messages a été supprimé après vérification par l’équipe CCA.",
        href: "/espace-membre/messages",
      }).catch(() => undefined);
    }

    return {
      success: true,
      report: this.serializeMessageReport(updatedReport, user.id),
    };
  }

  private async getConversation(currentUserId: string, conversationId: string) {
    const conversation = await this.getConversationRecord(currentUserId, conversationId);
    return this.serializeConversation(conversation, currentUserId);
  }

  private async getConversationRecord(currentUserId: string, conversationId: string) {
    const conversation = await this.prisma.directConversation.findFirst({
      where: {
        id: conversationId,
        participants: { some: { userId: currentUserId } },
      },
      include: directConversationInclude,
    });

    if (!conversation) {
      throw new NotFoundException("Cette conversation est introuvable.");
    }

    return conversation;
  }

  private async ensureParticipant(userId: string, conversationId: string) {
    const participant = await this.prisma.directConversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      select: { id: true },
    });

    if (!participant) {
      throw new NotFoundException("Cette conversation est introuvable.");
    }
  }

  private async getCurrentUser(authUser: AuthUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.userId },
      select: messageUserSelect,
    });

    if (!user || user.status !== AccountStatus.ACTIVE) {
      throw new ForbiddenException("Votre compte ne peut pas envoyer de message pour le moment.");
    }

    return user;
  }

  private ensureAdmin(user: MessagingUser) {
    if (user.type !== AccountType.ADMIN) {
      throw new ForbiddenException("Cette action est réservée à l'équipe CCA.");
    }
  }

  private async getTargetUser(input: CreateDirectConversationDto) {
    const memberId = this.optionalText(input.memberId);
    const memberNumber = this.optionalText(input.memberNumber);

    if (!memberId && !memberNumber) {
      throw new BadRequestException("Choisissez un membre à contacter.");
    }

    const user = memberId
      ? await this.prisma.user.findUnique({
          where: { id: memberId },
          select: messageUserSelect,
        })
      : await this.prisma.user.findFirst({
          where: { profile: { memberNumber: memberNumber ?? undefined } },
          select: messageUserSelect,
        });

    if (!user || user.status !== AccountStatus.ACTIVE) {
      throw new NotFoundException("Ce membre est introuvable.");
    }

    return user;
  }

  private async ensureUsersCanMessage(senderId: string, recipientIds: string[]) {
    if (!recipientIds.length) {
      return;
    }

    const blocked = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          {
            blockerId: senderId,
            blockedId: { in: recipientIds },
          },
          {
            blockerId: { in: recipientIds },
            blockedId: senderId,
          },
        ],
      },
      select: { id: true },
    });

    if (blocked) {
      throw new ForbiddenException("Cette conversation n'est pas disponible avec ce membre.");
    }
  }

  private async serializeConversation(conversation: DirectConversationWithRelations, currentUserId: string) {
    const targetParticipant = conversation.participants.find((participant) => participant.userId !== currentUserId);
    const currentParticipant = conversation.participants.find((participant) => participant.userId === currentUserId);
    const target = targetParticipant?.user;
    const lastMessage = conversation.messages[0] ? this.serializeMessage(conversation.messages[0], currentUserId) : null;
    const unread = currentParticipant ? await this.countDirectConversationUnread(currentUserId, conversation.id, currentParticipant.lastReadAt) : 0;

    return {
      id: conversation.id,
      target: target ? this.serializeUser(target) : null,
      lastMessage,
      unread,
      lastMessageAt: conversation.lastMessageAt,
      archived: Boolean(currentParticipant?.archivedAt),
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  private attachmentKind(mimeType?: string | null, url?: string | null) {
    const value = `${mimeType ?? ""} ${url ?? ""}`.toLowerCase();

    if (value.includes("image/") || /\.(png|jpe?g|webp|gif|avif)(\?|$)/.test(value)) {
      return "image";
    }

    if (
      value.includes("pdf") ||
      value.includes("document") ||
      /\.(pdf|docx?|xlsx?|pptx?)(\?|$)/.test(value)
    ) {
      return "document";
    }

    return "file";
  }

  private validateMessageAttachment(file?: Express.Multer.File): asserts file is Express.Multer.File {
    if (!file) {
      throw new BadRequestException("Ajoutez un fichier à joindre au message.");
    }

    const acceptedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
    ];

    if (!acceptedTypes.includes(file.mimetype)) {
      throw new BadRequestException("Format non accepté. Ajoutez une image, un PDF ou un document bureautique.");
    }

    if (file.size > 20 * 1024 * 1024) {
      throw new BadRequestException("La pièce jointe ne doit pas dépasser 20 Mo.");
    }
  }

  private fileExtension(file: Express.Multer.File) {
    const extension = extname(file.originalname).toLowerCase();

    if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt"].includes(extension)) {
      return extension;
    }

    const extensions: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
      "application/pdf": ".pdf",
      "application/msword": ".doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
      "application/vnd.ms-excel": ".xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
      "application/vnd.ms-powerpoint": ".ppt",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
      "text/plain": ".txt",
    };

    return extensions[file.mimetype] ?? "";
  }

  private safeOriginalFileName(originalName: string, extension: string) {
    const withoutExtension = originalName.slice(0, extension ? -extension.length : undefined);
    const normalized = withoutExtension
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);

    return normalized || "piece-jointe";
  }

  private serializeMessage(message: DirectMessageWithAuthor, currentUserId: string, targetLastReadAt?: Date | null) {
    const deleted = Boolean(message.deletedAt);
    const readAt = message.authorId === currentUserId && targetLastReadAt && targetLastReadAt >= message.createdAt
      ? targetLastReadAt
      : null;

    return {
      id: message.id,
      conversationId: message.conversationId,
      content: deleted ? "Message supprimé" : message.content,
      attachmentUrl: deleted ? null : message.attachmentUrl,
      attachmentName: deleted ? null : message.attachmentName,
      attachmentMimeType: deleted ? null : message.attachmentMimeType,
      editedAt: message.editedAt,
      deletedAt: message.deletedAt,
      readAt,
      createdAt: message.createdAt,
      author: this.serializeUser(message.author),
      permissions: {
        canEdit: !deleted && message.authorId === currentUserId,
        canDelete: !deleted && message.authorId === currentUserId,
      },
    };
  }

  private serializeMessageReport(report: DirectMessageReportWithRelations, currentUserId: string) {
    return {
      id: report.id,
      reason: report.reason,
      message: report.message,
      status: report.status,
      reviewedAt: report.reviewedAt,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      reporter: this.serializeUser(report.reporter),
      directMessage: this.serializeMessage(report.directMessage, currentUserId),
    };
  }

  private serializeUser(user: MessagingUser) {
    return {
      id: user.id,
      accountType: user.type,
      displayName: this.displayName(user),
      avatarUrl: this.avatarUrl(user),
      memberNumber: user.profile?.memberNumber ?? null,
      headline: [
        user.profile?.profession ?? user.organizationProfile?.sector ?? user.partnerProfile?.partnerType,
        user.profile?.discipline,
        user.profile?.city ?? user.organizationProfile?.city ?? user.partnerProfile?.city,
      ].filter(Boolean).join(" · "),
    };
  }

  private displayName(user: MessagingUser) {
    return user.profile?.publicName?.trim()
      || user.organizationProfile?.name?.trim()
      || user.partnerProfile?.name?.trim()
      || `${user.firstName} ${user.lastName}`.trim()
      || user.email;
  }

  private avatarUrl(user: MessagingUser) {
    return user.profile?.avatarUrl ?? user.organizationProfile?.logoUrl ?? user.partnerProfile?.logoUrl ?? null;
  }

  private participantKey(leftUserId: string, rightUserId: string) {
    return [leftUserId, rightUserId].sort().join(":");
  }

  private async countDirectConversationUnread(userId: string, conversationId: string, lastReadAt: Date | null) {
    return this.prisma.directMessage.count({
      where: {
        conversationId,
        authorId: { not: userId },
        deletedAt: null,
        ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
      },
    });
  }

  private async countTotalUnreadForUser(userId: string) {
    const directParticipants = await this.prisma.directConversationParticipant.findMany({
      where: {
        userId,
        archivedAt: null,
      },
      select: {
        conversationId: true,
        lastReadAt: true,
      },
    });
    const groupMemberships = await this.prisma.communityGroupMembership.findMany({
      where: { userId },
      select: {
        groupId: true,
        joinedAt: true,
        lastReadAt: true,
      },
    });

    const directCounts = await Promise.all(
      directParticipants.map((participant) =>
        this.countDirectConversationUnread(userId, participant.conversationId, participant.lastReadAt),
      ),
    );
    const groupCounts = await Promise.all(
      groupMemberships.map((membership) =>
        this.prisma.communityGroupMessage.count({
          where: {
            groupId: membership.groupId,
            authorId: { not: userId },
            deletedAt: null,
            createdAt: { gt: membership.lastReadAt ?? membership.joinedAt },
          },
        }),
      ),
    );

    return [...directCounts, ...groupCounts].reduce((total, count) => total + count, 0);
  }

  private async emitUnreadCount(userId: string) {
    this.realtime.emitToUser(userId, "messages.unreadCount", {
      unreadCount: await this.countTotalUnreadForUser(userId),
    });
  }

  private requiredText(value: string | undefined, message: string) {
    const text = this.optionalText(value);

    if (!text) {
      throw new BadRequestException(message);
    }

    return text;
  }

  private optionalText(value?: string | null) {
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }
}
