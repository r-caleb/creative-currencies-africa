import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  AccountEvolutionRequestStatus,
  AccountStatus,
  AccountType,
  ApplicationStatus,
  DirectMessageReportReason,
  DirectMessageReportStatus,
  EnrollmentStatus,
  EventType,
  GalleryAlbumCategory,
  NotificationType,
  OpportunityStatus,
  OpportunityType,
  Prisma,
  PublicationAudience,
  PublicationReportReason,
  PublicationReportStatus,
  PublicationStatus,
  PublicationType,
  ResourceAccessLevel,
  ResourceType,
  TrainingStatus,
} from "@prisma/client";
import type { AuthUser } from "../auth/auth.types";
import { NotificationService } from "../notification/notification.service";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { StorageService } from "../storage/storage.service";
import { CreateAdminEventDto } from "./dto/create-admin-event.dto";
import { CreateAdminOpportunityDto } from "./dto/create-admin-opportunity.dto";
import { CreateAdminResourceDto } from "./dto/create-admin-resource.dto";
import { CreateAdminTrainingDto } from "./dto/create-admin-training.dto";
import { CreateGalleryAlbumDto } from "./dto/create-gallery-album.dto";
import { CreateGalleryPhotoDto } from "./dto/create-gallery-photo.dto";
import { ListAdminContentQueryDto } from "./dto/list-admin-content.query.dto";
import { ListAdminAuditLogQueryDto } from "./dto/list-admin-audit-log-query.dto";
import { ListAdminMessageReportsQueryDto, ListAdminModerationQueryDto } from "./dto/list-admin-moderation-query.dto";
import { ListAdminOpportunityQueryDto } from "./dto/list-admin-opportunity.query.dto";
import { ListAccountEvolutionRequestsQueryDto } from "./dto/list-account-evolution-requests.query.dto";
import { ListOpportunityApplicationsQueryDto } from "./dto/list-opportunity-applications.query.dto";
import { ListGalleryAlbumQueryDto } from "./dto/list-gallery-album.query.dto";
import { ListTrainingEnrollmentsQueryDto } from "./dto/list-training-enrollments.query.dto";
import { CreatePartnerDto } from "./dto/create-partner.dto";
import { ListAdminReferenceQueryDto } from "./dto/list-admin-reference.query.dto";
import { ListAdminResourceQueryDto } from "./dto/list-admin-resource.query.dto";
import { UpdateAdminEventDto } from "./dto/update-admin-event.dto";
import { UpdateAdminOpportunityDto } from "./dto/update-admin-opportunity.dto";
import { UpdateAdminResourceDto } from "./dto/update-admin-resource.dto";
import { UpdateAdminTrainingDto } from "./dto/update-admin-training.dto";
import { UpdateAdminMessageReportDto } from "./dto/update-admin-message-report.dto";
import { UpdateGalleryAlbumDto } from "./dto/update-gallery-album.dto";
import { UpdateGalleryPhotoDto } from "./dto/update-gallery-photo.dto";
import { UpdateAccountEvolutionRequestDto } from "./dto/update-account-evolution-request.dto";
import { UpdateOpportunityApplicationDto } from "./dto/update-opportunity-application.dto";
import { UpdatePartnerDto } from "./dto/update-partner.dto";
import { UpdateTrainingEnrollmentDto } from "./dto/update-training-enrollment.dto";
import { CreateDisciplineDto } from "../reference/dto/create-discipline.dto";
import { UpdateDisciplineDto } from "../reference/dto/update-discipline.dto";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";

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

const adminDirectMessageReportInclude = {
  reporter: {
    include: adminUserInclude,
  },
  directMessage: {
    include: {
      author: {
        include: adminUserInclude,
      },
    },
  },
} satisfies Prisma.DirectMessageReportInclude;

const adminGroupMessageReportInclude = {
  reporter: {
    include: adminUserInclude,
  },
  groupMessage: {
    include: {
      author: {
        include: adminUserInclude,
      },
      group: true,
    },
  },
} satisfies Prisma.CommunityGroupMessageReportInclude;

const adminAuditLogInclude = {
  admin: {
    include: adminUserInclude,
  },
  targetUser: {
    include: adminUserInclude,
  },
} satisfies Prisma.AdminAuditLogInclude;

const adminTrainingInclude = {
  _count: {
    select: {
      modules: true,
      enrollments: true,
      resources: true,
      certificates: true,
    },
  },
} satisfies Prisma.TrainingInclude;

const adminEventInclude = {
  _count: {
    select: {
      registrations: true,
    },
  },
} satisfies Prisma.EventInclude;

const adminResourceInclude = {
  training: {
    select: {
      id: true,
      title: true,
      slug: true,
    },
  },
  _count: {
    select: {
      views: true,
      downloads: true,
      usefulMarks: true,
    },
  },
} satisfies Prisma.ResourceInclude;

const adminOpportunityInclude = {
  _count: {
    select: {
      applications: true,
    },
  },
} satisfies Prisma.OpportunityInclude;

const adminDossierUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  type: true,
  profile: {
    select: {
      publicName: true,
      discipline: true,
      otherDiscipline: true,
      country: true,
      city: true,
      portfolioUrl: true,
      cvUrl: true,
      avatarUrl: true,
    },
  },
  organizationProfile: { select: { name: true, sector: true, country: true, city: true, logoUrl: true } },
  partnerProfile: { select: { name: true, partnerType: true, country: true, city: true, logoUrl: true } },
} satisfies Prisma.UserSelect;

const adminOpportunityApplicationInclude = {
  opportunity: {
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      status: true,
      deadline: true,
      location: true,
    },
  },
  user: { select: adminDossierUserSelect },
} satisfies Prisma.OpportunityApplicationInclude;

const adminTrainingEnrollmentInclude = {
  training: {
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      startsAt: true,
      endsAt: true,
      location: true,
      certificateEnabled: true,
    },
  },
  user: { select: adminDossierUserSelect },
} satisfies Prisma.TrainingEnrollmentInclude;

const adminAccountEvolutionRequestInclude = {
  user: {
    include: adminUserInclude,
  },
  reviewedBy: {
    include: adminUserInclude,
  },
} satisfies Prisma.AccountEvolutionRequestInclude;

const adminGalleryAlbumInclude = {
  photos: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  },
  createdBy: {
    include: adminUserInclude,
  },
} satisfies Prisma.GalleryAlbumInclude;

type AdminUser = Prisma.UserGetPayload<{ include: typeof adminUserInclude }>;
type AdminPublication = Prisma.PublicationGetPayload<{ include: typeof adminPublicationInclude }>;
type AdminReport = Prisma.PublicationReportGetPayload<{ include: typeof adminReportInclude }>;
type AdminDirectMessageReport = Prisma.DirectMessageReportGetPayload<{ include: typeof adminDirectMessageReportInclude }>;
type AdminGroupMessageReport = Prisma.CommunityGroupMessageReportGetPayload<{ include: typeof adminGroupMessageReportInclude }>;
type AdminAuditLog = Prisma.AdminAuditLogGetPayload<{ include: typeof adminAuditLogInclude }>;
type AdminTraining = Prisma.TrainingGetPayload<{ include: typeof adminTrainingInclude }>;
type AdminEvent = Prisma.EventGetPayload<{ include: typeof adminEventInclude }>;
type AdminResource = Prisma.ResourceGetPayload<{ include: typeof adminResourceInclude }>;
type AdminOpportunity = Prisma.OpportunityGetPayload<{ include: typeof adminOpportunityInclude }>;
type OfficialPublicationData = Omit<
  Prisma.PublicationUncheckedCreateInput,
  "id" | "authorId" | "createdAt" | "updatedAt" | "publishedAt" | "attachments" | "comments" | "reactions" | "shares" | "reports" | "mentions"
>;
type AdminDossierUser = Prisma.UserGetPayload<{ select: typeof adminDossierUserSelect }>;
type AdminOpportunityApplication = Prisma.OpportunityApplicationGetPayload<{ include: typeof adminOpportunityApplicationInclude }>;
type AdminTrainingEnrollment = Prisma.TrainingEnrollmentGetPayload<{ include: typeof adminTrainingEnrollmentInclude }>;
type AdminAccountEvolutionRequest = Prisma.AccountEvolutionRequestGetPayload<{ include: typeof adminAccountEvolutionRequestInclude }>;
type AdminGalleryAlbum = Prisma.GalleryAlbumGetPayload<{ include: typeof adminGalleryAlbumInclude }>;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly realtime: RealtimeGateway,
    private readonly storage: StorageService,
  ) {}

  async overview(authUser: AuthUser) {
    await this.ensureAdmin(authUser);

    const [
      membersTotal,
      activeMembers,
      pendingMembers,
      suspendedMembers,
      pendingReports,
      pendingMessageReports,
      pendingGroupMessageReports,
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
      this.prisma.directMessageReport.count({ where: { status: DirectMessageReportStatus.PENDING } }),
      this.prisma.communityGroupMessageReport.count({ where: { status: DirectMessageReportStatus.PENDING } }),
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
        pendingReports: pendingReports + pendingMessageReports + pendingGroupMessageReports,
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

  async uploadAdminAsset(authUser: AuthUser, purpose = "resource", file?: Express.Multer.File) {
    const admin = await this.ensureAdmin(authUser);
    this.validateAdminUpload(file);

    const safePurpose = this.adminUploadPurpose(purpose);
    const extension = this.fileExtension(file);
    const originalName = this.safeOriginalFileName(file.originalname, extension);
    const fileName = `${safePurpose}-${Date.now()}-${originalName}-${randomUUID()}${extension}`;
    const storedFile = await this.storage.storeFile({
      directory: `admin/${safePurpose}`,
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
      purpose: safePurpose,
      uploadedById: admin.id,
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
    const limit = this.resolveLimit(query.limit ? String(query.limit) : undefined);
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

    await this.prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        targetUserId: member.id,
        action: `MEMBER_${status}`,
        entityType: "User",
        entityId: member.id,
        message: this.memberStatusMessage(status),
        metadata: {
          status,
        },
      },
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

  async updateMemberVerification(authUser: AuthUser, id: string, input: { verified?: boolean }) {
    await this.ensureAdmin(authUser);

    if (typeof input.verified !== "boolean") {
      throw new BadRequestException("Indiquez si le profil doit être vérifié ou non.");
    }

    const member = await this.prisma.user.findUnique({
      where: { id },
      include: adminUserInclude,
    });

    if (!member) {
      throw new NotFoundException("Ce compte est introuvable.");
    }

    const verifiedAt = input.verified ? new Date() : null;
    let updated: AdminUser;

    if (member.profile) {
      updated = await this.prisma.user.update({
        where: { id },
        data: { profile: { update: { verifiedAt } } },
        include: adminUserInclude,
      });
    } else if (member.organizationProfile) {
      updated = await this.prisma.user.update({
        where: { id },
        data: { organizationProfile: { update: { verifiedAt } } },
        include: adminUserInclude,
      });
    } else if (member.partnerProfile) {
      updated = await this.prisma.user.update({
        where: { id },
        data: { partnerProfile: { update: { verifiedAt } } },
        include: adminUserInclude,
      });
    } else {
      throw new BadRequestException("Ce compte n'a pas encore de profil à vérifier.");
    }

    await this.notifications.createForUser({
      userId: updated.id,
      type: NotificationType.SYSTEM,
      title: input.verified ? "Creative ID vérifié" : "Vérification retirée",
      message: input.verified
        ? "Votre profil a été validé officiellement par l'équipe CCA."
        : "La vérification officielle de votre profil a été retirée par l'équipe CCA.",
      href: "/espace-membre/creative-id",
    }).catch(() => undefined);

    return this.serializeMember(updated);
  }

  async listAccountEvolutionRequests(authUser: AuthUser, query: ListAccountEvolutionRequestsQueryDto) {
    await this.ensureAdmin(authUser);

    const q = this.optionalText(query.q);
    const status = this.parseEnum(AccountEvolutionRequestStatus, query.status, "Statut de demande invalide.");
    const requestedType = this.parseEnum(AccountType, query.requestedType, "Type de compte demandé invalide.");
    const limit = this.resolveLimit(query.limit ? String(query.limit) : undefined);
    const page = Math.max(Number(query.page ?? 1), 1);
    const where: Prisma.AccountEvolutionRequestWhereInput = {
      ...(status ? { status } : {}),
      ...(requestedType ? { requestedType } : {}),
      ...(q
        ? {
            OR: [
              { user: { email: { contains: q, mode: "insensitive" } } },
              { user: { firstName: { contains: q, mode: "insensitive" } } },
              { user: { lastName: { contains: q, mode: "insensitive" } } },
              { user: { profile: { publicName: { contains: q, mode: "insensitive" } } } },
              { user: { profile: { discipline: { contains: q, mode: "insensitive" } } } },
              { user: { profile: { city: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    };

    const [requests, total, pending] = await Promise.all([
      this.prisma.accountEvolutionRequest.findMany({
        where,
        include: adminAccountEvolutionRequestInclude,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.accountEvolutionRequest.count({ where }),
      this.prisma.accountEvolutionRequest.count({ where: { status: AccountEvolutionRequestStatus.PENDING } }),
    ]);

    return {
      requests: requests.map((request) => this.serializeAccountEvolutionRequest(request)),
      total,
      pending,
      page,
      limit,
    };
  }

  async updateAccountEvolutionRequest(authUser: AuthUser, id: string, input: UpdateAccountEvolutionRequestDto) {
    const admin = await this.ensureAdmin(authUser);
    const status = this.parseEnum(AccountEvolutionRequestStatus, input.status, "Choisissez une décision valide.");

    if (!status || status === AccountEvolutionRequestStatus.PENDING) {
      throw new BadRequestException("Choisissez une décision finale pour cette demande.");
    }

    const current = await this.prisma.accountEvolutionRequest.findUnique({
      where: { id },
      include: adminAccountEvolutionRequestInclude,
    });

    if (!current) {
      throw new NotFoundException("Cette demande de parcours est introuvable.");
    }

    if (current.status !== AccountEvolutionRequestStatus.PENDING) {
      throw new BadRequestException("Cette demande a déjà été traitée.");
    }

    if (current.requestedType !== AccountType.CREATOR) {
      throw new BadRequestException("Seules les demandes créateur peuvent être traitées dans cette version.");
    }

    if (status === AccountEvolutionRequestStatus.APPROVED && current.user.type !== AccountType.PUBLIC && current.user.type !== AccountType.LEARNER) {
      throw new BadRequestException("Ce compte ne peut pas être converti en créateur.");
    }

    const note = this.optionalText(input.note);
    const updated = await this.prisma.$transaction(async (tx) => {
      if (status === AccountEvolutionRequestStatus.APPROVED) {
        await tx.user.update({
          where: { id: current.userId },
          data: {
            type: AccountType.CREATOR,
            status: AccountStatus.ACTIVE,
          },
        });
      }

      return tx.accountEvolutionRequest.update({
        where: { id },
        data: {
          status,
          note,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
        include: adminAccountEvolutionRequestInclude,
      });
    });

    await this.notifications.createForUser({
      userId: updated.userId,
      type: NotificationType.SYSTEM,
      title: status === AccountEvolutionRequestStatus.APPROVED ? "Profil créateur validé" : "Demande créateur traitée",
      message: status === AccountEvolutionRequestStatus.APPROVED
        ? "CCA a validé votre passage au statut créateur. Votre Creative ID peut maintenant refléter ce parcours."
        : "CCA a traité votre demande de passage créateur. Consultez la note de l'équipe dans vos paramètres.",
      href: "/espace-membre/parametres",
    }).catch(() => undefined);

    await this.prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        targetUserId: updated.userId,
        action: `ACCOUNT_EVOLUTION_${status}`,
        entityType: "AccountEvolutionRequest",
        entityId: updated.id,
        message: note ?? "Demande de changement de parcours traitée.",
        metadata: {
          fromType: updated.fromType,
          requestedType: updated.requestedType,
          status,
        },
      },
    }).catch(() => undefined);

    return this.serializeAccountEvolutionRequest(updated);
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

  async listReports(authUser: AuthUser, query: ListAdminModerationQueryDto) {
    await this.ensureAdmin(authUser);

    const status = this.parseEnum(PublicationReportStatus, query.status, "Statut de signalement invalide.");
    const reason = this.parseEnum(PublicationReportReason, query.reason, "Raison de signalement invalide.");
    const q = this.optionalText(query.q);
    const createdAt = this.moderationDateRange(query.from, query.to);
    const where: Prisma.PublicationReportWhereInput = {
      ...(status ? { status } : {}),
      ...(reason ? { reason } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(q ? {
        OR: [
          { message: { contains: q, mode: "insensitive" } },
          { reporter: { email: { contains: q, mode: "insensitive" } } },
          { reporter: { firstName: { contains: q, mode: "insensitive" } } },
          { reporter: { lastName: { contains: q, mode: "insensitive" } } },
          { reporter: { profile: { publicName: { contains: q, mode: "insensitive" } } } },
          { publication: { title: { contains: q, mode: "insensitive" } } },
          { publication: { content: { contains: q, mode: "insensitive" } } },
          { publication: { author: { email: { contains: q, mode: "insensitive" } } } },
          { publication: { author: { firstName: { contains: q, mode: "insensitive" } } } },
          { publication: { author: { lastName: { contains: q, mode: "insensitive" } } } },
          { publication: { author: { profile: { publicName: { contains: q, mode: "insensitive" } } } } },
        ],
      } : {}),
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
    const admin = await this.ensureAdmin(authUser);
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

      await tx.adminAuditLog.create({
        data: {
          adminId: admin.id,
          targetUserId: currentReport.publication.authorId,
          action: publicationStatus ? `PUBLICATION_${publicationStatus}` : `PUBLICATION_REPORT_${status}`,
          entityType: "PublicationReport",
          entityId: id,
          message: currentReport.message,
          metadata: {
            publicationId: currentReport.publicationId,
            reportStatus: status,
            publicationStatus: publicationStatus ?? null,
            reason: currentReport.reason,
          },
        },
      });
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

  async listMessageReports(authUser: AuthUser, query: ListAdminMessageReportsQueryDto) {
    await this.ensureAdmin(authUser);

    const status = this.parseEnum(DirectMessageReportStatus, query.status, "Statut de signalement invalide.");
    const reason = this.parseEnum(DirectMessageReportReason, query.reason, "Raison de signalement invalide.");
    const q = this.optionalText(query.q);
    const createdAt = this.moderationDateRange(query.from, query.to);
    const where: Prisma.DirectMessageReportWhereInput = {
      ...(status ? { status } : {}),
      ...(reason ? { reason } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(q ? {
        OR: [
          { message: { contains: q, mode: "insensitive" } },
          { directMessage: { content: { contains: q, mode: "insensitive" } } },
          { reporter: { email: { contains: q, mode: "insensitive" } } },
          { reporter: { firstName: { contains: q, mode: "insensitive" } } },
          { reporter: { lastName: { contains: q, mode: "insensitive" } } },
          { reporter: { profile: { publicName: { contains: q, mode: "insensitive" } } } },
          { directMessage: { author: { email: { contains: q, mode: "insensitive" } } } },
          { directMessage: { author: { firstName: { contains: q, mode: "insensitive" } } } },
          { directMessage: { author: { lastName: { contains: q, mode: "insensitive" } } } },
          { directMessage: { author: { profile: { publicName: { contains: q, mode: "insensitive" } } } } },
        ],
      } : {}),
    };
    const limit = this.resolveLimit(query.limit);
    const [reports, total, pending] = await Promise.all([
      this.prisma.directMessageReport.findMany({
        where,
        include: adminDirectMessageReportInclude,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: limit,
      }),
      this.prisma.directMessageReport.count({ where }),
      this.prisma.directMessageReport.count({ where: { status: DirectMessageReportStatus.PENDING } }),
    ]);

    return {
      reports: reports.map((report) => this.serializeDirectMessageReport(report)),
      total,
      pending,
    };
  }

  async updateMessageReport(authUser: AuthUser, id: string, input: UpdateAdminMessageReportDto) {
    const admin = await this.ensureAdmin(authUser);
    const status = this.parseEnum(DirectMessageReportStatus, input.status, "Statut de signalement invalide.") ?? DirectMessageReportStatus.REVIEWED;

    if (status === DirectMessageReportStatus.PENDING) {
      throw new BadRequestException("Un signalement traité ne peut pas rester en attente.");
    }

    const currentReport = await this.prisma.directMessageReport.findUnique({
      where: { id },
      include: adminDirectMessageReportInclude,
    });

    if (!currentReport) {
      throw new NotFoundException("Ce signalement est introuvable.");
    }

    const updatedReport = await this.prisma.$transaction(async (tx) => {
      if (input.deleteMessage && !currentReport.directMessage.deletedAt) {
        await tx.directMessage.update({
          where: { id: currentReport.messageId },
          data: {
            content: "Message supprimé par la modération CCA",
            attachmentUrl: null,
            attachmentName: null,
            attachmentMimeType: null,
            deletedAt: new Date(),
          },
        });
      }

      const report = await tx.directMessageReport.update({
        where: { id },
        data: {
          status,
          reviewedAt: new Date(),
        },
        include: adminDirectMessageReportInclude,
      });

      await tx.adminAuditLog.create({
        data: {
          adminId: admin.id,
          targetUserId: currentReport.directMessage.authorId,
          action: input.deleteMessage ? "MESSAGE_DELETED" : `MESSAGE_REPORT_${status}`,
          entityType: "DirectMessageReport",
          entityId: id,
          message: this.optionalText(input.note) ?? currentReport.message,
          metadata: {
            messageId: currentReport.messageId,
            conversationId: currentReport.directMessage.conversationId,
            reportStatus: status,
            reason: currentReport.reason,
            deletedMessage: !!input.deleteMessage,
          },
        },
      });

      return report;
    });

    if (input.deleteMessage) {
      this.realtime.emitToDirectConversation(updatedReport.directMessage.conversationId, "direct.message.deleted", {
        conversationId: updatedReport.directMessage.conversationId,
        message: this.serializeDirectMessage(updatedReport.directMessage),
      });

      await this.notifications.createForUser({
        userId: currentReport.directMessage.authorId,
        type: NotificationType.SYSTEM,
        title: "Message modéré",
        message: "Un de vos messages a été supprimé après vérification par l’équipe CCA.",
        href: "/espace-membre/messages",
      }).catch(() => undefined);
    }

    return {
      success: true,
      report: this.serializeDirectMessageReport(updatedReport),
    };
  }

  async listGroupMessageReports(authUser: AuthUser, query: ListAdminMessageReportsQueryDto) {
    await this.ensureAdmin(authUser);

    const status = this.parseEnum(DirectMessageReportStatus, query.status, "Statut de signalement invalide.");
    const reason = this.parseEnum(DirectMessageReportReason, query.reason, "Raison de signalement invalide.");
    const q = this.optionalText(query.q);
    const createdAt = this.moderationDateRange(query.from, query.to);
    const where: Prisma.CommunityGroupMessageReportWhereInput = {
      ...(status ? { status } : {}),
      ...(reason ? { reason } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(q ? {
        OR: [
          { message: { contains: q, mode: "insensitive" } },
          { groupMessage: { content: { contains: q, mode: "insensitive" } } },
          { groupMessage: { group: { name: { contains: q, mode: "insensitive" } } } },
          { reporter: { email: { contains: q, mode: "insensitive" } } },
          { reporter: { firstName: { contains: q, mode: "insensitive" } } },
          { reporter: { lastName: { contains: q, mode: "insensitive" } } },
          { reporter: { profile: { publicName: { contains: q, mode: "insensitive" } } } },
          { groupMessage: { author: { email: { contains: q, mode: "insensitive" } } } },
          { groupMessage: { author: { firstName: { contains: q, mode: "insensitive" } } } },
          { groupMessage: { author: { lastName: { contains: q, mode: "insensitive" } } } },
          { groupMessage: { author: { profile: { publicName: { contains: q, mode: "insensitive" } } } } },
        ],
      } : {}),
    };
    const limit = this.resolveLimit(query.limit);
    const [reports, total, pending] = await Promise.all([
      this.prisma.communityGroupMessageReport.findMany({
        where,
        include: adminGroupMessageReportInclude,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: limit,
      }),
      this.prisma.communityGroupMessageReport.count({ where }),
      this.prisma.communityGroupMessageReport.count({ where: { status: DirectMessageReportStatus.PENDING } }),
    ]);

    return {
      reports: reports.map((report) => this.serializeGroupMessageReport(report)),
      total,
      pending,
    };
  }

  async updateGroupMessageReport(authUser: AuthUser, id: string, input: UpdateAdminMessageReportDto) {
    const admin = await this.ensureAdmin(authUser);
    const status = this.parseEnum(DirectMessageReportStatus, input.status, "Statut de signalement invalide.") ?? DirectMessageReportStatus.REVIEWED;

    if (status === DirectMessageReportStatus.PENDING) {
      throw new BadRequestException("Un signalement traité ne peut pas rester en attente.");
    }

    const currentReport = await this.prisma.communityGroupMessageReport.findUnique({
      where: { id },
      include: adminGroupMessageReportInclude,
    });

    if (!currentReport) {
      throw new NotFoundException("Ce signalement est introuvable.");
    }

    const updatedReport = await this.prisma.$transaction(async (tx) => {
      if (input.deleteMessage && !currentReport.groupMessage.deletedAt) {
        await tx.communityGroupMessage.update({
          where: { id: currentReport.messageId },
          data: {
            content: "Message supprimé par la modération CCA",
            attachmentUrl: null,
            attachmentName: null,
            attachmentMimeType: null,
            deletedAt: new Date(),
          },
        });
      }

      const report = await tx.communityGroupMessageReport.update({
        where: { id },
        data: {
          status,
          reviewedAt: new Date(),
        },
        include: adminGroupMessageReportInclude,
      });

      await tx.adminAuditLog.create({
        data: {
          adminId: admin.id,
          targetUserId: currentReport.groupMessage.authorId,
          action: input.deleteMessage ? "GROUP_MESSAGE_DELETED" : `GROUP_MESSAGE_REPORT_${status}`,
          entityType: "CommunityGroupMessageReport",
          entityId: id,
          message: this.optionalText(input.note) ?? currentReport.message,
          metadata: {
            messageId: currentReport.messageId,
            groupId: currentReport.groupMessage.groupId,
            groupName: currentReport.groupMessage.group.name,
            reportStatus: status,
            reason: currentReport.reason,
            deletedMessage: !!input.deleteMessage,
          },
        },
      });

      return report;
    });

    if (input.deleteMessage) {
      this.realtime.emitToGroup(updatedReport.groupMessage.groupId, "group.message.deleted", {
        groupId: updatedReport.groupMessage.groupId,
        message: this.serializeGroupMessage(updatedReport.groupMessage),
      });

      await this.notifications.createForUser({
        userId: currentReport.groupMessage.authorId,
        type: NotificationType.SYSTEM,
        title: "Message de groupe modéré",
        message: `Un de vos messages dans ${currentReport.groupMessage.group.name} a été supprimé après vérification par l’équipe CCA.`,
        href: `/espace-membre/messages?groupId=${currentReport.groupMessage.groupId}`,
      }).catch(() => undefined);
    }

    return {
      success: true,
      report: this.serializeGroupMessageReport(updatedReport),
    };
  }

  async listAuditLogs(authUser: AuthUser, query: ListAdminAuditLogQueryDto) {
    await this.ensureAdmin(authUser);

    const action = this.optionalText(query.action);
    const entityType = this.optionalText(query.entityType);
    const where: Prisma.AdminAuditLogWhereInput = {
      ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
      ...(entityType ? { entityType } : {}),
    };
    const limit = this.resolveLimit(query.limit);
    const [logs, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        where,
        include: adminAuditLogInclude,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => this.serializeAuditLog(log)),
      total,
    };
  }

  async listRiskUsers(authUser: AuthUser) {
    await this.ensureAdmin(authUser);

    const [publicationReports, messageReports, groupMessageReports] = await Promise.all([
      this.prisma.publicationReport.findMany({
        include: adminReportInclude,
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      this.prisma.directMessageReport.findMany({
        include: adminDirectMessageReportInclude,
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      this.prisma.communityGroupMessageReport.findMany({
        include: adminGroupMessageReportInclude,
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

    const riskMap = new Map<string, {
      member: AdminUser;
      publicationReports: number;
      messageReports: number;
      groupMessageReports: number;
      pendingReports: number;
      reasons: Set<string>;
      lastReportedAt: Date;
    }>();

    const registerRisk = (member: AdminUser, kind: "publication" | "message" | "groupMessage", status: string, reason: string, createdAt: Date) => {
      const existing = riskMap.get(member.id) ?? {
        member,
        publicationReports: 0,
        messageReports: 0,
        groupMessageReports: 0,
        pendingReports: 0,
        reasons: new Set<string>(),
        lastReportedAt: createdAt,
      };

      if (kind === "publication") {
        existing.publicationReports += 1;
      } else if (kind === "message") {
        existing.messageReports += 1;
      } else {
        existing.groupMessageReports += 1;
      }

      if (status === PublicationReportStatus.PENDING || status === DirectMessageReportStatus.PENDING) {
        existing.pendingReports += 1;
      }

      existing.reasons.add(reason);
      if (createdAt > existing.lastReportedAt) {
        existing.lastReportedAt = createdAt;
      }

      riskMap.set(member.id, existing);
    };

    publicationReports.forEach((report) => {
      registerRisk(report.publication.author, "publication", report.status, report.reason, report.createdAt);
    });
    messageReports.forEach((report) => {
      registerRisk(report.directMessage.author, "message", report.status, report.reason, report.createdAt);
    });
    groupMessageReports.forEach((report) => {
      registerRisk(report.groupMessage.author, "groupMessage", report.status, report.reason, report.createdAt);
    });

    const users = Array.from(riskMap.values())
      .map((entry) => ({
        member: this.serializeMember(entry.member),
        totalReports: entry.publicationReports + entry.messageReports + entry.groupMessageReports,
        publicationReports: entry.publicationReports,
        messageReports: entry.messageReports,
        groupMessageReports: entry.groupMessageReports,
        pendingReports: entry.pendingReports,
        reasons: Array.from(entry.reasons),
        lastReportedAt: entry.lastReportedAt,
      }))
      .sort((left, right) => (
        right.pendingReports - left.pendingReports
        || right.totalReports - left.totalReports
        || new Date(right.lastReportedAt).getTime() - new Date(left.lastReportedAt).getTime()
      ))
      .slice(0, 12);

    return {
      users,
      total: users.length,
    };
  }

  async listTrainings(authUser: AuthUser, query: ListAdminContentQueryDto) {
    await this.ensureAdmin(authUser);

    const q = this.optionalText(query.q);
    const status = this.parseEnum(TrainingStatus, query.status, "Statut de formation invalide.");
    const where: Prisma.TrainingWhereInput = {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { location: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [trainings, total] = await Promise.all([
      this.prisma.training.findMany({
        where,
        include: adminTrainingInclude,
        orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
      }),
      this.prisma.training.count({ where }),
    ]);

    return {
      trainings: trainings.map((training) => this.serializeTraining(training)),
      total,
    };
  }

  async createTraining(authUser: AuthUser, input: CreateAdminTrainingDto) {
    const admin = await this.ensureAdmin(authUser);

    const title = this.requiredText(input.title, "Le titre de la formation est requis.");
    const startsAt = this.parseOptionalDate(input.startsAt, "La date de début de la formation est invalide.");
    const endsAt = this.parseOptionalDate(input.endsAt, "La date de fin de la formation est invalide.");
    this.ensureDateOrder(startsAt, endsAt);
    const status = input.featuredOnLanding || input.showInFeed ? TrainingStatus.PUBLISHED : input.status ?? TrainingStatus.DRAFT;

    try {
      const training = await this.prisma.$transaction(async (tx) => {
        if (input.featuredOnLanding) {
          await tx.training.updateMany({
            where: { featuredOnLanding: true },
            data: { featuredOnLanding: false },
          });
        }

        return tx.training.create({
          data: {
            title,
            slug: await this.buildUniqueTrainingSlug(title),
            description: this.requiredText(input.description, "La description de la formation est requise."),
            startsAt,
            endsAt,
            location: this.optionalText(input.location),
            coverImageUrl: this.optionalText(input.coverImageUrl),
            capacity: input.capacity ?? null,
            priceCents: input.priceCents ?? null,
            currency: this.optionalText(input.currency) ?? "USD",
            status,
            certificateEnabled: input.certificateEnabled ?? true,
            featuredOnLanding: input.featuredOnLanding ?? false,
            showInFeed: input.showInFeed ?? false,
          },
          include: adminTrainingInclude,
        });
      });

      await this.syncTrainingPublication(admin, training);

      return this.serializeTraining(training);
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        throw new BadRequestException("Une formation avec ce titre existe déjà.");
      }

      throw error;
    }
  }

  async updateTraining(authUser: AuthUser, id: string, input: UpdateAdminTrainingDto) {
    const admin = await this.ensureAdmin(authUser);

    if (!Object.keys(input).length) {
      throw new BadRequestException("Aucune information à mettre à jour.");
    }

    const current = await this.prisma.training.findUnique({ where: { id } });

    if (!current) {
      throw new NotFoundException("Cette formation est introuvable.");
    }

    const startsAt = input.startsAt !== undefined ? this.parseOptionalDate(input.startsAt, "La date de début de la formation est invalide.") : current.startsAt;
    const endsAt = input.endsAt !== undefined ? this.parseOptionalDate(input.endsAt, "La date de fin de la formation est invalide.") : current.endsAt;
    this.ensureDateOrder(startsAt, endsAt);

    const data: Prisma.TrainingUpdateInput = {};

    if (input.title !== undefined) {
      data.title = this.requiredText(input.title, "Le titre de la formation est requis.");
    }

    if (input.description !== undefined) {
      data.description = this.requiredText(input.description, "La description de la formation est requise.");
    }

    if (input.startsAt !== undefined) {
      data.startsAt = startsAt;
    }

    if (input.endsAt !== undefined) {
      data.endsAt = endsAt;
    }

    if (input.location !== undefined) {
      data.location = this.optionalText(input.location);
    }

    if (input.coverImageUrl !== undefined) {
      data.coverImageUrl = this.optionalText(input.coverImageUrl);
    }

    if (input.capacity !== undefined) {
      data.capacity = input.capacity;
    }

    if (input.priceCents !== undefined) {
      data.priceCents = input.priceCents;
    }

    if (input.currency !== undefined) {
      data.currency = this.optionalText(input.currency) ?? current.currency;
    }

    if (input.status !== undefined) {
      data.status = input.status;
    }

    if (input.certificateEnabled !== undefined) {
      data.certificateEnabled = input.certificateEnabled;
    }

    if (input.featuredOnLanding !== undefined) {
      data.featuredOnLanding = input.featuredOnLanding;

      if (input.featuredOnLanding) {
        data.status = TrainingStatus.PUBLISHED;
      }
    }

    if (input.showInFeed !== undefined) {
      data.showInFeed = input.showInFeed;

      if (input.showInFeed) {
        data.status = TrainingStatus.PUBLISHED;
      }
    }

    if (data.status !== undefined && data.status !== TrainingStatus.PUBLISHED) {
      data.showInFeed = false;
    }

    const training = await this.prisma.$transaction(async (tx) => {
      if (input.featuredOnLanding) {
        await tx.training.updateMany({
          where: { featuredOnLanding: true, id: { not: id } },
          data: { featuredOnLanding: false },
        });
      }

      return tx.training.update({
        where: { id },
        data,
        include: adminTrainingInclude,
      });
    });

    await this.syncTrainingPublication(admin, training);

    return this.serializeTraining(training);
  }

  async deleteTraining(authUser: AuthUser, id: string) {
    await this.ensureAdmin(authUser);

    const training = await this.prisma.training.findUnique({
      where: { id },
      select: { publicationId: true },
    });

    if (!training) {
      throw new NotFoundException("Cette formation est introuvable.");
    }

    await this.prisma.$transaction([
      this.prisma.training.delete({ where: { id } }),
      ...(training.publicationId ? [this.prisma.publication.deleteMany({ where: { id: training.publicationId } })] : []),
    ]).catch((error) => {
      if (this.isNotFound(error)) {
        throw new NotFoundException("Cette formation est introuvable.");
      }

      throw error;
    });

    return { success: true };
  }

  async listTrainingEnrollments(authUser: AuthUser, query: ListTrainingEnrollmentsQueryDto) {
    await this.ensureAdmin(authUser);

    const page = this.resolvePage(query.page);
    const limit = this.resolveNumericLimit(query.limit, 20);
    const where = this.buildTrainingEnrollmentWhere(query);

    const [enrollments, total] = await Promise.all([
      this.prisma.trainingEnrollment.findMany({
        where,
        include: adminTrainingEnrollmentInclude,
        orderBy: [{ enrolledAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.trainingEnrollment.count({ where }),
    ]);

    return {
      enrollments: enrollments.map((enrollment) => this.serializeTrainingEnrollment(enrollment)),
      total,
      page,
      limit,
    };
  }

  async exportTrainingEnrollmentsCsv(authUser: AuthUser, query: ListTrainingEnrollmentsQueryDto) {
    await this.ensureAdmin(authUser);

    const enrollments = await this.prisma.trainingEnrollment.findMany({
      where: this.buildTrainingEnrollmentWhere(query),
      include: adminTrainingEnrollmentInclude,
      orderBy: [{ enrolledAt: "desc" }, { id: "asc" }],
      take: 1000,
    });

    return this.toCsv(
      ["Formation", "Membre", "Email", "Discipline", "Ville", "Téléphone", "Statut", "Progression", "Inscrit le", "Note interne", "Motivation"],
      enrollments.map((enrollment) => [
        enrollment.training.title,
        this.displayDossierName(enrollment.user),
        enrollment.user.email,
        enrollment.user.profile?.discipline ?? "",
        enrollment.user.profile?.city ?? "",
        enrollment.phone ?? enrollment.user.phone ?? "",
        this.enrollmentStatusLabel(enrollment.status),
        `${enrollment.progress}%`,
        this.formatCsvDate(enrollment.enrolledAt),
        enrollment.adminNote ?? "",
        enrollment.motivation ?? "",
      ]),
    );
  }

  async updateTrainingEnrollment(authUser: AuthUser, id: string, input: UpdateTrainingEnrollmentDto) {
    await this.ensureAdmin(authUser);

    if (!Object.keys(input).length) {
      throw new BadRequestException("Aucune information à mettre à jour.");
    }

    const current = await this.prisma.trainingEnrollment.findUnique({
      where: { id },
      include: adminTrainingEnrollmentInclude,
    });

    if (!current) {
      throw new NotFoundException("Cette inscription est introuvable.");
    }

    const data: Prisma.TrainingEnrollmentUpdateInput = {};
    const statusChanged = input.status !== undefined && input.status !== current.status;

    if (input.status !== undefined) {
      data.status = input.status;
      data.reviewedAt = new Date();

      if (input.status === EnrollmentStatus.COMPLETED) {
        data.completedAt = new Date();
        data.progress = 100;
      } else if (input.status === EnrollmentStatus.CANCELLED) {
        data.completedAt = null;
      }
    }

    if (input.progress !== undefined) {
      data.progress = input.progress;
    }

    if (input.adminNote !== undefined) {
      data.adminNote = this.optionalText(input.adminNote);
    }

    const enrollment = await this.prisma.trainingEnrollment.update({
      where: { id },
      data,
      include: adminTrainingEnrollmentInclude,
    });

    if (statusChanged) {
      await this.notifications.createForUser({
        userId: enrollment.userId,
        type: NotificationType.TRAINING,
        title: "Statut d'inscription mis à jour",
        message: `Votre inscription à “${enrollment.training.title}” est maintenant ${this.enrollmentStatusLabel(enrollment.status).toLowerCase()}.`,
        href: "/espace-membre/formations",
      }).catch(() => undefined);
    }

    return this.serializeTrainingEnrollment(enrollment);
  }

  async listEvents(authUser: AuthUser, query: ListAdminContentQueryDto) {
    await this.ensureAdmin(authUser);

    const q = this.optionalText(query.q);
    const type = this.parseEnum(EventType, query.type, "Type d'événement invalide.");
    const published = this.parseBoolean(query.published);
    const filters: Prisma.EventWhereInput[] = [];

    if (type) {
      filters.push({ OR: [{ type }, { types: { has: type } }] });
    }

    if (q) {
      filters.push({
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { location: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    const where: Prisma.EventWhereInput = {
      ...(typeof published === "boolean" ? { published } : {}),
      ...(filters.length ? { AND: filters } : {}),
    };
    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: adminEventInclude,
        orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      events: events.map((event) => this.serializeEvent(event)),
      total,
    };
  }

  async createEvent(authUser: AuthUser, input: CreateAdminEventDto) {
    const admin = await this.ensureAdmin(authUser);

    const title = this.requiredText(input.title, "Le titre de l'événement est requis.");
    const startsAt = this.parseRequiredDate(input.startsAt, "La date de début de l'événement est requise.");
    const endsAt = this.parseRequiredDate(input.endsAt, "La date de fin de l'événement est requise.");
    this.ensureDateOrder(startsAt, endsAt);
    const published = input.featuredOnLanding || input.showInFeed ? true : input.published ?? false;
    const types = this.normalizeEventTypes(input.types, input.type);

    try {
      const event = await this.prisma.$transaction(async (tx) => {
        if (input.featuredOnLanding) {
          await tx.event.updateMany({
            where: { featuredOnLanding: true },
            data: { featuredOnLanding: false },
          });
        }

        return tx.event.create({
          data: {
            title,
            slug: await this.buildUniqueEventSlug(title),
            description: this.requiredText(input.description, "La description de l'événement est requise."),
            type: types[0],
            types,
            startsAt,
            endsAt,
            location: this.requiredText(input.location, "Le lieu de l'événement est requis."),
            coverImageUrl: this.optionalText(input.coverImageUrl),
            whatsappUrl: this.optionalText(input.whatsappUrl),
            facebookEventUrl: this.optionalText(input.facebookEventUrl),
            published,
            featuredOnLanding: input.featuredOnLanding ?? false,
            showInFeed: input.showInFeed ?? false,
          },
          include: adminEventInclude,
        });
      });

      await this.syncEventPublication(admin, event);

      return this.serializeEvent(event);
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        throw new BadRequestException("Un événement avec ce titre existe déjà.");
      }

      throw error;
    }
  }

  async updateEvent(authUser: AuthUser, id: string, input: UpdateAdminEventDto) {
    const admin = await this.ensureAdmin(authUser);

    if (!Object.keys(input).length) {
      throw new BadRequestException("Aucune information à mettre à jour.");
    }

    const current = await this.prisma.event.findUnique({ where: { id } });

    if (!current) {
      throw new NotFoundException("Cet événement est introuvable.");
    }

    const startsAt = input.startsAt !== undefined ? this.parseRequiredDate(input.startsAt, "La date de début de l'événement est requise.") : current.startsAt;
    const endsAt = input.endsAt !== undefined ? this.parseRequiredDate(input.endsAt, "La date de fin de l'événement est requise.") : current.endsAt;
    this.ensureDateOrder(startsAt, endsAt);

    const data: Prisma.EventUpdateInput = {};

    if (input.title !== undefined) {
      data.title = this.requiredText(input.title, "Le titre de l'événement est requis.");
    }

    if (input.description !== undefined) {
      data.description = this.requiredText(input.description, "La description de l'événement est requise.");
    }

    if (input.type !== undefined) {
      data.type = input.type;

      if (input.types === undefined) {
        data.types = [input.type];
      }
    }

    if (input.types !== undefined) {
      const types = this.normalizeEventTypes(input.types, input.type ?? current.type);
      data.type = types[0];
      data.types = types;
    }

    if (input.startsAt !== undefined) {
      data.startsAt = startsAt;
    }

    if (input.endsAt !== undefined) {
      data.endsAt = endsAt;
    }

    if (input.location !== undefined) {
      data.location = this.requiredText(input.location, "Le lieu de l'événement est requis.");
    }

    if (input.coverImageUrl !== undefined) {
      data.coverImageUrl = this.optionalText(input.coverImageUrl);
    }

    if (input.whatsappUrl !== undefined) {
      data.whatsappUrl = this.optionalText(input.whatsappUrl);
    }

    if (input.facebookEventUrl !== undefined) {
      data.facebookEventUrl = this.optionalText(input.facebookEventUrl);
    }

    if (input.published !== undefined) {
      data.published = input.published;
    }

    if (input.featuredOnLanding !== undefined) {
      data.featuredOnLanding = input.featuredOnLanding;

      if (input.featuredOnLanding) {
        data.published = true;
      }
    }

    if (input.showInFeed !== undefined) {
      data.showInFeed = input.showInFeed;

      if (input.showInFeed) {
        data.published = true;
      }
    }

    if (data.published === false) {
      data.showInFeed = false;
    }

    const event = await this.prisma.$transaction(async (tx) => {
      if (input.featuredOnLanding) {
        await tx.event.updateMany({
          where: { featuredOnLanding: true, id: { not: id } },
          data: { featuredOnLanding: false },
        });
      }

      return tx.event.update({
        where: { id },
        data,
        include: adminEventInclude,
      });
    });

    await this.syncEventPublication(admin, event);

    return this.serializeEvent(event);
  }

  async deleteEvent(authUser: AuthUser, id: string) {
    await this.ensureAdmin(authUser);

    const event = await this.prisma.event.findUnique({
      where: { id },
      select: { publicationId: true },
    });

    if (!event) {
      throw new NotFoundException("Cet événement est introuvable.");
    }

    await this.prisma.$transaction([
      this.prisma.event.delete({ where: { id } }),
      ...(event.publicationId ? [this.prisma.publication.deleteMany({ where: { id: event.publicationId } })] : []),
    ]).catch((error) => {
      if (this.isNotFound(error)) {
        throw new NotFoundException("Cet événement est introuvable.");
      }

      throw error;
    });

    return { success: true };
  }

  async listResources(authUser: AuthUser, query: ListAdminResourceQueryDto) {
    await this.ensureAdmin(authUser);

    const q = this.optionalText(query.q);
    const type = this.parseEnum(ResourceType, query.type, "Type de ressource invalide.");
    const accessLevel = this.parseEnum(ResourceAccessLevel, query.accessLevel, "Niveau d'accès invalide.");
    const published = this.parseBoolean(query.published);
    const where: Prisma.ResourceWhereInput = {
      ...(type ? { type } : {}),
      ...(accessLevel ? { accessLevel } : {}),
      ...(typeof published === "boolean" ? { published } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { url: { contains: q, mode: "insensitive" } },
              { training: { title: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };
    const [resources, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        include: adminResourceInclude,
        orderBy: [{ createdAt: "desc" }, { title: "asc" }],
      }),
      this.prisma.resource.count({ where }),
    ]);

    return {
      resources: resources.map((resource) => this.serializeResource(resource)),
      total,
      stats: this.buildResourceStats(resources, total),
    };
  }

  async createResource(authUser: AuthUser, input: CreateAdminResourceDto) {
    const admin = await this.ensureAdmin(authUser);
    const title = this.requiredText(input.title, "Le titre de la ressource est requis.");
    const url = this.requiredText(input.url, "Le fichier ou lien de la ressource est requis.");

    const resource = await this.prisma.resource.create({
      data: {
        title,
        description: this.optionalText(input.description),
        type: input.type,
        url,
        accessLevel: input.accessLevel ?? ResourceAccessLevel.MEMBERS,
        published: input.showInFeed ? true : input.published ?? false,
        showInFeed: input.showInFeed ?? false,
        trainingId: this.optionalText(input.trainingId),
        uploadedById: admin.id,
      },
      include: adminResourceInclude,
    });

    await this.syncResourcePublication(admin, resource);

    return this.serializeResource(resource);
  }

  async updateResource(authUser: AuthUser, id: string, input: UpdateAdminResourceDto) {
    const admin = await this.ensureAdmin(authUser);

    if (!Object.keys(input).length) {
      throw new BadRequestException("Aucune information à mettre à jour.");
    }

    const data: Prisma.ResourceUpdateInput = {};

    if (input.title !== undefined) {
      data.title = this.requiredText(input.title, "Le titre de la ressource est requis.");
    }

    if (input.description !== undefined) {
      data.description = this.optionalText(input.description);
    }

    if (input.type !== undefined) {
      data.type = input.type;
    }

    if (input.url !== undefined) {
      data.url = this.requiredText(input.url, "Le fichier ou lien de la ressource est requis.");
    }

    if (input.accessLevel !== undefined) {
      data.accessLevel = input.accessLevel;
    }

    if (input.published !== undefined) {
      data.published = input.published;
    }

    if (input.showInFeed !== undefined) {
      data.showInFeed = input.showInFeed;

      if (input.showInFeed) {
        data.published = true;
      }
    }

    if (data.published === false) {
      data.showInFeed = false;
    }

    if (input.trainingId !== undefined) {
      const trainingId = this.optionalText(input.trainingId);
      data.training = trainingId ? { connect: { id: trainingId } } : { disconnect: true };
    }

    const resource = await this.prisma.resource.update({
      where: { id },
      data,
      include: adminResourceInclude,
    }).catch((error) => {
      if (this.isNotFound(error)) {
        throw new NotFoundException("Cette ressource est introuvable.");
      }

      throw error;
    });

    await this.syncResourcePublication(admin, resource);

    return this.serializeResource(resource);
  }

  async deleteResource(authUser: AuthUser, id: string) {
    await this.ensureAdmin(authUser);

    const resource = await this.prisma.resource.findUnique({
      where: { id },
      select: { publicationId: true },
    });

    if (!resource) {
      throw new NotFoundException("Cette ressource est introuvable.");
    }

    await this.prisma.$transaction([
      this.prisma.resource.delete({ where: { id } }),
      ...(resource.publicationId ? [this.prisma.publication.deleteMany({ where: { id: resource.publicationId } })] : []),
    ]).catch((error) => {
      if (this.isNotFound(error)) {
        throw new NotFoundException("Cette ressource est introuvable.");
      }

      throw error;
    });

    return { success: true };
  }

  async listOpportunities(authUser: AuthUser, query: ListAdminOpportunityQueryDto) {
    await this.ensureAdmin(authUser);

    const q = this.optionalText(query.q);
    const type = this.parseEnum(OpportunityType, query.type, "Type d'opportunité invalide.");
    const status = this.parseEnum(OpportunityStatus, query.status, "Statut d'opportunité invalide.");
    const published = this.parseBoolean(query.published);
    const where: Prisma.OpportunityWhereInput = {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(typeof published === "boolean" ? { published } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { location: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [opportunities, total] = await Promise.all([
      this.prisma.opportunity.findMany({
        where,
        include: adminOpportunityInclude,
        orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
      }),
      this.prisma.opportunity.count({ where }),
    ]);

    return {
      opportunities: opportunities.map((opportunity) => this.serializeOpportunity(opportunity)),
      total,
    };
  }

  async createOpportunity(authUser: AuthUser, input: CreateAdminOpportunityDto) {
    const admin = await this.ensureAdmin(authUser);

    const title = this.requiredText(input.title, "Le titre de l'opportunité est requis.");
    const status = input.published || input.showInFeed ? OpportunityStatus.OPEN : input.status ?? OpportunityStatus.DRAFT;

    try {
      const opportunity = await this.prisma.opportunity.create({
        data: {
          title,
          slug: await this.buildUniqueOpportunitySlug(title),
          description: this.requiredText(input.description, "La description de l'opportunité est requise."),
          type: input.type,
          status,
          deadline: this.parseOptionalDate(input.deadline, "La date limite de l'opportunité est invalide."),
          location: this.optionalText(input.location),
          eligibilityUrl: this.optionalText(input.eligibilityUrl),
          coverImageUrl: this.optionalText(input.coverImageUrl),
          showInFeed: input.showInFeed ?? false,
          published: input.showInFeed ? true : input.published ?? status === OpportunityStatus.OPEN,
        },
        include: adminOpportunityInclude,
      });

      await this.syncOpportunityPublication(admin, opportunity);

      return this.serializeOpportunity(opportunity);
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        throw new BadRequestException("Une opportunité avec ce titre existe déjà.");
      }

      throw error;
    }
  }

  async updateOpportunity(authUser: AuthUser, id: string, input: UpdateAdminOpportunityDto) {
    const admin = await this.ensureAdmin(authUser);

    if (!Object.keys(input).length) {
      throw new BadRequestException("Aucune information à mettre à jour.");
    }

    const data: Prisma.OpportunityUpdateInput = {};

    if (input.title !== undefined) {
      data.title = this.requiredText(input.title, "Le titre de l'opportunité est requis.");
    }

    if (input.description !== undefined) {
      data.description = this.requiredText(input.description, "La description de l'opportunité est requise.");
    }

    if (input.type !== undefined) {
      data.type = input.type;
    }

    if (input.status !== undefined) {
      data.status = input.status;
    }

    if (input.deadline !== undefined) {
      data.deadline = this.parseOptionalDate(input.deadline, "La date limite de l'opportunité est invalide.");
    }

    if (input.location !== undefined) {
      data.location = this.optionalText(input.location);
    }

    if (input.eligibilityUrl !== undefined) {
      data.eligibilityUrl = this.optionalText(input.eligibilityUrl);
    }

    if (input.coverImageUrl !== undefined) {
      data.coverImageUrl = this.optionalText(input.coverImageUrl);
    }

    if (input.published !== undefined) {
      data.published = input.published;

      if (input.published) {
        data.status = OpportunityStatus.OPEN;
      }
    }

    if (input.showInFeed !== undefined) {
      data.showInFeed = input.showInFeed;

      if (input.showInFeed) {
        data.published = true;
        data.status = OpportunityStatus.OPEN;
      }
    }

    if (data.published === false || (data.status !== undefined && data.status !== OpportunityStatus.OPEN)) {
      data.showInFeed = false;
    }

    const opportunity = await this.prisma.opportunity.update({
      where: { id },
      data,
      include: adminOpportunityInclude,
    }).catch((error) => {
      if (this.isNotFound(error)) {
        throw new NotFoundException("Cette opportunité est introuvable.");
      }

      if (this.isUniqueConflict(error)) {
        throw new BadRequestException("Une opportunité avec ce titre existe déjà.");
      }

      throw error;
    });

    await this.syncOpportunityPublication(admin, opportunity);

    return this.serializeOpportunity(opportunity);
  }

  async deleteOpportunity(authUser: AuthUser, id: string) {
    await this.ensureAdmin(authUser);

    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id },
      select: { publicationId: true },
    });

    if (!opportunity) {
      throw new NotFoundException("Cette opportunité est introuvable.");
    }

    await this.prisma.$transaction([
      this.prisma.opportunity.delete({ where: { id } }),
      ...(opportunity.publicationId ? [this.prisma.publication.deleteMany({ where: { id: opportunity.publicationId } })] : []),
    ]).catch((error) => {
      if (this.isNotFound(error)) {
        throw new NotFoundException("Cette opportunité est introuvable.");
      }

      throw error;
    });

    return { success: true };
  }

  async listOpportunityApplications(authUser: AuthUser, query: ListOpportunityApplicationsQueryDto) {
    await this.ensureAdmin(authUser);

    const page = this.resolvePage(query.page);
    const limit = this.resolveNumericLimit(query.limit, 20);
    const where = this.buildOpportunityApplicationWhere(query);

    const [applications, total] = await Promise.all([
      this.prisma.opportunityApplication.findMany({
        where,
        include: adminOpportunityApplicationInclude,
        orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.opportunityApplication.count({ where }),
    ]);

    return {
      applications: applications.map((application) => this.serializeOpportunityApplication(application)),
      total,
      page,
      limit,
    };
  }

  async exportOpportunityApplicationsCsv(authUser: AuthUser, query: ListOpportunityApplicationsQueryDto) {
    await this.ensureAdmin(authUser);

    const applications = await this.prisma.opportunityApplication.findMany({
      where: this.buildOpportunityApplicationWhere(query),
      include: adminOpportunityApplicationInclude,
      orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
      take: 1000,
    });

    return this.toCsv(
      ["Opportunité", "Membre", "Email", "Discipline", "Ville", "Téléphone", "Statut", "Soumis le", "Portfolio", "CV", "Dossier", "Liens", "Réseaux", "Note interne", "Motivation"],
      applications.map((application) => [
        application.opportunity.title,
        this.displayDossierName(application.user),
        application.user.email,
        application.discipline ?? application.user.profile?.discipline ?? "",
        application.city ?? application.user.profile?.city ?? application.user.organizationProfile?.city ?? application.user.partnerProfile?.city ?? "",
        application.phone ?? application.user.phone ?? "",
        this.applicationStatusLabel(application.status),
        application.submittedAt ? this.formatCsvDate(application.submittedAt) : "",
        application.portfolioUrl ?? "",
        application.cvUrl ?? "",
        application.fileUrl ?? "",
        this.serializeJsonStringList(application.links).join(" | "),
        this.serializeJsonStringList(application.socialLinks).join(" | "),
        application.adminNote ?? "",
        application.motivation ?? "",
      ]),
    );
  }

  async updateOpportunityApplication(authUser: AuthUser, id: string, input: UpdateOpportunityApplicationDto) {
    await this.ensureAdmin(authUser);

    if (!Object.keys(input).length) {
      throw new BadRequestException("Aucune information à mettre à jour.");
    }

    const current = await this.prisma.opportunityApplication.findUnique({
      where: { id },
      include: adminOpportunityApplicationInclude,
    });

    if (!current) {
      throw new NotFoundException("Cette candidature est introuvable.");
    }

    const data: Prisma.OpportunityApplicationUpdateInput = {};
    const statusChanged = input.status !== undefined && input.status !== current.status;

    if (input.status !== undefined) {
      data.status = input.status;
      data.reviewedAt = new Date();
    }

    if (input.adminNote !== undefined) {
      data.adminNote = this.optionalText(input.adminNote);
    }

    const application = await this.prisma.opportunityApplication.update({
      where: { id },
      data,
      include: adminOpportunityApplicationInclude,
    });

    if (statusChanged) {
      await this.notifications.createForUser({
        userId: application.userId,
        type: NotificationType.OPPORTUNITY,
        title: "Statut de candidature mis à jour",
        message: `Votre dossier pour “${application.opportunity.title}” est maintenant ${this.applicationStatusLabel(application.status).toLowerCase()}.`,
        href: "/espace-membre/opportunites",
      }).catch(() => undefined);
    }

    return this.serializeOpportunityApplication(application);
  }

  async listGalleryAlbums(authUser: AuthUser, query: ListGalleryAlbumQueryDto) {
    await this.ensureAdmin(authUser);

    const q = this.optionalText(query.q);
    const category = this.parseEnum(GalleryAlbumCategory, query.category, "Catégorie de galerie invalide.");
    const published = this.parseBoolean(query.published);
    const where: Prisma.GalleryAlbumWhereInput = {
      ...(category ? { category } : {}),
      ...(typeof published === "boolean" ? { published } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { photos: { some: { caption: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    };
    const [albums, total] = await Promise.all([
      this.prisma.galleryAlbum.findMany({
        where,
        include: adminGalleryAlbumInclude,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
      this.prisma.galleryAlbum.count({ where }),
    ]);

    return {
      albums: albums.map((album) => this.serializeGalleryAlbum(album)),
      total,
    };
  }

  async createGalleryAlbum(authUser: AuthUser, input: CreateGalleryAlbumDto) {
    const admin = await this.ensureAdmin(authUser);
    const title = this.requiredText(input.title, "Le titre de l'album est requis.");
    const coverImageUrl = this.optionalText(input.coverImageUrl);
    const photos = this.normalizeGalleryPhotos(input.photos, coverImageUrl);

    try {
      const album = await this.prisma.galleryAlbum.create({
        data: {
          title,
          slug: await this.buildUniqueGalleryAlbumSlug(title),
          description: this.optionalText(input.description),
          category: input.category ?? GalleryAlbumCategory.EVENT,
          coverImageUrl: coverImageUrl ?? photos[0]?.imageUrl ?? null,
          published: input.published ?? false,
          featuredOnLanding: input.featuredOnLanding ?? false,
          sortOrder: input.sortOrder ?? 0,
          createdById: admin.id,
          photos: photos.length ? { create: photos } : undefined,
        },
        include: adminGalleryAlbumInclude,
      });

      return this.serializeGalleryAlbum(album);
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        throw new BadRequestException("Un album avec ce titre existe déjà.");
      }

      throw error;
    }
  }

  async updateGalleryAlbum(authUser: AuthUser, id: string, input: UpdateGalleryAlbumDto) {
    await this.ensureAdmin(authUser);

    if (!Object.keys(input).length) {
      throw new BadRequestException("Aucune information à mettre à jour.");
    }

    const data: Prisma.GalleryAlbumUpdateInput = {};

    if (input.title !== undefined) {
      data.title = this.requiredText(input.title, "Le titre de l'album est requis.");
    }

    if (input.description !== undefined) {
      data.description = this.optionalText(input.description);
    }

    if (input.category !== undefined) {
      data.category = input.category;
    }

    if (input.coverImageUrl !== undefined) {
      data.coverImageUrl = this.optionalText(input.coverImageUrl);
    }

    if (input.published !== undefined) {
      data.published = input.published;
    }

    if (input.featuredOnLanding !== undefined) {
      data.featuredOnLanding = input.featuredOnLanding;

      if (input.featuredOnLanding) {
        data.published = true;
      }
    }

    if (input.sortOrder !== undefined) {
      data.sortOrder = input.sortOrder;
    }

    if (input.photos !== undefined) {
      const photos = this.normalizeGalleryPhotos(input.photos, this.optionalText(input.coverImageUrl));
      data.photos = {
        deleteMany: {},
        ...(photos.length ? { create: photos } : {}),
      };

      if (input.coverImageUrl === undefined) {
        data.coverImageUrl = photos[0]?.imageUrl ?? null;
      }
    }

    const album = await this.prisma.galleryAlbum.update({
      where: { id },
      data,
      include: adminGalleryAlbumInclude,
    }).catch((error) => {
      if (this.isNotFound(error)) {
        throw new NotFoundException("Cet album est introuvable.");
      }

      if (this.isUniqueConflict(error)) {
        throw new BadRequestException("Un album avec ce titre existe déjà.");
      }

      throw error;
    });

    return this.serializeGalleryAlbum(album);
  }

  async deleteGalleryAlbum(authUser: AuthUser, id: string) {
    await this.ensureAdmin(authUser);

    await this.prisma.galleryAlbum.delete({ where: { id } }).catch((error) => {
      if (this.isNotFound(error)) {
        throw new NotFoundException("Cet album est introuvable.");
      }

      throw error;
    });

    return { success: true };
  }

  async createGalleryPhoto(authUser: AuthUser, albumId: string, input: CreateGalleryPhotoDto) {
    await this.ensureAdmin(authUser);

    const album = await this.prisma.galleryAlbum.findUnique({ where: { id: albumId } });

    if (!album) {
      throw new NotFoundException("Cet album est introuvable.");
    }

    const photo = await this.prisma.galleryPhoto.create({
      data: {
        ...this.normalizeGalleryPhotoCreate(input, 0),
        albumId,
      },
    });

    if (!album.coverImageUrl) {
      await this.prisma.galleryAlbum.update({
        where: { id: albumId },
        data: { coverImageUrl: photo.imageUrl },
      });
    }

    return photo;
  }

  async updateGalleryPhoto(authUser: AuthUser, id: string, input: UpdateGalleryPhotoDto) {
    await this.ensureAdmin(authUser);

    if (!Object.keys(input).length) {
      throw new BadRequestException("Aucune information à mettre à jour.");
    }

    const data: Prisma.GalleryPhotoUpdateInput = {};

    if (input.imageUrl !== undefined) {
      data.imageUrl = this.requiredText(input.imageUrl, "L'image est requise.");
    }

    if (input.title !== undefined) {
      data.title = this.optionalText(input.title);
    }

    if (input.caption !== undefined) {
      data.caption = this.optionalText(input.caption);
    }

    if (input.altText !== undefined) {
      data.altText = this.optionalText(input.altText);
    }

    if (input.sortOrder !== undefined) {
      data.sortOrder = input.sortOrder;
    }

    if (input.published !== undefined) {
      data.published = input.published;
    }

    return this.prisma.galleryPhoto.update({ where: { id }, data }).catch((error) => {
      if (this.isNotFound(error)) {
        throw new NotFoundException("Cette photo est introuvable.");
      }

      throw error;
    });
  }

  async deleteGalleryPhoto(authUser: AuthUser, id: string) {
    await this.ensureAdmin(authUser);

    await this.prisma.galleryPhoto.delete({ where: { id } }).catch((error) => {
      if (this.isNotFound(error)) {
        throw new NotFoundException("Cette photo est introuvable.");
      }

      throw error;
    });

    return { success: true };
  }

  async listDisciplines(authUser: AuthUser, query: ListAdminReferenceQueryDto) {
    await this.ensureAdmin(authUser);

    const q = this.optionalText(query.q);
    const isActive = this.parseBoolean(query.isActive);
    const where: Prisma.DisciplineWhereInput = {
      ...(typeof isActive === "boolean" ? { isActive } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    };
    const [disciplines, total] = await Promise.all([
      this.prisma.discipline.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      this.prisma.discipline.count({ where }),
    ]);

    return { disciplines, total };
  }

  async createDiscipline(authUser: AuthUser, input: CreateDisciplineDto) {
    await this.ensureAdmin(authUser);

    const name = this.requiredText(input.name, "Le nom de la discipline est requis.");
    const slug = input.slug?.trim() ? this.slugify(input.slug) : await this.buildUniqueDisciplineSlug(name);
    const sortOrder = input.sortOrder ?? await this.nextAvailableDisciplineNumber();

    await this.ensureUniqueDisciplineNumber(sortOrder);

    try {
      return await this.prisma.discipline.create({
        data: {
          name,
          slug,
          isActive: input.isActive ?? true,
          sortOrder,
        },
      });
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        throw new BadRequestException("Cette discipline existe déjà.");
      }

      throw error;
    }
  }

  async updateDiscipline(authUser: AuthUser, id: string, input: UpdateDisciplineDto) {
    await this.ensureAdmin(authUser);

    if (!Object.keys(input).length) {
      throw new BadRequestException("Aucune information à mettre à jour.");
    }

    const data: Prisma.DisciplineUpdateInput = {};

    if (input.name !== undefined) {
      data.name = this.requiredText(input.name, "Le nom de la discipline est requis.");
    }

    if (input.slug !== undefined) {
      data.slug = this.slugify(input.slug);
    }

    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
    }

    if (input.sortOrder !== undefined) {
      await this.ensureUniqueDisciplineNumber(input.sortOrder, id);
      data.sortOrder = input.sortOrder;
    }

    try {
      return await this.prisma.discipline.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (this.isNotFound(error)) {
        throw new NotFoundException("Cette discipline est introuvable.");
      }

      if (this.isUniqueConflict(error)) {
        throw new BadRequestException("Cette discipline existe déjà.");
      }

      throw error;
    }
  }

  async deleteDiscipline(authUser: AuthUser, id: string) {
    await this.ensureAdmin(authUser);

    await this.prisma.discipline.delete({ where: { id } }).catch((error) => {
      if (this.isNotFound(error)) {
        throw new NotFoundException("Cette discipline est introuvable.");
      }

      throw error;
    });

    return { success: true };
  }

  async listPartners(authUser: AuthUser, query: ListAdminReferenceQueryDto) {
    await this.ensureAdmin(authUser);

    const q = this.optionalText(query.q);
    const published = this.parseBoolean(query.published);
    const where: Prisma.PartnerWhereInput = {
      ...(typeof published === "boolean" ? { published } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { type: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [partners, total] = await Promise.all([
      this.prisma.partner.findMany({
        where,
        orderBy: [{ order: "asc" }, { name: "asc" }],
      }),
      this.prisma.partner.count({ where }),
    ]);

    return { partners, total };
  }

  async createPartner(authUser: AuthUser, input: CreatePartnerDto) {
    await this.ensureAdmin(authUser);

    const order = input.order ?? await this.nextAvailablePartnerNumber();

    await this.ensureUniquePartnerNumber(order);

    return this.prisma.partner.create({
      data: {
        name: this.requiredText(input.name, "Le nom du partenaire est requis."),
        type: this.optionalText(input.type),
        description: this.optionalText(input.description),
        logoUrl: this.optionalText(input.logoUrl),
        website: this.optionalText(input.website),
        order,
        published: input.published ?? true,
      },
    });
  }

  async updatePartner(authUser: AuthUser, id: string, input: UpdatePartnerDto) {
    await this.ensureAdmin(authUser);

    if (!Object.keys(input).length) {
      throw new BadRequestException("Aucune information à mettre à jour.");
    }

    const data: Prisma.PartnerUpdateInput = {};

    if (input.name !== undefined) {
      data.name = this.requiredText(input.name, "Le nom du partenaire est requis.");
    }

    if (input.type !== undefined) {
      data.type = this.optionalText(input.type);
    }

    if (input.description !== undefined) {
      data.description = this.optionalText(input.description);
    }

    if (input.logoUrl !== undefined) {
      data.logoUrl = this.optionalText(input.logoUrl);
    }

    if (input.website !== undefined) {
      data.website = this.optionalText(input.website);
    }

    if (input.order !== undefined) {
      await this.ensureUniquePartnerNumber(input.order, id);
      data.order = input.order;
    }

    if (input.published !== undefined) {
      data.published = input.published;
    }

    return this.prisma.partner.update({
      where: { id },
      data,
    }).catch((error) => {
      if (this.isNotFound(error)) {
        throw new NotFoundException("Ce partenaire est introuvable.");
      }

      throw error;
    });
  }

  async deletePartner(authUser: AuthUser, id: string) {
    await this.ensureAdmin(authUser);

    await this.prisma.partner.delete({ where: { id } }).catch((error) => {
      if (this.isNotFound(error)) {
        throw new NotFoundException("Ce partenaire est introuvable.");
      }

      throw error;
    });

    return { success: true };
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

  private serializeAccountEvolutionRequest(request: AdminAccountEvolutionRequest) {
    return {
      id: request.id,
      fromType: request.fromType,
      requestedType: request.requestedType,
      status: request.status,
      motivation: request.motivation,
      portfolioUrl: request.portfolioUrl,
      cvUrl: request.cvUrl,
      note: request.note,
      reviewedAt: request.reviewedAt,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      user: this.serializeMember(request.user),
      reviewedBy: request.reviewedBy ? this.serializeMember(request.reviewedBy) : null,
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

  private serializeDirectMessageReport(report: AdminDirectMessageReport) {
    return {
      id: report.id,
      reason: report.reason,
      message: report.message,
      status: report.status,
      reviewedAt: report.reviewedAt,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      reporter: this.serializeMember(report.reporter),
      directMessage: this.serializeDirectMessage(report.directMessage),
    };
  }

  private serializeDirectMessage(message: AdminDirectMessageReport["directMessage"]) {
    const deleted = !!message.deletedAt;

    return {
      id: message.id,
      conversationId: message.conversationId,
      content: deleted ? "Message supprimé par la modération CCA" : message.content,
      attachmentUrl: deleted ? null : message.attachmentUrl,
      attachmentName: deleted ? null : message.attachmentName,
      attachmentMimeType: deleted ? null : message.attachmentMimeType,
      editedAt: message.editedAt,
      deletedAt: message.deletedAt,
      createdAt: message.createdAt,
      author: this.serializeMember(message.author),
      permissions: {
        canEdit: false,
        canDelete: !deleted,
      },
    };
  }

  private serializeGroupMessageReport(report: AdminGroupMessageReport) {
    return {
      id: report.id,
      reason: report.reason,
      message: report.message,
      status: report.status,
      reviewedAt: report.reviewedAt,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      reporter: this.serializeMember(report.reporter),
      groupMessage: this.serializeGroupMessage(report.groupMessage),
    };
  }

  private serializeGroupMessage(message: AdminGroupMessageReport["groupMessage"]) {
    const deleted = !!message.deletedAt;

    return {
      id: message.id,
      groupId: message.groupId,
      groupName: message.group.name,
      content: deleted ? "Message supprimé par la modération CCA" : message.content,
      attachmentUrl: deleted ? null : message.attachmentUrl,
      attachmentName: deleted ? null : message.attachmentName,
      attachmentMimeType: deleted ? null : message.attachmentMimeType,
      editedAt: message.editedAt,
      deletedAt: message.deletedAt,
      createdAt: message.createdAt,
      author: this.serializeMember(message.author),
      permissions: {
        canEdit: false,
        canDelete: !deleted,
      },
    };
  }

  private serializeAuditLog(log: AdminAuditLog) {
    return {
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      message: log.message,
      metadata: log.metadata,
      createdAt: log.createdAt,
      admin: log.admin ? this.serializeMember(log.admin) : null,
      targetUser: log.targetUser ? this.serializeMember(log.targetUser) : null,
    };
  }

  private serializeTraining(training: AdminTraining) {
    return {
      id: training.id,
      title: training.title,
      slug: training.slug,
      description: training.description,
      startsAt: training.startsAt,
      endsAt: training.endsAt,
      location: training.location,
      coverImageUrl: training.coverImageUrl,
      capacity: training.capacity,
      priceCents: training.priceCents,
      currency: training.currency,
      status: training.status,
      certificateEnabled: training.certificateEnabled,
      featuredOnLanding: training.featuredOnLanding,
      showInFeed: training.showInFeed,
      createdAt: training.createdAt,
      updatedAt: training.updatedAt,
      counts: {
        modules: training._count.modules,
        enrollments: training._count.enrollments,
        resources: training._count.resources,
        certificates: training._count.certificates,
      },
    };
  }

  private serializeEvent(event: AdminEvent) {
    const types = event.types.length ? event.types : [event.type];

    return {
      id: event.id,
      title: event.title,
      slug: event.slug,
      description: event.description,
      type: event.type,
      types,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      location: event.location,
      coverImageUrl: event.coverImageUrl,
      whatsappUrl: event.whatsappUrl,
      facebookEventUrl: event.facebookEventUrl,
      published: event.published,
      featuredOnLanding: event.featuredOnLanding,
      showInFeed: event.showInFeed,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      counts: {
        registrations: event._count.registrations,
      },
    };
  }

  private normalizeEventTypes(types?: EventType[], fallback?: EventType) {
    const normalized = Array.from(new Set((types?.length ? types : [fallback]).filter((type): type is EventType => !!type)));

    return normalized.length ? normalized : [EventType.WORKSHOP];
  }

  private serializeResource(resource: AdminResource) {
    return {
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      url: resource.url,
      accessLevel: resource.accessLevel,
      published: resource.published,
      showInFeed: resource.showInFeed,
      training: resource.training,
      counts: {
        views: resource._count.views,
        downloads: resource._count.downloads,
        usefulMarks: resource._count.usefulMarks,
      },
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    };
  }

  private buildResourceStats(resources: AdminResource[], total: number) {
    const totals = resources.reduce(
      (accumulator, resource) => ({
        views: accumulator.views + resource._count.views,
        downloads: accumulator.downloads + resource._count.downloads,
        usefulMarks: accumulator.usefulMarks + resource._count.usefulMarks,
        published: accumulator.published + (resource.published ? 1 : 0),
      }),
      { views: 0, downloads: 0, usefulMarks: 0, published: 0 },
    );

    return {
      total,
      published: totals.published,
      views: totals.views,
      downloads: totals.downloads,
      usefulMarks: totals.usefulMarks,
      topViewed: [...resources]
        .sort((first, second) => second._count.views - first._count.views || first.title.localeCompare(second.title))
        .slice(0, 5)
        .map((resource) => ({
          id: resource.id,
          title: resource.title,
          type: resource.type,
          views: resource._count.views,
          downloads: resource._count.downloads,
          usefulMarks: resource._count.usefulMarks,
        })),
      topDownloaded: [...resources]
        .sort((first, second) => second._count.downloads - first._count.downloads || first.title.localeCompare(second.title))
        .slice(0, 5)
        .map((resource) => ({
          id: resource.id,
          title: resource.title,
          type: resource.type,
          views: resource._count.views,
          downloads: resource._count.downloads,
          usefulMarks: resource._count.usefulMarks,
        })),
    };
  }

  private serializeOpportunity(opportunity: AdminOpportunity) {
    return {
      id: opportunity.id,
      title: opportunity.title,
      slug: opportunity.slug,
      description: opportunity.description,
      type: opportunity.type,
      status: opportunity.status,
      deadline: opportunity.deadline,
      location: opportunity.location,
      eligibilityUrl: opportunity.eligibilityUrl,
      coverImageUrl: opportunity.coverImageUrl,
      showInFeed: opportunity.showInFeed,
      published: opportunity.published,
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
      counts: {
        applications: opportunity._count.applications,
      },
    };
  }

  private serializeTrainingEnrollment(enrollment: AdminTrainingEnrollment) {
    return {
      id: enrollment.id,
      status: enrollment.status,
      statusLabel: this.enrollmentStatusLabel(enrollment.status),
      progress: enrollment.progress,
      motivation: enrollment.motivation,
      phone: enrollment.phone,
      adminNote: enrollment.adminNote,
      enrolledAt: enrollment.enrolledAt,
      reviewedAt: enrollment.reviewedAt,
      completedAt: enrollment.completedAt,
      training: enrollment.training,
      member: this.serializeDossierUser(enrollment.user),
    };
  }

  private serializeOpportunityApplication(application: AdminOpportunityApplication) {
    return {
      id: application.id,
      status: application.status,
      statusLabel: this.applicationStatusLabel(application.status),
      motivation: application.motivation,
      discipline: application.discipline,
      city: application.city,
      phone: application.phone,
      portfolioUrl: application.portfolioUrl,
      cvUrl: application.cvUrl,
      fileUrl: application.fileUrl,
      links: this.serializeJsonStringList(application.links),
      socialLinks: this.serializeJsonStringList(application.socialLinks),
      submittedAt: application.submittedAt,
      reviewedAt: application.reviewedAt,
      adminNote: application.adminNote,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      opportunity: application.opportunity,
      member: this.serializeDossierUser(application.user),
    };
  }

  private serializeDossierUser(user: AdminDossierUser) {
    return {
      id: user.id,
      email: user.email,
      displayName: this.displayDossierName(user),
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.profile?.avatarUrl ?? user.organizationProfile?.logoUrl ?? user.partnerProfile?.logoUrl ?? null,
      type: user.type,
      phone: user.phone,
      discipline: user.profile?.discipline ?? user.profile?.otherDiscipline ?? user.organizationProfile?.sector ?? user.partnerProfile?.partnerType ?? null,
      country: user.profile?.country ?? user.organizationProfile?.country ?? user.partnerProfile?.country ?? null,
      city: user.profile?.city ?? user.organizationProfile?.city ?? user.partnerProfile?.city ?? null,
      portfolioUrl: user.profile?.portfolioUrl ?? null,
      cvUrl: user.profile?.cvUrl ?? null,
    };
  }

  private applicationStatusLabel(status: ApplicationStatus) {
    const labels: Record<ApplicationStatus, string> = {
      [ApplicationStatus.DRAFT]: "Brouillon",
      [ApplicationStatus.SUBMITTED]: "Soumis",
      [ApplicationStatus.UNDER_REVIEW]: "En étude",
      [ApplicationStatus.SELECTED]: "Présélectionné",
      [ApplicationStatus.ACCEPTED]: "Accepté",
      [ApplicationStatus.REJECTED]: "Refusé",
      [ApplicationStatus.WITHDRAWN]: "Retiré",
    };

    return labels[status];
  }

  private enrollmentStatusLabel(status: EnrollmentStatus) {
    const labels: Record<EnrollmentStatus, string> = {
      [EnrollmentStatus.ENROLLED]: "Inscrit",
      [EnrollmentStatus.IN_PROGRESS]: "En cours",
      [EnrollmentStatus.COMPLETED]: "Terminé",
      [EnrollmentStatus.CANCELLED]: "Annulé",
    };

    return labels[status];
  }

  private serializeGalleryAlbum(album: AdminGalleryAlbum) {
    return {
      id: album.id,
      title: album.title,
      slug: album.slug,
      description: album.description,
      category: album.category,
      coverImageUrl: album.coverImageUrl,
      published: album.published,
      featuredOnLanding: album.featuredOnLanding,
      sortOrder: album.sortOrder,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt,
      createdBy: album.createdBy ? this.serializeMember(album.createdBy) : null,
      photos: album.photos.map((photo) => ({
        id: photo.id,
        title: photo.title,
        caption: photo.caption,
        imageUrl: photo.imageUrl,
        altText: photo.altText,
        sortOrder: photo.sortOrder,
        published: photo.published,
        createdAt: photo.createdAt,
        updatedAt: photo.updatedAt,
      })),
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

  private displayDossierName(user: AdminDossierUser) {
    return (
      this.optionalText(user.organizationProfile?.name) ??
      this.optionalText(user.partnerProfile?.name) ??
      this.optionalText(user.profile?.publicName) ??
      `${user.firstName} ${user.lastName}`.trim()
    );
  }

  private buildTrainingEnrollmentWhere(query: ListTrainingEnrollmentsQueryDto) {
    const q = this.optionalText(query.q);
    const status = this.parseEnum(EnrollmentStatus, query.status, "Statut d'inscription invalide.");
    const trainingId = this.optionalText(query.trainingId);

    return {
      ...(status ? { status } : {}),
      ...(trainingId ? { trainingId } : {}),
      ...(q
        ? {
            OR: [
              { motivation: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { training: { title: { contains: q, mode: "insensitive" } } },
              { user: { firstName: { contains: q, mode: "insensitive" } } },
              { user: { lastName: { contains: q, mode: "insensitive" } } },
              { user: { email: { contains: q, mode: "insensitive" } } },
              { user: { profile: { publicName: { contains: q, mode: "insensitive" } } } },
              { user: { profile: { discipline: { contains: q, mode: "insensitive" } } } },
              { user: { profile: { city: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    } satisfies Prisma.TrainingEnrollmentWhereInput;
  }

  private buildOpportunityApplicationWhere(query: ListOpportunityApplicationsQueryDto) {
    const q = this.optionalText(query.q);
    const status = this.parseEnum(ApplicationStatus, query.status, "Statut de candidature invalide.");
    const opportunityId = this.optionalText(query.opportunityId);
    const discipline = this.optionalText(query.discipline);
    const city = this.optionalText(query.city);
    const andFilters: Prisma.OpportunityApplicationWhereInput[] = [];

    if (discipline) {
      andFilters.push({
        OR: [
          { discipline: { contains: discipline, mode: "insensitive" } },
          { user: { profile: { discipline: { contains: discipline, mode: "insensitive" } } } },
        ],
      });
    }

    if (city) {
      andFilters.push({
        OR: [
          { city: { contains: city, mode: "insensitive" } },
          { user: { profile: { city: { contains: city, mode: "insensitive" } } } },
          { user: { organizationProfile: { city: { contains: city, mode: "insensitive" } } } },
          { user: { partnerProfile: { city: { contains: city, mode: "insensitive" } } } },
        ],
      });
    }

    if (q) {
      andFilters.push({
        OR: [
          { motivation: { contains: q, mode: "insensitive" } },
          { discipline: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { opportunity: { title: { contains: q, mode: "insensitive" } } },
          { user: { firstName: { contains: q, mode: "insensitive" } } },
          { user: { lastName: { contains: q, mode: "insensitive" } } },
          { user: { email: { contains: q, mode: "insensitive" } } },
          { user: { profile: { publicName: { contains: q, mode: "insensitive" } } } },
        ],
      });
    }

    return {
      ...(status ? { status } : {}),
      ...(opportunityId ? { opportunityId } : {}),
      ...(andFilters.length ? { AND: andFilters } : {}),
    } satisfies Prisma.OpportunityApplicationWhereInput;
  }

  private toCsv(headers: string[], rows: string[][]) {
    const lines = [headers, ...rows].map((row) => row.map((cell) => this.escapeCsvCell(cell)).join(","));
    return `\uFEFF${lines.join("\n")}`;
  }

  private escapeCsvCell(value: string | number | null | undefined) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  private formatCsvDate(value: Date) {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(value);
  }

  private resolveLimit(value?: string) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return 40;
    }

    return Math.min(Math.max(Math.trunc(parsed), 1), 100);
  }

  private resolveNumericLimit(value: number | undefined, fallback = 40) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.min(Math.max(Math.trunc(parsed), 1), 100);
  }

  private resolvePage(value: number | undefined) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return 1;
    }

    return Math.max(Math.trunc(parsed), 1);
  }

  private optionalText(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed || null;
  }

  private serializeJsonStringList(value: unknown) {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && !!item.trim()) : [];
  }

  private validateAdminUpload(file?: Express.Multer.File): asserts file is Express.Multer.File {
    if (!file) {
      throw new BadRequestException("Choisissez un fichier à importer.");
    }

    const acceptedMimeTypes = [
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

    if (!acceptedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException("Importez une image, un PDF ou un document bureautique valide.");
    }

    if (file.size > 25 * 1024 * 1024) {
      throw new BadRequestException("Le fichier ne doit pas dépasser 25 Mo.");
    }
  }

  private adminUploadPurpose(value: string | undefined) {
    const normalized = value?.trim().toLowerCase();

    if (["training", "event", "gallery", "resource", "opportunity", "partner", "certificate"].includes(normalized ?? "")) {
      return normalized as "training" | "event" | "gallery" | "resource" | "opportunity" | "partner" | "certificate";
    }

    return "resource";
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

    return normalized || "fichier";
  }

  private requiredText(value: unknown, message: string) {
    if (typeof value !== "string" || !value.trim()) {
      throw new BadRequestException(message);
    }

    return value.trim();
  }

  private parseBoolean(value?: string) {
    if (value === undefined || value === "") {
      return null;
    }

    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }

    throw new BadRequestException("Le filtre booléen est invalide.");
  }

  private slugify(value: string) {
    const slug = value
      .trim()
      .toLocaleLowerCase("fr")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " et ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!slug) {
      throw new BadRequestException("Le slug est invalide.");
    }

    return slug;
  }

  private async buildUniqueDisciplineSlug(name: string) {
    const baseSlug = this.slugify(name);
    const existingDisciplines = await this.prisma.discipline.findMany({
      where: { slug: { startsWith: baseSlug } },
      select: { slug: true },
    });
    const existingSlugs = new Set(existingDisciplines.map((discipline) => discipline.slug));

    if (!existingSlugs.has(baseSlug)) {
      return baseSlug;
    }

    let suffix = 2;
    let candidate = `${baseSlug}-${suffix}`;

    while (existingSlugs.has(candidate)) {
      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }

    return candidate;
  }

  private async buildUniqueTrainingSlug(title: string) {
    const baseSlug = this.slugify(title);
    const existingTrainings = await this.prisma.training.findMany({
      where: { slug: { startsWith: baseSlug } },
      select: { slug: true },
    });
    const existingSlugs = new Set(existingTrainings.map((training) => training.slug));

    return this.resolveUniqueSlug(baseSlug, existingSlugs);
  }

  private async buildUniqueEventSlug(title: string) {
    const baseSlug = this.slugify(title);
    const existingEvents = await this.prisma.event.findMany({
      where: { slug: { startsWith: baseSlug } },
      select: { slug: true },
    });
    const existingSlugs = new Set(existingEvents.map((event) => event.slug));

    return this.resolveUniqueSlug(baseSlug, existingSlugs);
  }

  private async buildUniqueOpportunitySlug(title: string) {
    const baseSlug = this.slugify(title);
    const existingOpportunities = await this.prisma.opportunity.findMany({
      where: { slug: { startsWith: baseSlug } },
      select: { slug: true },
    });
    const existingSlugs = new Set(existingOpportunities.map((opportunity) => opportunity.slug));

    return this.resolveUniqueSlug(baseSlug, existingSlugs);
  }

  private async syncTrainingPublication(admin: AdminUser, training: AdminTraining) {
    const shouldPublish = training.showInFeed && training.status === TrainingStatus.PUBLISHED;

    if (!shouldPublish) {
      await this.archiveOfficialPublication(training.publicationId);
      return;
    }

    const publicationData = {
      type: PublicationType.TRAINING,
      status: PublicationStatus.PUBLISHED,
      audience: PublicationAudience.PUBLIC,
      title: training.title,
      content: training.description,
      excerpt: this.buildExcerpt(training.description),
      category: "Formation officielle CCA",
      discipline: null,
      country: null,
      city: training.location,
      tags: ["formation", "cca"],
      routingDestinations: ["trainings", "network"],
      linkUrl: null,
      coverImageUrl: training.coverImageUrl,
      opportunityDeadline: training.startsAt,
      opportunityLocation: training.location,
      budgetRange: training.priceCents && training.priceCents > 0 ? `${training.priceCents} ${training.currency}` : null,
      contactEmail: null,
      expiresAt: training.endsAt,
    };

    const publicationId = await this.upsertOfficialPublication(admin, training.publicationId, publicationData, training.createdAt, training.updatedAt);

    if (publicationId !== training.publicationId) {
      await this.prisma.training.update({
        where: { id: training.id },
        data: { publicationId },
        select: { id: true },
      });
    }
  }

  private async syncEventPublication(admin: AdminUser, event: AdminEvent) {
    const shouldPublish = event.showInFeed && event.published;

    if (!shouldPublish) {
      await this.archiveOfficialPublication(event.publicationId);
      return;
    }

    const eventTypes = event.types.length ? event.types : [event.type];
    const publicationData = {
      type: PublicationType.EVENT,
      status: PublicationStatus.PUBLISHED,
      audience: PublicationAudience.PUBLIC,
      title: event.title,
      content: event.description,
      excerpt: this.buildExcerpt(event.description),
      category: eventTypes.map((type) => this.eventTypeLabel(type)).join(", "),
      discipline: null,
      country: null,
      city: event.location,
      tags: ["événement", "cca", ...eventTypes.map((type) => this.eventTypeLabel(type).toLowerCase())],
      routingDestinations: ["agenda", "network"],
      linkUrl: event.facebookEventUrl ?? event.whatsappUrl,
      coverImageUrl: event.coverImageUrl,
      opportunityDeadline: event.startsAt,
      opportunityLocation: event.location,
      budgetRange: null,
      contactEmail: null,
      expiresAt: event.endsAt,
    };

    const publicationId = await this.upsertOfficialPublication(admin, event.publicationId, publicationData, event.createdAt, event.updatedAt);

    if (publicationId !== event.publicationId) {
      await this.prisma.event.update({
        where: { id: event.id },
        data: { publicationId },
        select: { id: true },
      });
    }
  }

  private async syncResourcePublication(admin: AdminUser, resource: AdminResource) {
    const shouldPublish = resource.showInFeed && resource.published;

    if (!shouldPublish) {
      await this.archiveOfficialPublication(resource.publicationId);
      return;
    }

    const resourceTypeLabel = this.resourceTypeLabel(resource.type);
    const publicationData = {
      type: PublicationType.RESOURCE,
      status: PublicationStatus.PUBLISHED,
      audience: resource.accessLevel === ResourceAccessLevel.PUBLIC ? PublicationAudience.PUBLIC : PublicationAudience.MEMBERS,
      title: resource.title,
      content: resource.description ?? `Nouvelle ressource CCA disponible : ${resource.title}.`,
      excerpt: this.buildExcerpt(resource.description ?? `Nouvelle ressource CCA disponible : ${resource.title}.`),
      category: resourceTypeLabel,
      discipline: null,
      country: null,
      city: null,
      tags: ["ressource", "cca", resourceTypeLabel.toLowerCase()],
      routingDestinations: ["resources", "network"],
      linkUrl: resource.url,
      coverImageUrl: null,
      opportunityDeadline: null,
      opportunityLocation: null,
      budgetRange: null,
      contactEmail: null,
      expiresAt: null,
    };

    const publicationId = await this.upsertOfficialPublication(admin, resource.publicationId, publicationData, resource.createdAt, resource.updatedAt);

    if (publicationId !== resource.publicationId) {
      await this.prisma.resource.update({
        where: { id: resource.id },
        data: { publicationId },
        select: { id: true },
      });
    }
  }

  private async syncOpportunityPublication(admin: AdminUser, opportunity: AdminOpportunity) {
    const shouldPublish = opportunity.showInFeed && opportunity.published && opportunity.status === OpportunityStatus.OPEN;

    if (!shouldPublish) {
      await this.archiveOfficialPublication(opportunity.publicationId);
      return;
    }

    const publicationData = {
      type: PublicationType.OPPORTUNITY,
      status: PublicationStatus.PUBLISHED,
      audience: PublicationAudience.PUBLIC,
      title: opportunity.title,
      content: opportunity.description,
      excerpt: this.buildExcerpt(opportunity.description),
      category: this.opportunityTypeLabel(opportunity.type),
      discipline: null,
      country: null,
      city: opportunity.location,
      tags: ["opportunité", "cca", this.opportunityTypeLabel(opportunity.type).toLowerCase()],
      routingDestinations: ["opportunities", "network"],
      linkUrl: opportunity.eligibilityUrl,
      coverImageUrl: opportunity.coverImageUrl,
      opportunityDeadline: opportunity.deadline,
      opportunityLocation: opportunity.location,
      budgetRange: null,
      contactEmail: null,
      expiresAt: opportunity.deadline,
    };

    const publicationId = await this.upsertOfficialPublication(admin, opportunity.publicationId, publicationData, opportunity.createdAt, opportunity.updatedAt);

    if (publicationId !== opportunity.publicationId) {
      await this.prisma.opportunity.update({
        where: { id: opportunity.id },
        data: { publicationId },
        select: { id: true },
      });
    }
  }

  private async archiveOfficialPublication(publicationId?: string | null) {
    if (!publicationId) {
      return;
    }

    await this.prisma.publication.updateMany({
      where: { id: publicationId },
      data: { status: PublicationStatus.ARCHIVED },
    });
  }

  private async upsertOfficialPublication(
    admin: AdminUser,
    publicationId: string | null | undefined,
    data: OfficialPublicationData,
    createdAt: Date,
    updatedAt: Date,
  ) {
    if (publicationId) {
      const updateResult = await this.prisma.publication.updateMany({
        where: { id: publicationId },
        data,
      });

      if (updateResult.count > 0) {
        return publicationId;
      }
    }

    const publication = await this.prisma.publication.create({
      data: {
        ...data,
        authorId: admin.id,
        publishedAt: new Date(),
        createdAt,
        updatedAt,
      },
      select: { id: true },
    });

    return publication.id;
  }

  private eventTypeLabel(type: EventType) {
    const labels: Record<EventType, string> = {
      [EventType.WORKSHOP]: "Workshop",
      [EventType.MASTERCLASS]: "Masterclass",
      [EventType.CONFERENCE]: "Conférence",
      [EventType.PANEL]: "Panel",
      [EventType.NETWORKING]: "Networking",
      [EventType.ACTIVATION]: "Activation",
      [EventType.VISIT]: "Visite",
      [EventType.FESTIVAL]: "Festival",
    };

    return labels[type];
  }

  private resourceTypeLabel(type: ResourceType) {
    const labels: Record<ResourceType, string> = {
      [ResourceType.PDF]: "PDF",
      [ResourceType.TEMPLATE]: "Modèle",
      [ResourceType.CONTRACT]: "Contrat",
      [ResourceType.GUIDE]: "Guide",
      [ResourceType.VIDEO]: "Vidéo",
      [ResourceType.PODCAST]: "Podcast",
    };

    return labels[type];
  }

  private opportunityTypeLabel(type: OpportunityType) {
    const labels: Record<OpportunityType, string> = {
      [OpportunityType.CONTEST]: "Concours",
      [OpportunityType.RESIDENCY]: "Résidence",
      [OpportunityType.MISSION]: "Mission",
      [OpportunityType.FUNDING]: "Financement",
      [OpportunityType.CASTING]: "Casting",
      [OpportunityType.FESTIVAL]: "Festival",
      [OpportunityType.TRAINING]: "Formation",
    };

    return labels[type];
  }

  private buildExcerpt(content: string) {
    const normalized = content.trim().replace(/\s+/g, " ");

    if (normalized.length <= 180) {
      return normalized;
    }

    return `${normalized.slice(0, 177)}...`;
  }

  private async buildUniqueGalleryAlbumSlug(title: string) {
    const baseSlug = this.slugify(title);
    const existingAlbums = await this.prisma.galleryAlbum.findMany({
      where: { slug: { startsWith: baseSlug } },
      select: { slug: true },
    });
    const existingSlugs = new Set(existingAlbums.map((album) => album.slug));

    return this.resolveUniqueSlug(baseSlug, existingSlugs);
  }

  private normalizeGalleryPhotoCreate(input: CreateGalleryPhotoDto, index: number) {
    return {
      imageUrl: this.requiredText(input.imageUrl, "L'image est requise."),
      title: this.optionalText(input.title),
      caption: this.optionalText(input.caption),
      altText: this.optionalText(input.altText),
      sortOrder: input.sortOrder ?? index + 1,
      published: input.published ?? true,
    };
  }

  private normalizeGalleryPhotos(inputs: CreateGalleryPhotoDto[] | undefined, coverImageUrl?: string | null) {
    const photos = inputs?.map((photo, index) => this.normalizeGalleryPhotoCreate(photo, index)) ?? [];
    const seenUrls = new Set(photos.map((photo) => photo.imageUrl));

    if (coverImageUrl && !seenUrls.has(coverImageUrl)) {
      photos.unshift({
        imageUrl: coverImageUrl,
        title: null,
        caption: null,
        altText: null,
        sortOrder: 1,
        published: true,
      });
    }

    return photos.map((photo, index) => ({ ...photo, sortOrder: index + 1 }));
  }

  private resolveUniqueSlug(baseSlug: string, existingSlugs: Set<string>) {
    if (!existingSlugs.has(baseSlug)) {
      return baseSlug;
    }

    let suffix = 2;
    let candidate = `${baseSlug}-${suffix}`;

    while (existingSlugs.has(candidate)) {
      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }

    return candidate;
  }

  private parseRequiredDate(value: string | undefined, message: string) {
    if (!value) {
      throw new BadRequestException(message);
    }

    return this.parseDate(value, message);
  }

  private parseOptionalDate(value: string | undefined, message: string) {
    if (value === undefined || value === "") {
      return null;
    }

    return this.parseDate(value, message);
  }

  private parseDate(value: string, message: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(message);
    }

    return date;
  }

  private moderationDateRange(from?: string, to?: string): Prisma.DateTimeFilter | null {
    const filter: Prisma.DateTimeFilter = {};

    if (from) {
      filter.gte = this.parseDate(from, "La date de début est invalide.");
    }

    if (to) {
      const endDate = this.parseDate(to, "La date de fin est invalide.");
      endDate.setHours(23, 59, 59, 999);
      filter.lte = endDate;
    }

    return Object.keys(filter).length ? filter : null;
  }

  private ensureDateOrder(startsAt: Date | null, endsAt: Date | null) {
    if (startsAt && endsAt && endsAt < startsAt) {
      throw new BadRequestException("La date de fin doit être après la date de début.");
    }
  }

  private async ensureUniqueDisciplineNumber(sortOrder: number, currentId?: string) {
    const existing = await this.prisma.discipline.findFirst({
      where: {
        sortOrder,
        ...(currentId ? { id: { not: currentId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException("Ce numéro est déjà utilisé. Choisissez un autre numéro.");
    }
  }

  private async ensureUniquePartnerNumber(order: number, currentId?: string) {
    const existing = await this.prisma.partner.findFirst({
      where: {
        order,
        ...(currentId ? { id: { not: currentId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException("Ce numéro est déjà utilisé. Choisissez un autre numéro.");
    }
  }

  private async nextAvailableDisciplineNumber() {
    const disciplines = await this.prisma.discipline.findMany({
      select: { sortOrder: true },
      orderBy: { sortOrder: "asc" },
    });

    return this.nextAvailableNumber(disciplines.map((discipline) => discipline.sortOrder));
  }

  private async nextAvailablePartnerNumber() {
    const partners = await this.prisma.partner.findMany({
      select: { order: true },
      orderBy: { order: "asc" },
    });

    return this.nextAvailableNumber(partners.map((partner) => partner.order));
  }

  private nextAvailableNumber(numbers: number[]) {
    const usedNumbers = new Set(numbers.filter((number) => number > 0));
    let candidate = 1;

    while (usedNumbers.has(candidate)) {
      candidate += 1;
    }

    return candidate;
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

  private isUniqueConflict(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
  }
}
