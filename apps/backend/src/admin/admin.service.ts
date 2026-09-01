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
  NotificationType,
  Prisma,
  PublicationAudience,
  PublicationReportReason,
  PublicationReportStatus,
  PublicationStatus,
  PublicationType,
} from "@prisma/client";
import type { AuthUser } from "../auth/auth.types";
import { NotificationService } from "../notification/notification.service";
import { PrismaService } from "../prisma/prisma.service";

const adminUserInclude = {
  profile: true,
  organizationProfile: true,
  partnerProfile: true,
} satisfies Prisma.UserInclude;

const adminPublicationInclude = {
  author: {
    include: adminUserInclude,
  },
  attachments: {
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  },
  _count: {
    select: {
      comments: true,
      reactions: true,
      shares: true,
      reports: true,
    },
  },
} satisfies Prisma.PublicationInclude;

const adminReportInclude = {
  reporter: {
    include: adminUserInclude,
  },
  publication: {
    include: adminPublicationInclude,
  },
} satisfies Prisma.PublicationReportInclude;

type AdminUser = Prisma.UserGetPayload<{ include: typeof adminUserInclude }>;
type AdminPublication = Prisma.PublicationGetPayload<{ include: typeof adminPublicationInclude }>;
type AdminReport = Prisma.PublicationReportGetPayload<{ include: typeof adminReportInclude }>;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async overview(authUser: AuthUser) {
    await this.ensureAdmin(authUser);

    const [
      membersTotal,
      activeMembers,
      pendingMembers,
      suspendedMembers,
      pendingReports,
      publishedPublications,
      draftPublications,
      rejectedPublications,
      trainings,
      opportunities,
      resources,
      groups,
      certificatesIssued,
      applicationsPending,
      recentReports,
      recentMembers,
      recentPublications,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: AccountStatus.ACTIVE } }),
      this.prisma.user.count({ where: { status: AccountStatus.PENDING } }),
      this.prisma.user.count({ where: { status: AccountStatus.SUSPENDED } }),
      this.prisma.publicationReport.count({ where: { status: PublicationReportStatus.PENDING } }),
      this.prisma.publication.count({ where: { status: PublicationStatus.PUBLISHED } }),
      this.prisma.publication.count({ where: { status: PublicationStatus.DRAFT } }),
      this.prisma.publication.count({ where: { status: PublicationStatus.REJECTED } }),
      this.prisma.training.count(),
      this.prisma.opportunity.count(),
      this.prisma.resource.count(),
      this.prisma.communityGroup.count(),
      this.prisma.certificate.count({ where: { status: "ISSUED" } }),
      this.prisma.opportunityApplication.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
      this.prisma.publicationReport.findMany({
        include: adminReportInclude,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 6,
      }),
      this.prisma.user.findMany({
        include: adminUserInclude,
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      this.prisma.publication.findMany({
        include: adminPublicationInclude,
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

    return {
      summary: {
        membersTotal,
        activeMembers,
        pendingMembers,
        suspendedMembers,
        pendingReports,
        publishedPublications,
        draftPublications,
        rejectedPublications,
        applicationsPending,
      },
      content: {
        trainings,
        opportunities,
        resources,
        groups,
        certificatesIssued,
      },
      recentReports: recentReports.map((report) => this.serializeReport(report)),
      recentMembers: recentMembers.map((member) => this.serializeMember(member)),
      recentPublications: recentPublications.map((publication) => this.serializePublication(publication)),
    };
  }

  async listMembers(authUser: AuthUser, query: Record<string, string | undefined>) {
    await this.ensureAdmin(authUser);

    const q = this.optionalText(query.q);
    const type = this.parseEnum(AccountType, query.type, "Type de compte invalide.");
    const status = this.parseEnum(AccountStatus, query.status, "Statut de compte invalide.");
    const where: Prisma.UserWhereInput = {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(q ? {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { profile: { publicName: { contains: q, mode: "insensitive" } } },
          { profile: { memberNumber: { contains: q, mode: "insensitive" } } },
          { organizationProfile: { name: { contains: q, mode: "insensitive" } } },
          { partnerProfile: { name: { contains: q, mode: "insensitive" } } },
        ],
      } : {}),
    };
    const limit = this.resolveLimit(query.limit);
    const [members, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: adminUserInclude,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      members: members.map((member) => this.serializeMember(member)),
      total,
    };
  }

  async updateMemberStatus(authUser: AuthUser, id: string, input: { status?: string }) {
    const admin = await this.ensureAdmin(authUser);
    const status = this.parseEnum(AccountStatus, input.status, "Choisissez un statut de compte valide.");

    if (!status) {
      throw new BadRequestException("Choisissez le statut à appliquer.");
    }

    if (admin.id === id && status !== AccountStatus.ACTIVE) {
      throw new BadRequestException("Vous ne pouvez pas désactiver votre propre accès administrateur.");
    }

    const member = await this.prisma.user.update({
      where: { id },
      data: { status },
      include: adminUserInclude,
    }).catch((error) => {
      if (this.isNotFound(error)) {
        throw new NotFoundException("Ce compte est introuvable.");
      }

      throw error;
    });

    await this.notifications.createForUser({
      userId: member.id,
      type: NotificationType.SYSTEM,
      title: "Statut du compte mis à jour",
      message: this.memberStatusMessage(status),
      href: "/espace-membre/parametres",
    }).catch(() => undefined);

    return this.serializeMember(member);
  }

  async grantAdminAccess(authUser: AuthUser, id: string) {
    const admin = await this.ensureAdmin(authUser);

    const member = await this.prisma.user.findUnique({
      where: { id },
      include: adminUserInclude,
    });

    if (!member) {
      throw new NotFoundException("Ce compte est introuvable.");
    }

    if (member.type === AccountType.ADMIN) {
      return this.serializeMember(member);
    }

    const promoted = await this.prisma.user.update({
      where: { id },
      data: {
        type: AccountType.ADMIN,
        status: AccountStatus.ACTIVE,
        emailVerifiedAt: member.emailVerifiedAt ?? new Date(),
      },
      include: adminUserInclude,
    });

    await this.notifications.createForUser({
      userId: promoted.id,
      type: NotificationType.SYSTEM,
      title: "Accès admin activé",
      message: `${this.displayName(admin)} vous a donné accès au back-office CCA.`,
      href: "/espace-membre/admin",
    }).catch(() => undefined);

    return this.serializeMember(promoted);
  }

  async listPublications(authUser: AuthUser, query: Record<string, string | undefined>) {
    await this.ensureAdmin(authUser);

    const q = this.optionalText(query.q);
    const type = this.parseEnum(PublicationType, query.type, "Type de publication invalide.");
    const status = this.parseEnum(PublicationStatus, query.status, "Statut de publication invalide.");
    const where: Prisma.PublicationWhereInput = {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(q ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
          { discipline: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { country: { contains: q, mode: "insensitive" } },
          { author: { email: { contains: q, mode: "insensitive" } } },
          { author: { profile: { publicName: { contains: q, mode: "insensitive" } } } },
          { author: { organizationProfile: { name: { contains: q, mode: "insensitive" } } } },
        ],
      } : {}),
    };
    const limit = this.resolveLimit(query.limit);
    const [publications, total] = await Promise.all([
      this.prisma.publication.findMany({
        where,
        include: adminPublicationInclude,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: limit,
      }),
      this.prisma.publication.count({ where }),
    ]);

    return {
      publications: publications.map((publication) => this.serializePublication(publication)),
      total,
    };
  }

  async updatePublicationStatus(authUser: AuthUser, id: string, input: { status?: string }) {
    await this.ensureAdmin(authUser);
    const status = this.parseEnum(PublicationStatus, input.status, "Choisissez un statut de publication valide.");

    if (!status || status === PublicationStatus.DRAFT) {
      throw new BadRequestException("Choisissez publier, archiver ou rejeter.");
    }

    const publication = await this.prisma.publication.update({
      where: { id },
      data: {
        status,
        ...(status === PublicationStatus.PUBLISHED ? { publishedAt: new Date() } : {}),
      },
      include: adminPublicationInclude,
    }).catch((error) => {
      if (this.isNotFound(error)) {
        throw new NotFoundException("Cette publication est introuvable.");
      }

      throw error;
    });

    await this.notifications.createForUser({
      userId: publication.authorId,
      type: NotificationType.SYSTEM,
      title: "Publication mise à jour",
      message: this.publicationStatusMessage(status, publication.title),
      href: "/espace-membre/publier",
    }).catch(() => undefined);

    return this.serializePublication(publication);
  }

  async listReports(authUser: AuthUser, query: Record<string, string | undefined>) {
    await this.ensureAdmin(authUser);

    const status = this.parseEnum(PublicationReportStatus, query.status, "Statut de signalement invalide.");
    const reason = this.parseEnum(PublicationReportReason, query.reason, "Raison de signalement invalide.");
    const where: Prisma.PublicationReportWhereInput = {
      ...(status ? { status } : {}),
      ...(reason ? { reason } : {}),
    };
    const limit = this.resolveLimit(query.limit);
    const [reports, total, pending] = await Promise.all([
      this.prisma.publicationReport.findMany({
        where,
        include: adminReportInclude,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: limit,
      }),
      this.prisma.publicationReport.count({ where }),
      this.prisma.publicationReport.count({ where: { status: PublicationReportStatus.PENDING } }),
    ]);

    return {
      reports: reports.map((report) => this.serializeReport(report)),
      total,
      pending,
    };
  }

  async updateReport(authUser: AuthUser, id: string, input: { status?: string; publicationStatus?: string }) {
    await this.ensureAdmin(authUser);
    const status = this.parseEnum(PublicationReportStatus, input.status, "Statut de signalement invalide.") ?? PublicationReportStatus.REVIEWED;
    const publicationStatus = this.parseEnum(PublicationStatus, input.publicationStatus, "Statut de publication invalide.");

    if (status === PublicationReportStatus.PENDING) {
      throw new BadRequestException("Un signalement traité ne peut pas rester en attente.");
    }

    if (publicationStatus === PublicationStatus.DRAFT) {
      throw new BadRequestException("Une modération ne peut pas remettre une publication en brouillon.");
    }

    const currentReport = await this.prisma.publicationReport.findUnique({
      where: { id },
      include: { publication: true },
    });

    if (!currentReport) {
      throw new NotFoundException("Ce signalement est introuvable.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.publicationReport.update({
        where: { id },
        data: {
          status,
          reviewedAt: new Date(),
        },
      });

      if (publicationStatus) {
        await tx.publication.update({
          where: { id: currentReport.publicationId },
          data: { status: publicationStatus },
        });
      }
    });

    if (publicationStatus === PublicationStatus.ARCHIVED || publicationStatus === PublicationStatus.REJECTED) {
      await this.notifications.createForUser({
        userId: currentReport.publication.authorId,
        type: NotificationType.SYSTEM,
        title: "Publication modérée",
        message: `Votre publication “${currentReport.publication.title}” a été retirée après vérification par l'équipe CCA.`,
        href: "/espace-membre/publier",
      }).catch(() => undefined);
    }

    const report = await this.prisma.publicationReport.findUnique({
      where: { id },
      include: adminReportInclude,
    });

    return {
      success: true,
      report: report ? this.serializeReport(report) : null,
    };
  }

  private async ensureAdmin(authUser: AuthUser): Promise<AdminUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.userId },
      include: adminUserInclude,
    });

    if (!user || user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException("Votre session administrateur n'est plus valide.");
    }

    if (user.type !== AccountType.ADMIN) {
      throw new ForbiddenException("Cet espace est réservé à l'équipe CCA.");
    }

    return user;
  }

  private serializeMember(user: AdminUser) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: this.displayName(user),
      avatarUrl: user.profile?.avatarUrl ?? user.organizationProfile?.logoUrl ?? user.partnerProfile?.logoUrl ?? null,
      type: user.type,
      status: user.status,
      phone: user.phone,
      emailVerified: !!user.emailVerifiedAt,
      memberNumber: user.profile?.memberNumber ?? null,
      profileCompletion: user.profile?.profileCompletion ?? null,
      discipline: user.profile?.discipline ?? user.organizationProfile?.sector ?? user.partnerProfile?.partnerType ?? null,
      country: user.profile?.country ?? user.organizationProfile?.country ?? user.partnerProfile?.country ?? null,
      city: user.profile?.city ?? user.organizationProfile?.city ?? user.partnerProfile?.city ?? null,
      verifiedAt: user.profile?.verifiedAt ?? user.organizationProfile?.verifiedAt ?? user.partnerProfile?.verifiedAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private serializePublication(publication: AdminPublication) {
    return {
      id: publication.id,
      type: publication.type,
      status: publication.status,
      audience: publication.audience,
      title: publication.title,
      excerpt: publication.excerpt,
      content: publication.content,
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
      author: this.serializeMember(publication.author),
      attachments: publication.attachments.map((attachment) => ({
        id: attachment.id,
        type: attachment.type,
        url: attachment.url,
        name: attachment.name,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
      })),
      counts: {
        comments: publication._count.comments,
        reactions: publication._count.reactions,
        shares: publication._count.shares,
        reports: publication._count.reports,
      },
    };
  }

  private serializeReport(report: AdminReport) {
    return {
      id: report.id,
      reason: report.reason,
      message: report.message,
      status: report.status,
      reviewedAt: report.reviewedAt,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      reporter: this.serializeMember(report.reporter),
      publication: this.serializePublication(report.publication),
    };
  }

  private displayName(user: AdminUser) {
    return (
      this.optionalText(user.organizationProfile?.name) ??
      this.optionalText(user.partnerProfile?.name) ??
      this.optionalText(user.profile?.publicName) ??
      `${user.firstName} ${user.lastName}`.trim()
    );
  }

  private resolveLimit(value?: string) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return 40;
    }

    return Math.min(Math.max(Math.trunc(parsed), 1), 100);
  }

  private optionalText(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed || null;
  }

  private parseEnum<T extends Record<string, string>>(source: T, value: string | undefined, message: string): T[keyof T] | null {
    const normalized = this.optionalText(value);

    if (!normalized) {
      return null;
    }

    if (Object.values(source).includes(normalized)) {
      return normalized as T[keyof T];
    }

    throw new BadRequestException(message);
  }

  private memberStatusMessage(status: AccountStatus) {
    const messages: Record<AccountStatus, string> = {
      [AccountStatus.PENDING]: "Votre compte est en attente de validation.",
      [AccountStatus.ACTIVE]: "Votre compte est actif.",
      [AccountStatus.SUSPENDED]: "Votre compte est temporairement suspendu. Contactez l'équipe CCA si besoin.",
      [AccountStatus.ARCHIVED]: "Votre compte a été archivé par l'équipe CCA.",
    };

    return messages[status];
  }

  private publicationStatusMessage(status: PublicationStatus, title: string) {
    const messages: Record<PublicationStatus, string> = {
      [PublicationStatus.DRAFT]: `La publication “${title}” est revenue en brouillon.`,
      [PublicationStatus.PUBLISHED]: `La publication “${title}” est publiée.`,
      [PublicationStatus.ARCHIVED]: `La publication “${title}” a été archivée par l'équipe CCA.`,
      [PublicationStatus.REJECTED]: `La publication “${title}” n'a pas été retenue après vérification par l'équipe CCA.`,
    };

    return messages[status];
  }

  private isNotFound(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
  }
}
