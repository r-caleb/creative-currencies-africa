import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  AccountStatus,
  AccountType,
  Prisma,
  PublicationAttachmentType,
  PublicationAudience,
  NotificationType,
  PublicationReportReason,
  PublicationReactionType,
  PublicationReportStatus,
  PublicationStatus,
  PublicationType,
} from "@prisma/client";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import type { AuthUser } from "../auth/auth.types";
import { NotificationService } from "../notification/notification.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import type { CreatePublicationCommentDto } from "./dto/create-publication-comment.dto";
import type { CreatePublicationDto, PublicationAttachmentDto } from "./dto/create-publication.dto";
import type { ModeratePublicationReportDto } from "./dto/moderate-publication-report.dto";
import type { PublicationCommentsQueryDto } from "./dto/publication-comments-query.dto";
import type { PublicationQueryDto } from "./dto/publication-query.dto";
import type { PublicationReportQueryDto } from "./dto/publication-report-query.dto";
import type { ReportPublicationDto } from "./dto/report-publication.dto";
import type { SharePublicationDto } from "./dto/share-publication.dto";
import type { TogglePublicationReactionDto } from "./dto/toggle-publication-reaction.dto";
import type { UpdatePublicationDto } from "./dto/update-publication.dto";

type PublicationPolicy = {
  label: string;
  description: string;
  destinations: string[];
  allowedAccountTypes: AccountType[];
  defaultAudience: PublicationAudience;
  requiredFields: string[];
};

const activeUserInclude = {
  profile: true,
  organizationProfile: true,
  partnerProfile: true,
} satisfies Prisma.UserInclude;

type ActiveUser = Prisma.UserGetPayload<{ include: typeof activeUserInclude }>;
type PublicationPayloadForValidation = Pick<CreatePublicationDto, "title" | "content" | "linkUrl"> & {
  attachments?: Array<{ url: string }>;
};

const publicationAuthorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  type: true,
  emailVerifiedAt: true,
  profile: {
    select: {
      publicName: true,
      avatarUrl: true,
      memberNumber: true,
      discipline: true,
      otherDiscipline: true,
      country: true,
      city: true,
      verifiedAt: true,
    },
  },
  organizationProfile: {
    select: {
      name: true,
      logoUrl: true,
      sector: true,
      country: true,
      city: true,
      verifiedAt: true,
    },
  },
  partnerProfile: {
    select: {
      name: true,
      logoUrl: true,
      partnerType: true,
      country: true,
      city: true,
      verifiedAt: true,
    },
  },
} satisfies Prisma.UserSelect;

type PublicationAuthor = Prisma.UserGetPayload<{ select: typeof publicationAuthorSelect }>;
type OfficialAuthorProfile = {
  displayName: string;
  logoUrl: string;
};

const publicationInclude = {
  author: {
    select: publicationAuthorSelect,
  },
  mentions: {
    include: {
      user: {
        select: publicationAuthorSelect,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  },
  attachments: {
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  },
  _count: {
    select: {
      comments: true,
      reactions: true,
      shares: true,
    },
  },
} satisfies Prisma.PublicationInclude;

type PublicationWithRelations = Prisma.PublicationGetPayload<{ include: typeof publicationInclude }>;

const publicationReportInclude = {
  reporter: {
    include: activeUserInclude,
  },
  publication: {
    include: publicationInclude,
  },
} satisfies Prisma.PublicationReportInclude;

type PublicationReportWithRelations = Prisma.PublicationReportGetPayload<{ include: typeof publicationReportInclude }>;

const publicationCommentInclude = {
  author: {
    select: publicationAuthorSelect,
  },
} satisfies Prisma.PublicationCommentInclude;

type PublicationCommentWithAuthor = Prisma.PublicationCommentGetPayload<{ include: typeof publicationCommentInclude }>;

const publicationPolicies: Record<PublicationType, PublicationPolicy> = {
  [PublicationType.PROJECT]: {
    label: "Projet",
    description: "Je veux présenter une initiative, une exposition, une campagne ou une production.",
    destinations: ["network", "creative-id"],
    allowedAccountTypes: [
      AccountType.CREATOR,
      AccountType.LEARNER,
      AccountType.ORGANIZATION,
      AccountType.PARTNER,
      AccountType.ADMIN,
    ],
    defaultAudience: PublicationAudience.MEMBERS,
    requiredFields: ["title", "content"],
  },
  [PublicationType.CREATION]: {
    label: "Création / œuvre",
    description: "Je veux montrer une œuvre, une image, une vidéo, un design ou une réalisation.",
    destinations: ["network", "creative-id"],
    allowedAccountTypes: [AccountType.CREATOR, AccountType.LEARNER, AccountType.ORGANIZATION, AccountType.ADMIN],
    defaultAudience: PublicationAudience.MEMBERS,
    requiredFields: ["title", "content"],
  },
  [PublicationType.QUESTION]: {
    label: "Question",
    description: "Je veux demander un avis, un conseil ou une réponse à la communauté.",
    destinations: ["network"],
    allowedAccountTypes: [
      AccountType.PUBLIC,
      AccountType.CREATOR,
      AccountType.LEARNER,
      AccountType.ORGANIZATION,
      AccountType.PARTNER,
      AccountType.ADMIN,
    ],
    defaultAudience: PublicationAudience.MEMBERS,
    requiredFields: ["title", "content"],
  },
  [PublicationType.COLLABORATION]: {
    label: "Collaboration",
    description: "Je cherche une personne, une équipe, un lieu, un mentor ou un partenaire.",
    destinations: ["network"],
    allowedAccountTypes: [
      AccountType.CREATOR,
      AccountType.LEARNER,
      AccountType.ORGANIZATION,
      AccountType.PARTNER,
      AccountType.ADMIN,
    ],
    defaultAudience: PublicationAudience.MEMBERS,
    requiredFields: ["title", "content"],
  },
  [PublicationType.OPPORTUNITY]: {
    label: "Opportunité",
    description: "Je partage un appel à projets, une résidence, un casting, un concours ou un financement.",
    destinations: ["opportunities", "network"],
    allowedAccountTypes: [AccountType.CREATOR, AccountType.ORGANIZATION, AccountType.PARTNER, AccountType.ADMIN],
    defaultAudience: PublicationAudience.MEMBERS,
    requiredFields: ["title", "content"],
  },
  [PublicationType.JOB]: {
    label: "Mission / emploi",
    description: "Je veux recruter ou proposer une mission, un poste, une prestation ou un besoin freelance.",
    destinations: ["opportunities", "network"],
    allowedAccountTypes: [AccountType.CREATOR, AccountType.ORGANIZATION, AccountType.PARTNER, AccountType.ADMIN],
    defaultAudience: PublicationAudience.MEMBERS,
    requiredFields: ["title", "content"],
  },
  [PublicationType.RESOURCE]: {
    label: "Ressource utile",
    description: "Je partage un guide, un modèle, un document, un lien utile ou un retour d'expérience.",
    destinations: ["resources", "network"],
    allowedAccountTypes: [
      AccountType.CREATOR,
      AccountType.LEARNER,
      AccountType.ORGANIZATION,
      AccountType.PARTNER,
      AccountType.ADMIN,
    ],
    defaultAudience: PublicationAudience.MEMBERS,
    requiredFields: ["title", "content", "linkUrlOrAttachment"],
  },
  [PublicationType.GROUP_DISCUSSION]: {
    label: "Discussion de groupe",
    description: "Créer un sujet de conversation dans un groupe ou une catégorie communautaire.",
    destinations: ["groups"],
    allowedAccountTypes: [],
    defaultAudience: PublicationAudience.GROUP,
    requiredFields: ["title", "content"],
  },
  [PublicationType.TRAINING]: {
    label: "Formation",
    description: "Je propose un atelier, un cours, une masterclass ou un parcours d'apprentissage.",
    destinations: ["trainings", "agenda"],
    allowedAccountTypes: [AccountType.ORGANIZATION, AccountType.PARTNER, AccountType.ADMIN],
    defaultAudience: PublicationAudience.MEMBERS,
    requiredFields: ["title", "content"],
  },
  [PublicationType.EVENT]: {
    label: "Événement",
    description: "J'annonce une exposition, une rencontre, un workshop, un panel ou une activation.",
    destinations: ["agenda", "network"],
    allowedAccountTypes: [AccountType.CREATOR, AccountType.ORGANIZATION, AccountType.PARTNER, AccountType.ADMIN],
    defaultAudience: PublicationAudience.MEMBERS,
    requiredFields: ["title", "content"],
  },
  [PublicationType.ANNOUNCEMENT]: {
    label: "Annonce officielle",
    description: "Diffuser une communication officielle de la plateforme CCA.",
    destinations: ["network", "notifications"],
    allowedAccountTypes: [AccountType.ADMIN],
    defaultAudience: PublicationAudience.MEMBERS,
    requiredFields: ["title", "content"],
  },
};

@Injectable()
export class PublicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly storage: StorageService,
  ) {}

  async getCapabilities(authUser: AuthUser) {
    const user = await this.getActiveUser(authUser);

    return {
      accountType: user.type,
      types: Object.values(PublicationType)
        .filter((type) => type !== PublicationType.GROUP_DISCUSSION)
        .map((type) => {
          const policy = publicationPolicies[type];
          return {
            value: type,
            label: policy.label,
            description: policy.description,
            destinations: policy.destinations,
            defaultAudience: policy.defaultAudience,
            allowed: policy.allowedAccountTypes.includes(user.type),
            allowedAccountTypes: policy.allowedAccountTypes,
            requiredFields: policy.requiredFields,
          };
        }),
      audiences: Object.values(PublicationAudience).filter((audience) => audience !== PublicationAudience.GROUP),
    };
  }

  async createPublication(authUser: AuthUser, input: CreatePublicationDto) {
    const user = await this.getActiveUser(authUser);
    const policy = this.ensureTypeAllowed(user, input.type);
    this.validatePublicationPayload(input.type, input);

    const status = input.publishNow === false ? PublicationStatus.DRAFT : PublicationStatus.PUBLISHED;
    const mentionedUserIds = await this.resolveMentionedUserIds(user.id, input.mentionedUserIds);
    const publication = await this.prisma.publication.create({
      data: {
        author: { connect: { id: user.id } },
        type: input.type,
        status,
        audience: input.audience ?? policy.defaultAudience,
        title: this.requiredText(input.title, "Le titre est requis."),
        content: this.requiredText(input.content, "Le contenu est requis."),
        excerpt: this.buildExcerpt(input.content),
        category: this.optionalText(input.category),
        discipline: this.optionalText(input.discipline) ?? this.defaultDiscipline(user),
        country: this.optionalText(input.country) ?? this.defaultCountry(user),
        city: this.optionalText(input.city) ?? this.defaultCity(user),
        tags: this.normalizeTags(input.tags),
        routingDestinations: policy.destinations,
        linkUrl: this.optionalText(input.linkUrl),
        coverImageUrl: this.resolveCoverImageUrl(input),
        groupId: this.optionalText(input.groupId),
        opportunityDeadline: input.opportunityDeadline ? new Date(input.opportunityDeadline) : null,
        opportunityLocation: this.optionalText(input.opportunityLocation),
        budgetRange: this.optionalText(input.budgetRange),
        contactEmail: this.optionalText(input.contactEmail),
        publishedAt: status === PublicationStatus.PUBLISHED ? new Date() : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        attachments: this.buildAttachmentsCreate(input.attachments),
        mentions: mentionedUserIds.length
          ? {
              create: mentionedUserIds.map((userId) => ({ userId })),
            }
          : undefined,
      },
      include: publicationInclude,
    });

    if (status === PublicationStatus.PUBLISHED) {
      await Promise.all([
        this.notifyPublicationPublished(publication, user).catch(() => undefined),
        this.notifyPublicationMentions(publication, user).catch(() => undefined),
      ]);
    }

    return this.serializePublication(publication, user.id, null, await this.loadOfficialAuthorProfile());
  }

  async uploadPublicationAttachment(authUser: AuthUser, file?: Express.Multer.File) {
    const user = await this.getActiveUser(authUser);
    this.validatePublicationFile(file);
    const attachmentType = this.publicationAttachmentType(file);
    const storedFile = await this.storePublicationFile(user.id, file, attachmentType);

    return {
      type: attachmentType,
      url: storedFile.url,
      name: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    };
  }

  async listPublications(authUser: AuthUser, query: PublicationQueryDto = {}) {
    const user = await this.getActiveUser(authUser);
    const limit = this.resolveLimit(query.limit);
    const where = this.buildListWhere(user, query);
    const publications = await this.prisma.publication.findMany({
      where: this.addCursorToWhere(where, query.cursor),
      include: publicationInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.paginated ? limit + 1 : limit,
    });
    const pageItems = query.paginated ? publications.slice(0, limit) : publications;
    const rankedItems = this.rankPublicationsForUser(pageItems, user);
    const viewerReactions = await this.loadViewerReactions(rankedItems.map((publication) => publication.id), user.id);
    const officialProfile = await this.loadOfficialAuthorProfile();
    const serializedItems = rankedItems.map((publication) => this.serializePublication(publication, user.id, viewerReactions.get(publication.id) ?? null, officialProfile));

    if (query.paginated) {
      return {
        items: serializedItems,
        nextCursor: publications.length > limit && pageItems.length ? this.encodePublicationCursor(pageItems[pageItems.length - 1]) : null,
        hasMore: publications.length > limit,
      };
    }

    return serializedItems;
  }

  async listMyPublications(authUser: AuthUser, query: PublicationQueryDto = {}) {
    return this.listPublications(authUser, { ...query, mine: true });
  }

  async getPublication(authUser: AuthUser, id: string) {
    const user = await this.getActiveUser(authUser);
    const publication = await this.findPublicationOrThrow(id);

    this.ensureCanRead(user, publication);

    return this.serializePublication(publication, user.id, await this.loadViewerReaction(publication.id, user.id), await this.loadOfficialAuthorProfile());
  }

  async listComments(authUser: AuthUser, publicationId: string, query: PublicationCommentsQueryDto = {}) {
    const user = await this.getActiveUser(authUser);
    const publication = await this.findPublicationOrThrow(publicationId);
    this.ensureCanRead(user, publication);
    const limit = this.resolveCommentLimit(query.limit);

    const rootComments = await this.prisma.publicationComment.findMany({
      where: this.addCommentCursorToWhere({ publicationId, parentId: null }, query.cursor),
      include: publicationCommentInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });
    const pageRoots = rootComments.slice(0, limit);
    const rootIds = pageRoots.map((comment) => comment.id);
    const replies = rootIds.length
      ? await this.prisma.publicationComment.findMany({
          where: {
            publicationId,
            parentId: { in: rootIds },
          },
          include: publicationCommentInclude,
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        })
      : [];
    const repliesByParentId = replies.reduce<Map<string, PublicationCommentWithAuthor[]>>((groups, reply) => {
      if (!reply.parentId) {
        return groups;
      }

      const items = groups.get(reply.parentId) ?? [];
      items.push(reply);
      groups.set(reply.parentId, items);
      return groups;
    }, new Map());
    const comments = pageRoots.flatMap((comment) => [comment, ...(repliesByParentId.get(comment.id) ?? [])]);
    const total = await this.prisma.publicationComment.count({ where: { publicationId } });
    const officialProfile = await this.loadOfficialAuthorProfile();

    return {
      items: comments.map((comment) => this.serializePublicationComment(comment, user.id, publication.authorId, officialProfile)),
      nextCursor: rootComments.length > limit && pageRoots.length ? this.encodeCommentCursor(pageRoots[pageRoots.length - 1]) : null,
      hasMore: rootComments.length > limit,
      total,
    };
  }

  async updatePublication(authUser: AuthUser, id: string, input: UpdatePublicationDto) {
    const user = await this.getActiveUser(authUser);
    const publication = await this.findPublicationOrThrow(id);
    this.ensureCanManage(user, publication);

    const nextType = input.type ?? publication.type;
    const policy = this.ensureTypeAllowed(user, nextType);
    this.validatePublicationPayload(nextType, {
      ...input,
      title: input.title ?? publication.title,
      content: input.content ?? publication.content,
      linkUrl: input.linkUrl ?? publication.linkUrl ?? undefined,
      attachments: input.attachments,
    });

    const nextStatus =
      input.publishNow === undefined
        ? publication.status
        : input.publishNow
          ? PublicationStatus.PUBLISHED
          : PublicationStatus.DRAFT;

    const updated = await this.prisma.publication.update({
      where: { id },
      data: {
        type: nextType,
        status: nextStatus,
        audience: input.audience ?? publication.audience,
        title: input.title === undefined ? publication.title : this.requiredText(input.title, "Le titre est requis."),
        content:
          input.content === undefined ? publication.content : this.requiredText(input.content, "Le contenu est requis."),
        excerpt: input.content === undefined ? publication.excerpt : this.buildExcerpt(input.content),
        category: input.category === undefined ? publication.category : this.optionalText(input.category),
        discipline: input.discipline === undefined ? publication.discipline : this.optionalText(input.discipline),
        country: input.country === undefined ? publication.country : this.optionalText(input.country),
        city: input.city === undefined ? publication.city : this.optionalText(input.city),
        tags: input.tags === undefined ? publication.tags : this.normalizeTags(input.tags),
        routingDestinations: nextType === publication.type ? publication.routingDestinations : policy.destinations,
        linkUrl: input.linkUrl === undefined ? publication.linkUrl : this.optionalText(input.linkUrl),
        coverImageUrl:
          input.coverImageUrl === undefined
            ? input.attachments === undefined
              ? publication.coverImageUrl
              : this.resolveCoverImageUrl(input) ?? publication.coverImageUrl
            : this.optionalText(input.coverImageUrl),
        groupId: input.groupId === undefined ? publication.groupId : this.optionalText(input.groupId),
        opportunityDeadline:
          input.opportunityDeadline === undefined
            ? publication.opportunityDeadline
            : input.opportunityDeadline
              ? new Date(input.opportunityDeadline)
              : null,
        opportunityLocation:
          input.opportunityLocation === undefined
            ? publication.opportunityLocation
            : this.optionalText(input.opportunityLocation),
        budgetRange: input.budgetRange === undefined ? publication.budgetRange : this.optionalText(input.budgetRange),
        contactEmail:
          input.contactEmail === undefined ? publication.contactEmail : this.optionalText(input.contactEmail),
        publishedAt:
          nextStatus === PublicationStatus.PUBLISHED && !publication.publishedAt ? new Date() : publication.publishedAt,
        expiresAt: input.expiresAt === undefined ? publication.expiresAt : input.expiresAt ? new Date(input.expiresAt) : null,
        ...(input.attachments === undefined
          ? {}
          : {
              attachments: {
                deleteMany: {},
                create: this.normalizeAttachments(input.attachments),
              },
            }),
      },
      include: publicationInclude,
    });

    if (publication.status !== PublicationStatus.PUBLISHED && updated.status === PublicationStatus.PUBLISHED) {
      await Promise.all([
        this.notifyPublicationPublished(updated, user).catch(() => undefined),
        this.notifyPublicationMentions(updated, user).catch(() => undefined),
      ]);
    }

    return this.serializePublication(updated, user.id, null, await this.loadOfficialAuthorProfile());
  }

  async publishPublication(authUser: AuthUser, id: string) {
    const user = await this.getActiveUser(authUser);
    const publication = await this.findPublicationOrThrow(id);
    this.ensureCanManage(user, publication);
    this.ensureTypeAllowed(user, publication.type);
    this.validatePublicationPayload(publication.type, {
      title: publication.title,
      content: publication.content,
      linkUrl: publication.linkUrl ?? undefined,
      attachments: publication.attachments,
    });

    const updated = await this.prisma.publication.update({
      where: { id },
      data: {
        status: PublicationStatus.PUBLISHED,
        publishedAt: publication.publishedAt ?? new Date(),
      },
      include: publicationInclude,
    });

    await Promise.all([
      this.notifyPublicationPublished(updated, user).catch(() => undefined),
      this.notifyPublicationMentions(updated, user).catch(() => undefined),
    ]);

    return this.serializePublication(updated, user.id, null, await this.loadOfficialAuthorProfile());
  }

  async archivePublication(authUser: AuthUser, id: string) {
    const user = await this.getActiveUser(authUser);
    const publication = await this.findPublicationOrThrow(id);
    this.ensureCanManage(user, publication);

    const updated = await this.prisma.publication.update({
      where: { id },
      data: { status: PublicationStatus.ARCHIVED },
      include: publicationInclude,
    });

    return this.serializePublication(updated, user.id, null, await this.loadOfficialAuthorProfile());
  }

  async addComment(authUser: AuthUser, publicationId: string, input: CreatePublicationCommentDto) {
    const user = await this.getActiveUser(authUser);
    const publication = await this.findPublicationOrThrow(publicationId);
    this.ensureCanRead(user, publication);

    const parentId = this.optionalText(input.parentId);
    if (parentId) {
      const parent = await this.prisma.publicationComment.findUnique({
        where: { id: parentId },
        select: { publicationId: true },
      });

      if (!parent || parent.publicationId !== publicationId) {
        throw new BadRequestException("Le commentaire auquel vous répondez est introuvable.");
      }
    }

    const comment = await this.prisma.publicationComment.create({
      data: {
        publicationId,
        authorId: user.id,
        parentId,
        content: this.requiredText(input.content, "Le commentaire est requis."),
      },
      include: publicationCommentInclude,
    });

    if (publication.authorId !== user.id) {
      await this.notifications.createForUser({
        userId: publication.authorId,
        type: NotificationType.MESSAGE,
        title: "Nouveau commentaire",
        message: `${this.displayName(user)} a commenté votre publication “${publication.title}”.`,
        href: this.hrefForFeedPublication(publication),
      }).catch(() => undefined);
    }

    return this.serializePublicationComment(comment, user.id, publication.authorId, await this.loadOfficialAuthorProfile());
  }

  async deleteComment(authUser: AuthUser, publicationId: string, commentId: string) {
    const user = await this.getActiveUser(authUser);
    const publication = await this.findPublicationOrThrow(publicationId);
    this.ensureCanRead(user, publication);

    const comment = await this.prisma.publicationComment.findFirst({
      where: {
        id: commentId,
        publicationId,
      },
      include: publicationCommentInclude,
    });

    if (!comment) {
      throw new NotFoundException("Ce commentaire est introuvable.");
    }

    const canDelete = comment.authorId === user.id || publication.authorId === user.id || user.type === AccountType.ADMIN;

    if (!canDelete) {
      throw new ForbiddenException("Vous ne pouvez pas supprimer ce commentaire.");
    }

    await this.prisma.publicationComment.delete({
      where: { id: commentId },
    });

    if (comment.authorId !== user.id && publication.authorId === user.id) {
      await this.notifications.createForUser({
        userId: comment.authorId,
        type: NotificationType.SYSTEM,
        title: "Commentaire supprimé",
        message: `Votre commentaire sous “${publication.title}” a été retiré par l'auteur de la publication.`,
        href: this.hrefForFeedPublication(publication),
      }).catch(() => undefined);
    }

    if (user.type === AccountType.ADMIN) {
      await this.prisma.adminAuditLog.create({
        data: {
          adminId: user.id,
          targetUserId: comment.authorId,
          action: "COMMENT_DELETED",
          entityType: "PublicationComment",
          entityId: comment.id,
          message: `Commentaire supprimé sous “${publication.title}”.`,
        },
      }).catch(() => undefined);
    }

    return {
      success: true,
      commentId,
      publicationId,
    };
  }

  async toggleReaction(authUser: AuthUser, publicationId: string, input: TogglePublicationReactionDto = {}) {
    const user = await this.getActiveUser(authUser);
    const publication = await this.findPublicationOrThrow(publicationId);
    this.ensureCanRead(user, publication);

    const type = input.type ?? PublicationReactionType.LIKE;
    const existing = await this.prisma.publicationReaction.findUnique({
      where: {
        publicationId_userId_type: {
          publicationId,
          userId: user.id,
          type,
        },
      },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.publicationReaction.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.publicationReaction.create({
        data: {
          publicationId,
          userId: user.id,
          type,
        },
      });

      if (publication.authorId !== user.id) {
        await this.notifications.createForUser({
          userId: publication.authorId,
          type: NotificationType.SYSTEM,
          title: "Nouvelle réaction",
          message: `${this.displayName(user)} a réagi à votre publication “${publication.title}”.`,
          href: this.hrefForFeedPublication(publication),
        }).catch(() => undefined);
      }
    }

    const count = await this.prisma.publicationReaction.count({
      where: { publicationId, type },
    });

    return {
      active: !existing,
      type,
      count,
    };
  }

  async listReactions(authUser: AuthUser, publicationId: string) {
    const user = await this.getActiveUser(authUser);
    const publication = await this.findPublicationOrThrow(publicationId);
    this.ensureCanRead(user, publication);

    if (publication.authorId !== user.id && user.type !== AccountType.ADMIN) {
      throw new ForbiddenException("Seul l'auteur de la publication peut consulter la liste des réactions.");
    }

    const [reactions, count] = await this.prisma.$transaction([
      this.prisma.publicationReaction.findMany({
        where: {
          publicationId,
          type: PublicationReactionType.LIKE,
        },
        include: {
          user: {
            select: publicationAuthorSelect,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      this.prisma.publicationReaction.count({
        where: {
          publicationId,
          type: PublicationReactionType.LIKE,
        },
      }),
    ]);

    const officialProfile = await this.loadOfficialAuthorProfile();

    return {
      count,
      items: reactions.map((reaction) => ({
        ...this.serializeAuthor(reaction.user, officialProfile),
        reactionType: reaction.type,
        reactedAt: reaction.createdAt,
      })),
    };
  }

  async sharePublication(authUser: AuthUser, publicationId: string, input: SharePublicationDto = {}) {
    const user = await this.getActiveUser(authUser);
    const publication = await this.findPublicationOrThrow(publicationId);
    this.ensureCanRead(user, publication);

    const content = this.optionalText(input.content);
    const existing = await this.prisma.publicationShare.findUnique({
      where: {
        publicationId_userId: {
          publicationId,
          userId: user.id,
        },
      },
      select: { id: true },
    });

    const share = await this.prisma.publicationShare.upsert({
      where: {
        publicationId_userId: {
          publicationId,
          userId: user.id,
        },
      },
      create: {
        publicationId,
        userId: user.id,
        content,
      },
      update: { content },
    });

    if (!existing && publication.authorId !== user.id) {
      await this.notifications.createForUser({
        userId: publication.authorId,
        type: NotificationType.SYSTEM,
        title: "Publication partagée",
        message: `${this.displayName(user)} a partagé votre publication “${publication.title}”.`,
        href: this.hrefForFeedPublication(publication),
      }).catch(() => undefined);
    }

    const count = await this.prisma.publicationShare.count({ where: { publicationId } });

    return {
      success: true,
      shared: true,
      shareId: share.id,
      count,
    };
  }

  async reportPublication(authUser: AuthUser, publicationId: string, input: ReportPublicationDto) {
    const user = await this.getActiveUser(authUser);
    const publication = await this.findPublicationOrThrow(publicationId);
    this.ensureCanRead(user, publication);

    if (publication.authorId === user.id) {
      throw new BadRequestException("Vous ne pouvez pas signaler votre propre publication.");
    }

    const reason = input.reason ?? PublicationReportReason.OTHER;
    const message = this.optionalText(input.message);
    const report = await this.prisma.publicationReport.upsert({
      where: {
        publicationId_reporterId: {
          publicationId,
          reporterId: user.id,
        },
      },
      create: {
        publicationId,
        reporterId: user.id,
        reason,
        message,
      },
      update: {
        reason,
        message,
        status: PublicationReportStatus.PENDING,
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
          title: "Publication signalée",
          message: `${this.displayName(user)} a signalé “${publication.title}”.`,
          href: "/espace-membre",
        }).catch(() => undefined),
      ),
    );

    return {
      success: true,
      reportId: report.id,
      status: report.status,
    };
  }

  async listPublicationReports(authUser: AuthUser, query: PublicationReportQueryDto = {}) {
    const user = await this.getActiveUser(authUser);
    this.ensureAdmin(user);

    const where: Prisma.PublicationReportWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.reason ? { reason: query.reason } : {}),
    };
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
    const [reports, total] = await Promise.all([
      this.prisma.publicationReport.findMany({
        where,
        include: publicationReportInclude,
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        take: limit,
      }),
      this.prisma.publicationReport.count({ where }),
    ]);
    const officialProfile = await this.loadOfficialAuthorProfile();

    return {
      reports: reports.map((report) => this.serializePublicationReport(report, user.id, officialProfile)),
      total,
      pending: reports.filter((report) => report.status === PublicationReportStatus.PENDING).length,
    };
  }

  async moderatePublicationReport(authUser: AuthUser, reportId: string, input: ModeratePublicationReportDto) {
    const user = await this.getActiveUser(authUser);
    this.ensureAdmin(user);

    if (!input.status && !input.publicationStatus) {
      throw new BadRequestException("Choisissez l'action de modération à appliquer.");
    }

    if (input.publicationStatus === PublicationStatus.DRAFT) {
      throw new BadRequestException("Une modération ne peut pas remettre une publication en brouillon.");
    }

    const existing = await this.prisma.publicationReport.findUnique({
      where: { id: reportId },
      include: { publication: true },
    });

    if (!existing) {
      throw new NotFoundException("Ce signalement est introuvable.");
    }

    const reportStatus = input.status ?? PublicationReportStatus.REVIEWED;
    await this.prisma.$transaction(async (tx) => {
      await tx.publicationReport.update({
        where: { id: reportId },
        data: {
          status: reportStatus,
          reviewedAt: new Date(),
        },
      });

      if (input.publicationStatus) {
        await tx.publication.update({
          where: { id: existing.publicationId },
          data: {
            status: input.publicationStatus,
          },
        });
      }
    });

    if (input.publicationStatus === PublicationStatus.ARCHIVED || input.publicationStatus === PublicationStatus.REJECTED) {
      await this.notifications.createForUser({
        userId: existing.publication.authorId,
        type: NotificationType.SYSTEM,
        title: "Publication modérée",
        message: `Votre publication “${existing.publication.title}” a été retirée après vérification par l’équipe CCA.`,
        href: "/espace-membre/publier",
      }).catch(() => undefined);
    }

    const report = await this.prisma.publicationReport.findUnique({
      where: { id: reportId },
      include: publicationReportInclude,
    });

    return {
      success: true,
      report: report ? this.serializePublicationReport(report, user.id, await this.loadOfficialAuthorProfile()) : null,
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

  private ensureTypeAllowed(user: ActiveUser, type: PublicationType) {
    const policy = publicationPolicies[type];

    if (!policy) {
      throw new BadRequestException("Choisissez un type de publication valide.");
    }

    if (!policy.allowedAccountTypes.includes(user.type)) {
      throw new ForbiddenException(this.permissionMessage(user.type, policy.label));
    }

    return policy;
  }

  private permissionMessage(accountType: AccountType, label: string) {
    const labels: Record<AccountType, string> = {
      [AccountType.PUBLIC]: "public",
      [AccountType.CREATOR]: "créateur",
      [AccountType.LEARNER]: "apprenant",
      [AccountType.ORGANIZATION]: "organisation",
      [AccountType.PARTNER]: "partenaire",
      [AccountType.ADMIN]: "administrateur",
    };

    return `Un compte ${labels[accountType]} ne peut pas publier ce type de contenu : ${label}.`;
  }

  private validatePublicationPayload(type: PublicationType, input: PublicationPayloadForValidation) {
    this.requiredText(input.title, "Le titre est requis.");
    this.requiredText(input.content, "Le contenu est requis.");

    if (type === PublicationType.RESOURCE && !this.optionalText(input.linkUrl) && !input.attachments?.length) {
      throw new BadRequestException("Ajoutez un lien ou un fichier pour publier une ressource.");
    }
  }

  private buildListWhere(user: ActiveUser, query: PublicationQueryDto): Prisma.PublicationWhereInput {
    const and: Prisma.PublicationWhereInput[] = [];
    const q = this.optionalText(query.q);
    const category = this.optionalText(query.category);
    const destination = this.optionalText(query.destination);

    if (user.type !== AccountType.ADMIN) {
      and.push(
        query.mine
          ? { authorId: user.id }
          : {
              OR: [
                { authorId: user.id },
                {
                  status: PublicationStatus.PUBLISHED,
                  audience: { in: [PublicationAudience.PUBLIC, PublicationAudience.MEMBERS, PublicationAudience.GROUP] },
                },
              ],
            },
      );
    } else if (query.mine) {
      and.push({ authorId: user.id });
    }

    if (query.type) {
      and.push({ type: query.type });
    }

    if (query.status) {
      and.push({ status: query.status });
    } else if (!query.mine && user.type === AccountType.ADMIN) {
      and.push({ status: PublicationStatus.PUBLISHED });
    }

    if (query.audience) {
      and.push({ audience: query.audience });
    }

    if (category) {
      and.push({ category: { contains: category, mode: "insensitive" } });
    }

    if (destination) {
      and.push({ routingDestinations: { has: destination } });
    }

    if (q) {
      and.push({
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
          { discipline: { contains: q, mode: "insensitive" } },
          { country: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { tags: { has: q } },
        ],
      });
    }

    return and.length ? { AND: and } : {};
  }

  private async findPublicationOrThrow(id: string) {
    const publication = await this.prisma.publication.findUnique({
      where: { id },
      include: publicationInclude,
    });

    if (!publication) {
      throw new NotFoundException("Cette publication est introuvable.");
    }

    return publication;
  }

  private ensureCanRead(user: ActiveUser, publication: PublicationWithRelations) {
    if (user.type === AccountType.ADMIN || publication.authorId === user.id) {
      return;
    }

    if (publication.status === PublicationStatus.PUBLISHED && publication.audience !== PublicationAudience.PRIVATE) {
      return;
    }

    throw new NotFoundException("Cette publication est introuvable.");
  }

  private ensureCanManage(user: ActiveUser, publication: PublicationWithRelations) {
    if (user.type === AccountType.ADMIN || publication.authorId === user.id) {
      return;
    }

    throw new ForbiddenException("Vous ne pouvez modifier que vos propres publications.");
  }

  private ensureAdmin(user: ActiveUser) {
    if (user.type !== AccountType.ADMIN) {
      throw new ForbiddenException("Seul un administrateur peut gérer la modération.");
    }
  }

  private buildAttachmentsCreate(attachments?: PublicationAttachmentDto[]) {
    const normalized = this.normalizeAttachments(attachments);
    return normalized.length ? { create: normalized } : undefined;
  }

  private normalizeAttachments(attachments?: PublicationAttachmentDto[]) {
    return (attachments ?? []).map((attachment, index) => ({
      type: attachment.type ?? PublicationAttachmentType.OTHER,
      url: this.requiredText(attachment.url, "Le lien du fichier est requis."),
      name: this.optionalText(attachment.name),
      mimeType: this.optionalText(attachment.mimeType),
      sizeBytes: attachment.sizeBytes ?? null,
      order: attachment.order ?? index,
    }));
  }

  private resolveCoverImageUrl(input: Pick<CreatePublicationDto | UpdatePublicationDto, "coverImageUrl" | "attachments">) {
    const explicitCover = this.optionalText(input.coverImageUrl);

    if (explicitCover) {
      return explicitCover;
    }

    return this.normalizeAttachments(input.attachments).find((attachment) => attachment.type === PublicationAttachmentType.IMAGE)?.url ?? null;
  }

  private normalizeTags(tags?: string[]) {
    return Array.from(new Set((tags ?? []).map((tag) => this.optionalText(tag)).filter((tag): tag is string => !!tag))).slice(0, 12);
  }

  private resolveLimit(value?: number) {
    return Math.min(Math.max(value ?? 30, 1), 80);
  }

  private resolveCommentLimit(value?: number) {
    return Math.min(Math.max(value ?? 8, 1), 30);
  }

  private addCursorToWhere(where: Prisma.PublicationWhereInput, cursor?: string): Prisma.PublicationWhereInput {
    const decodedCursor = this.decodePublicationCursor(cursor);

    if (!decodedCursor) {
      return where;
    }

    return {
      AND: [
        where,
        {
          OR: [
            { createdAt: { lt: decodedCursor.createdAt } },
            { createdAt: { equals: decodedCursor.createdAt }, id: { lt: decodedCursor.id } },
          ],
        },
      ],
    };
  }

  private addCommentCursorToWhere(where: Prisma.PublicationCommentWhereInput, cursor?: string): Prisma.PublicationCommentWhereInput {
    const decodedCursor = this.decodePublicationCursor(cursor);

    if (!decodedCursor) {
      return where;
    }

    return {
      AND: [
        where,
        {
          OR: [
            { createdAt: { lt: decodedCursor.createdAt } },
            { createdAt: { equals: decodedCursor.createdAt }, id: { lt: decodedCursor.id } },
          ],
        },
      ],
    };
  }

  private encodePublicationCursor(publication: PublicationWithRelations) {
    return Buffer.from(`${publication.createdAt.toISOString()}|${publication.id}`, "utf8").toString("base64url");
  }

  private encodeCommentCursor(comment: PublicationCommentWithAuthor) {
    return Buffer.from(`${comment.createdAt.toISOString()}|${comment.id}`, "utf8").toString("base64url");
  }

  private decodePublicationCursor(cursor?: string) {
    const rawCursor = this.optionalText(cursor);

    if (!rawCursor) {
      return null;
    }

    try {
      const [rawDate, id] = Buffer.from(rawCursor, "base64url").toString("utf8").split("|");
      const createdAt = new Date(rawDate);

      if (!id || Number.isNaN(createdAt.getTime())) {
        throw new Error("Invalid cursor");
      }

      return { createdAt, id };
    } catch {
      throw new BadRequestException("Le curseur de pagination est invalide.");
    }
  }

  private rankPublicationsForUser(publications: PublicationWithRelations[], user: ActiveUser) {
    return publications
      .map((publication) => ({
        publication,
        score: this.scorePublicationForUser(publication, user),
      }))
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        const rightDate = right.publication.publishedAt ?? right.publication.createdAt;
        const leftDate = left.publication.publishedAt ?? left.publication.createdAt;

        return rightDate.getTime() - leftDate.getTime();
      })
      .map(({ publication }) => publication);
  }

  private scorePublicationForUser(publication: PublicationWithRelations, user: ActiveUser) {
    const now = Date.now();
    const publishedAt = publication.publishedAt ?? publication.createdAt;
    const ageInDays = Math.max(0, (now - publishedAt.getTime()) / 86_400_000);
    const freshness = Math.max(0, 24 - ageInDays) * 1.4;
    const engagement = Math.min(40, publication._count.reactions * 2 + publication._count.comments * 3 + publication._count.shares * 4);
    const completeness =
      6 +
      (publication.coverImageUrl ? 5 : 0) +
      (publication.linkUrl ? 4 : 0) +
      (publication.attachments.length ? 5 : 0) +
      (publication.category ? 3 : 0);
    const relevance =
      this.sameValue(publication.discipline, this.defaultDiscipline(user)) * 16 +
      this.sameValue(publication.country, this.defaultCountry(user)) * 8 +
      this.sameValue(publication.city, this.defaultCity(user)) * 12;
    const businessPriority =
      (publication.routingDestinations.includes("opportunities") ? 13 : 0) +
      (publication.routingDestinations.includes("trainings") ? 10 : 0) +
      (publication.routingDestinations.includes("agenda") ? 8 : 0) +
      (publication.author.type === AccountType.ADMIN ? 12 : 0) +
      (publication.author.type === AccountType.ORGANIZATION || publication.author.type === AccountType.PARTNER ? 6 : 0);
    const deadlineBoost = this.deadlineScore(publication.opportunityDeadline ?? publication.expiresAt);
    const expiredPenalty = this.isExpired(publication.expiresAt) || this.isExpired(publication.opportunityDeadline) ? -80 : 0;

    return freshness + engagement + completeness + relevance + businessPriority + deadlineBoost + expiredPenalty;
  }

  private sameValue(left?: string | null, right?: string | null) {
    return this.normalizeComparable(left) && this.normalizeComparable(left) === this.normalizeComparable(right) ? 1 : 0;
  }

  private normalizeComparable(value?: string | null) {
    return value?.trim().toLowerCase() ?? "";
  }

  private deadlineScore(deadline?: Date | null) {
    if (!deadline) {
      return 0;
    }

    const daysUntilDeadline = (deadline.getTime() - Date.now()) / 86_400_000;

    if (daysUntilDeadline < 0) {
      return -40;
    }

    if (daysUntilDeadline <= 7) {
      return 18;
    }

    if (daysUntilDeadline <= 30) {
      return 9;
    }

    return 3;
  }

  private isExpired(value?: Date | null) {
    return !!value && value.getTime() < Date.now();
  }

  private defaultDiscipline(user: ActiveUser) {
    return user.profile?.otherDiscipline ?? user.profile?.discipline ?? user.organizationProfile?.sector ?? user.partnerProfile?.partnerType ?? null;
  }

  private defaultCountry(user: ActiveUser) {
    return user.profile?.country ?? user.organizationProfile?.country ?? user.partnerProfile?.country ?? null;
  }

  private defaultCity(user: ActiveUser) {
    return user.profile?.city ?? user.organizationProfile?.city ?? user.partnerProfile?.city ?? null;
  }

  private async resolveMentionedUserIds(authorId: string, mentionedUserIds?: string[]) {
    const uniqueIds = Array.from(
      new Set(
        (mentionedUserIds ?? [])
          .filter((userId): userId is string => typeof userId === "string")
          .map((userId) => userId.trim())
          .filter((userId) => userId && userId !== authorId),
      ),
    ).slice(0, 10);

    if (!uniqueIds.length) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: uniqueIds },
        status: AccountStatus.ACTIVE,
      },
      select: { id: true },
    });

    return users.map((user) => user.id);
  }

  private async notifyPublicationPublished(publication: PublicationWithRelations, author: ActiveUser) {
    const recipients = await this.prisma.networkConnection.findMany({
      where: {
        memberId: author.id,
        status: "ACCEPTED",
        ownerId: { not: author.id },
      },
      select: { ownerId: true },
      take: 80,
    });
    const notificationType = this.notificationTypeForPublication(publication.type);
    const href = this.hrefForPublication(publication);
    const authorName = this.displayName(author);

    await Promise.all(
      recipients.map((recipient) =>
        this.notifications.createForUser({
          userId: recipient.ownerId,
          type: notificationType,
          title: publicationPolicies[publication.type].label,
          message: `${authorName} a publié “${publication.title}”.`,
          href,
        }).catch(() => undefined),
      ),
    );
  }

  private async notifyPublicationMentions(publication: PublicationWithRelations, author: ActiveUser) {
    const mentionedUserIds = Array.from(
      new Set(publication.mentions.map((mention) => mention.userId).filter((userId) => userId !== author.id)),
    );

    if (!mentionedUserIds.length) {
      return;
    }

    const href = this.hrefForFeedPublication(publication);
    const authorName = this.displayName(author);

    await Promise.all(
      mentionedUserIds.map((userId) =>
        this.notifications.createForUser({
          userId,
          type: NotificationType.SYSTEM,
          title: "Vous êtes identifié dans une publication",
          message: `${authorName} vous a identifié dans “${publication.title}”.`,
          href,
        }).catch(() => undefined),
      ),
    );
  }

  private notificationTypeForPublication(type: PublicationType) {
    if (type === PublicationType.TRAINING) {
      return NotificationType.TRAINING;
    }

    if (type === PublicationType.OPPORTUNITY || type === PublicationType.JOB) {
      return NotificationType.OPPORTUNITY;
    }

    return NotificationType.SYSTEM;
  }

  private hrefForPublication(publication: PublicationWithRelations) {
    if (publication.routingDestinations.includes("opportunities")) {
      return "/espace-membre/opportunites";
    }

    if (publication.routingDestinations.includes("resources")) {
      return "/espace-membre/ressources";
    }

    if (publication.routingDestinations.includes("groups")) {
      return publication.groupId ? `/espace-membre/messages?groupId=${publication.groupId}` : "/espace-membre/groupes";
    }

    if (publication.routingDestinations.includes("trainings")) {
      return "/espace-membre/formations";
    }

    return "/espace-membre";
  }

  private hrefForFeedPublication(publication: Pick<PublicationWithRelations, "id">) {
    const publicationId = encodeURIComponent(publication.id);
    return `/espace-membre?publicationId=${publicationId}#publication-${publicationId}`;
  }

  private displayName(user: ActiveUser) {
    return (
      user.profile?.publicName ??
      user.organizationProfile?.name ??
      user.partnerProfile?.name ??
      `${user.firstName} ${user.lastName}`.trim()
    );
  }

  private buildExcerpt(content: string) {
    const normalized = this.requiredText(content, "Le contenu est requis.").replace(/\s+/g, " ");
    return normalized.length > 220 ? `${normalized.slice(0, 217).trim()}...` : normalized;
  }

  private requiredText(value: unknown, message: string) {
    if (typeof value !== "string" || !value.trim()) {
      throw new BadRequestException(message);
    }

    return value.trim();
  }

  private optionalText(value: unknown) {
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  private validatePublicationFile(file?: Express.Multer.File): asserts file is Express.Multer.File {
    if (!file) {
      throw new BadRequestException("Choisissez un fichier à envoyer.");
    }

    const acceptedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/quicktime",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
    ];

    if (!acceptedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException("Envoyez une image, une vidéo, un PDF ou un document valide.");
    }

    if (file.size > 20 * 1024 * 1024) {
      throw new BadRequestException("Le fichier ne doit pas dépasser 20 Mo.");
    }
  }

  private publicationAttachmentType(file: Express.Multer.File) {
    if (file.mimetype.startsWith("image/")) {
      return PublicationAttachmentType.IMAGE;
    }

    if (file.mimetype.startsWith("video/")) {
      return PublicationAttachmentType.VIDEO;
    }

    if (file.mimetype === "application/pdf") {
      return PublicationAttachmentType.PDF;
    }

    return PublicationAttachmentType.DOCUMENT;
  }

  private async storePublicationFile(userId: string, file: Express.Multer.File, type: PublicationAttachmentType) {
    const extension = this.fileExtension(file);
    const safeType = type.toLowerCase();
    const originalName = this.safeOriginalFileName(file.originalname, extension);
    const fileName = `${safeType}-${Date.now()}-${originalName}-${randomUUID()}${extension}`;
    const storedFile = await this.storage.storeFile({
      directory: `publications/${userId}`,
      fileName,
      buffer: file.buffer,
      mimeType: file.mimetype,
      visibility: "public",
    });

    return {
      fileName,
      url: storedFile.url,
    };
  }

  private fileExtension(file: Express.Multer.File) {
    const extension = extname(file.originalname).toLowerCase();

    if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".mov", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt"].includes(extension)) {
      return extension;
    }

    const extensions: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
      "video/mp4": ".mp4",
      "video/quicktime": ".mov",
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

    return normalized || "fichier";
  }

  private async loadOfficialAuthorProfile(): Promise<OfficialAuthorProfile | null> {
    return this.prisma.platformProfile.findUnique({
      where: { id: "official-cca" },
      select: {
        displayName: true,
        logoUrl: true,
      },
    });
  }

  private serializePublication(
    publication: PublicationWithRelations,
    currentUserId: string,
    viewerReaction: PublicationReactionType | null = null,
    officialProfile: OfficialAuthorProfile | null = null,
  ) {
    return {
      id: publication.id,
      type: publication.type,
      typeLabel: publicationPolicies[publication.type].label,
      status: publication.status,
      audience: publication.audience,
      title: publication.title,
      content: publication.content,
      excerpt: publication.excerpt,
      category: publication.category,
      discipline: publication.discipline,
      country: publication.country,
      city: publication.city,
      tags: publication.tags,
      routingDestinations: publication.routingDestinations,
      linkUrl: publication.linkUrl,
      coverImageUrl: publication.coverImageUrl,
      groupId: publication.groupId,
      opportunityDeadline: publication.opportunityDeadline,
      opportunityLocation: publication.opportunityLocation,
      budgetRange: publication.budgetRange,
      contactEmail: publication.contactEmail,
      publishedAt: publication.publishedAt,
      expiresAt: publication.expiresAt,
      createdAt: publication.createdAt,
      updatedAt: publication.updatedAt,
      author: this.serializeAuthor(publication.author, officialProfile),
      attachments: publication.attachments,
      mentions: publication.mentions.map((mention) => this.serializeAuthor(mention.user, officialProfile)),
      counts: {
        comments: publication._count.comments,
        reactions: publication._count.reactions,
        shares: publication._count.shares,
      },
      viewerReaction,
      permissions: {
        canEdit: publication.authorId === currentUserId,
        canArchive: publication.authorId === currentUserId,
      },
    };
  }

  private async loadViewerReaction(publicationId: string, userId: string) {
    const reaction = await this.prisma.publicationReaction.findFirst({
      where: { publicationId, userId },
      select: { type: true },
    });

    return reaction?.type ?? null;
  }

  private async loadViewerReactions(publicationIds: string[], userId: string) {
    if (!publicationIds.length) {
      return new Map<string, PublicationReactionType>();
    }

    const reactions = await this.prisma.publicationReaction.findMany({
      where: {
        publicationId: { in: publicationIds },
        userId,
      },
      select: {
        publicationId: true,
        type: true,
      },
    });

    return new Map(reactions.map((reaction) => [reaction.publicationId, reaction.type]));
  }

  private serializePublicationComment(
    comment: PublicationCommentWithAuthor,
    currentUserId: string,
    publicationAuthorId?: string,
    officialProfile: OfficialAuthorProfile | null = null,
  ) {
    return {
      id: comment.id,
      publicationId: comment.publicationId,
      parentId: comment.parentId,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: this.serializeAuthor(comment.author, officialProfile),
      permissions: {
        canEdit: comment.authorId === currentUserId,
        canDelete: comment.authorId === currentUserId || publicationAuthorId === currentUserId,
      },
    };
  }

  private serializePublicationReport(report: PublicationReportWithRelations, currentUserId: string, officialProfile: OfficialAuthorProfile | null = null) {
    return {
      id: report.id,
      reason: report.reason,
      message: report.message,
      status: report.status,
      reviewedAt: report.reviewedAt,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      reporter: this.serializeAuthor(report.reporter, officialProfile),
      publication: this.serializePublication(report.publication, currentUserId, null, officialProfile),
    };
  }

  private serializeAuthor(author: PublicationAuthor | ActiveUser, officialProfile: OfficialAuthorProfile | null = null) {
    if (author.type === AccountType.ADMIN) {
      return {
        id: author.id,
        accountType: author.type,
        displayName: officialProfile?.displayName ?? "Creative Currencies Africa",
        avatarUrl: officialProfile?.logoUrl ?? "/assets/cca-mask-gold-transparent.png",
        memberNumber: null,
        discipline: "Compte officiel",
        country: null,
        city: null,
        verified: true,
      };
    }

    const profile = author.profile;
    const organization = author.organizationProfile;
    const partner = author.partnerProfile;

    return {
      id: author.id,
      accountType: author.type,
      displayName:
        profile?.publicName ??
        organization?.name ??
        partner?.name ??
        `${author.firstName} ${author.lastName}`.trim(),
      avatarUrl: profile?.avatarUrl ?? organization?.logoUrl ?? partner?.logoUrl,
      memberNumber: profile?.memberNumber,
      discipline: profile?.otherDiscipline ?? profile?.discipline ?? organization?.sector ?? partner?.partnerType,
      country: profile?.country ?? organization?.country ?? partner?.country,
      city: profile?.city ?? organization?.city ?? partner?.city,
      verified: !!author.emailVerifiedAt || !!profile?.verifiedAt || !!organization?.verifiedAt || !!partner?.verifiedAt,
    };
  }
}
