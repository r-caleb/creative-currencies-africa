import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AccountStatus, NotificationType, Prisma } from "@prisma/client";
import type { AuthUser } from "../auth/auth.types";
import { NotificationService } from "../notification/notification.service";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import type { CreateDirectConversationDto } from "./dto/create-direct-conversation.dto";
import type { CreateDirectMessageDto } from "./dto/create-direct-message.dto";
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

type MessagingUser = Prisma.UserGetPayload<{ select: typeof messageUserSelect }>;
type DirectMessageWithAuthor = Prisma.DirectMessageGetPayload<{ include: typeof directMessageInclude }>;
type DirectConversationWithRelations = Prisma.DirectConversationGetPayload<{ include: typeof directConversationInclude }>;

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly notifications: NotificationService,
  ) {}

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

  async createConversation(authUser: AuthUser, input: CreateDirectConversationDto) {
    const user = await this.getCurrentUser(authUser);
    const target = await this.getTargetUser(input);

    if (target.id === user.id) {
      throw new BadRequestException("Vous ne pouvez pas créer une conversation avec vous-même.");
    }

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
    await this.ensureParticipant(user.id, conversationId);

    const messages = await this.prisma.directMessage.findMany({
      where: { conversationId },
      include: directMessageInclude,
      orderBy: { createdAt: "asc" },
      take: 120,
    });

    await this.prisma.directConversationParticipant.updateMany({
      where: { conversationId, userId: user.id },
      data: { lastReadAt: new Date() },
    });
    await this.emitUnreadCount(user.id);

    return messages.map((message) => this.serializeMessage(message, user.id));
  }

  async markConversationRead(authUser: AuthUser, conversationId: string) {
    const user = await this.getCurrentUser(authUser);
    await this.ensureParticipant(user.id, conversationId);

    await this.prisma.directConversationParticipant.updateMany({
      where: { conversationId, userId: user.id },
      data: { lastReadAt: new Date() },
    });
    const unreadCount = await this.countTotalUnreadForUser(user.id);

    this.realtime.emitToUser(user.id, "messages.unreadCount", { unreadCount });

    return { success: true, unreadCount };
  }

  async createMessage(authUser: AuthUser, conversationId: string, input: CreateDirectMessageDto) {
    const user = await this.getCurrentUser(authUser);
    const conversation = await this.getConversationRecord(user.id, conversationId);
    const content = this.requiredText(input.content, "Le message est requis.");

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
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  private serializeMessage(message: DirectMessageWithAuthor, currentUserId: string) {
    const deleted = Boolean(message.deletedAt);

    return {
      id: message.id,
      conversationId: message.conversationId,
      content: deleted ? "Message supprimé" : message.content,
      attachmentUrl: deleted ? null : message.attachmentUrl,
      attachmentName: deleted ? null : message.attachmentName,
      attachmentMimeType: deleted ? null : message.attachmentMimeType,
      editedAt: message.editedAt,
      deletedAt: message.deletedAt,
      createdAt: message.createdAt,
      author: this.serializeUser(message.author),
      permissions: {
        canEdit: !deleted && message.authorId === currentUserId,
        canDelete: !deleted && message.authorId === currentUserId,
      },
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
