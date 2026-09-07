import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AccountStatus,
  AccountType,
  CommunityGroupInvitationStatus,
  CommunityGroupMessageType,
  CommunityGroupRole,
  CommunityGroupStatus,
  CommunityGroupVisibility,
  DirectMessageReportStatus,
  NetworkConnectionStatus,
  NotificationType,
  Prisma,
} from "@prisma/client";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import type { AuthUser } from "../auth/auth.types";
import { NotificationService } from "../notification/notification.service";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import type { AddGroupMemberDto } from "./dto/add-group-member.dto";
import type { CreateGroupInvitationDto } from "./dto/create-group-invitation.dto";
import type { CreateGroupMessageDto } from "./dto/create-group-message.dto";
import type { CreateGroupDto } from "./dto/create-group.dto";
import type { GroupMemberCandidateQueryDto } from "./dto/group-member-candidate-query.dto";
import type { GroupQueryDto } from "./dto/group-query.dto";
import type { ReportGroupMessageDto } from "./dto/report-group-message.dto";
import type { ReviewGroupJoinRequestDto } from "./dto/review-group-join-request.dto";
import type { UpdateGroupMemberRoleDto } from "./dto/update-group-member-role.dto";
import type { UpdateGroupMessageDto } from "./dto/update-group-message.dto";
import type { UpdateGroupDto } from "./dto/update-group.dto";

const activeUserInclude = {
  profile: true,
  organizationProfile: true,
  partnerProfile: true,
} satisfies Prisma.UserInclude;

const groupOwnerSelect = {
  id: true,
  firstName: true,
  lastName: true,
  type: true,
  profile: { select: { publicName: true, avatarUrl: true } },
  organizationProfile: { select: { name: true, logoUrl: true } },
  partnerProfile: { select: { name: true, logoUrl: true } },
} satisfies Prisma.UserSelect;

const messageAuthorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  type: true,
  profile: { select: { publicName: true, avatarUrl: true } },
  organizationProfile: { select: { name: true, logoUrl: true } },
  partnerProfile: { select: { name: true, logoUrl: true } },
} satisfies Prisma.UserSelect;

const groupInclude = {
  owner: { select: groupOwnerSelect },
  memberships: { select: { userId: true, role: true, joinedAt: true } },
  joinRequests: {
    where: { status: CommunityGroupInvitationStatus.PENDING },
    select: { id: true, requesterId: true, status: true, createdAt: true },
  },
  messages: {
    orderBy: { createdAt: "desc" },
    take: 1,
    select: { createdAt: true },
  },
  _count: { select: { memberships: true, messages: true } },
} satisfies Prisma.CommunityGroupInclude;

const messageInclude = {
  author: { select: messageAuthorSelect },
} satisfies Prisma.CommunityGroupMessageInclude;

type ActiveUser = Prisma.UserGetPayload<{ include: typeof activeUserInclude }>;
type GroupWithRelations = Prisma.CommunityGroupGetPayload<{ include: typeof groupInclude }>;
type GroupMessageWithAuthor = Prisma.CommunityGroupMessageGetPayload<{ include: typeof messageInclude }>;
type MessageAuthor = Prisma.UserGetPayload<{ select: typeof messageAuthorSelect }>;
type GroupMemberWithUser = Prisma.CommunityGroupMembershipGetPayload<{
  include: { user: { include: typeof activeUserInclude } };
}>;
type GroupInvitationWithRelations = Prisma.CommunityGroupInvitationGetPayload<{
  include: {
    group: { include: typeof groupInclude };
    inviter: { include: typeof activeUserInclude };
    invitee: { include: typeof activeUserInclude };
  };
}>;
type GroupJoinRequestWithRelations = Prisma.CommunityGroupJoinRequestGetPayload<{
  include: {
    group: { include: typeof groupInclude };
    requester: { include: typeof activeUserInclude };
    reviewedBy: { include: typeof activeUserInclude };
  };
}>;

@Injectable()
export class GroupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly realtime: RealtimeGateway,
    private readonly notifications: NotificationService,
  ) {}

  async listGroups(authUser: AuthUser, query: GroupQueryDto = {}) {
    const user = await this.getActiveUser(authUser);
    const groups = await this.prisma.communityGroup.findMany({
      where: this.buildGroupWhere(user, query),
      include: groupInclude,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: this.resolveLimit(query.limit),
    });

    return groups.map((group) => this.serializeGroup(group, user));
  }

  async createGroup(authUser: AuthUser, input: CreateGroupDto) {
    const user = await this.getActiveUser(authUser);
    const name = this.requiredText(input.name, "Le nom du groupe est requis.");
    const slug = await this.generateUniqueSlug(name);

    const group = await this.prisma.$transaction(async (tx) => {
      const createdGroup = await tx.communityGroup.create({
        data: {
          ownerId: user.id,
          name,
          slug,
          category: this.requiredText(input.category, "La catégorie est requise."),
          description: this.requiredText(input.description, "La description du groupe est requise."),
          city: this.optionalText(input.city),
          country: this.optionalText(input.country),
          tags: this.normalizeTags(input.tags),
          visibility: input.visibility ?? CommunityGroupVisibility.PUBLIC,
          memberships: {
            create: {
              userId: user.id,
              role: CommunityGroupRole.OWNER,
            },
          },
        },
      });

      await tx.communityGroupMessage.create({
        data: {
          groupId: createdGroup.id,
          authorId: user.id,
          type: CommunityGroupMessageType.SYSTEM,
          content: "Groupe créé. La discussion peut commencer.",
        },
      });

      return tx.communityGroup.findUniqueOrThrow({
        where: { id: createdGroup.id },
        include: groupInclude,
      });
    });

    return this.serializeGroup(group, user);
  }

  async getGroup(authUser: AuthUser, id: string) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(id);
    this.ensureCanReadGroup(user, group);

    return this.serializeGroup(group, user);
  }

  async updateGroup(authUser: AuthUser, id: string, input: UpdateGroupDto) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(id);
    this.ensureCanManageGroup(user, group);

    const updated = await this.prisma.communityGroup.update({
      where: { id },
      data: {
        name: input.name === undefined ? group.name : this.requiredText(input.name, "Le nom du groupe est requis."),
        category:
          input.category === undefined
            ? group.category
            : this.requiredText(input.category, "La catégorie est requise."),
        description:
          input.description === undefined
            ? group.description
            : this.requiredText(input.description, "La description du groupe est requise."),
        city: input.city === undefined ? group.city : this.optionalText(input.city),
        country: input.country === undefined ? group.country : this.optionalText(input.country),
        tags: input.tags === undefined ? group.tags : this.normalizeTags(input.tags),
        visibility: input.visibility ?? group.visibility,
      },
      include: groupInclude,
    });

    return this.serializeGroup(updated, user);
  }

  async archiveGroup(authUser: AuthUser, id: string) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(id);
    this.ensureCanManageGroup(user, group);

    const archived = await this.prisma.communityGroup.update({
      where: { id },
      data: { status: CommunityGroupStatus.ARCHIVED },
      include: groupInclude,
    });

    return this.serializeGroup(archived, user);
  }

  async joinGroup(authUser: AuthUser, id: string) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(id);
    this.ensureCanReadGroup(user, group);

    if (this.currentMembership(group, user.id)) {
      return this.getGroup(authUser, id);
    }

    const pendingRequest = await this.prisma.communityGroupJoinRequest.findFirst({
      where: {
        groupId: id,
        requesterId: user.id,
        status: CommunityGroupInvitationStatus.PENDING,
      },
      select: { id: true },
    });

    if (!pendingRequest) {
      await this.prisma.communityGroupJoinRequest.create({
        data: {
          groupId: id,
          requesterId: user.id,
          message: `${this.displayName(user)} souhaite rejoindre le groupe.`,
        },
      });

      await this.notifyGroupManagers(group, {
        title: "Nouvelle demande de groupe",
        message: `${this.displayName(user)} demande à rejoindre ${group.name}.`,
        href: `/espace-membre/groupes?groupId=${group.id}`,
      });
    }

    return this.getGroup(authUser, id);
  }

  async listJoinRequests(authUser: AuthUser, id: string) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(id);
    this.ensureCanManageMembers(user, group);

    const requests = await this.prisma.communityGroupJoinRequest.findMany({
      where: {
        groupId: id,
        status: CommunityGroupInvitationStatus.PENDING,
      },
      include: this.groupJoinRequestInclude(),
      orderBy: [{ createdAt: "asc" }],
    });

    return requests.map((request) => this.serializeJoinRequest(request, user));
  }

  async reviewJoinRequest(authUser: AuthUser, id: string, requestId: string, input: ReviewGroupJoinRequestDto) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(id);
    this.ensureCanManageMembers(user, group);

    const status = input.status;
    if (status !== CommunityGroupInvitationStatus.ACCEPTED && status !== CommunityGroupInvitationStatus.DECLINED) {
      throw new BadRequestException("Choisissez d'accepter ou de refuser la demande.");
    }

    const request = await this.prisma.communityGroupJoinRequest.findUnique({
      where: { id: requestId },
      include: this.groupJoinRequestInclude(),
    });

    if (!request || request.groupId !== id) {
      throw new NotFoundException("Cette demande d'accès est introuvable.");
    }

    if (request.status !== CommunityGroupInvitationStatus.PENDING) {
      throw new BadRequestException("Cette demande a déjà été traitée.");
    }

    const updatedRequest = await this.prisma.$transaction(async (tx) => {
      if (status === CommunityGroupInvitationStatus.ACCEPTED) {
        await tx.communityGroupMembership.upsert({
          where: { groupId_userId: { groupId: id, userId: request.requesterId } },
          update: {},
          create: {
            groupId: id,
            userId: request.requesterId,
            role: CommunityGroupRole.MEMBER,
          },
        });

        await tx.communityGroupMessage.create({
          data: {
            groupId: id,
            authorId: user.id,
            type: CommunityGroupMessageType.SYSTEM,
            content: `${this.displayName(request.requester)} a rejoint le groupe après validation.`,
          },
        });
      }

      return tx.communityGroupJoinRequest.update({
        where: { id: requestId },
        data: {
          status,
          message: this.optionalText(input.note) ?? request.message,
          reviewedById: user.id,
          respondedAt: new Date(),
        },
        include: this.groupJoinRequestInclude(),
      });
    });

    await this.notifications.createForUser({
      userId: request.requesterId,
      type: NotificationType.MESSAGE,
      title: status === CommunityGroupInvitationStatus.ACCEPTED ? "Demande de groupe acceptée" : "Demande de groupe refusée",
      message: status === CommunityGroupInvitationStatus.ACCEPTED
        ? `Votre demande pour rejoindre ${group.name} a été acceptée.`
        : `Votre demande pour rejoindre ${group.name} a été refusée.`,
      href: `/espace-membre/groupes?groupId=${group.id}`,
    }).catch(() => undefined);

    return {
      request: this.serializeJoinRequest(updatedRequest, user),
      group: await this.getGroup(authUser, id),
    };
  }

  async leaveGroup(authUser: AuthUser, id: string) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(id);
    const membership = this.currentMembership(group, user.id);

    if (!membership) {
      return this.serializeGroup(group, user);
    }

    if (membership.role === CommunityGroupRole.OWNER) {
      throw new BadRequestException("Le propriétaire ne peut pas quitter son groupe. Archivez-le ou transférez-le d'abord.");
    }

    await this.prisma.communityGroupMembership.delete({
      where: { groupId_userId: { groupId: id, userId: user.id } },
    });

    return this.getGroup(authUser, id);
  }

  async listMemberCandidates(authUser: AuthUser, id: string, query: GroupMemberCandidateQueryDto = {}) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(id);
    this.ensureCanManageGroup(user, group);

    const existingUserIds = group.memberships.map((membership) => membership.userId);
    const q = this.optionalText(query.q);
    const limit = Math.min(Math.max(query.limit ?? 8, 1), 20);
    const searchWhere = this.groupMemberCandidateSearchWhere(q);
    const relations = await this.prisma.networkConnection.findMany({
      where: {
        status: NetworkConnectionStatus.ACCEPTED,
        OR: [{ ownerId: user.id }, { memberId: user.id }],
      },
      select: { ownerId: true, memberId: true },
    });
    const relatedUserIds = [
      ...new Set(
        relations
          .map((relation) => (relation.ownerId === user.id ? relation.memberId : relation.ownerId))
          .filter((userId) => userId !== user.id && !existingUserIds.includes(userId)),
      ),
    ];
    const candidateBaseWhere: Prisma.UserWhereInput = {
      status: AccountStatus.ACTIVE,
      type: { not: AccountType.ADMIN },
      ...searchWhere,
    };
    const relatedUsers = relatedUserIds.length
      ? await this.prisma.user.findMany({
          where: {
            ...candidateBaseWhere,
            id: { in: relatedUserIds },
          },
          include: activeUserInclude,
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
          take: limit,
        })
      : [];
    const remainingLimit = limit - relatedUsers.length;
    const users = remainingLimit > 0
      ? [
          ...relatedUsers,
          ...(await this.prisma.user.findMany({
            where: {
              ...candidateBaseWhere,
              id: { notIn: [...existingUserIds, ...relatedUsers.map((candidate) => candidate.id)] },
            },
            include: activeUserInclude,
            orderBy: [{ createdAt: "desc" }],
            take: remainingLimit,
          })),
        ]
      : relatedUsers;
    const relatedUserIdSet = new Set(relatedUserIds);

    const pendingInvitations = users.length
      ? await this.prisma.communityGroupInvitation.findMany({
          where: {
            groupId: id,
            inviteeId: { in: users.map((candidate) => candidate.id) },
            status: CommunityGroupInvitationStatus.PENDING,
          },
          select: { id: true, inviteeId: true, status: true },
        })
      : [];
    const pendingInvitationByUserId = new Map(
      pendingInvitations.map((invitation) => [invitation.inviteeId, invitation]),
    );

    return users.map((candidate) => {
      const pendingInvitation = pendingInvitationByUserId.get(candidate.id);

      return {
        userId: candidate.id,
        accountType: candidate.type,
        displayName: this.displayName(candidate),
        avatarUrl: this.avatarUrl(candidate),
        headline: this.memberHeadline(candidate),
        city: candidate.profile?.city ?? candidate.organizationProfile?.city ?? candidate.partnerProfile?.city ?? null,
        country: candidate.profile?.country ?? candidate.organizationProfile?.country ?? candidate.partnerProfile?.country ?? null,
        isConnected: relatedUserIdSet.has(candidate.id),
        pendingInvitationId: pendingInvitation?.id ?? null,
        pendingInvitationStatus: pendingInvitation?.status ?? null,
      };
    });
  }

  async listMembers(authUser: AuthUser, id: string) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(id);
    this.ensureGroupMember(user, group);

    const members = await this.prisma.communityGroupMembership.findMany({
      where: { groupId: id },
      include: { user: { include: activeUserInclude } },
      orderBy: [{ joinedAt: "asc" }],
    });

    return members.map((member) => this.serializeMember(member, user, group));
  }

  async listMyInvitations(authUser: AuthUser) {
    const user = await this.getActiveUser(authUser);
    const invitations = await this.prisma.communityGroupInvitation.findMany({
      where: {
        inviteeId: user.id,
        status: CommunityGroupInvitationStatus.PENDING,
      },
      include: this.groupInvitationInclude(),
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return invitations.map((invitation) => this.serializeInvitation(invitation, user));
  }

  async uploadGroupPhoto(authUser: AuthUser, id: string, file?: Express.Multer.File) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(id);
    this.ensureCanManageGroup(user, group);
    this.validateGroupPhoto(file);

    const storedFile = await this.storeGroupPhoto(id, file);
    const previousAvatarUrl = group.avatarUrl;
    const updatedGroup = await this.prisma.communityGroup.update({
      where: { id },
      data: { avatarUrl: storedFile.url },
      include: groupInclude,
    });

    if (previousAvatarUrl && previousAvatarUrl !== storedFile.url) {
      await this.deleteStoredUpload(previousAvatarUrl);
    }

    return this.serializeGroup(updatedGroup, user);
  }

  async listGroupInvitations(authUser: AuthUser, id: string) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(id);
    this.ensureCanManageMembers(user, group);

    const invitations = await this.prisma.communityGroupInvitation.findMany({
      where: {
        groupId: id,
        status: CommunityGroupInvitationStatus.PENDING,
      },
      include: this.groupInvitationInclude(),
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return invitations.map((invitation) => this.serializeInvitation(invitation, user));
  }

  async addMember(authUser: AuthUser, id: string, input: AddGroupMemberDto) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(id);

    const targetUserId = this.requiredText(input.userId, "Choisissez un membre à ajouter.");
    const role = input.role === CommunityGroupRole.MODERATOR
      ? CommunityGroupRole.MODERATOR
      : CommunityGroupRole.MEMBER;

    if (role === CommunityGroupRole.MODERATOR) {
      this.ensureCanAssignRoles(user, group);
    } else {
      this.ensureCanManageMembers(user, group);
    }

    if (this.currentMembership(group, targetUserId)) {
      throw new BadRequestException("Ce membre est déjà dans le groupe.");
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: activeUserInclude,
    });

    if (!targetUser || targetUser.status !== AccountStatus.ACTIVE) {
      throw new NotFoundException("Ce membre est introuvable ou son compte n'est pas actif.");
    }

    this.ensureGroupInvitableUser(targetUser);

    const updatedGroup = await this.prisma.$transaction(async (tx) => {
      await tx.communityGroupMembership.create({
        data: {
          groupId: id,
          userId: targetUser.id,
          role,
        },
      });

      await tx.communityGroupInvitation.updateMany({
        where: {
          groupId: id,
          inviteeId: targetUser.id,
          status: CommunityGroupInvitationStatus.PENDING,
        },
        data: {
          status: CommunityGroupInvitationStatus.CANCELLED,
          respondedAt: new Date(),
        },
      });

      await tx.communityGroupMessage.create({
        data: {
          groupId: id,
          authorId: user.id,
          type: CommunityGroupMessageType.SYSTEM,
          content: `${this.displayName(targetUser)} a été ajouté au groupe.`,
        },
      });

      return tx.communityGroup.update({
        where: { id },
        data: { updatedAt: new Date() },
        include: groupInclude,
      });
    });

    await this.notifications.createForUser({
      userId: targetUser.id,
      type: NotificationType.MESSAGE,
      title: "Ajouté dans un groupe",
      message: `${this.displayName(user)} vous a ajouté dans ${group.name}.`,
      href: `/espace-membre/messages?groupId=${id}`,
    }).catch(() => undefined);

    return this.serializeGroup(updatedGroup, user);
  }

  async inviteMember(authUser: AuthUser, id: string, input: CreateGroupInvitationDto) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(id);

    const targetUserId = this.requiredText(input.userId, "Choisissez un membre à inviter.");
    const role = input.role === CommunityGroupRole.MODERATOR
      ? CommunityGroupRole.MODERATOR
      : CommunityGroupRole.MEMBER;

    if (role === CommunityGroupRole.MODERATOR) {
      this.ensureCanAssignRoles(user, group);
    } else {
      this.ensureCanManageMembers(user, group);
    }

    if (targetUserId === user.id) {
      throw new BadRequestException("Vous êtes déjà dans ce groupe.");
    }

    if (this.currentMembership(group, targetUserId)) {
      throw new BadRequestException("Ce membre est déjà dans le groupe.");
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: activeUserInclude,
    });

    if (!targetUser || targetUser.status !== AccountStatus.ACTIVE) {
      throw new NotFoundException("Ce membre est introuvable ou son compte n'est pas actif.");
    }

    this.ensureGroupInvitableUser(targetUser);

    const existingInvitation = await this.prisma.communityGroupInvitation.findFirst({
      where: {
        groupId: id,
        inviteeId: targetUser.id,
        status: CommunityGroupInvitationStatus.PENDING,
      },
      include: this.groupInvitationInclude(),
    });

    if (existingInvitation) {
      throw new BadRequestException("Une invitation est déjà en attente pour ce membre.");
    }

    const invitation = await this.prisma.$transaction(async (tx) => {
      const createdInvitation = await tx.communityGroupInvitation.create({
        data: {
          groupId: id,
          inviterId: user.id,
          inviteeId: targetUser.id,
          role,
          message: this.optionalText(input.message),
        },
      });

      await tx.communityGroupMessage.create({
        data: {
          groupId: id,
          authorId: user.id,
          type: CommunityGroupMessageType.SYSTEM,
          content: `Une invitation a été envoyée à ${this.displayName(targetUser)}.`,
        },
      });

      await tx.communityGroup.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      return tx.communityGroupInvitation.findUniqueOrThrow({
        where: { id: createdInvitation.id },
        include: this.groupInvitationInclude(),
      });
    });

    await this.notifications.createForUser({
      userId: targetUser.id,
      type: NotificationType.MESSAGE,
      title: "Invitation de groupe",
      message: `${this.displayName(user)} vous invite à rejoindre ${group.name}.`,
      href: `/espace-membre/groupes?groupId=${id}`,
    }).catch(() => undefined);

    return this.serializeInvitation(invitation, user);
  }

  async acceptInvitation(authUser: AuthUser, invitationId: string) {
    const user = await this.getActiveUser(authUser);
    const invitation = await this.findInvitationOrThrow(invitationId);

    if (invitation.inviteeId !== user.id) {
      throw new ForbiddenException("Cette invitation ne vous est pas destinée.");
    }

    this.ensurePendingInvitation(invitation);

    if (invitation.group.status !== CommunityGroupStatus.ACTIVE) {
      throw new BadRequestException("Ce groupe n'est plus actif.");
    }

    const alreadyMember = this.currentMembership(invitation.group, user.id);

    const updatedInvitation = await this.prisma.$transaction(async (tx) => {
      if (!alreadyMember) {
        await tx.communityGroupMembership.create({
          data: {
            groupId: invitation.groupId,
            userId: user.id,
            role: invitation.role,
          },
        });
      }

      await tx.communityGroupInvitation.updateMany({
        where: {
          groupId: invitation.groupId,
          inviteeId: user.id,
          status: CommunityGroupInvitationStatus.PENDING,
        },
        data: {
          status: CommunityGroupInvitationStatus.ACCEPTED,
          respondedAt: new Date(),
        },
      });

      await tx.communityGroupMessage.create({
        data: {
          groupId: invitation.groupId,
          authorId: user.id,
          type: CommunityGroupMessageType.SYSTEM,
          content: `${this.displayName(user)} a accepté l'invitation et rejoint le groupe.`,
        },
      });

      await tx.communityGroup.update({
        where: { id: invitation.groupId },
        data: { updatedAt: new Date() },
      });

      return tx.communityGroupInvitation.findUniqueOrThrow({
        where: { id: invitation.id },
        include: this.groupInvitationInclude(),
      });
    });

    await this.notifications.createForUser({
      userId: invitation.inviterId,
      type: NotificationType.MESSAGE,
      title: "Invitation acceptée",
      message: `${this.displayName(user)} a rejoint ${invitation.group.name}.`,
      href: `/espace-membre/messages?groupId=${invitation.groupId}`,
    }).catch(() => undefined);

    return {
      invitation: this.serializeInvitation(updatedInvitation, user),
      group: await this.getGroup(authUser, invitation.groupId),
    };
  }

  async declineInvitation(authUser: AuthUser, invitationId: string) {
    const user = await this.getActiveUser(authUser);
    const invitation = await this.findInvitationOrThrow(invitationId);

    if (invitation.inviteeId !== user.id) {
      throw new ForbiddenException("Cette invitation ne vous est pas destinée.");
    }

    this.ensurePendingInvitation(invitation);

    const updatedInvitation = await this.prisma.communityGroupInvitation.update({
      where: { id: invitationId },
      data: {
        status: CommunityGroupInvitationStatus.DECLINED,
        respondedAt: new Date(),
      },
      include: this.groupInvitationInclude(),
    });

    return this.serializeInvitation(updatedInvitation, user);
  }

  async cancelInvitation(authUser: AuthUser, id: string, invitationId: string) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(id);
    this.ensureCanManageMembers(user, group);

    const invitation = await this.findInvitationOrThrow(invitationId);
    if (invitation.groupId !== id) {
      throw new NotFoundException("Cette invitation est introuvable pour ce groupe.");
    }

    this.ensurePendingInvitation(invitation);

    const updatedInvitation = await this.prisma.communityGroupInvitation.update({
      where: { id: invitationId },
      data: {
        status: CommunityGroupInvitationStatus.CANCELLED,
        respondedAt: new Date(),
      },
      include: this.groupInvitationInclude(),
    });

    return this.serializeInvitation(updatedInvitation, user);
  }

  async updateMemberRole(authUser: AuthUser, id: string, memberUserId: string, input: UpdateGroupMemberRoleDto) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(id);
    this.ensureCanAssignRoles(user, group);

    const targetMembership = this.currentMembership(group, memberUserId);
    if (!targetMembership) {
      throw new NotFoundException("Ce membre ne fait pas partie du groupe.");
    }

    if (targetMembership.role === CommunityGroupRole.OWNER) {
      throw new BadRequestException("Le propriétaire du groupe ne peut pas changer de rôle ici.");
    }

    const nextRole = input.role === CommunityGroupRole.MODERATOR
      ? CommunityGroupRole.MODERATOR
      : CommunityGroupRole.MEMBER;

    if (targetMembership.role === nextRole) {
      return this.getGroup(authUser, id);
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: memberUserId },
      include: activeUserInclude,
    });

    if (!targetUser || targetUser.status !== AccountStatus.ACTIVE) {
      throw new NotFoundException("Ce membre est introuvable ou son compte n'est pas actif.");
    }

    const updatedGroup = await this.prisma.$transaction(async (tx) => {
      await tx.communityGroupMembership.update({
        where: { groupId_userId: { groupId: id, userId: memberUserId } },
        data: { role: nextRole },
      });

      await tx.communityGroupMessage.create({
        data: {
          groupId: id,
          authorId: user.id,
          type: CommunityGroupMessageType.SYSTEM,
          content:
            nextRole === CommunityGroupRole.MODERATOR
              ? `${this.displayName(targetUser)} est maintenant admin du groupe.`
              : `${this.displayName(targetUser)} n'est plus admin du groupe.`,
        },
      });

      return tx.communityGroup.update({
        where: { id },
        data: { updatedAt: new Date() },
        include: groupInclude,
      });
    });

    return this.serializeGroup(updatedGroup, user);
  }

  async removeMember(authUser: AuthUser, id: string, memberUserId: string) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(id);
    this.ensureCanManageMembers(user, group);

    const targetMembership = this.currentMembership(group, memberUserId);
    if (!targetMembership) {
      throw new NotFoundException("Ce membre ne fait pas partie du groupe.");
    }

    if (targetMembership.role === CommunityGroupRole.OWNER) {
      throw new BadRequestException("Le propriétaire du groupe ne peut pas être retiré.");
    }

    if (targetMembership.userId === user.id) {
      throw new BadRequestException("Utilisez l'action Quitter pour sortir de ce groupe.");
    }

    if (targetMembership.role === CommunityGroupRole.MODERATOR && !this.canAssignRoles(user, group)) {
      throw new ForbiddenException("Seul le propriétaire peut retirer un admin du groupe.");
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: memberUserId },
      include: activeUserInclude,
    });

    if (!targetUser) {
      throw new NotFoundException("Ce membre est introuvable.");
    }

    const updatedGroup = await this.prisma.$transaction(async (tx) => {
      await tx.communityGroupMembership.delete({
        where: { groupId_userId: { groupId: id, userId: memberUserId } },
      });

      await tx.communityGroupMessage.create({
        data: {
          groupId: id,
          authorId: user.id,
          type: CommunityGroupMessageType.SYSTEM,
          content: `${this.displayName(targetUser)} a été retiré du groupe.`,
        },
      });

      return tx.communityGroup.update({
        where: { id },
        data: { updatedAt: new Date() },
        include: groupInclude,
      });
    });

    return this.serializeGroup(updatedGroup, user);
  }

  async listMessages(authUser: AuthUser, groupId: string) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(groupId);
    this.ensureGroupMember(user, group);

    const messages = await this.prisma.communityGroupMessage.findMany({
      where: { groupId },
      include: messageInclude,
      orderBy: { createdAt: "asc" },
      take: 120,
    });

    await this.prisma.communityGroupMembership.updateMany({
      where: { groupId, userId: user.id },
      data: { lastReadAt: new Date() },
    });
    await this.emitUnreadCount(user.id);

    return messages.map((message) => this.serializeMessage(message, user.id));
  }

  async createMessage(authUser: AuthUser, groupId: string, input: CreateGroupMessageDto) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(groupId);
    this.ensureGroupMember(user, group);

    const message = await this.prisma.communityGroupMessage.create({
      data: {
        groupId,
        authorId: user.id,
        type: this.optionalText(input.attachmentUrl) ? CommunityGroupMessageType.FILE : CommunityGroupMessageType.TEXT,
        content: this.requiredText(input.content, "Le message est requis."),
        attachmentUrl: this.optionalText(input.attachmentUrl),
        attachmentName: this.optionalText(input.attachmentName),
        attachmentMimeType: this.optionalText(input.attachmentMimeType),
      },
      include: messageInclude,
    });

    await this.prisma.communityGroup.update({
      where: { id: groupId },
      data: { updatedAt: new Date() },
    });

    const serialized = this.serializeMessage(message, user.id);
    this.realtime.emitToGroup(groupId, "group.message.created", {
      groupId,
      message: serialized,
    });

    const recipients = group.memberships
      .map((membership) => membership.userId)
      .filter((memberUserId) => memberUserId !== user.id);

    await Promise.all(
      recipients.map((userId) =>
        this.notifications.createForUser({
          userId,
          type: NotificationType.MESSAGE,
          title: `Nouveau message dans ${group.name}`,
          message: `${this.displayName(user)} a envoyé un message dans le groupe.`,
          href: `/espace-membre/messages?groupId=${groupId}`,
        }).catch(() => undefined),
      ),
    );
    await Promise.all(recipients.map((userId) => this.emitUnreadCount(userId)));

    return serialized;
  }

  async updateMessage(authUser: AuthUser, groupId: string, messageId: string, input: UpdateGroupMessageDto) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(groupId);
    this.ensureGroupMember(user, group);

    const message = await this.prisma.communityGroupMessage.findUnique({
      where: { id: messageId },
      include: messageInclude,
    });

    if (!message || message.groupId !== groupId) {
      throw new NotFoundException("Ce message est introuvable.");
    }

    if (message.authorId !== user.id && !this.canManageGroup(user, group)) {
      throw new ForbiddenException("Vous ne pouvez modifier que vos propres messages.");
    }

    if (message.deletedAt) {
      throw new BadRequestException("Ce message a déjà été supprimé.");
    }

    const updated = await this.prisma.communityGroupMessage.update({
      where: { id: messageId },
      data: {
        content: this.requiredText(input.content, "Le message est requis."),
        editedAt: new Date(),
      },
      include: messageInclude,
    });

    const serialized = this.serializeMessage(updated, user.id);
    this.realtime.emitToGroup(groupId, "group.message.updated", {
      groupId,
      message: serialized,
    });

    return serialized;
  }

  async deleteMessage(authUser: AuthUser, groupId: string, messageId: string) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(groupId);
    this.ensureGroupMember(user, group);

    const message = await this.prisma.communityGroupMessage.findUnique({
      where: { id: messageId },
      include: messageInclude,
    });

    if (!message || message.groupId !== groupId) {
      throw new NotFoundException("Ce message est introuvable.");
    }

    if (message.authorId !== user.id && !this.canManageGroup(user, group)) {
      throw new ForbiddenException("Vous ne pouvez supprimer que vos propres messages.");
    }

    const deleted = await this.prisma.communityGroupMessage.update({
      where: { id: messageId },
      data: {
        content: "Message supprimé",
        attachmentUrl: null,
        attachmentName: null,
        attachmentMimeType: null,
        deletedAt: new Date(),
      },
      include: messageInclude,
    });

    const serialized = this.serializeMessage(deleted, user.id);
    this.realtime.emitToGroup(groupId, "group.message.deleted", {
      groupId,
      message: serialized,
    });
    await Promise.all(group.memberships.map((membership) => this.emitUnreadCount(membership.userId)));

    return serialized;
  }

  async reportMessage(authUser: AuthUser, groupId: string, messageId: string, input: ReportGroupMessageDto) {
    const user = await this.getActiveUser(authUser);
    const group = await this.findGroupOrThrow(groupId);
    this.ensureGroupMember(user, group);

    const message = await this.prisma.communityGroupMessage.findFirst({
      where: {
        id: messageId,
        groupId,
      },
      include: messageInclude,
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException("Ce message est introuvable.");
    }

    if (message.authorId === user.id) {
      throw new BadRequestException("Vous ne pouvez pas signaler votre propre message.");
    }

    const report = await this.prisma.communityGroupMessageReport.upsert({
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

    const moderators = group.memberships
      .filter((membership) => membership.role === CommunityGroupRole.OWNER || membership.role === CommunityGroupRole.MODERATOR)
      .map((membership) => membership.userId);
    const admins = await this.prisma.user.findMany({
      where: {
        type: AccountType.ADMIN,
        status: AccountStatus.ACTIVE,
      },
      select: { id: true },
      take: 20,
    });
    const recipients = [...new Set([...moderators, ...admins.map((admin) => admin.id)].filter((id) => id !== user.id))];

    await Promise.all(
      recipients.map((userId) =>
        this.notifications.createForUser({
          userId,
          type: NotificationType.SYSTEM,
          title: "Message de groupe signalé",
          message: `${this.displayName(user)} a signalé un message dans ${group.name}.`,
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

  private async getActiveUser(authUser: AuthUser): Promise<ActiveUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.userId },
      include: activeUserInclude,
    });

    if (!user || user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException("Votre connexion n'est plus valide. Connectez-vous à nouveau.");
    }

    return user;
  }

  private async notifyGroupManagers(group: GroupWithRelations, input: { title: string; message: string; href: string }) {
    const managerIds = group.memberships
      .filter((membership) => membership.role === CommunityGroupRole.OWNER || membership.role === CommunityGroupRole.MODERATOR)
      .map((membership) => membership.userId);

    const recipients = [...new Set([group.ownerId, ...managerIds])];

    await Promise.all(recipients.map((userId) => this.notifications.createForUser({
      userId,
      type: NotificationType.MESSAGE,
      title: input.title,
      message: input.message,
      href: input.href,
    }).catch(() => undefined)));
  }

  private buildGroupWhere(user: ActiveUser, query: GroupQueryDto): Prisma.CommunityGroupWhereInput {
    const and: Prisma.CommunityGroupWhereInput[] = [{ status: CommunityGroupStatus.ACTIVE }];
    const q = this.optionalText(query.q);
    const category = this.optionalText(query.category);
    const city = this.optionalText(query.city);

    if (query.mine) {
      and.push({ memberships: { some: { userId: user.id } } });
    } else if (user.type !== AccountType.ADMIN) {
      and.push({
        OR: [
          { visibility: { in: [CommunityGroupVisibility.PUBLIC, CommunityGroupVisibility.MEMBERS] } },
          { ownerId: user.id },
          { memberships: { some: { userId: user.id } } },
        ],
      });
    }

    if (category) {
      and.push({ category: { contains: category, mode: "insensitive" } });
    }

    if (city) {
      and.push({ city: { contains: city, mode: "insensitive" } });
    }

    if (q) {
      and.push({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { country: { contains: q, mode: "insensitive" } },
          { tags: { has: q } },
        ],
      });
    }

    return { AND: and };
  }

  private async findGroupOrThrow(id: string) {
    const group = await this.prisma.communityGroup.findUnique({
      where: { id },
      include: groupInclude,
    });

    if (!group) {
      throw new NotFoundException("Ce groupe est introuvable.");
    }

    return group;
  }

  private async findInvitationOrThrow(id: string) {
    const invitation = await this.prisma.communityGroupInvitation.findUnique({
      where: { id },
      include: this.groupInvitationInclude(),
    });

    if (!invitation) {
      throw new NotFoundException("Cette invitation est introuvable.");
    }

    return invitation;
  }

  private groupInvitationInclude() {
    return {
      group: { include: groupInclude },
      inviter: { include: activeUserInclude },
      invitee: { include: activeUserInclude },
    } satisfies Prisma.CommunityGroupInvitationInclude;
  }

  private groupJoinRequestInclude() {
    return {
      group: { include: groupInclude },
      requester: { include: activeUserInclude },
      reviewedBy: { include: activeUserInclude },
    } satisfies Prisma.CommunityGroupJoinRequestInclude;
  }

  private ensureCanReadGroup(user: ActiveUser, group: GroupWithRelations) {
    if (group.status !== CommunityGroupStatus.ACTIVE && !this.canManageGroup(user, group)) {
      throw new NotFoundException("Ce groupe est introuvable.");
    }

    if (group.visibility === CommunityGroupVisibility.PRIVATE && !this.canManageGroup(user, group) && !this.currentMembership(group, user.id)) {
      throw new ForbiddenException("Ce groupe est privé.");
    }
  }

  private ensureGroupMember(user: ActiveUser, group: GroupWithRelations) {
    this.ensureCanReadGroup(user, group);

    if (!this.currentMembership(group, user.id) && user.type !== AccountType.ADMIN) {
      throw new ForbiddenException("Rejoignez le groupe pour participer à la discussion.");
    }
  }

  private ensureCanManageGroup(user: ActiveUser, group: GroupWithRelations) {
    if (!this.canManageGroup(user, group)) {
      throw new ForbiddenException("Vous ne pouvez pas modifier ce groupe.");
    }
  }

  private ensureCanManageMembers(user: ActiveUser, group: GroupWithRelations) {
    if (!this.canManageMembers(user, group)) {
      throw new ForbiddenException("Vous ne pouvez pas gérer les membres de ce groupe.");
    }
  }

  private ensureCanAssignRoles(user: ActiveUser, group: GroupWithRelations) {
    if (!this.canAssignRoles(user, group)) {
      throw new ForbiddenException("Seul le propriétaire peut nommer ou retirer un admin du groupe.");
    }
  }

  private ensurePendingInvitation(invitation: GroupInvitationWithRelations) {
    if (invitation.status !== CommunityGroupInvitationStatus.PENDING) {
      throw new BadRequestException("Cette invitation n'est plus en attente.");
    }
  }

  private canManageGroup(user: ActiveUser, group: GroupWithRelations) {
    if (user.type === AccountType.ADMIN || group.ownerId === user.id) {
      return true;
    }

    const membership = this.currentMembership(group, user.id);
    return membership?.role === CommunityGroupRole.OWNER || membership?.role === CommunityGroupRole.MODERATOR;
  }

  private canManageMembers(user: ActiveUser, group: GroupWithRelations) {
    return this.canManageGroup(user, group);
  }

  private canAssignRoles(user: ActiveUser, group: GroupWithRelations) {
    return user.type === AccountType.ADMIN || group.ownerId === user.id;
  }

  private currentMembership(group: GroupWithRelations, userId: string) {
    return group.memberships.find((membership) => membership.userId === userId);
  }

  private serializeGroup(group: GroupWithRelations, user: ActiveUser) {
    const membership = this.currentMembership(group, user.id);
    const pendingJoinRequest = group.joinRequests.find((request) => request.requesterId === user.id) ?? null;

    return {
      id: group.id,
      ownerId: group.ownerId,
      name: group.name,
      slug: group.slug,
      category: group.category,
      description: group.description,
      avatarUrl: group.avatarUrl,
      city: group.city,
      country: group.country,
      tags: group.tags,
      visibility: group.visibility,
      status: group.status,
      members: group._count.memberships,
      posts: group._count.messages,
      isJoined: Boolean(membership),
      pendingJoinRequestId: pendingJoinRequest?.id ?? null,
      pendingJoinRequestStatus: pendingJoinRequest?.status ?? null,
      currentUserRole: membership?.role ?? null,
      canManage: this.canManageGroup(user, group),
      lastActivity: group.messages[0]?.createdAt ?? group.updatedAt,
      owner: {
        id: group.owner.id,
        accountType: group.owner.type,
        displayName: this.displayName(group.owner),
        avatarUrl: this.avatarUrl(group.owner),
      },
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  private serializeMessage(message: GroupMessageWithAuthor, currentUserId: string) {
    const deleted = Boolean(message.deletedAt);

    return {
      id: message.id,
      groupId: message.groupId,
      type: message.type,
      content: deleted ? "Message supprimé" : message.content,
      attachmentUrl: deleted ? null : message.attachmentUrl,
      attachmentName: deleted ? null : message.attachmentName,
      attachmentMimeType: deleted ? null : message.attachmentMimeType,
      editedAt: message.editedAt,
      deletedAt: message.deletedAt,
      createdAt: message.createdAt,
      author: {
        id: message.author.id,
        accountType: message.author.type,
        displayName: this.displayName(message.author),
        avatarUrl: this.avatarUrl(message.author),
      },
      permissions: {
        canEdit: !deleted && message.authorId === currentUserId,
        canDelete: !deleted && message.authorId === currentUserId,
      },
    };
  }

  private serializeMember(member: GroupMemberWithUser, currentUser: ActiveUser, group: GroupWithRelations) {
    const canManageMembers = this.canManageMembers(currentUser, group);
    const canAssignRoles = this.canAssignRoles(currentUser, group);

    return {
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      accountType: member.user.type,
      displayName: this.displayName(member.user),
      avatarUrl: this.avatarUrl(member.user),
      headline: this.memberHeadline(member.user),
      city: member.user.profile?.city ?? member.user.organizationProfile?.city ?? member.user.partnerProfile?.city ?? null,
      country: member.user.profile?.country ?? member.user.organizationProfile?.country ?? member.user.partnerProfile?.country ?? null,
      isCurrentUser: member.userId === currentUser.id,
      permissions: {
        canPromote: canAssignRoles && member.role === CommunityGroupRole.MEMBER,
        canDemote: canAssignRoles && member.role === CommunityGroupRole.MODERATOR,
        canRemove:
          canManageMembers &&
          member.role !== CommunityGroupRole.OWNER &&
          member.userId !== currentUser.id &&
          (member.role !== CommunityGroupRole.MODERATOR || canAssignRoles),
      },
    };
  }

  private serializeInvitation(invitation: GroupInvitationWithRelations, currentUser: ActiveUser) {
    const isPending = invitation.status === CommunityGroupInvitationStatus.PENDING;

    return {
      id: invitation.id,
      groupId: invitation.groupId,
      inviterId: invitation.inviterId,
      inviteeId: invitation.inviteeId,
      role: invitation.role,
      status: invitation.status,
      message: invitation.message,
      respondedAt: invitation.respondedAt,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
      group: this.serializeGroup(invitation.group, currentUser),
      inviter: this.serializeInvitationUser(invitation.inviter),
      invitee: this.serializeInvitationUser(invitation.invitee),
      permissions: {
        canAccept: isPending && invitation.inviteeId === currentUser.id,
        canDecline: isPending && invitation.inviteeId === currentUser.id,
        canCancel: isPending && this.canManageMembers(currentUser, invitation.group),
      },
    };
  }

  private serializeInvitationUser(user: ActiveUser) {
    return {
      userId: user.id,
      accountType: user.type,
      displayName: this.displayName(user),
      avatarUrl: this.avatarUrl(user),
      headline: this.memberHeadline(user),
      city: user.profile?.city ?? user.organizationProfile?.city ?? user.partnerProfile?.city ?? null,
      country: user.profile?.country ?? user.organizationProfile?.country ?? user.partnerProfile?.country ?? null,
      pendingInvitationId: null,
      pendingInvitationStatus: null,
    };
  }

  private serializeJoinRequest(request: GroupJoinRequestWithRelations, currentUser: ActiveUser) {
    const isPending = request.status === CommunityGroupInvitationStatus.PENDING;

    return {
      id: request.id,
      groupId: request.groupId,
      requesterId: request.requesterId,
      status: request.status,
      message: request.message,
      respondedAt: request.respondedAt,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      group: this.serializeGroup(request.group, currentUser),
      requester: this.serializeInvitationUser(request.requester),
      reviewedBy: request.reviewedBy ? this.serializeInvitationUser(request.reviewedBy) : null,
      permissions: {
        canAccept: isPending && this.canManageMembers(currentUser, request.group),
        canDecline: isPending && this.canManageMembers(currentUser, request.group),
      },
    };
  }

  private async generateUniqueSlug(name: string) {
    const base = this.slugify(name);
    let slug = base;
    let suffix = 2;

    while (await this.prisma.communityGroup.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }

  private slugify(value: string) {
    const slug = value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return slug || `groupe-${Date.now()}`;
  }

  private requiredText(value: string | undefined, message: string) {
    const normalized = value?.trim();

    if (!normalized) {
      throw new BadRequestException(message);
    }

    return normalized;
  }

  private optionalText(value?: string | null) {
    const normalized = value?.trim();
    return normalized || null;
  }

  private groupMemberCandidateSearchWhere(q: string | null): Prisma.UserWhereInput {
    if (!q) {
      return {};
    }

    return {
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { profile: { publicName: { contains: q, mode: "insensitive" } } },
        { profile: { memberNumber: { contains: q, mode: "insensitive" } } },
        { profile: { profession: { contains: q, mode: "insensitive" } } },
        { profile: { discipline: { contains: q, mode: "insensitive" } } },
        { profile: { city: { contains: q, mode: "insensitive" } } },
        { profile: { country: { contains: q, mode: "insensitive" } } },
        { organizationProfile: { name: { contains: q, mode: "insensitive" } } },
        { organizationProfile: { sector: { contains: q, mode: "insensitive" } } },
        { organizationProfile: { city: { contains: q, mode: "insensitive" } } },
        { organizationProfile: { country: { contains: q, mode: "insensitive" } } },
        { partnerProfile: { name: { contains: q, mode: "insensitive" } } },
        { partnerProfile: { partnerType: { contains: q, mode: "insensitive" } } },
        { partnerProfile: { city: { contains: q, mode: "insensitive" } } },
        { partnerProfile: { country: { contains: q, mode: "insensitive" } } },
      ],
    };
  }

  private ensureGroupInvitableUser(targetUser: { type: AccountType }) {
    if (targetUser.type === AccountType.ADMIN) {
      throw new BadRequestException("Un compte administrateur CCA n'est pas ajoutable à un groupe membre.");
    }
  }

  private normalizeTags(tags?: string[]) {
    if (!tags) {
      return [];
    }

    return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 8);
  }

  private resolveLimit(limit?: number) {
    return Math.min(Math.max(limit ?? 40, 1), 80);
  }

  private validateGroupPhoto(file?: Express.Multer.File): asserts file is Express.Multer.File {
    if (!file) {
      throw new BadRequestException("Choisissez une photo de groupe à envoyer.");
    }

    const accepted = ["image/jpeg", "image/png", "image/webp"];
    if (!accepted.includes(file.mimetype)) {
      throw new BadRequestException("Envoyez une image JPG, PNG ou WebP.");
    }

    if (file.size > 3 * 1024 * 1024) {
      throw new BadRequestException("La photo du groupe ne doit pas dépasser 3 Mo.");
    }
  }

  private async storeGroupPhoto(groupId: string, file: Express.Multer.File) {
    const extension = this.fileExtension(file);
    const originalName = this.safeOriginalFileName(file.originalname, extension);
    const fileName = `avatar-${Date.now()}-${originalName}-${randomUUID()}${extension}`;
    const relativeDirectory = join("groups", groupId);
    const uploadsRoot = resolve(process.cwd(), this.config.get<string>("UPLOADS_DIR") ?? "uploads");
    const directory = join(uploadsRoot, relativeDirectory);

    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, fileName), file.buffer);

    return {
      fileName,
      url: `${this.publicBackendUrl()}/uploads/${relativeDirectory}/${fileName}`,
    };
  }

  private async deleteStoredUpload(url: string) {
    const publicUploadsPrefix = `${this.publicBackendUrl()}/uploads/`;

    if (!url.startsWith(publicUploadsPrefix)) {
      return;
    }

    const uploadsRoot = resolve(process.cwd(), this.config.get<string>("UPLOADS_DIR") ?? "uploads");
    const relativePath = decodeURIComponent(url.slice(publicUploadsPrefix.length));
    const filePath = resolve(uploadsRoot, relativePath);

    if (filePath !== uploadsRoot && !filePath.startsWith(`${uploadsRoot}${sep}`)) {
      return;
    }

    await unlink(filePath).catch(() => undefined);
  }

  private fileExtension(file: Express.Multer.File) {
    const extension = extname(file.originalname).toLowerCase();

    if ([".jpg", ".jpeg", ".png", ".webp"].includes(extension)) {
      return extension;
    }

    const extensions: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };

    return extensions[file.mimetype] ?? ".jpg";
  }

  private safeOriginalFileName(originalName: string, extension: string) {
    const withoutExtension = originalName.replace(new RegExp(`${extension}$`, "i"), "");
    const normalized = withoutExtension
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48);

    return normalized || "photo-groupe";
  }

  private publicBackendUrl() {
    return (this.config.get<string>("PUBLIC_BACKEND_URL") ?? "http://localhost:4000").replace(/\/$/, "");
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
        this.prisma.directMessage.count({
          where: {
            conversationId: participant.conversationId,
            authorId: { not: userId },
            deletedAt: null,
            ...(participant.lastReadAt ? { createdAt: { gt: participant.lastReadAt } } : {}),
          },
        }),
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

  private displayName(user: MessageAuthor) {
    return (
      user.profile?.publicName ||
      user.organizationProfile?.name ||
      user.partnerProfile?.name ||
      `${user.firstName} ${user.lastName}`.trim()
    );
  }

  private avatarUrl(user: MessageAuthor) {
    return user.profile?.avatarUrl || user.organizationProfile?.logoUrl || user.partnerProfile?.logoUrl || null;
  }

  private memberHeadline(user: ActiveUser) {
    return (
      user.profile?.profession ||
      user.profile?.otherDiscipline ||
      user.profile?.discipline ||
      user.organizationProfile?.sector ||
      user.partnerProfile?.partnerType ||
      user.type
    );
  }
}
