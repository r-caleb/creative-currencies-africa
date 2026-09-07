import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AccountEvolutionRequestStatus, AccountStatus, AccountType, ApplicationStatus, CertificateStatus, EnrollmentStatus, EventRegistrationStatus, EventType, NetworkConnectionKind, NetworkConnectionStatus, NotificationType, OpportunityStatus, OpportunityType, Prisma, ProfileVisibility, PublicationAudience, PublicationStatus, PublicationType, ResourceAccessLevel, TrainingStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "../auth/auth.types";
import { NotificationService } from "../notification/notification.service";
import { ApplyOpportunityDto } from "./dto/apply-opportunity.dto";
import { CreatePortfolioItemDto } from "./dto/create-portfolio-item.dto";
import { EnrollTrainingDto } from "./dto/enroll-training.dto";
import { MemberSearchQueryDto } from "./dto/member-search-query.dto";
import { RequestAccountEvolutionDto } from "./dto/request-account-evolution.dto";
import { UpdateMemberProfileDto } from "./dto/update-member-profile.dto";
import { UpdatePortfolioItemDto } from "./dto/update-portfolio-item.dto";

type ProfileUploadKind = "AVATAR" | "LOGO" | "CV";

@Injectable()
export class MemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationService,
  ) {}

  async search(authUser: AuthUser, query: MemberSearchQueryDto = {}) {
    const user = await this.getActiveUser(authUser);
    const q = this.optionalText(query.q);
    const limit = this.resolveGlobalSearchLimit(query.limit);

    if (!q || q.length < 2) {
      return this.emptyGlobalSearch(q ?? "");
    }

    const contains = { contains: q, mode: "insensitive" as const };
    const enrolledTrainingIds = await this.prisma.trainingEnrollment.findMany({
      where: {
        userId: user.id,
        status: { in: [EnrollmentStatus.ENROLLED, EnrollmentStatus.IN_PROGRESS, EnrollmentStatus.COMPLETED] },
      },
      select: { trainingId: true },
    });
    const trainingIds = enrolledTrainingIds.map((enrollment) => enrollment.trainingId);
    const resourceAccess: ResourceAccessLevel[] = [ResourceAccessLevel.PUBLIC, ResourceAccessLevel.MEMBERS];

    if (user.type === AccountType.ADMIN) {
      resourceAccess.push(ResourceAccessLevel.ADMIN_ONLY);
    }

    const [creators, publications, trainings, opportunities, resources, partners] = await Promise.all([
      this.prisma.creativeProfile.findMany({
        where: {
          user: { status: AccountStatus.ACTIVE, type: { not: AccountType.ADMIN } },
          OR: [
            { userId: user.id },
            { visibility: { in: [ProfileVisibility.MEMBERS, ProfileVisibility.PUBLIC] } },
          ],
          AND: [
            {
              OR: [
                { publicName: contains },
                { memberNumber: contains },
                { profession: contains },
                { discipline: contains },
                { otherDiscipline: contains },
                { city: contains },
                { country: contains },
                { bio: contains },
                { skills: { has: q } },
                { user: { firstName: contains } },
                { user: { lastName: contains } },
              ],
            },
          ],
        },
        include: {
          user: { select: { firstName: true, lastName: true, type: true, emailVerifiedAt: true } },
        },
        orderBy: [{ profileCompletion: "desc" }, { updatedAt: "desc" }],
        take: limit,
      }),
      this.prisma.publication.findMany({
        where: {
          status: PublicationStatus.PUBLISHED,
          OR: [
            { authorId: user.id },
            { audience: { in: [PublicationAudience.PUBLIC, PublicationAudience.MEMBERS] } },
          ],
          AND: [
            {
              OR: [
                { title: contains },
                { content: contains },
                { excerpt: contains },
                { category: contains },
                { discipline: contains },
                { city: contains },
                { country: contains },
                { tags: { has: q } },
              ],
            },
          ],
        },
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        take: limit,
      }),
      this.prisma.training.findMany({
        where: {
          status: TrainingStatus.PUBLISHED,
          OR: [{ title: contains }, { description: contains }, { location: contains }],
        },
        orderBy: [{ startsAt: "asc" }, { updatedAt: "desc" }],
        take: limit,
      }),
      this.prisma.opportunity.findMany({
        where: {
          published: true,
          status: OpportunityStatus.OPEN,
          OR: [{ title: contains }, { description: contains }, { location: contains }, { eligibilityUrl: contains }],
        },
        orderBy: [{ deadline: "asc" }, { updatedAt: "desc" }],
        take: limit,
      }),
      this.prisma.resource.findMany({
        where: {
          published: true,
          OR: [
            { accessLevel: { in: resourceAccess } },
            trainingIds.length ? { accessLevel: ResourceAccessLevel.ENROLLED, trainingId: { in: trainingIds } } : undefined,
          ].filter((item): item is Exclude<typeof item, undefined> => !!item),
          AND: [
            {
              OR: [{ title: contains }, { description: contains }, { url: contains }],
            },
          ],
        },
        include: { training: { select: { title: true } } },
        orderBy: [{ updatedAt: "desc" }],
        take: limit,
      }),
      this.prisma.partner.findMany({
        where: {
          published: true,
          OR: [{ name: contains }, { type: contains }, { description: contains }, { website: contains }],
        },
        orderBy: [{ order: "asc" }, { name: "asc" }],
        take: limit,
      }),
    ]);

    const sections = {
      creators: creators.map((profile) => ({
        id: profile.id,
        type: "creator",
        label: "Créateur",
        title: profile.publicName ?? `${profile.user.firstName} ${profile.user.lastName}`.trim(),
        description: this.compactSearchText(profile.bio ?? profile.profession ?? profile.discipline),
        meta: [profile.memberNumber, profile.otherDiscipline ?? profile.discipline, profile.city].filter(Boolean).join(" · "),
        href: `/espace-membre/reseau/membre/${encodeURIComponent(profile.memberNumber)}`,
        imageUrl: profile.avatarUrl,
      })),
      publications: publications.map((publication) => ({
        id: publication.id,
        type: "publication",
        label: this.memberPublicationTypeLabel(publication.type),
        title: publication.title,
        description: this.compactSearchText(publication.excerpt ?? publication.content),
        meta: [publication.category, publication.city, publication.publishedAt ? this.formatShortDate(publication.publishedAt) : null]
          .filter(Boolean)
          .join(" · "),
        href: "/espace-membre",
        imageUrl: publication.coverImageUrl,
      })),
      trainings: trainings.map((training) => ({
        id: training.id,
        type: "training",
        label: "Formation",
        title: training.title,
        description: this.compactSearchText(training.description),
        meta: [training.location, training.startsAt ? this.formatShortDate(training.startsAt) : "Date à confirmer"].filter(Boolean).join(" · "),
        href: `/espace-membre/formations?trainingId=${encodeURIComponent(training.id)}`,
        imageUrl: training.coverImageUrl,
      })),
      opportunities: opportunities.map((opportunity) => ({
        id: opportunity.id,
        type: "opportunity",
        label: this.opportunityTypeLabel(opportunity.type),
        title: opportunity.title,
        description: this.compactSearchText(opportunity.description),
        meta: [opportunity.location, opportunity.deadline ? `Limite ${this.formatShortDate(opportunity.deadline)}` : "Date à confirmer"].filter(Boolean).join(" · "),
        href: `/espace-membre/opportunites?opportunityId=${encodeURIComponent(opportunity.id)}`,
        imageUrl: null,
      })),
      resources: resources.map((resource) => ({
        id: resource.id,
        type: "resource",
        label: this.resourceTypeLabel(resource.type),
        title: resource.title,
        description: this.compactSearchText(resource.description ?? resource.training?.title ?? "Ressource CCA"),
        meta: [this.resourceAccessLabel(resource.accessLevel), resource.training?.title].filter(Boolean).join(" · "),
        href: `/espace-membre/ressources?resourceId=${encodeURIComponent(resource.id)}`,
        imageUrl: null,
      })),
      partners: partners.map((partner) => ({
        id: partner.id,
        type: "partner",
        label: partner.type ?? "Partenaire",
        title: partner.name,
        description: this.compactSearchText(partner.description ?? partner.website ?? "Partenaire Creative Currencies Africa"),
        meta: "Partenaire publié",
        href: partner.website || "/#partenaires",
        imageUrl: partner.logoUrl,
      })),
    };
    const results = [
      ...sections.creators,
      ...sections.publications,
      ...sections.trainings,
      ...sections.opportunities,
      ...sections.resources,
      ...sections.partners,
    ];

    return {
      query: q,
      total: results.length,
      results,
      sections,
    };
  }

  async getCreativeId(authUser: AuthUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.userId },
      include: {
        profile: { include: { socialLinks: { orderBy: { network: "asc" } } } },
        portfolioItems: { orderBy: [{ featured: "desc" }, { order: "asc" }, { updatedAt: "desc" }] },
        enrollments: {
          orderBy: [{ enrolledAt: "desc" }],
          include: { training: { select: { id: true, title: true, slug: true, startsAt: true, endsAt: true } } },
        },
        eventRegistrations: {
          orderBy: [{ registeredAt: "desc" }],
          include: { event: { select: { id: true, title: true, slug: true, startsAt: true, endsAt: true } } },
        },
        opportunityApplications: {
          orderBy: [{ updatedAt: "desc" }],
          include: { opportunity: { select: { id: true, title: true, slug: true, deadline: true } } },
        },
        certificates: {
          orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }],
          include: {
            training: { select: { id: true, title: true, slug: true, startsAt: true, certificateEnabled: true } },
          },
        },
      },
    });

    if (!user || user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException("Votre connexion n'est plus valide. Connectez-vous à nouveau.");
    }

    if (!user.profile) {
      throw new BadRequestException("Aucun profil Creative ID n'est associé à ce compte.");
    }

    const issuedCertificates = user.certificates.filter((certificate) => certificate.status === CertificateStatus.ISSUED).length;

    return {
      profile: {
        ...user.profile,
        discipline: user.profile.otherDiscipline ?? user.profile.discipline,
      },
      socialLinks: user.profile.socialLinks.map((link) => ({
        id: link.id,
        network: link.network,
        url: link.url,
      })),
      portfolioItems: user.portfolioItems.map((item) => this.serializePortfolioItem(item)),
      history: this.buildCreativeIdHistory(user),
      badges: this.memberBadges({
        emailVerifiedAt: user.emailVerifiedAt,
        profileVerifiedAt: user.profile.verifiedAt,
        profileCompletion: user.profile.profileCompletion,
        issuedCertificates,
      }),
      stats: {
        portfolioItems: user.portfolioItems.length,
        trainings: user.enrollments.length,
        certificates: issuedCertificates,
        opportunities: user.opportunityApplications.length,
        events: user.eventRegistrations.length,
      },
    };
  }

  async createPortfolioItem(authUser: AuthUser, input: CreatePortfolioItemDto) {
    await this.ensurePortfolioOwner(authUser);
    const item = await this.prisma.portfolioItem.create({
      data: {
        userId: authUser.userId,
        title: this.requiredText(input.title, "Le titre du projet est requis."),
        category: this.requiredText(input.category, "La discipline du projet est requise."),
        description: this.optionalText(input.description),
        mediaUrl: this.optionalText(input.mediaUrl),
        externalUrl: this.optionalText(input.externalUrl),
        year: input.year ?? null,
        featured: input.featured ?? false,
        order: input.order ?? 0,
      },
    });

    return this.serializePortfolioItem(item);
  }

  async updatePortfolioItem(authUser: AuthUser, id: string, input: UpdatePortfolioItemDto) {
    await this.ensurePortfolioOwner(authUser);
    const existing = await this.prisma.portfolioItem.findFirst({
      where: { id, userId: authUser.userId },
    });

    if (!existing) {
      throw new NotFoundException("Cet élément de portfolio est introuvable.");
    }

    const item = await this.prisma.portfolioItem.update({
      where: { id },
      data: {
        title: input.title === undefined ? existing.title : this.requiredText(input.title, "Le titre du projet est requis."),
        category: input.category === undefined ? existing.category : this.requiredText(input.category, "La discipline du projet est requise."),
        description: this.nextOptionalText(input.description, existing.description),
        mediaUrl: this.nextOptionalText(input.mediaUrl, existing.mediaUrl),
        externalUrl: this.nextOptionalText(input.externalUrl, existing.externalUrl),
        year: input.year === undefined ? existing.year : input.year,
        featured: input.featured === undefined ? existing.featured : input.featured,
        order: input.order === undefined ? existing.order : input.order,
      },
    });

    return this.serializePortfolioItem(item);
  }

  async deletePortfolioItem(authUser: AuthUser, id: string) {
    await this.ensurePortfolioOwner(authUser);
    const existing = await this.prisma.portfolioItem.findFirst({
      where: { id, userId: authUser.userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("Cet élément de portfolio est introuvable.");
    }

    await this.prisma.portfolioItem.delete({ where: { id } });

    return { success: true };
  }

  async getPublicCreativeId(memberNumber: string) {
    const profile = await this.prisma.creativeProfile.findUnique({
      where: { memberNumber },
      include: {
        socialLinks: { orderBy: { network: "asc" } },
        user: {
          select: {
            firstName: true,
            lastName: true,
            type: true,
            emailVerifiedAt: true,
            status: true,
            portfolioItems: {
              orderBy: [{ featured: "desc" }, { order: "asc" }, { updatedAt: "desc" }],
              take: 8,
            },
            certificates: {
              where: { status: CertificateStatus.ISSUED },
              orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }],
              take: 6,
              include: {
                training: { select: { title: true } },
              },
            },
            enrollments: {
              where: { status: EnrollmentStatus.COMPLETED },
              orderBy: [{ completedAt: "desc" }, { enrolledAt: "desc" }],
              take: 6,
              include: {
                training: { select: { title: true } },
              },
            },
            eventRegistrations: {
              where: { status: EventRegistrationStatus.ATTENDED },
              orderBy: [{ attendedAt: "desc" }, { registeredAt: "desc" }],
              take: 6,
              include: {
                event: { select: { title: true } },
              },
            },
          },
        },
      },
    });

    if (!profile || profile.visibility !== ProfileVisibility.PUBLIC || profile.user.status !== AccountStatus.ACTIVE) {
      throw new NotFoundException("Ce Creative ID n'est pas public.");
    }

    return {
      memberNumber: profile.memberNumber,
      publicName: profile.publicName ?? `${profile.user.firstName} ${profile.user.lastName}`,
      accountType: profile.user.type,
      city: profile.city,
      country: profile.country,
      profession: profile.profession,
      discipline: profile.otherDiscipline ?? profile.discipline,
      bio: profile.bio,
      portfolioUrl: profile.portfolioUrl,
      websiteUrl: profile.websiteUrl,
      avatarUrl: profile.avatarUrl,
      socialLinks: profile.socialLinks.map((link) => ({
        id: link.id,
        network: link.network,
        url: link.url,
      })),
      skills: profile.skills,
      languages: profile.languages,
      availability: profile.availability,
      profileCompletion: profile.profileCompletion,
      emailVerified: !!profile.user.emailVerifiedAt,
      profileVerified: !!profile.verifiedAt,
      verifiedAt: profile.verifiedAt,
      portfolioItems: profile.user.portfolioItems.map((item) => this.serializePortfolioItem(item)),
      certificates: profile.user.certificates.map((certificate) => ({
        title: certificate.training?.title ?? certificate.title,
        number: certificate.number,
        issuedAt: certificate.issuedAt,
      })),
      officialHistory: [
        ...profile.user.certificates.map((certificate) => ({
          kind: "certificate",
          label: "Certificat",
          title: certificate.training?.title ?? certificate.title,
          date: certificate.issuedAt ?? certificate.createdAt,
        })),
        ...profile.user.enrollments.map((enrollment) => ({
          kind: "training",
          label: "Formation",
          title: enrollment.training.title,
          date: enrollment.completedAt ?? enrollment.enrolledAt,
        })),
        ...profile.user.eventRegistrations.map((registration) => ({
          kind: "event",
          label: "Événement",
          title: registration.event.title,
          date: registration.attendedAt ?? registration.registeredAt,
        })),
      ].sort((first, second) => second.date.getTime() - first.date.getTime()).slice(0, 10),
      updatedAt: profile.updatedAt,
    };
  }

  async getNetworkMembers(authUser: AuthUser, filters: Record<string, string | undefined> = {}) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, status: true },
    });

    if (!currentUser || currentUser.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException("Votre connexion n'est plus valide. Connectez-vous à nouveau.");
    }

    const query = this.optionalText(filters.q);
    const discipline = this.optionalText(filters.discipline);
    const country = this.optionalText(filters.country);
    const city = this.optionalText(filters.city);
    const language = this.optionalText(filters.language);
    const availability = this.optionalText(filters.availability);

    const profiles = await this.prisma.creativeProfile.findMany({
      where: {
        user: {
          status: AccountStatus.ACTIVE,
          type: { not: AccountType.ADMIN },
        },
        OR: [
          { userId: currentUser.id },
          { visibility: { in: [ProfileVisibility.MEMBERS, ProfileVisibility.PUBLIC] } },
        ],
        ...(query
          ? {
              AND: [
                {
                  OR: [
                    { publicName: { contains: query, mode: "insensitive" } },
                    { city: { contains: query, mode: "insensitive" } },
                    { country: { contains: query, mode: "insensitive" } },
                    { profession: { contains: query, mode: "insensitive" } },
                    { discipline: { contains: query, mode: "insensitive" } },
                    { otherDiscipline: { contains: query, mode: "insensitive" } },
                    { bio: { contains: query, mode: "insensitive" } },
                    { availability: { contains: query, mode: "insensitive" } },
                    { memberNumber: { contains: query, mode: "insensitive" } },
                    { user: { firstName: { contains: query, mode: "insensitive" } } },
                    { user: { lastName: { contains: query, mode: "insensitive" } } },
                  ],
                },
              ],
            }
          : {}),
        ...(discipline ? { discipline: { contains: discipline, mode: "insensitive" } } : {}),
        ...(country ? { country: { contains: country, mode: "insensitive" } } : {}),
        ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
        ...(language ? { languages: { has: language } } : {}),
        ...(availability ? { availability: { contains: availability, mode: "insensitive" } } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            type: true,
            emailVerifiedAt: true,
          },
        },
      },
      orderBy: [
        { profileCompletion: "desc" },
        { updatedAt: "desc" },
      ],
      take: 80,
    });
    const connections = await this.prisma.networkConnection.findMany({
      where: { ownerId: currentUser.id },
      select: { memberId: true, createdAt: true, kind: true, status: true },
    });
    const outgoingConnections = new Map(connections.map((connection) => [connection.memberId, connection]));
    const currentConnectionIds = connections
      .filter((connection) => connection.status === NetworkConnectionStatus.ACCEPTED)
      .map((connection) => connection.memberId);
    const candidateUserIds = profiles.map((profile) => profile.userId).filter((userId) => userId !== currentUser.id);
    const [incomingPendingConnections, mutualConnections] = await Promise.all([
      candidateUserIds.length
        ? this.prisma.networkConnection.findMany({
            where: {
              ownerId: { in: candidateUserIds },
              memberId: currentUser.id,
              kind: NetworkConnectionKind.CONNECTION,
              status: NetworkConnectionStatus.PENDING,
            },
            select: { ownerId: true, createdAt: true },
          })
        : [],
      currentConnectionIds.length && candidateUserIds.length
        ? this.prisma.networkConnection.findMany({
            where: {
              ownerId: { in: candidateUserIds },
              memberId: { in: currentConnectionIds },
              status: NetworkConnectionStatus.ACCEPTED,
            },
            select: {
              ownerId: true,
              member: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profile: {
                    select: {
                      publicName: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          })
        : [],
    ]);
    const incomingPendingByOwner = new Map(incomingPendingConnections.map((connection) => [connection.ownerId, connection.createdAt]));
    const mutualConnectionsByOwner = mutualConnections.reduce((groups, connection) => {
      const current = groups.get(connection.ownerId) ?? [];
      current.push({
        userId: connection.member.id,
        publicName: connection.member.profile?.publicName ?? `${connection.member.firstName} ${connection.member.lastName}`,
        avatarUrl: connection.member.profile?.avatarUrl ?? null,
      });
      groups.set(connection.ownerId, current);
      return groups;
    }, new Map<string, { userId: string; publicName: string; avatarUrl: string | null }[]>());

    return profiles.map((profile) => {
      const outgoingConnection = outgoingConnections.get(profile.userId);
      const incomingPendingAt = incomingPendingByOwner.get(profile.userId) ?? null;
      const connectionStatus = outgoingConnection?.status ?? (incomingPendingAt ? NetworkConnectionStatus.PENDING : null);

      return {
        id: profile.id,
        userId: profile.userId,
        isCurrentMember: profile.userId === currentUser.id,
        publicName: profile.publicName ?? `${profile.user.firstName} ${profile.user.lastName}`,
        accountType: profile.user.type,
        memberNumber: profile.memberNumber,
        city: profile.city,
        country: profile.country,
        profession: profile.profession,
        discipline: profile.otherDiscipline ?? profile.discipline,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        skills: profile.skills,
        languages: profile.languages,
        availability: profile.availability,
        visibility: profile.visibility,
        profileCompletion: profile.profileCompletion,
        connected: outgoingConnection?.status === NetworkConnectionStatus.ACCEPTED,
        connectedAt: outgoingConnection?.status === NetworkConnectionStatus.ACCEPTED ? outgoingConnection.createdAt : null,
        connectionKind: outgoingConnection?.kind ?? NetworkConnectionKind.CONNECTION,
        connectionStatus,
        connectionDirection: outgoingConnection ? "OUTGOING" : incomingPendingAt ? "INCOMING" : null,
        mutualConnectionCount: mutualConnectionsByOwner.get(profile.userId)?.length ?? 0,
        mutualConnections: (mutualConnectionsByOwner.get(profile.userId) ?? []).slice(0, 3),
        emailVerified: !!profile.user.emailVerifiedAt,
        profileVerified: !!profile.verifiedAt,
        updatedAt: profile.updatedAt,
      };
    });
  }

  async getNetworkMemberProfile(authUser: AuthUser, memberNumber: string) {
    const currentUser = await this.getActiveUser(authUser);
    const profile = await this.prisma.creativeProfile.findUnique({
      where: { memberNumber },
      include: {
        socialLinks: { orderBy: { network: "asc" } },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            type: true,
            status: true,
            emailVerifiedAt: true,
            portfolioItems: {
              orderBy: [{ featured: "desc" }, { order: "asc" }, { updatedAt: "desc" }],
              take: 8,
            },
          },
        },
      },
    });

    if (!profile || profile.user.status !== AccountStatus.ACTIVE) {
      throw new NotFoundException("Ce profil est introuvable.");
    }

    const isCurrentMember = profile.userId === currentUser.id;

    if (!isCurrentMember && currentUser.type !== AccountType.ADMIN && profile.visibility === ProfileVisibility.PRIVATE) {
      throw new NotFoundException("Ce profil est introuvable.");
    }

    const [connection, incomingConnection, currentConnections, publications] = await Promise.all([
      this.prisma.networkConnection.findUnique({
        where: { ownerId_memberId: { ownerId: currentUser.id, memberId: profile.userId } },
        select: { createdAt: true, kind: true, status: true },
      }),
      this.prisma.networkConnection.findUnique({
        where: { ownerId_memberId: { ownerId: profile.userId, memberId: currentUser.id } },
        select: { createdAt: true, kind: true, status: true },
      }),
      this.prisma.networkConnection.findMany({
        where: { ownerId: currentUser.id, status: NetworkConnectionStatus.ACCEPTED },
        select: { memberId: true },
      }),
      this.prisma.publication.findMany({
        where: {
          authorId: profile.userId,
          status: PublicationStatus.PUBLISHED,
          audience: { in: [PublicationAudience.PUBLIC, PublicationAudience.MEMBERS] },
        },
        select: {
          id: true,
          type: true,
          audience: true,
          title: true,
          content: true,
          excerpt: true,
          category: true,
          discipline: true,
          country: true,
          city: true,
          tags: true,
          routingDestinations: true,
          linkUrl: true,
          coverImageUrl: true,
          publishedAt: true,
          updatedAt: true,
          attachments: {
            select: {
              id: true,
              type: true,
              url: true,
              name: true,
              mimeType: true,
            },
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          },
          _count: {
            select: {
              comments: true,
              reactions: true,
              shares: true,
            },
          },
        },
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        take: 12,
      }),
    ]);
    const effectiveConnection = connection ?? (
      incomingConnection?.kind === NetworkConnectionKind.CONNECTION && incomingConnection.status === NetworkConnectionStatus.PENDING
        ? incomingConnection
        : null
    );
    const currentConnectionIds = currentConnections.map((item) => item.memberId);
    const mutualConnections = currentConnectionIds.length
      ? await this.prisma.networkConnection.findMany({
          where: {
            ownerId: profile.userId,
            memberId: { in: currentConnectionIds },
          },
          select: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profile: {
                  select: {
                    publicName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
          take: 6,
        })
      : [];
    const displayName = profile.publicName ?? `${profile.user.firstName} ${profile.user.lastName}`;

    return {
      profile: {
        id: profile.id,
        userId: profile.userId,
        isCurrentMember,
        publicName: displayName,
        accountType: profile.user.type,
        memberNumber: profile.memberNumber,
        city: profile.city,
        country: profile.country,
        profession: profile.profession,
        discipline: profile.otherDiscipline ?? profile.discipline,
        bio: profile.bio,
        portfolioUrl: profile.portfolioUrl,
        websiteUrl: profile.websiteUrl,
        avatarUrl: profile.avatarUrl,
        cvUrl: profile.cvUrl,
        skills: profile.skills,
        languages: profile.languages,
        availability: profile.availability,
        visibility: profile.visibility,
        profileCompletion: profile.profileCompletion,
        connected: effectiveConnection?.status === NetworkConnectionStatus.ACCEPTED,
        connectedAt: effectiveConnection?.status === NetworkConnectionStatus.ACCEPTED ? effectiveConnection.createdAt : null,
        connectionKind: effectiveConnection?.kind ?? NetworkConnectionKind.CONNECTION,
        connectionStatus: effectiveConnection?.status ?? null,
        connectionDirection: connection ? "OUTGOING" : effectiveConnection ? "INCOMING" : null,
        mutualConnectionCount: mutualConnections.length,
        mutualConnections: mutualConnections.slice(0, 3).map((item) => ({
          userId: item.member.id,
          publicName: item.member.profile?.publicName ?? `${item.member.firstName} ${item.member.lastName}`,
          avatarUrl: item.member.profile?.avatarUrl ?? null,
        })),
        emailVerified: !!profile.user.emailVerifiedAt,
        profileVerified: !!profile.verifiedAt,
        updatedAt: profile.updatedAt,
      },
      socialLinks: profile.socialLinks.map((link) => ({
        id: link.id,
        network: link.network,
        url: link.url,
      })),
      portfolioItems: profile.user.portfolioItems.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        mediaUrl: item.mediaUrl,
        externalUrl: item.externalUrl,
        year: item.year,
        featured: item.featured,
      })),
      publications: publications.map((publication) => ({
        id: publication.id,
        type: publication.type,
        typeLabel: this.memberPublicationTypeLabel(publication.type),
        audience: publication.audience,
        title: publication.title,
        excerpt: publication.excerpt ?? this.buildProfilePublicationExcerpt(publication.content),
        category: publication.category,
        discipline: publication.discipline,
        country: publication.country,
        city: publication.city,
        tags: publication.tags,
        routingDestinations: publication.routingDestinations,
        linkUrl: publication.linkUrl,
        coverImageUrl: publication.coverImageUrl,
        publishedAt: publication.publishedAt,
        updatedAt: publication.updatedAt,
        attachments: publication.attachments,
        counts: {
          comments: publication._count.comments,
          reactions: publication._count.reactions,
          shares: publication._count.shares,
        },
      })),
    };
  }

  async saveNetworkMember(authUser: AuthUser, memberUserId: string) {
    const currentUser = await this.getActiveUser(authUser);

    if (currentUser.id === memberUserId) {
      throw new BadRequestException("Vous ne pouvez pas ajouter votre propre profil au réseau.");
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: memberUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        type: true,
        profile: { select: { id: true, visibility: true } },
        organizationProfile: { select: { id: true } },
        partnerProfile: { select: { id: true } },
      },
    });

    if (!targetUser || targetUser.status !== AccountStatus.ACTIVE) {
      throw new NotFoundException("Ce membre est introuvable.");
    }

    if (targetUser.type === AccountType.ADMIN) {
      throw new NotFoundException("Ce membre est introuvable.");
    }

    const isFollowTarget = targetUser.type === AccountType.ORGANIZATION || targetUser.type === AccountType.PARTNER;
    const hasVisibleTarget = isFollowTarget ? true : !!targetUser.profile;

    if (!hasVisibleTarget) {
      throw new NotFoundException("Ce membre est introuvable.");
    }

    if (!isFollowTarget && targetUser.profile?.visibility === ProfileVisibility.PRIVATE) {
      throw new BadRequestException("Ce profil n'est pas disponible dans l'annuaire.");
    }

    if (!isFollowTarget) {
      const incomingRequest = await this.prisma.networkConnection.findUnique({
        where: { ownerId_memberId: { ownerId: targetUser.id, memberId: currentUser.id } },
      });

      if (incomingRequest?.kind === NetworkConnectionKind.CONNECTION && incomingRequest.status === NetworkConnectionStatus.PENDING) {
        const acceptedAt = new Date();
        const [connection] = await this.prisma.$transaction([
          this.prisma.networkConnection.upsert({
            where: { ownerId_memberId: { ownerId: currentUser.id, memberId: targetUser.id } },
            create: {
              ownerId: currentUser.id,
              memberId: targetUser.id,
              kind: NetworkConnectionKind.CONNECTION,
              status: NetworkConnectionStatus.ACCEPTED,
              respondedAt: acceptedAt,
            },
            update: {
              kind: NetworkConnectionKind.CONNECTION,
              status: NetworkConnectionStatus.ACCEPTED,
              respondedAt: acceptedAt,
            },
          }),
          this.prisma.networkConnection.update({
            where: { id: incomingRequest.id },
            data: {
              status: NetworkConnectionStatus.ACCEPTED,
              respondedAt: acceptedAt,
            },
          }),
        ]);

        await this.notifications.createForUser({
          userId: targetUser.id,
          type: NotificationType.SYSTEM,
          title: "Connexion acceptée",
          message: `${currentUser.firstName} ${currentUser.lastName} a accepté votre invitation.`,
          href: "/espace-membre/reseau",
        }).catch(() => undefined);

        return {
          success: true,
          connected: true,
          connectedAt: connection.createdAt,
          connectionKind: connection.kind,
          connectionStatus: connection.status,
        };
      }
    }

    const kind = isFollowTarget ? NetworkConnectionKind.FOLLOW : NetworkConnectionKind.CONNECTION;
    const status = isFollowTarget ? NetworkConnectionStatus.ACCEPTED : NetworkConnectionStatus.PENDING;
    const connection = await this.prisma.networkConnection.upsert({
      where: { ownerId_memberId: { ownerId: currentUser.id, memberId: targetUser.id } },
      create: { ownerId: currentUser.id, memberId: targetUser.id, kind, status },
      update: { kind, status },
    });

    await this.notifications.createForUser({
      userId: targetUser.id,
      type: NotificationType.SYSTEM,
      title: isFollowTarget ? "Nouveau suivi" : "Nouvelle invitation réseau",
      message: isFollowTarget
        ? `${currentUser.firstName} ${currentUser.lastName} suit maintenant vos publications.`
        : `${currentUser.firstName} ${currentUser.lastName} souhaite se connecter avec vous sur CCA.`,
      href: "/espace-membre/reseau",
    }).catch(() => undefined);

    return {
      success: true,
      connected: connection.status === NetworkConnectionStatus.ACCEPTED,
      connectedAt: connection.status === NetworkConnectionStatus.ACCEPTED ? connection.createdAt : null,
      connectionKind: connection.kind,
      connectionStatus: connection.status,
    };
  }

  async removeNetworkMember(authUser: AuthUser, memberUserId: string) {
    const currentUser = await this.getActiveUser(authUser);
    const connection = await this.prisma.networkConnection.findUnique({
      where: { ownerId_memberId: { ownerId: currentUser.id, memberId: memberUserId } },
      select: { kind: true, status: true },
    });

    if (connection?.kind === NetworkConnectionKind.CONNECTION && connection.status === NetworkConnectionStatus.ACCEPTED) {
      await this.prisma.networkConnection.deleteMany({
        where: {
          OR: [
            { ownerId: currentUser.id, memberId: memberUserId },
            { ownerId: memberUserId, memberId: currentUser.id },
          ],
        },
      });
    } else {
      await this.prisma.networkConnection.deleteMany({
        where: { ownerId: currentUser.id, memberId: memberUserId },
      });
    }

    return {
      success: true,
      connected: false,
    };
  }

  async getTrainings(authUser: AuthUser) {
    const user = await this.getActiveUser(authUser);
    const canPublishTraining = this.canPublishTraining(user.type);
    const readablePublicationWhere = {
      type: PublicationType.TRAINING,
      routingDestinations: { has: "trainings" },
      status: PublicationStatus.PUBLISHED,
      OR: [
        { authorId: user.id },
        {
          audience: { in: [PublicationAudience.PUBLIC, PublicationAudience.MEMBERS] },
        },
      ],
    };

    const [trainings, trainingPublications, myPublished] = await Promise.all([
      this.prisma.training.findMany({
        where: { status: TrainingStatus.PUBLISHED },
        include: {
          modules: { orderBy: [{ order: "asc" }, { startsAt: "asc" }] },
          resources: {
            where: {
              published: true,
              accessLevel: { not: ResourceAccessLevel.ADMIN_ONLY },
            },
            orderBy: { createdAt: "desc" },
            take: 4,
          },
          enrollments: {
            where: { userId: user.id },
            take: 1,
          },
          _count: { select: { enrollments: true } },
        },
        orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
        take: 60,
      }),
      this.prisma.publication.findMany({
        where: readablePublicationWhere,
        include: {
          attachments: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              type: true,
              profile: { select: { publicName: true, avatarUrl: true, discipline: true, country: true, city: true } },
              organizationProfile: { select: { name: true, logoUrl: true, sector: true, country: true, city: true } },
              partnerProfile: { select: { name: true, logoUrl: true, partnerType: true, country: true, city: true } },
            },
          },
          _count: { select: { comments: true, reactions: true, shares: true } },
        },
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        take: 60,
      }),
      canPublishTraining
        ? this.prisma.publication.findMany({
            where: { authorId: user.id, type: PublicationType.TRAINING },
            include: {
              attachments: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  type: true,
                  profile: { select: { publicName: true, avatarUrl: true, discipline: true, country: true, city: true } },
                  organizationProfile: { select: { name: true, logoUrl: true, sector: true, country: true, city: true } },
                  partnerProfile: { select: { name: true, logoUrl: true, partnerType: true, country: true, city: true } },
                },
              },
              _count: { select: { comments: true, reactions: true, shares: true } },
            },
            orderBy: [{ updatedAt: "desc" }],
            take: 30,
          })
        : Promise.resolve([]),
    ]);

    const catalog = [
      ...trainings.map((training) => this.serializeTraining(training)),
      ...trainingPublications.map((publication) => this.serializeTrainingPublication(publication, user.id)),
    ];

    return {
      accountType: user.type,
      canPublishTraining,
      catalog,
      myEnrollments: catalog.filter((training) => !!training.enrollment),
      myPublished: myPublished.map((publication) => this.serializeTrainingPublication(publication, user.id)),
    };
  }

  async enrollTraining(authUser: AuthUser, id: string, input: EnrollTrainingDto = {}) {
    const user = await this.getActiveUser(authUser);
    const training = await this.prisma.training.findUnique({
      where: { id },
      select: { id: true, status: true, capacity: true, _count: { select: { enrollments: true } } },
    });

    if (!training || training.status !== TrainingStatus.PUBLISHED) {
      throw new NotFoundException("Cette formation n'est pas disponible.");
    }

    const existing = await this.prisma.trainingEnrollment.findUnique({
      where: { trainingId_userId: { trainingId: training.id, userId: user.id } },
      select: { id: true, status: true, progress: true },
    });

    if (!existing && training.capacity !== null && training._count.enrollments >= training.capacity) {
      throw new BadRequestException("Cette formation est complète.");
    }

    const enrollment = await this.prisma.trainingEnrollment.upsert({
      where: { trainingId_userId: { trainingId: training.id, userId: user.id } },
      create: {
        trainingId: training.id,
        userId: user.id,
        status: EnrollmentStatus.ENROLLED,
        motivation: this.optionalText(input.motivation),
        phone: this.optionalText(input.phone) ?? user.phone,
      },
      update: {
        status: existing?.status === EnrollmentStatus.CANCELLED ? EnrollmentStatus.ENROLLED : existing?.status,
        motivation: input.motivation !== undefined ? this.optionalText(input.motivation) : undefined,
        phone: input.phone !== undefined ? this.optionalText(input.phone) : undefined,
      },
    });

    if (user.type === AccountType.PUBLIC) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { type: AccountType.LEARNER },
      });

      await this.notifications.createForUser({
        userId: user.id,
        type: NotificationType.TRAINING,
        title: "Parcours apprenant activé",
        message: "Votre inscription à une formation CCA active votre statut apprenant.",
        href: "/espace-membre/formations",
      }).catch(() => undefined);
    }

    return {
      success: true,
      enrollment,
      trainings: await this.getTrainings(authUser),
    };
  }

  async getAccountEvolution(authUser: AuthUser) {
    const user = await this.getActiveUser(authUser);
    const requests = await this.prisma.accountEvolutionRequest.findMany({
      where: { userId: user.id },
      orderBy: [{ createdAt: "desc" }],
      take: 10,
    });

    return {
      accountType: user.type,
      availableTargets: this.accountEvolutionTargets(user.type),
      requests: requests.map((request) => this.serializeAccountEvolutionRequest(request)),
    };
  }

  async requestAccountEvolution(authUser: AuthUser, input: RequestAccountEvolutionDto) {
    const user = await this.getActiveUser(authUser);
    const requestedType = input.requestedType;

    if (requestedType !== AccountType.CREATOR) {
      throw new BadRequestException("Pour cette version, seule la demande de profil créateur est ouverte.");
    }

    if (user.type !== AccountType.PUBLIC && user.type !== AccountType.LEARNER) {
      throw new BadRequestException("Votre type de compte ne peut pas demander ce changement de parcours.");
    }

    const pending = await this.prisma.accountEvolutionRequest.findFirst({
      where: {
        userId: user.id,
        requestedType,
        status: AccountEvolutionRequestStatus.PENDING,
      },
      select: { id: true },
    });

    if (pending) {
      throw new BadRequestException("Une demande de passage créateur est déjà en cours de traitement.");
    }

    const request = await this.prisma.accountEvolutionRequest.create({
      data: {
        userId: user.id,
        fromType: user.type,
        requestedType,
        motivation: this.optionalText(input.motivation),
        portfolioUrl: this.optionalText(input.portfolioUrl) ?? user.profile?.portfolioUrl,
        cvUrl: this.optionalText(input.cvUrl) ?? user.profile?.cvUrl,
      },
    });

    await this.notifyAdmins({
      title: "Nouvelle demande créateur",
      message: `${user.firstName} ${user.lastName} demande la validation de son profil créateur.`,
      href: "/espace-membre/admin?tab=members",
    });

    return {
      success: true,
      message: "Votre demande créateur a été envoyée à l'équipe CCA.",
      request: this.serializeAccountEvolutionRequest(request),
    };
  }

  async getOpportunities(authUser: AuthUser) {
    const user = await this.getActiveUser(authUser);
    const canPublishOpportunity = this.canPublishOpportunity(user.type);
    const readablePublicationWhere = {
      type: { in: [PublicationType.OPPORTUNITY, PublicationType.JOB] },
      routingDestinations: { has: "opportunities" },
      status: PublicationStatus.PUBLISHED,
      OR: [
        { authorId: user.id },
        {
          audience: { in: [PublicationAudience.PUBLIC, PublicationAudience.MEMBERS] },
        },
      ],
    };

    const [opportunities, publicationOpportunities, myPublished] = await Promise.all([
      this.prisma.opportunity.findMany({
        where: {
          published: true,
          status: OpportunityStatus.OPEN,
        },
        include: {
          applications: {
            where: { userId: user.id },
            take: 1,
          },
        },
        orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
        take: 80,
      }),
      this.prisma.publication.findMany({
        where: readablePublicationWhere,
        include: {
          attachments: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              type: true,
              profile: { select: { publicName: true, avatarUrl: true, discipline: true, country: true, city: true } },
              organizationProfile: { select: { name: true, logoUrl: true, sector: true, country: true, city: true } },
              partnerProfile: { select: { name: true, logoUrl: true, partnerType: true, country: true, city: true } },
            },
          },
          _count: { select: { comments: true, reactions: true, shares: true } },
        },
        orderBy: [{ opportunityDeadline: "asc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
        take: 80,
      }),
      canPublishOpportunity
        ? this.prisma.publication.findMany({
            where: { authorId: user.id, type: { in: [PublicationType.OPPORTUNITY, PublicationType.JOB] } },
            include: {
              attachments: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  type: true,
                  profile: { select: { publicName: true, avatarUrl: true, discipline: true, country: true, city: true } },
                  organizationProfile: { select: { name: true, logoUrl: true, sector: true, country: true, city: true } },
                  partnerProfile: { select: { name: true, logoUrl: true, partnerType: true, country: true, city: true } },
                },
              },
              _count: { select: { comments: true, reactions: true, shares: true } },
            },
            orderBy: [{ updatedAt: "desc" }],
            take: 30,
          })
        : Promise.resolve([]),
    ]);

    const catalog = [
      ...opportunities.map((opportunity) => this.serializeOpportunity(opportunity, user)),
      ...publicationOpportunities.map((publication) => this.serializeOpportunityPublication(publication, user)),
    ];

    return {
      accountType: user.type,
      canPublishOpportunity,
      catalog,
      myApplications: catalog.filter((opportunity) => !!opportunity.application),
      myPublished: myPublished.map((publication) => this.serializeOpportunityPublication(publication, user)),
    };
  }

  async applyOpportunity(authUser: AuthUser, id: string, input: ApplyOpportunityDto) {
    const user = await this.getActiveUser(authUser);
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id },
      select: { id: true, status: true, published: true, deadline: true },
    });

    if (!opportunity || !opportunity.published || opportunity.status !== OpportunityStatus.OPEN) {
      throw new NotFoundException("Cette opportunité n'est pas disponible.");
    }

    if (opportunity.deadline && opportunity.deadline.getTime() < Date.now()) {
      throw new BadRequestException("La date limite de cette opportunité est dépassée.");
    }

    const status = this.resolveApplicationStatus(input.status);
    const motivation = this.optionalText(input.motivation);
    const discipline = this.optionalText(input.discipline) ?? user.profile?.discipline ?? null;
    const city = this.optionalText(input.city) ?? user.profile?.city ?? null;
    const phone = this.optionalText(input.phone) ?? user.phone;
    const portfolioUrl = this.optionalText(input.portfolioUrl) ?? user.profile?.portfolioUrl ?? null;
    const cvUrl = this.optionalText(input.cvUrl) ?? user.profile?.cvUrl ?? null;
    const fileUrl = this.optionalText(input.fileUrl);
    const links = this.optionalTextList(input.links);
    const socialLinks = this.optionalTextList(input.socialLinks);

    const application = await this.prisma.opportunityApplication.upsert({
      where: { opportunityId_userId: { opportunityId: opportunity.id, userId: user.id } },
      create: {
        opportunityId: opportunity.id,
        userId: user.id,
        status,
        motivation,
        discipline,
        city,
        phone,
        portfolioUrl,
        cvUrl,
        fileUrl,
        links: links.length ? links : undefined,
        socialLinks: socialLinks.length ? socialLinks : undefined,
        submittedAt: status === ApplicationStatus.SUBMITTED ? new Date() : null,
      },
      update: {
        status,
        motivation,
        discipline,
        city,
        phone,
        portfolioUrl,
        cvUrl,
        fileUrl,
        links: links.length ? links : input.links !== undefined ? Prisma.DbNull : undefined,
        socialLinks: socialLinks.length ? socialLinks : input.socialLinks !== undefined ? Prisma.DbNull : undefined,
        submittedAt: status === ApplicationStatus.SUBMITTED ? new Date() : undefined,
      },
    });

    return {
      success: true,
      application,
      opportunities: await this.getOpportunities(authUser),
    };
  }

  async getResources(authUser: AuthUser) {
    const user = await this.getActiveUser(authUser);
    const canPublishResource = this.canPublishResource(user.type);
    const enrolledTrainingIds = await this.prisma.trainingEnrollment.findMany({
      where: {
        userId: user.id,
        status: { in: [EnrollmentStatus.ENROLLED, EnrollmentStatus.IN_PROGRESS, EnrollmentStatus.COMPLETED] },
      },
      select: { trainingId: true },
    });
    const trainingIds = enrolledTrainingIds.map((enrollment) => enrollment.trainingId);
    const resourceAccess: ResourceAccessLevel[] = [ResourceAccessLevel.PUBLIC, ResourceAccessLevel.MEMBERS];

    if (user.type === AccountType.ADMIN) {
      resourceAccess.push(ResourceAccessLevel.ADMIN_ONLY);
    }

    const [resources, resourcePublications, myResourcePublications] = await Promise.all([
      this.prisma.resource.findMany({
        where: {
          published: true,
          OR: [
            { accessLevel: { in: resourceAccess } },
            trainingIds.length ? { accessLevel: ResourceAccessLevel.ENROLLED, trainingId: { in: trainingIds } } : undefined,
          ].filter((item): item is Exclude<typeof item, undefined> => !!item),
        },
        include: {
          training: { select: { id: true, title: true, slug: true } },
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              type: true,
              profile: { select: { publicName: true } },
              organizationProfile: { select: { name: true } },
              partnerProfile: { select: { name: true } },
            },
          },
          usefulMarks: { where: { userId: user.id }, select: { id: true }, take: 1 },
          _count: { select: { views: true, downloads: true, usefulMarks: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 80,
      }),
      this.prisma.publication.findMany({
        where:
          user.type === AccountType.ADMIN
            ? { type: PublicationType.RESOURCE, status: PublicationStatus.PUBLISHED, routingDestinations: { has: "resources" } }
            : {
                type: PublicationType.RESOURCE,
                routingDestinations: { has: "resources" },
                OR: [
                  { authorId: user.id },
                  {
                    status: PublicationStatus.PUBLISHED,
                    audience: { in: [PublicationAudience.PUBLIC, PublicationAudience.MEMBERS] },
                  },
                ],
              },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              type: true,
              profile: { select: { publicName: true } },
              organizationProfile: { select: { name: true } },
              partnerProfile: { select: { name: true } },
            },
          },
          attachments: { orderBy: { order: "asc" } },
          _count: { select: { comments: true, reactions: true, shares: true } },
        },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 80,
      }),
      canPublishResource
        ? this.prisma.publication.findMany({
            where: { authorId: user.id, type: PublicationType.RESOURCE },
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  type: true,
                  profile: { select: { publicName: true } },
                  organizationProfile: { select: { name: true } },
                  partnerProfile: { select: { name: true } },
                },
              },
              attachments: { orderBy: { order: "asc" } },
              _count: { select: { comments: true, reactions: true, shares: true } },
            },
            orderBy: [{ updatedAt: "desc" }],
            take: 30,
          })
        : Promise.resolve([]),
    ]);

    const library = [
      ...resources.map((resource) => this.serializeResource(resource, user)),
      ...resourcePublications.map((publication) => this.serializeResourcePublication(publication, user)),
    ];

    const myPublished = myResourcePublications.map((publication) => this.serializeResourcePublication(publication, user));

    return {
      accountType: user.type,
      canPublishResource,
      accessRules: this.resourceAccessRules(user.type),
      library,
      trainingResources: library.filter((resource) => resource.training || resource.accessLevel === ResourceAccessLevel.ENROLLED),
      myPublished,
    };
  }

  async viewResource(authUser: AuthUser, id: string) {
    const { user, resource } = await this.getAccessibleResource(authUser, id);

    await this.prisma.resourceView.create({
      data: {
        resourceId: resource.id,
        userId: user.id,
      },
    });

    const updatedResource = await this.prisma.resource.findUniqueOrThrow({
      where: { id: resource.id },
      include: this.resourceDetailInclude(user.id),
    });

    return {
      success: true,
      resource: this.serializeResource(updatedResource, user),
    };
  }

  async downloadResource(authUser: AuthUser, id: string) {
    const { user, resource } = await this.getAccessibleResource(authUser, id);

    await this.prisma.resourceDownload.create({
      data: {
        resourceId: resource.id,
        userId: user.id,
      },
    });

    const updatedResource = await this.prisma.resource.findUniqueOrThrow({
      where: { id: resource.id },
      include: this.resourceDetailInclude(user.id),
    });

    return {
      success: true,
      url: resource.url,
      filename: resource.title,
      resource: this.serializeResource(updatedResource, user),
    };
  }

  async toggleUsefulResource(authUser: AuthUser, id: string) {
    const { user, resource } = await this.getAccessibleResource(authUser, id);
    const existing = await this.prisma.resourceUsefulMark.findUnique({
      where: {
        resourceId_userId: {
          resourceId: resource.id,
          userId: user.id,
        },
      },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.resourceUsefulMark.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.resourceUsefulMark.create({
        data: {
          resourceId: resource.id,
          userId: user.id,
        },
      });
    }

    const updatedResource = await this.prisma.resource.findUniqueOrThrow({
      where: { id: resource.id },
      include: this.resourceDetailInclude(user.id),
    });

    return {
      success: true,
      useful: !existing,
      resource: this.serializeResource(updatedResource, user),
    };
  }

  async getAgenda(authUser: AuthUser) {
    const user = await this.getActiveUser(authUser);
    const now = new Date();
    const readablePublicationWhere = {
      status: PublicationStatus.PUBLISHED,
      opportunityDeadline: { not: null },
      OR: [
        { authorId: user.id },
        {
          audience: { in: [PublicationAudience.PUBLIC, PublicationAudience.MEMBERS] },
        },
      ],
      AND: [
        {
          OR: [
            { routingDestinations: { has: "agenda" } },
            { routingDestinations: { has: "opportunities" } },
            { type: { in: [PublicationType.EVENT, PublicationType.TRAINING, PublicationType.OPPORTUNITY, PublicationType.JOB] } },
          ],
        },
      ],
    };

    const [events, trainings, opportunities, publications] = await Promise.all([
      this.prisma.event.findMany({
        where: {
          published: true,
          startsAt: { gte: now },
        },
        include: {
          registrations: {
            where: { userId: user.id },
            take: 1,
          },
        },
        orderBy: [{ startsAt: "asc" }],
        take: 60,
      }),
      this.prisma.training.findMany({
        where: {
          status: TrainingStatus.PUBLISHED,
          startsAt: { not: null, gte: now },
        },
        include: {
          enrollments: {
            where: { userId: user.id },
            take: 1,
          },
        },
        orderBy: [{ startsAt: "asc" }],
        take: 60,
      }),
      this.prisma.opportunity.findMany({
        where: {
          published: true,
          status: OpportunityStatus.OPEN,
          deadline: { not: null, gte: now },
        },
        include: {
          applications: {
            where: { userId: user.id },
            take: 1,
          },
        },
        orderBy: [{ deadline: "asc" }],
        take: 60,
      }),
      this.prisma.publication.findMany({
        where: readablePublicationWhere,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              type: true,
              profile: { select: { publicName: true } },
              organizationProfile: { select: { name: true } },
              partnerProfile: { select: { name: true } },
            },
          },
          attachments: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
          _count: { select: { comments: true, reactions: true, shares: true } },
        },
        orderBy: [{ opportunityDeadline: "asc" }, { publishedAt: "desc" }],
        take: 80,
      }),
    ]);

    const items = [
      ...events.map((event) => this.serializeAgendaEvent(event)),
      ...trainings.map((training) => this.serializeAgendaTraining(training)),
      ...opportunities.map((opportunity) => this.serializeAgendaOpportunity(opportunity, user)),
      ...publications.map((publication) => this.serializeAgendaPublication(publication, user)),
    ].sort((first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime());

    return {
      accountType: user.type,
      canPublishEvent: this.canPublishEvent(user.type),
      items,
      upcoming: items.slice(0, 12),
      deadlines: items.filter((item) => item.kind === "OPPORTUNITY" || item.kind === "JOB").slice(0, 8),
      registered: items.filter((item) => item.registrationStatus || item.enrollmentStatus || item.applicationStatus),
    };
  }

  async registerAgendaEvent(authUser: AuthUser, id: string) {
    const user = await this.getActiveUser(authUser);
    const event = await this.prisma.event.findUnique({
      where: { id },
      select: { id: true, published: true, startsAt: true },
    });

    if (!event || !event.published || event.startsAt < new Date()) {
      throw new NotFoundException("Cet événement n'est pas disponible.");
    }

    const registration = await this.prisma.eventRegistration.upsert({
      where: { eventId_userId: { eventId: event.id, userId: user.id } },
      create: { eventId: event.id, userId: user.id, status: EventRegistrationStatus.REGISTERED },
      update: { status: EventRegistrationStatus.REGISTERED },
    });

    return {
      success: true,
      registration,
      agenda: await this.getAgenda(authUser),
    };
  }

  async getCertificates(authUser: AuthUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        type: true,
        status: true,
        firstName: true,
        lastName: true,
        emailVerifiedAt: true,
        profile: {
          select: {
            memberNumber: true,
            profileCompletion: true,
            verifiedAt: true,
          },
        },
        certificates: {
          orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }],
          include: {
            training: {
              select: {
                id: true,
                title: true,
                slug: true,
                startsAt: true,
                certificateEnabled: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException("Votre connexion n'est plus valide. Connectez-vous à nouveau.");
    }

    const canViewCertificates = this.canViewCertificates(user.type);

    if (!canViewCertificates) {
      return {
        accountType: user.type,
        canViewCertificates,
        memberNumber: null,
        holderName: `${user.firstName} ${user.lastName}`,
        certificates: [],
        badges: [],
        stats: {
          issued: 0,
          pending: 0,
          revoked: 0,
          visibleBadges: 0,
        },
      };
    }

    const certificates = user.certificates.map((certificate) => this.serializeCertificate(certificate));
    const issuedCount = certificates.filter((certificate) => certificate.status === CertificateStatus.ISSUED).length;
    const pendingCount = certificates.filter((certificate) => certificate.status === CertificateStatus.PENDING).length;
    const revokedCount = certificates.filter((certificate) => certificate.status === CertificateStatus.REVOKED).length;
    const badges = this.memberBadges({
      emailVerifiedAt: user.emailVerifiedAt,
      profileVerifiedAt: user.profile?.verifiedAt ?? null,
      profileCompletion: user.profile?.profileCompletion ?? 0,
      issuedCertificates: issuedCount,
    });

    return {
      accountType: user.type,
      canViewCertificates,
      memberNumber: user.profile?.memberNumber ?? null,
      holderName: `${user.firstName} ${user.lastName}`,
      certificates,
      badges,
      stats: {
        issued: issuedCount,
        pending: pendingCount,
        revoked: revokedCount,
        visibleBadges: badges.length,
      },
    };
  }

  async verifyCertificate(number: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { number },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            profile: { select: { memberNumber: true } },
          },
        },
        training: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundException("Ce certificat est introuvable.");
    }

    return {
      valid: certificate.status === CertificateStatus.ISSUED,
      title: certificate.title,
      number: certificate.number,
      status: certificate.status,
      issuedAt: certificate.issuedAt,
      expiresAt: certificate.expiresAt,
      holderName: `${certificate.user.firstName} ${certificate.user.lastName}`,
      memberNumber: certificate.user.profile?.memberNumber ?? null,
      trainingTitle: certificate.training?.title ?? null,
    };
  }

  async issueCertificate(authUser: AuthUser, input: Record<string, unknown>) {
    if (authUser.type !== AccountType.ADMIN) {
      throw new ForbiddenException("Seul un administrateur CCA peut délivrer un certificat.");
    }

    const userId = typeof input.userId === "string" ? input.userId.trim() : "";
    const trainingId = typeof input.trainingId === "string" && input.trainingId.trim() ? input.trainingId.trim() : null;
    const title = typeof input.title === "string" ? input.title.trim() : "";
    const fileUrl = typeof input.fileUrl === "string" && input.fileUrl.trim() ? input.fileUrl.trim() : null;
    const badgeUrl = typeof input.badgeUrl === "string" && input.badgeUrl.trim() ? input.badgeUrl.trim() : null;
    const status = input.status === CertificateStatus.PENDING ? CertificateStatus.PENDING : CertificateStatus.ISSUED;

    if (!userId || !title) {
      throw new BadRequestException("Indiquez l'apprenant et le titre du certificat.");
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, type: true, status: true },
    });

    if (!targetUser || targetUser.status !== AccountStatus.ACTIVE || !this.canViewCertificates(targetUser.type)) {
      throw new BadRequestException("Ce certificat doit être rattaché à un créateur ou un apprenant actif.");
    }

    if (trainingId) {
      const training = await this.prisma.training.findUnique({
        where: { id: trainingId },
        select: { id: true, certificateEnabled: true },
      });

      if (!training || !training.certificateEnabled) {
        throw new BadRequestException("Cette formation ne permet pas de délivrer un certificat CCA.");
      }
    }

    const certificate = await this.prisma.certificate.create({
      data: {
        userId,
        trainingId,
        title,
        number: await this.generateCertificateNumber(),
        status,
        issuedAt: status === CertificateStatus.ISSUED ? new Date() : null,
        fileUrl,
        badgeUrl,
      },
      include: {
        training: {
          select: {
            id: true,
            title: true,
            slug: true,
            startsAt: true,
            certificateEnabled: true,
          },
        },
      },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.CERTIFICATE,
        title: status === CertificateStatus.ISSUED ? "Certificat CCA délivré" : "Certificat CCA en préparation",
        message: status === CertificateStatus.ISSUED
          ? `Votre certificat "${title}" est disponible dans votre espace membre.`
          : `Votre certificat "${title}" est en préparation par l'équipe CCA.`,
        href: "/espace-membre/certificats",
      },
    });

    return {
      success: true,
      certificate: this.serializeCertificate(certificate),
    };
  }

  async updateProfile(authUser: AuthUser, input: UpdateMemberProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.userId },
      include: {
        profile: true,
        organizationProfile: true,
        partnerProfile: true,
      },
    });

    if (!user || user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException("Votre connexion n'est plus valide. Connectez-vous à nouveau.");
    }

    const uploadsToDelete: string[] = [];

    if (user.profile && input.avatarUrl !== undefined && input.avatarUrl !== user.profile.avatarUrl && user.profile.avatarUrl) {
      uploadsToDelete.push(user.profile.avatarUrl);
    }

    if (user.profile && input.cvUrl !== undefined && input.cvUrl !== user.profile.cvUrl && user.profile.cvUrl) {
      uploadsToDelete.push(user.profile.cvUrl);
    }

    if (user.organizationProfile && input.organizationLogoUrl !== undefined && input.organizationLogoUrl !== user.organizationProfile.logoUrl && user.organizationProfile.logoUrl) {
      uploadsToDelete.push(user.organizationProfile.logoUrl);
    }

    if (user.partnerProfile && input.partnerLogoUrl !== undefined && input.partnerLogoUrl !== user.partnerProfile.logoUrl && user.partnerProfile.logoUrl) {
      uploadsToDelete.push(user.partnerProfile.logoUrl);
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const accountData = {
        firstName: this.requiredText(input.firstName ?? user.firstName, "Le prénom est requis"),
        lastName: this.requiredText(input.lastName ?? user.lastName, "Le nom est requis"),
        phone: this.nextOptionalText(input.phone, user.phone),
      };

      await tx.user.update({
        where: { id: user.id },
        data: accountData,
      });

      if (user.type === AccountType.CREATOR || user.type === AccountType.LEARNER) {
        if (!user.profile) {
          throw new BadRequestException("Aucun profil Creative ID n'est associé à ce compte.");
        }

        const profileData = {
          publicName: this.nextOptionalText(input.publicName, user.profile.publicName),
          country: this.requiredText(input.country ?? user.profile.country, "Le pays est requis"),
          city: this.requiredText(input.city ?? user.profile.city, "La ville est requise"),
          profession: this.nextOptionalText(input.profession, user.profile.profession),
          birthDate: input.birthDate ? new Date(input.birthDate) : user.profile.birthDate,
          gender: input.gender ?? user.profile.gender,
          discipline: this.requiredText(input.discipline ?? user.profile.discipline, "La discipline est requise"),
          otherDiscipline: this.nextOptionalText(input.otherDiscipline, user.profile.otherDiscipline),
          bio: this.nextOptionalText(input.bio, user.profile.bio),
          portfolioUrl: this.nextOptionalText(input.portfolioUrl, user.profile.portfolioUrl),
          websiteUrl: this.nextOptionalText(input.websiteUrl, user.profile.websiteUrl),
          avatarUrl: this.nextOptionalText(input.avatarUrl, user.profile.avatarUrl),
          cvUrl: this.nextOptionalText(input.cvUrl, user.profile.cvUrl),
          skills: this.nextOptionalTextList(input.skills, user.profile.skills),
          languages: this.nextOptionalTextList(input.languages, user.profile.languages),
          availability: this.nextOptionalText(input.availability, user.profile.availability),
          visibility: input.visibility ?? user.profile.visibility,
        };

        await tx.creativeProfile.update({
          where: { userId: user.id },
          data: {
            ...profileData,
            profileCompletion: this.calculateCreativeProfileCompletion({
              ...user.profile,
              ...profileData,
            }),
          },
        });
      }

      if (user.type === AccountType.ORGANIZATION) {
        if (!user.organizationProfile) {
          throw new BadRequestException("Aucun profil organisation n'est associé à ce compte.");
        }

        await tx.organizationProfile.update({
          where: { userId: user.id },
          data: {
            name: this.requiredText(input.organizationName ?? user.organizationProfile.name, "Le nom de l'organisation est requis"),
            legalName: this.nextOptionalText(input.organizationLegalName, user.organizationProfile.legalName),
            sector: this.nextOptionalText(input.organizationSector, user.organizationProfile.sector),
            country: this.requiredText(input.country ?? user.organizationProfile.country, "Le pays est requis"),
            city: this.requiredText(input.city ?? user.organizationProfile.city, "La ville est requise"),
            websiteUrl: this.nextOptionalText(input.websiteUrl, user.organizationProfile.websiteUrl),
            logoUrl: this.nextOptionalText(input.organizationLogoUrl, user.organizationProfile.logoUrl),
            description: this.nextOptionalText(input.organizationDescription ?? input.bio, user.organizationProfile.description),
          },
        });
      }

      if (user.type === AccountType.PARTNER) {
        if (!user.partnerProfile) {
          throw new BadRequestException("Aucun profil partenaire n'est associé à ce compte.");
        }

        await tx.partnerProfile.update({
          where: { userId: user.id },
          data: {
            name: this.requiredText(input.partnerName ?? user.partnerProfile.name, "Le nom du partenaire est requis"),
            partnerType: this.requiredText(input.partnerType ?? user.partnerProfile.partnerType, "Le type de partenaire est requis"),
            country: this.requiredText(input.country ?? user.partnerProfile.country, "Le pays est requis"),
            city: this.nextOptionalText(input.city, user.partnerProfile.city),
            websiteUrl: this.nextOptionalText(input.websiteUrl, user.partnerProfile.websiteUrl),
            logoUrl: this.nextOptionalText(input.partnerLogoUrl, user.partnerProfile.logoUrl),
            description: this.nextOptionalText(input.partnerDescription ?? input.bio, user.partnerProfile.description),
          },
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: {
          profile: true,
          organizationProfile: true,
          partnerProfile: true,
        },
      });
    });

    await Promise.all(uploadsToDelete.map((url) => this.deleteStoredUpload(url)));

    return this.toAuthMeResponse(updatedUser);
  }

  async uploadProfileAsset(authUser: AuthUser, kind: string, file?: Express.Multer.File) {
    const uploadKind = this.validateUploadKind(kind);
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.userId },
      include: {
        profile: true,
        organizationProfile: true,
        partnerProfile: true,
      },
    });

    if (!user || user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException("Votre connexion n'est plus valide. Connectez-vous à nouveau.");
    }

    this.validateUploadTarget(user.type, uploadKind);
    this.validateUploadedFile(uploadKind, file);

    const previousUploadUrl = this.previousUploadUrl(user, uploadKind);
    const storedFile = await this.storeUploadedFile(user.id, uploadKind, file);
    const updatedUser = await this.prisma.$transaction(async (tx) => {
      if (uploadKind === "AVATAR") {
        if (!user.profile) {
          throw new BadRequestException("Aucun profil Creative ID n'est associé à ce compte.");
        }

        await tx.creativeProfile.update({
          where: { userId: user.id },
          data: {
            avatarUrl: storedFile.url,
            profileCompletion: this.calculateCreativeProfileCompletion({
              ...user.profile,
              avatarUrl: storedFile.url,
            }),
          },
        });
      }

      if (uploadKind === "CV") {
        if (!user.profile) {
          throw new BadRequestException("Aucun profil Creative ID n'est associé à ce compte.");
        }

        await tx.creativeProfile.update({
          where: { userId: user.id },
          data: {
            cvUrl: storedFile.url,
            profileCompletion: this.calculateCreativeProfileCompletion({
              ...user.profile,
              cvUrl: storedFile.url,
            }),
          },
        });
      }

      if (uploadKind === "LOGO") {
        if (user.type === AccountType.ORGANIZATION) {
          if (!user.organizationProfile) {
            throw new BadRequestException("Aucun profil organisation n'est associé à ce compte.");
          }

          await tx.organizationProfile.update({
            where: { userId: user.id },
            data: { logoUrl: storedFile.url },
          });
        }

        if (user.type === AccountType.PARTNER) {
          if (!user.partnerProfile) {
            throw new BadRequestException("Aucun profil partenaire n'est associé à ce compte.");
          }

          await tx.partnerProfile.update({
            where: { userId: user.id },
            data: { logoUrl: storedFile.url },
          });
        }
      }

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: {
          profile: true,
          organizationProfile: true,
          partnerProfile: true,
        },
      });
    });

    if (previousUploadUrl) {
      await this.deleteStoredUpload(previousUploadUrl);
    }

    return {
      ...this.toAuthMeResponse(updatedUser),
      fileUrl: storedFile.url,
    };
  }

  private calculateCreativeProfileCompletion(profile: {
    publicName: string | null;
    country: string;
    city: string;
    profession: string | null;
    birthDate: Date | null;
    gender: unknown;
    discipline: string;
    bio: string | null;
    portfolioUrl: string | null;
    websiteUrl: string | null;
    avatarUrl: string | null;
    cvUrl: string | null;
    skills: string[];
    languages: string[];
    availability: string | null;
  }) {
    const checks = [
      profile.publicName,
      profile.country,
      profile.city,
      profile.profession,
      profile.birthDate,
      profile.gender,
      profile.discipline,
      profile.bio,
      profile.skills.length > 0,
      profile.languages.length > 0,
      profile.portfolioUrl || profile.websiteUrl,
      profile.avatarUrl || profile.cvUrl,
      profile.availability,
    ];

    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
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

  private nextOptionalText(value: unknown, current: string | null) {
    return value === undefined ? current : this.optionalText(value);
  }

  private optionalTextList(value: unknown) {
    return Array.isArray(value) ? value.map((item) => this.optionalText(item)).filter((item): item is string => !!item) : [];
  }

  private serializeJsonStringList(value: unknown) {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && !!item.trim()) : [];
  }

  private nextOptionalTextList(value: unknown, current: string[]) {
    return value === undefined ? current : this.optionalTextList(value);
  }

  private validateUploadKind(kind: string): ProfileUploadKind {
    if (kind === "AVATAR" || kind === "LOGO" || kind === "CV") {
      return kind;
    }

    throw new BadRequestException("Choisissez un type de fichier valide.");
  }

  private validateUploadTarget(accountType: AccountType, kind: ProfileUploadKind) {
    const isCreativeProfile = accountType === AccountType.CREATOR || accountType === AccountType.LEARNER;

    if ((kind === "AVATAR" || kind === "CV") && !isCreativeProfile) {
      throw new BadRequestException("Ce type de fichier est réservé aux profils créatifs et apprenants.");
    }

    if (kind === "LOGO" && accountType !== AccountType.ORGANIZATION && accountType !== AccountType.PARTNER) {
      throw new BadRequestException("Le logo est réservé aux organisations et partenaires.");
    }
  }

  private validateUploadedFile(kind: ProfileUploadKind, file?: Express.Multer.File): asserts file is Express.Multer.File {
    if (!file) {
      throw new BadRequestException("Choisissez un fichier à envoyer.");
    }

    const imageTypes = ["image/jpeg", "image/png", "image/webp"];
    const isImageUpload = kind === "AVATAR" || kind === "LOGO";
    const maxSize = isImageUpload ? 3 * 1024 * 1024 : 8 * 1024 * 1024;
    const accepted = isImageUpload ? imageTypes : ["application/pdf"];

    if (!accepted.includes(file.mimetype)) {
      throw new BadRequestException(isImageUpload ? "Envoyez une image JPG, PNG ou WebP." : "Envoyez un fichier PDF valide.");
    }

    if (file.size > maxSize) {
      throw new BadRequestException(isImageUpload ? "L'image ne doit pas dépasser 3 Mo." : "Le PDF ne doit pas dépasser 8 Mo.");
    }
  }

  private async storeUploadedFile(userId: string, kind: ProfileUploadKind, file: Express.Multer.File) {
    const extension = this.fileExtension(file);
    const safeKind = kind.toLowerCase();
    const originalName = this.safeOriginalFileName(file.originalname, extension);
    const fileName = `${safeKind}-${Date.now()}-${originalName}-${randomUUID()}${extension}`;
    const relativeDirectory = join("member", userId);
    const uploadsRoot = resolve(process.cwd(), this.config.get<string>("UPLOADS_DIR") ?? "uploads");
    const directory = join(uploadsRoot, relativeDirectory);

    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, fileName), file.buffer);

    return {
      fileName,
      url: `${this.publicBackendUrl()}/uploads/${relativeDirectory}/${fileName}`,
    };
  }

  private previousUploadUrl(
    user: {
      type: AccountType;
      profile: { avatarUrl: string | null; cvUrl: string | null } | null;
      organizationProfile: { logoUrl: string | null } | null;
      partnerProfile: { logoUrl: string | null } | null;
    },
    kind: ProfileUploadKind,
  ) {
    if (kind === "AVATAR") {
      return user.profile?.avatarUrl ?? null;
    }

    if (kind === "CV") {
      return user.profile?.cvUrl ?? null;
    }

    if (user.type === AccountType.ORGANIZATION) {
      return user.organizationProfile?.logoUrl ?? null;
    }

    if (user.type === AccountType.PARTNER) {
      return user.partnerProfile?.logoUrl ?? null;
    }

    return null;
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

    if ([".jpg", ".jpeg", ".png", ".webp", ".pdf"].includes(extension)) {
      return extension;
    }

    const extensions: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "application/pdf": ".pdf",
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

  private publicBackendUrl() {
    const configuredUrl = this.config.get<string>("PUBLIC_BACKEND_URL");

    if (configuredUrl?.trim()) {
      return configuredUrl.replace(/\/+$/, "");
    }

    const port = this.config.get<number>("PORT") ?? 4000;
    return `http://localhost:${port}`;
  }

  private publicFrontendUrl() {
    const configuredUrl = this.config.get<string>("FRONTEND_URL");

    if (configuredUrl?.trim()) {
      return configuredUrl.replace(/\/+$/, "");
    }

    return "http://localhost:3000";
  }

  private canViewCertificates(accountType: AccountType) {
    return accountType === AccountType.CREATOR || accountType === AccountType.LEARNER;
  }

  private async generateCertificateNumber() {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const year = new Date().getFullYear();
      const suffix = Math.floor(100000 + Math.random() * 900000);
      const number = `CCA-CERT-${year}-${suffix}`;
      const exists = await this.prisma.certificate.findUnique({
        where: { number },
        select: { id: true },
      });

      if (!exists) {
        return number;
      }
    }

    throw new BadRequestException("Impossible de générer un numéro de certificat unique. Réessayez dans un instant.");
  }

  private serializeCertificate(certificate: {
    id: string;
    title: string;
    number: string;
    status: CertificateStatus;
    issuedAt: Date | null;
    expiresAt: Date | null;
    fileUrl: string | null;
    badgeUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    training: {
      id: string;
      title: string;
      slug: string;
      startsAt: Date | null;
      certificateEnabled: boolean;
    } | null;
  }) {
    return {
      id: certificate.id,
      title: certificate.title,
      number: certificate.number,
      status: certificate.status,
      statusLabel: this.certificateStatusLabel(certificate.status),
      issuedAt: certificate.issuedAt,
      expiresAt: certificate.expiresAt,
      fileUrl: certificate.fileUrl,
      badgeUrl: certificate.badgeUrl,
      verificationUrl: `${this.publicFrontendUrl()}/certificats/verifier?number=${encodeURIComponent(certificate.number)}`,
      training: certificate.training
        ? {
            id: certificate.training.id,
            title: certificate.training.title,
            slug: certificate.training.slug,
            startsAt: certificate.training.startsAt,
            certificateEnabled: certificate.training.certificateEnabled,
          }
        : null,
      createdAt: certificate.createdAt,
      updatedAt: certificate.updatedAt,
    };
  }

  private serializePortfolioItem(item: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    mediaUrl: string | null;
    externalUrl: string | null;
    year: number | null;
    featured: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      mediaUrl: item.mediaUrl,
      externalUrl: item.externalUrl,
      year: item.year,
      featured: item.featured,
      order: item.order,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private buildCreativeIdHistory(user: {
    enrollments: {
      status: EnrollmentStatus;
      progress: number;
      enrolledAt: Date;
      completedAt: Date | null;
      training: { id: string; title: string; slug: string; startsAt: Date | null; endsAt: Date | null };
    }[];
    eventRegistrations: {
      status: EventRegistrationStatus;
      registeredAt: Date;
      attendedAt: Date | null;
      event: { id: string; title: string; slug: string; startsAt: Date; endsAt: Date };
    }[];
    opportunityApplications: {
      status: ApplicationStatus;
      submittedAt: Date | null;
      reviewedAt: Date | null;
      updatedAt: Date;
      opportunity: { id: string; title: string; slug: string; deadline: Date | null };
    }[];
    certificates: {
      status: CertificateStatus;
      title: string;
      number: string;
      issuedAt: Date | null;
      createdAt: Date;
      training: { title: string } | null;
    }[];
  }) {
    const items = [
      ...user.enrollments.map((enrollment) => ({
        kind: "training",
        label: "Formation",
        title: enrollment.training.title,
        status: enrollment.status,
        statusLabel: this.enrollmentStatusLabel(enrollment.status),
        date: enrollment.completedAt ?? enrollment.enrolledAt,
        meta: `${enrollment.progress}% de progression`,
        href: "/espace-membre/formations#mes-inscriptions",
      })),
      ...user.eventRegistrations.map((registration) => ({
        kind: "event",
        label: "Événement",
        title: registration.event.title,
        status: registration.status,
        statusLabel: this.eventRegistrationStatusLabel(registration.status),
        date: registration.attendedAt ?? registration.registeredAt,
        meta: registration.status === EventRegistrationStatus.ATTENDED ? "Participation confirmée" : "Inscription enregistrée",
        href: "/espace-membre/agenda",
      })),
      ...user.opportunityApplications.map((application) => ({
        kind: "opportunity",
        label: "Candidature",
        title: application.opportunity.title,
        status: application.status,
        statusLabel: this.applicationStatusLabel(application.status),
        date: application.reviewedAt ?? application.submittedAt ?? application.updatedAt,
        meta: application.submittedAt ? "Dossier transmis à CCA" : "Dossier en préparation",
        href: "/espace-membre/opportunites#mes-candidatures",
      })),
      ...user.certificates.map((certificate) => ({
        kind: "certificate",
        label: "Certificat",
        title: certificate.training?.title ?? certificate.title,
        status: certificate.status,
        statusLabel: this.certificateStatusLabel(certificate.status),
        date: certificate.issuedAt ?? certificate.createdAt,
        meta: certificate.number,
        href: "/espace-membre/certificats",
      })),
    ];

    return items
      .sort((first, second) => second.date.getTime() - first.date.getTime())
      .slice(0, 20);
  }

  private certificateStatusLabel(status: CertificateStatus) {
    const labels: Record<CertificateStatus, string> = {
      [CertificateStatus.PENDING]: "En préparation",
      [CertificateStatus.ISSUED]: "Délivré",
      [CertificateStatus.REVOKED]: "Révoqué",
    };

    return labels[status];
  }

  private enrollmentStatusLabel(status: EnrollmentStatus) {
    const labels: Record<EnrollmentStatus, string> = {
      [EnrollmentStatus.ENROLLED]: "Inscrit",
      [EnrollmentStatus.IN_PROGRESS]: "En cours",
      [EnrollmentStatus.COMPLETED]: "Terminée",
      [EnrollmentStatus.CANCELLED]: "Annulée",
    };

    return labels[status];
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

  private eventRegistrationStatusLabel(status: EventRegistrationStatus) {
    const labels: Record<EventRegistrationStatus, string> = {
      [EventRegistrationStatus.REGISTERED]: "Inscrit",
      [EventRegistrationStatus.ATTENDED]: "Présent",
      [EventRegistrationStatus.CANCELLED]: "Annulé",
    };

    return labels[status];
  }

  private memberBadges(member: {
    emailVerifiedAt: Date | null;
    profileVerifiedAt: Date | null;
    profileCompletion: number;
    issuedCertificates: number;
  }) {
    return [
      member.emailVerifiedAt
        ? {
            title: "E-mail vérifié",
            text: "Votre compte est confirmé.",
            status: "valid",
          }
        : null,
      member.profileVerifiedAt
        ? {
            title: "Creative ID vérifié",
            text: "Votre profil a été validé par CCA.",
            status: "valid",
          }
        : null,
      member.profileCompletion >= 100
        ? {
            title: "Profil complet",
            text: "Votre Creative ID est prêt à être présenté.",
            status: "valid",
          }
        : null,
      member.issuedCertificates > 0
        ? {
            title: "Certificat CCA",
            text: `${member.issuedCertificates} certificat${member.issuedCertificates > 1 ? "s" : ""} délivré${member.issuedCertificates > 1 ? "s" : ""}.`,
            status: "valid",
          }
        : null,
    ].filter(Boolean);
  }

  private accountEvolutionTargets(type: AccountType) {
    if (type === AccountType.PUBLIC) {
      return [
        {
          type: AccountType.LEARNER,
          mode: "automatic_training",
          title: "Devenir apprenant",
          text: "Le statut apprenant s'active automatiquement dès votre première inscription à une formation CCA.",
        },
        {
          type: AccountType.CREATOR,
          mode: "request",
          title: "Demander le profil créateur",
          text: "CCA vérifie votre démarche, votre portfolio et votre profil avant d'activer le statut créateur.",
        },
      ];
    }

    if (type === AccountType.LEARNER) {
      return [
        {
          type: AccountType.CREATOR,
          mode: "request",
          title: "Passer créateur",
          text: "Demandez la validation CCA lorsque votre profil, vos créations et votre portfolio sont prêts.",
        },
      ];
    }

    return [];
  }

  private serializeAccountEvolutionRequest(request: {
    id: string;
    fromType: AccountType;
    requestedType: AccountType;
    status: AccountEvolutionRequestStatus;
    motivation: string | null;
    portfolioUrl: string | null;
    cvUrl: string | null;
    note: string | null;
    reviewedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
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
    };
  }

  private async notifyAdmins(input: { title: string; message: string; href: string }) {
    const admins = await this.prisma.user.findMany({
      where: { type: AccountType.ADMIN, status: AccountStatus.ACTIVE },
      select: { id: true },
    });

    await Promise.all(admins.map((admin) => this.notifications.createForUser({
      userId: admin.id,
      type: NotificationType.SYSTEM,
      title: input.title,
      message: input.message,
      href: input.href,
    }).catch(() => undefined)));
  }

  private async getActiveUser(authUser: AuthUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        type: true,
        status: true,
        firstName: true,
        lastName: true,
        phone: true,
        profile: { select: { discipline: true, country: true, city: true, portfolioUrl: true, cvUrl: true } },
        organizationProfile: { select: { sector: true, country: true, city: true } },
        partnerProfile: { select: { partnerType: true, country: true, city: true } },
      },
    });

    if (!user || user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException("Votre connexion n'est plus valide. Connectez-vous à nouveau.");
    }

    return user;
  }

  private async ensurePortfolioOwner(authUser: AuthUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, type: true, status: true, profile: { select: { id: true } } },
    });

    if (!user || user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException("Votre connexion n'est plus valide. Connectez-vous à nouveau.");
    }

    if (user.type !== AccountType.CREATOR && user.type !== AccountType.LEARNER) {
      throw new ForbiddenException("Le portfolio Creative ID est réservé aux créateurs et apprenants.");
    }

    if (!user.profile) {
      throw new BadRequestException("Aucun profil Creative ID n'est associé à ce compte.");
    }

    return user;
  }

  private canPublishTraining(accountType: AccountType) {
    return accountType === AccountType.ORGANIZATION || accountType === AccountType.PARTNER || accountType === AccountType.ADMIN;
  }

  private canPublishOpportunity(accountType: AccountType) {
    return accountType === AccountType.CREATOR || accountType === AccountType.ORGANIZATION || accountType === AccountType.PARTNER || accountType === AccountType.ADMIN;
  }

  private canPublishResource(accountType: AccountType) {
    return accountType === AccountType.CREATOR || accountType === AccountType.LEARNER || accountType === AccountType.ORGANIZATION || accountType === AccountType.PARTNER || accountType === AccountType.ADMIN;
  }

  private canPublishEvent(accountType: AccountType) {
    return accountType === AccountType.CREATOR || accountType === AccountType.ORGANIZATION || accountType === AccountType.PARTNER || accountType === AccountType.ADMIN;
  }

  private memberPublicationTypeLabel(type: PublicationType) {
    const labels: Record<PublicationType, string> = {
      [PublicationType.PROJECT]: "Projet",
      [PublicationType.CREATION]: "Création / œuvre",
      [PublicationType.QUESTION]: "Question",
      [PublicationType.COLLABORATION]: "Collaboration",
      [PublicationType.OPPORTUNITY]: "Opportunité",
      [PublicationType.JOB]: "Mission / emploi",
      [PublicationType.RESOURCE]: "Ressource",
      [PublicationType.GROUP_DISCUSSION]: "Discussion",
      [PublicationType.TRAINING]: "Formation",
      [PublicationType.EVENT]: "Événement",
      [PublicationType.ANNOUNCEMENT]: "Annonce officielle",
    };

    return labels[type];
  }

  private buildProfilePublicationExcerpt(content: string) {
    const cleanContent = content.replace(/\s+/g, " ").trim();

    return cleanContent.length > 170 ? `${cleanContent.slice(0, 167)}...` : cleanContent;
  }

  private compactSearchText(content: string | null | undefined) {
    const cleanContent = (content ?? "").replace(/\s+/g, " ").trim();

    if (!cleanContent) {
      return "";
    }

    return cleanContent.length > 115 ? `${cleanContent.slice(0, 112)}...` : cleanContent;
  }

  private resolveGlobalSearchLimit(value: unknown) {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return 5;
    }

    return Math.min(8, Math.max(1, Math.trunc(value)));
  }

  private emptyGlobalSearch(query: string) {
    const sections = {
      creators: [],
      publications: [],
      trainings: [],
      opportunities: [],
      resources: [],
      partners: [],
    };

    return {
      query,
      total: 0,
      results: [],
      sections,
    };
  }

  private resourceAccessRules(accountType: AccountType) {
    const canPublishResource = this.canPublishResource(accountType);

    return [
      {
        level: "PUBLIC",
        label: "Public",
        description: "Visible par tous les visiteurs et les membres.",
        canCreate: accountType === AccountType.ADMIN || accountType === AccountType.ORGANIZATION || accountType === AccountType.PARTNER,
      },
      {
        level: "MEMBERS",
        label: "Membres CCA",
        description: "Visible uniquement après connexion à l'espace membre.",
        canCreate: canPublishResource,
      },
      {
        level: "ENROLLED",
        label: "Inscrits à une formation",
        description: "Visible seulement aux personnes inscrites à la formation liée.",
        canCreate: accountType === AccountType.ADMIN || accountType === AccountType.ORGANIZATION || accountType === AccountType.PARTNER,
      },
      {
        level: "GROUP",
        label: "Groupe",
        description: "À utiliser dans les groupes pour une équipe ou une communauté précise.",
        canCreate: canPublishResource,
      },
      {
        level: "PRIVATE",
        label: "Brouillon privé",
        description: "Visible uniquement par son auteur tant que la ressource n'est pas publiée.",
        canCreate: canPublishResource,
      },
    ];
  }

  private resourceDetailInclude(userId: string) {
    return {
      training: { select: { id: true, title: true, slug: true } },
      uploadedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          type: true,
          profile: { select: { publicName: true } },
          organizationProfile: { select: { name: true } },
          partnerProfile: { select: { name: true } },
        },
      },
      usefulMarks: { where: { userId }, select: { id: true }, take: 1 },
      _count: { select: { views: true, downloads: true, usefulMarks: true } },
    } satisfies Prisma.ResourceInclude;
  }

  private async getAccessibleResource(authUser: AuthUser, id: string) {
    const user = await this.getActiveUser(authUser);
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: this.resourceDetailInclude(user.id),
    });

    if (!resource || !resource.published) {
      throw new NotFoundException("Cette ressource est introuvable.");
    }

    if (!(await this.canAccessResource(user, resource))) {
      throw new ForbiddenException("Votre compte n'a pas accès à cette ressource.");
    }

    return { user, resource };
  }

  private async canAccessResource(
    user: Awaited<ReturnType<MemberService["getActiveUser"]>>,
    resource: { accessLevel: ResourceAccessLevel; trainingId: string | null },
  ) {
    if (user.type === AccountType.ADMIN) {
      return true;
    }

    if (resource.accessLevel === ResourceAccessLevel.PUBLIC || resource.accessLevel === ResourceAccessLevel.MEMBERS) {
      return true;
    }

    if (resource.accessLevel === ResourceAccessLevel.ADMIN_ONLY) {
      return false;
    }

    if (resource.accessLevel === ResourceAccessLevel.ENROLLED && resource.trainingId) {
      const enrollment = await this.prisma.trainingEnrollment.findFirst({
        where: {
          userId: user.id,
          trainingId: resource.trainingId,
          status: { in: [EnrollmentStatus.ENROLLED, EnrollmentStatus.IN_PROGRESS, EnrollmentStatus.COMPLETED] },
        },
        select: { id: true },
      });

      return !!enrollment;
    }

    return false;
  }

  private resolveApplicationStatus(value: unknown) {
    if (value === ApplicationStatus.SUBMITTED || value === "submitted") {
      return ApplicationStatus.SUBMITTED;
    }

    return ApplicationStatus.DRAFT;
  }

  private serializeOpportunity(opportunity: {
    id: string;
    title: string;
    slug: string;
    description: string;
    type: OpportunityType;
    status: OpportunityStatus;
    deadline: Date | null;
    location: string | null;
    eligibilityUrl: string | null;
    published: boolean;
    applications: Array<{
      id: string;
      status: ApplicationStatus;
      motivation: string | null;
      discipline: string | null;
      city: string | null;
      phone: string | null;
      portfolioUrl: string | null;
      cvUrl: string | null;
      fileUrl: string | null;
      links: unknown;
      socialLinks: unknown;
      submittedAt: Date | null;
      reviewedAt: Date | null;
      adminNote: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }, user: Awaited<ReturnType<MemberService["getActiveUser"]>>) {
    const application = opportunity.applications[0] ?? null;
    const official = this.isOfficialCcaOpportunity(opportunity.title);

    return {
      id: opportunity.id,
      source: "opportunity",
      title: opportunity.title,
      category: this.opportunityTypeLabel(opportunity.type),
      status: opportunity.status,
      deadline: opportunity.deadline,
      deadlineLabel: opportunity.deadline ? this.formatShortDate(opportunity.deadline) : "À confirmer",
      location: opportunity.location ?? "À confirmer",
      mode: this.opportunityMode(opportunity.location, opportunity.eligibilityUrl),
      fit: this.opportunityFit(opportunity, user),
      description: opportunity.description,
      organizer: official ? "Creative Currencies Africa" : "Organisation CCA",
      reward: this.opportunityReward(opportunity.type),
      requirements: this.opportunityRequirements(opportunity.type, !!opportunity.eligibilityUrl),
      disciplines: this.opportunityDisciplines(opportunity.type, user),
      official,
      linkUrl: opportunity.eligibilityUrl,
      canApply: true,
      canManage: false,
      application: application
        ? {
            id: application.id,
            status: application.status,
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
          }
        : null,
    };
  }

  private serializeOpportunityPublication(publication: {
    id: string;
    title: string;
    type: PublicationType;
    content: string;
    excerpt: string | null;
    category: string | null;
    discipline: string | null;
    city: string | null;
    country: string | null;
    tags: string[];
    linkUrl: string | null;
    opportunityDeadline: Date | null;
    opportunityLocation: string | null;
    budgetRange: string | null;
    status: PublicationStatus;
    authorId: string;
    author: {
      firstName: string;
      lastName: string;
      type: AccountType;
      profile: { publicName: string | null; discipline: string; country: string; city: string } | null;
      organizationProfile: { name: string; sector: string | null; country: string; city: string } | null;
      partnerProfile: { name: string; partnerType: string; country: string; city: string | null } | null;
    };
    _count: { comments: number; reactions: number; shares: number };
  }, user: Awaited<ReturnType<MemberService["getActiveUser"]>>) {
    const official = publication.author.type === AccountType.ADMIN || this.isOfficialCcaOpportunity(publication.title);
    const location = publication.opportunityLocation ?? ([publication.city, publication.country].filter(Boolean).join(", ") || "À confirmer");

    return {
      id: `publication:${publication.id}`,
      publicationId: publication.id,
      source: "publication",
      title: publication.title,
      category: publication.type === PublicationType.JOB ? "Mission / emploi" : publication.category ?? "Appel à projets",
      status: publication.status,
      deadline: publication.opportunityDeadline,
      deadlineLabel: publication.opportunityDeadline ? this.formatShortDate(publication.opportunityDeadline) : "À vérifier",
      location,
      mode: this.opportunityMode(location, publication.linkUrl),
      fit: this.publicationOpportunityFit(publication, user),
      description: publication.excerpt ?? publication.content,
      organizer: official ? "Creative Currencies Africa" : this.trainingOrganizerName(publication.author),
      reward: publication.budgetRange ?? (publication.type === PublicationType.JOB ? "Mission à discuter" : "Modalités dans la publication"),
      requirements: ["Creative ID à jour", publication.linkUrl ? "Lien de candidature disponible" : "Contacter l'auteur", "Portfolio conseillé"],
      disciplines: [publication.discipline, publication.category, ...publication.tags].filter((item): item is string => !!item).slice(0, 4),
      official,
      linkUrl: publication.linkUrl,
      canApply: false,
      canManage: publication.authorId === user.id,
      application: null,
      commentsCount: publication._count.comments,
      reactionsCount: publication._count.reactions,
    };
  }

  private isOfficialCcaOpportunity(title: string) {
    return /creative currencies|cca|officiel/i.test(title);
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

  private opportunityMode(location?: string | null, linkUrl?: string | null) {
    const normalized = `${location ?? ""} ${linkUrl ?? ""}`.toLowerCase();

    if (normalized.includes("hybride")) {
      return "Hybride";
    }

    if (normalized.includes("ligne") || normalized.includes("online") || normalized.includes("http")) {
      return "En ligne";
    }

    return "Présentiel";
  }

  private opportunityFit(opportunity: { type: OpportunityType; location: string | null }, user: Awaited<ReturnType<MemberService["getActiveUser"]>>) {
    let score = 62;
    const location = opportunity.location?.toLowerCase() ?? "";
    const userCity = user.profile?.city ?? user.organizationProfile?.city ?? user.partnerProfile?.city ?? "";
    const userCountry = user.profile?.country ?? user.organizationProfile?.country ?? user.partnerProfile?.country ?? "";

    const creatorPreferredTypes: OpportunityType[] = [OpportunityType.CONTEST, OpportunityType.RESIDENCY, OpportunityType.MISSION, OpportunityType.FUNDING];
    const learnerPreferredTypes: OpportunityType[] = [OpportunityType.TRAINING, OpportunityType.CONTEST];

    if (user.type === AccountType.CREATOR && creatorPreferredTypes.includes(opportunity.type)) {
      score += 14;
    }

    if (user.type === AccountType.LEARNER && learnerPreferredTypes.includes(opportunity.type)) {
      score += 12;
    }

    if (location && (location.includes(userCity.toLowerCase()) || location.includes(userCountry.toLowerCase()))) {
      score += 12;
    }

    if (location.includes("ligne") || location.includes("online") || location.includes("afrique")) {
      score += 8;
    }

    return Math.min(score, 96);
  }

  private publicationOpportunityFit(publication: { discipline: string | null; city: string | null; country: string | null; tags: string[] }, user: Awaited<ReturnType<MemberService["getActiveUser"]>>) {
    let score = 64;
    const userDiscipline = user.profile?.discipline ?? user.organizationProfile?.sector ?? user.partnerProfile?.partnerType ?? "";
    const userCity = user.profile?.city ?? user.organizationProfile?.city ?? user.partnerProfile?.city ?? "";
    const userCountry = user.profile?.country ?? user.organizationProfile?.country ?? user.partnerProfile?.country ?? "";
    const haystack = [publication.discipline, publication.city, publication.country, ...publication.tags].join(" ").toLowerCase();

    if (userDiscipline && haystack.includes(userDiscipline.toLowerCase())) {
      score += 16;
    }

    if (userCity && haystack.includes(userCity.toLowerCase())) {
      score += 10;
    }

    if (userCountry && haystack.includes(userCountry.toLowerCase())) {
      score += 8;
    }

    return Math.min(score, 95);
  }

  private opportunityReward(type: OpportunityType) {
    const rewards: Record<OpportunityType, string> = {
      [OpportunityType.CONTEST]: "Sélection, visibilité ou prix",
      [OpportunityType.RESIDENCY]: "Accompagnement, résidence ou restitution",
      [OpportunityType.MISSION]: "Mission rémunérée ou prestation",
      [OpportunityType.FUNDING]: "Financement, bourse ou soutien",
      [OpportunityType.CASTING]: "Sélection de profil",
      [OpportunityType.FESTIVAL]: "Participation ou vitrine professionnelle",
      [OpportunityType.TRAINING]: "Accès à une formation ou masterclass",
    };

    return rewards[type];
  }

  private opportunityRequirements(type: OpportunityType, hasLink: boolean) {
    const base = ["Creative ID à jour", "Portfolio ou références"];

    if (type === OpportunityType.FUNDING || type === OpportunityType.RESIDENCY) {
      base.push("Note d'intention");
    } else if (type === OpportunityType.MISSION) {
      base.push("Disponibilité et proposition");
    } else {
      base.push("Présentation courte");
    }

    if (hasLink) {
      base.push("Formulaire externe disponible");
    }

    return base;
  }

  private opportunityDisciplines(type: OpportunityType, user: Awaited<ReturnType<MemberService["getActiveUser"]>>) {
    const userDiscipline = user.profile?.discipline ?? user.organizationProfile?.sector ?? user.partnerProfile?.partnerType;
    const defaults: Record<OpportunityType, string[]> = {
      [OpportunityType.CONTEST]: ["Arts visuels", "Mode", "Design"],
      [OpportunityType.RESIDENCY]: ["Arts visuels", "Écriture", "Performance"],
      [OpportunityType.MISSION]: ["Design", "Communication", "Production"],
      [OpportunityType.FUNDING]: ["Projets créatifs", "Culture", "Innovation"],
      [OpportunityType.CASTING]: ["Cinéma", "Mode", "Performance"],
      [OpportunityType.FESTIVAL]: ["Musique", "Cinéma", "Arts vivants"],
      [OpportunityType.TRAINING]: ["Toutes disciplines"],
    };

    return Array.from(new Set([userDiscipline, ...defaults[type]].filter((item): item is string => !!item))).slice(0, 4);
  }

  private serializeAgendaEvent(event: {
    id: string;
    title: string;
    description: string;
    type: EventType;
    startsAt: Date;
    endsAt: Date;
    location: string;
    whatsappUrl: string | null;
    facebookEventUrl: string | null;
    registrations: Array<{ id: string; status: EventRegistrationStatus; registeredAt: Date; attendedAt: Date | null }>;
  }) {
    const registration = event.registrations[0] ?? null;

    return {
      id: `event:${event.id}`,
      source: "event",
      sourceId: event.id,
      kind: "EVENT",
      kindLabel: this.eventTypeLabel(event.type),
      title: event.title,
      description: event.description,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      dateLabel: this.formatShortDate(event.startsAt),
      timeLabel: this.formatTimeRange(event.startsAt, event.endsAt),
      location: event.location,
      organizerName: "Creative Currencies Africa",
      href: event.whatsappUrl ?? event.facebookEventUrl ?? null,
      routeHref: "/espace-membre/agenda",
      actionLabel: registration ? "Inscrit" : "S'inscrire",
      canRegister: !registration,
      registrationStatus: registration?.status ?? null,
      enrollmentStatus: null,
      applicationStatus: null,
      official: true,
      status: "PUBLISHED",
    };
  }

  private serializeAgendaTraining(training: {
    id: string;
    title: string;
    description: string;
    startsAt: Date | null;
    endsAt: Date | null;
    location: string | null;
    enrollments: Array<{ id: string; status: EnrollmentStatus; progress: number }>;
  }) {
    const enrollment = training.enrollments[0] ?? null;
    const startsAt = training.startsAt ?? new Date();

    return {
      id: `training:${training.id}`,
      source: "training",
      sourceId: training.id,
      kind: "TRAINING",
      kindLabel: "Formation",
      title: training.title,
      description: training.description,
      startsAt,
      endsAt: training.endsAt,
      dateLabel: this.formatShortDate(startsAt),
      timeLabel: this.formatTimeRange(startsAt, training.endsAt),
      location: training.location ?? "À confirmer",
      organizerName: this.isOfficialCcaTraining(training.title) ? "Creative Currencies Africa" : "Organisateur CCA",
      href: null,
      routeHref: "/espace-membre/formations",
      actionLabel: enrollment ? "Inscrit" : "Voir la formation",
      canRegister: false,
      registrationStatus: null,
      enrollmentStatus: enrollment?.status ?? null,
      applicationStatus: null,
      official: this.isOfficialCcaTraining(training.title),
      status: "PUBLISHED",
    };
  }

  private serializeAgendaOpportunity(opportunity: {
    id: string;
    title: string;
    description: string;
    type: OpportunityType;
    deadline: Date | null;
    location: string | null;
    eligibilityUrl: string | null;
    applications: Array<{ id: string; status: ApplicationStatus }>;
  }, user: Awaited<ReturnType<MemberService["getActiveUser"]>>) {
    const application = opportunity.applications[0] ?? null;
    const startsAt = opportunity.deadline ?? new Date();

    return {
      id: `opportunity:${opportunity.id}`,
      source: "opportunity",
      sourceId: opportunity.id,
      kind: "OPPORTUNITY",
      kindLabel: this.opportunityTypeLabel(opportunity.type),
      title: opportunity.title,
      description: opportunity.description,
      startsAt,
      endsAt: null,
      dateLabel: this.formatShortDate(startsAt),
      timeLabel: "Date limite",
      location: opportunity.location ?? "À confirmer",
      organizerName: this.isOfficialCcaOpportunity(opportunity.title) ? "Creative Currencies Africa" : "Organisation CCA",
      href: opportunity.eligibilityUrl,
      routeHref: "/espace-membre/opportunites",
      actionLabel: application ? "Dossier ouvert" : "Voir l'opportunité",
      canRegister: false,
      registrationStatus: null,
      enrollmentStatus: null,
      applicationStatus: application?.status ?? null,
      official: this.isOfficialCcaOpportunity(opportunity.title),
      status: "PUBLISHED",
      fit: this.opportunityFit(opportunity, user),
    };
  }

  private serializeAgendaPublication(publication: {
    id: string;
    type: PublicationType;
    title: string;
    content: string;
    excerpt: string | null;
    category: string | null;
    city: string | null;
    country: string | null;
    linkUrl: string | null;
    opportunityDeadline: Date | null;
    opportunityLocation: string | null;
    budgetRange: string | null;
    contactEmail: string | null;
    routingDestinations: string[];
    status: PublicationStatus;
    authorId: string;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      type: AccountType;
      profile: { publicName: string | null } | null;
      organizationProfile: { name: string } | null;
      partnerProfile: { name: string } | null;
    };
  }, user: Awaited<ReturnType<MemberService["getActiveUser"]>>) {
    const startsAt = publication.opportunityDeadline ?? new Date();
    const location = publication.opportunityLocation ?? ([publication.city, publication.country].filter(Boolean).join(", ") || "À confirmer");
    const kind = publication.type === PublicationType.JOB ? "JOB" : publication.type;
    const official = publication.author.type === AccountType.ADMIN;

    return {
      id: `publication:${publication.id}`,
      publicationId: publication.id,
      source: "publication",
      sourceId: publication.id,
      kind,
      kindLabel: this.agendaPublicationKindLabel(publication.type, publication.category),
      title: publication.title,
      description: publication.excerpt ?? publication.content,
      startsAt,
      endsAt: null,
      dateLabel: this.formatShortDate(startsAt),
      timeLabel: this.agendaPublicationTimeLabel(publication.type),
      location,
      organizerName: official ? "Creative Currencies Africa" : this.resourceAuthorName(publication.author),
      href: publication.linkUrl,
      routeHref: this.agendaPublicationRoute(publication),
      actionLabel: this.agendaPublicationActionLabel(publication.type),
      canRegister: false,
      registrationStatus: null,
      enrollmentStatus: null,
      applicationStatus: null,
      official,
      status: publication.status,
      canManage: publication.authorId === user.id,
      budgetRange: publication.budgetRange,
      contactEmail: publication.contactEmail,
    };
  }

  private eventTypeLabel(type: EventType) {
    const labels: Record<EventType, string> = {
      [EventType.WORKSHOP]: "Workshop",
      [EventType.MASTERCLASS]: "Masterclass",
      [EventType.CONFERENCE]: "Conférence",
      [EventType.PANEL]: "Panel",
      [EventType.ACTIVATION]: "Activation",
      [EventType.VISIT]: "Visite",
      [EventType.FESTIVAL]: "Festival",
    };

    return labels[type];
  }

  private agendaPublicationKindLabel(type: PublicationType, category?: string | null) {
    if (type === PublicationType.TRAINING) {
      return "Formation";
    }

    if (type === PublicationType.EVENT) {
      return category ?? "Événement";
    }

    if (type === PublicationType.JOB) {
      return "Mission / emploi";
    }

    if (type === PublicationType.OPPORTUNITY) {
      return category ?? "Opportunité";
    }

    return category ?? "Publication datée";
  }

  private agendaPublicationTimeLabel(type: PublicationType) {
    if (type === PublicationType.OPPORTUNITY || type === PublicationType.JOB) {
      return "Date limite";
    }

    return "Date prévue";
  }

  private agendaPublicationActionLabel(type: PublicationType) {
    if (type === PublicationType.TRAINING) {
      return "Voir la formation";
    }

    if (type === PublicationType.EVENT) {
      return "Voir l'événement";
    }

    if (type === PublicationType.OPPORTUNITY || type === PublicationType.JOB) {
      return "Voir l'opportunité";
    }

    return "Ouvrir";
  }

  private agendaPublicationRoute(publication: { type: PublicationType; routingDestinations: string[] }) {
    if (publication.type === PublicationType.TRAINING || publication.routingDestinations.includes("trainings")) {
      return "/espace-membre/formations";
    }

    if (publication.type === PublicationType.EVENT || publication.routingDestinations.includes("agenda")) {
      return "/espace-membre/agenda";
    }

    if (publication.type === PublicationType.OPPORTUNITY || publication.type === PublicationType.JOB || publication.routingDestinations.includes("opportunities")) {
      return "/espace-membre/opportunites";
    }

    return "/espace-membre/reseau";
  }

  private serializeResource(resource: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    url: string;
    accessLevel: ResourceAccessLevel;
    trainingId: string | null;
    uploadedById: string | null;
    createdAt: Date;
    updatedAt: Date;
    training: { id: string; title: string; slug: string } | null;
    uploadedBy: {
      id: string;
      firstName: string;
      lastName: string;
      type: AccountType;
      profile: { publicName: string | null } | null;
      organizationProfile: { name: string } | null;
      partnerProfile: { name: string } | null;
    } | null;
    usefulMarks?: Array<{ id: string }>;
    _count?: { views: number; downloads: number; usefulMarks: number };
  }, user: Awaited<ReturnType<MemberService["getActiveUser"]>>) {
    const authorName = resource.uploadedBy ? this.resourceAuthorName(resource.uploadedBy) : "Creative Currencies Africa";
    const official = !resource.uploadedBy || resource.uploadedBy.type === AccountType.ADMIN;

    return {
      id: resource.id,
      source: "resource",
      title: resource.title,
      type: this.resourceTypeLabel(resource.type),
      category: this.resourceCategory(resource.type),
      accessLevel: resource.accessLevel,
      accessLabel: this.resourceAccessLabel(resource.accessLevel),
      status: "PUBLISHED",
      description: resource.description ?? this.resourceDefaultDescription(resource.type, resource.training?.title),
      href: resource.url,
      authorName,
      meta: [official ? "Officielle CCA" : authorName, resource.training?.title, this.formatShortDate(resource.createdAt)].filter(Boolean).join(" · "),
      official,
      recommended: official || !!resource.trainingId,
      training: resource.training
        ? {
            id: resource.training.id,
            title: resource.training.title,
            slug: resource.training.slug,
          }
        : null,
      attachments: [
        {
          name: resource.title,
          type: resource.type,
          url: resource.url,
        },
      ],
      isUseful: (resource.usefulMarks?.length ?? 0) > 0,
      secureDownload: true,
      counts: {
        views: resource._count?.views ?? 0,
        downloads: resource._count?.downloads ?? 0,
        usefulMarks: resource._count?.usefulMarks ?? 0,
      },
      canManage: user.type === AccountType.ADMIN || resource.uploadedById === user.id,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    };
  }

  private serializeResourcePublication(publication: {
    id: string;
    title: string;
    content: string;
    excerpt: string | null;
    category: string | null;
    audience: PublicationAudience;
    status: PublicationStatus;
    linkUrl: string | null;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    authorId: string;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      type: AccountType;
      profile: { publicName: string | null } | null;
      organizationProfile: { name: string } | null;
      partnerProfile: { name: string } | null;
    };
    attachments: Array<{ name: string | null; type: string; url: string; mimeType: string | null; sizeBytes: number | null }>;
    _count: { comments: number; reactions: number; shares: number };
  }, user: Awaited<ReturnType<MemberService["getActiveUser"]>>) {
    const authorName = this.resourceAuthorName(publication.author);
    const official = publication.author.type === AccountType.ADMIN;
    const primaryAttachment = publication.attachments[0] ?? null;
    const href = publication.linkUrl ?? primaryAttachment?.url ?? null;

    return {
      id: `publication:${publication.id}`,
      publicationId: publication.id,
      source: "publication",
      title: publication.title,
      type: this.publicationResourceTypeLabel(publication),
      category: publication.category ?? "Ressource utile",
      accessLevel: publication.audience,
      accessLabel: this.publicationAudienceLabel(publication.audience),
      status: publication.status,
      description: publication.excerpt ?? publication.content,
      href,
      authorName,
      meta: [official ? "Officielle CCA" : authorName, publication.publishedAt ? this.formatShortDate(publication.publishedAt) : "Brouillon"].filter(Boolean).join(" · "),
      official,
      recommended: official || publication._count.reactions >= 3,
      training: null,
      attachments: publication.attachments.map((attachment) => ({
        name: attachment.name ?? "Fichier joint",
        type: attachment.type,
        url: attachment.url,
      })),
      isUseful: false,
      secureDownload: false,
      counts: {
        views: 0,
        downloads: 0,
        usefulMarks: publication._count.reactions,
      },
      canManage: user.type === AccountType.ADMIN || publication.authorId === user.id,
      createdAt: publication.createdAt,
      updatedAt: publication.updatedAt,
    };
  }

  private resourceAuthorName(author: {
    firstName: string;
    lastName: string;
    profile: { publicName: string | null } | null;
    organizationProfile: { name: string } | null;
    partnerProfile: { name: string } | null;
  }) {
    return author.organizationProfile?.name ?? author.partnerProfile?.name ?? author.profile?.publicName ?? `${author.firstName} ${author.lastName}`.trim();
  }

  private resourceTypeLabel(type: string) {
    const labels: Record<string, string> = {
      PDF: "PDF",
      TEMPLATE: "Template",
      CONTRACT: "Contrat",
      GUIDE: "Guide",
      VIDEO: "Vidéo",
      PODCAST: "Podcast",
    };

    return labels[type] ?? "Ressource";
  }

  private resourceCategory(type: string) {
    const categories: Record<string, string> = {
      PDF: "Document",
      TEMPLATE: "Template",
      CONTRACT: "Juridique",
      GUIDE: "Guide pratique",
      VIDEO: "Vidéo",
      PODCAST: "Audio",
    };

    return categories[type] ?? "Ressource utile";
  }

  private resourceAccessLabel(accessLevel: ResourceAccessLevel) {
    const labels: Record<ResourceAccessLevel, string> = {
      [ResourceAccessLevel.PUBLIC]: "Public",
      [ResourceAccessLevel.MEMBERS]: "Membres CCA",
      [ResourceAccessLevel.ENROLLED]: "Inscrits à la formation",
      [ResourceAccessLevel.ADMIN_ONLY]: "Admin CCA",
    };

    return labels[accessLevel];
  }

  private publicationAudienceLabel(audience: PublicationAudience) {
    const labels: Record<PublicationAudience, string> = {
      [PublicationAudience.PUBLIC]: "Public",
      [PublicationAudience.MEMBERS]: "Membres CCA",
      [PublicationAudience.GROUP]: "Groupe",
      [PublicationAudience.PRIVATE]: "Privé",
    };

    return labels[audience];
  }

  private publicationResourceTypeLabel(publication: { category: string | null; linkUrl: string | null; attachments: Array<{ mimeType: string | null; type: string }> }) {
    const normalized = `${publication.category ?? ""} ${publication.linkUrl ?? ""} ${publication.attachments.map((attachment) => `${attachment.mimeType ?? ""} ${attachment.type}`).join(" ")}`.toLowerCase();

    if (normalized.includes("video")) {
      return "Vidéo";
    }

    if (normalized.includes("pdf")) {
      return "PDF";
    }

    if (normalized.includes("contrat")) {
      return "Contrat";
    }

    if (normalized.includes("template") || normalized.includes("modele")) {
      return "Template";
    }

    if (publication.linkUrl) {
      return "Lien utile";
    }

    return "Ressource";
  }

  private resourceDefaultDescription(type: string, trainingTitle?: string) {
    const suffix = trainingTitle ? ` liée à la formation ${trainingTitle}` : " pour les membres CCA";
    const descriptions: Record<string, string> = {
      PDF: `Document PDF${suffix}.`,
      TEMPLATE: `Modèle réutilisable${suffix}.`,
      CONTRACT: `Document de référence juridique ou contractuelle${suffix}.`,
      GUIDE: `Guide pratique${suffix}.`,
      VIDEO: `Vidéo ou replay${suffix}.`,
      PODCAST: `Contenu audio${suffix}.`,
    };

    return descriptions[type] ?? `Ressource utile${suffix}.`;
  }

  private serializeTraining(training: {
    id: string;
    title: string;
    slug: string;
    description: string;
    startsAt: Date | null;
    endsAt: Date | null;
    location: string | null;
    coverImageUrl: string | null;
    capacity: number | null;
    priceCents: number | null;
    currency: string;
    certificateEnabled: boolean;
    modules: Array<{ title: string; startsAt: Date | null; endsAt: Date | null }>;
    resources: Array<{ title: string; type: string; url: string; accessLevel: ResourceAccessLevel }>;
    enrollments: Array<{
      id: string;
      status: EnrollmentStatus;
      progress: number;
      motivation: string | null;
      phone: string | null;
      adminNote: string | null;
      enrolledAt: Date;
      reviewedAt: Date | null;
      completedAt: Date | null;
    }>;
    _count: { enrollments: number };
  }) {
    const enrollment = training.enrollments[0] ?? null;
    const isOfficial = this.isOfficialCcaTraining(training.title, "Creative Currencies Africa");

    const visibleResources = training.resources.filter((resource) => {
      if (resource.accessLevel === ResourceAccessLevel.ENROLLED) {
        return !!enrollment;
      }

      return resource.accessLevel === ResourceAccessLevel.PUBLIC || resource.accessLevel === ResourceAccessLevel.MEMBERS;
    });

    return {
      id: training.id,
      source: "training",
      title: training.title,
      category: isOfficial ? "Officielle CCA" : "Formation",
      level: "Tous niveaux",
      mode: this.trainingMode(training.location),
      location: training.location ?? "À confirmer",
      dates: this.formatDateRange(training.startsAt, training.endsAt),
      seats: training.capacity,
      enrolledCount: training._count.enrollments,
      progress: enrollment?.progress ?? 0,
      certificate: training.certificateEnabled,
      recommended: isOfficial,
      official: isOfficial,
      organizerName: isOfficial ? "Creative Currencies Africa" : "Organisateur CCA",
      description: training.description,
      modules: training.modules.length ? training.modules.map((module) => module.title) : ["Présentation", "Atelier pratique", "Restitution"],
      sessions: training.modules.map((module) => ({
        date: this.formatShortDate(module.startsAt),
        title: module.title,
        time: this.formatTimeRange(module.startsAt, module.endsAt),
      })),
      resources: visibleResources.map((resource) => ({
        title: resource.title,
        type: resource.type,
        url: resource.url,
      })),
      linkUrl: null,
      coverImageUrl: training.coverImageUrl,
      status: "PUBLISHED",
      canEnroll: true,
      canManage: false,
      enrollment: enrollment
        ? {
            id: enrollment.id,
            status: enrollment.status,
            progress: enrollment.progress,
            motivation: enrollment.motivation,
            phone: enrollment.phone,
            adminNote: enrollment.adminNote,
            enrolledAt: enrollment.enrolledAt,
            reviewedAt: enrollment.reviewedAt,
            completedAt: enrollment.completedAt,
          }
        : null,
    };
  }

  private serializeTrainingPublication(publication: {
    id: string;
    title: string;
    content: string;
    excerpt: string | null;
    category: string | null;
    discipline: string | null;
    city: string | null;
    country: string | null;
    linkUrl: string | null;
    coverImageUrl: string | null;
    status: PublicationStatus;
    publishedAt: Date | null;
    updatedAt: Date;
    authorId: string;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      type: AccountType;
      profile: { publicName: string | null; discipline: string; country: string; city: string } | null;
      organizationProfile: { name: string; sector: string | null; country: string; city: string } | null;
      partnerProfile: { name: string; partnerType: string; country: string; city: string | null } | null;
    };
    attachments: Array<{ name: string | null; type: string; url: string }>;
    _count: { comments: number; reactions: number; shares: number };
  }, currentUserId: string) {
    const organizerName = this.trainingOrganizerName(publication.author);
    const official = publication.author.type === AccountType.ADMIN || this.isOfficialCcaTraining(publication.title, publication.category);

    return {
      id: `publication:${publication.id}`,
      publicationId: publication.id,
      source: "publication",
      title: publication.title,
      category: official ? "Officielle CCA" : publication.category ?? "Formation",
      level: "Tous niveaux",
      mode: this.trainingMode(publication.city ?? publication.country ?? publication.linkUrl),
      location: [publication.city, publication.country].filter(Boolean).join(", ") || "À confirmer",
      dates: publication.publishedAt ? `Publié le ${this.formatShortDate(publication.publishedAt)}` : "Dates à confirmer",
      seats: null,
      enrolledCount: publication._count.reactions,
      progress: 0,
      certificate: official || /certificat|certifiante|attestation/i.test(publication.content),
      recommended: official,
      official,
      organizerName: official ? "Creative Currencies Africa" : organizerName,
      description: publication.excerpt ?? publication.content,
      modules: this.trainingModulesFromPublication(publication.content),
      sessions: [],
      resources: publication.attachments.map((attachment) => ({
        title: attachment.name ?? "Document de formation",
        type: attachment.type,
        url: attachment.url,
      })),
      linkUrl: publication.linkUrl,
      coverImageUrl: publication.coverImageUrl,
      status: publication.status,
      canEnroll: false,
      canManage: publication.authorId === currentUserId,
      enrollment: null,
    };
  }

  private trainingOrganizerName(author: {
    firstName: string;
    lastName: string;
    profile: { publicName: string | null } | null;
    organizationProfile: { name: string } | null;
    partnerProfile: { name: string } | null;
  }) {
    return author.organizationProfile?.name ?? author.partnerProfile?.name ?? author.profile?.publicName ?? `${author.firstName} ${author.lastName}`;
  }

  private isOfficialCcaTraining(title: string, category?: string | null) {
    return /creative currencies|cca|officiel/i.test(`${title} ${category ?? ""}`);
  }

  private trainingMode(value?: string | null) {
    const normalized = value?.toLowerCase() ?? "";

    if (normalized.includes("ligne") || normalized.includes("online") || normalized.includes("http")) {
      return "En ligne";
    }

    if (normalized.includes("hybride")) {
      return "Hybride";
    }

    return "Présentiel";
  }

  private trainingModulesFromPublication(content: string) {
    const lines = content
      .split(/\n+/)
      .map((line) => line.replace(/^[-•\d.\s]+/, "").trim())
      .filter((line) => line.length > 8)
      .slice(0, 4);

    return lines.length ? lines : ["Présentation", "Atelier pratique", "Questions et orientation"];
  }

  private formatDateRange(startsAt?: Date | null, endsAt?: Date | null) {
    if (!startsAt) {
      return "Dates à confirmer";
    }

    const start = this.formatShortDate(startsAt);
    const end = endsAt ? this.formatShortDate(endsAt) : "";

    return end && end !== start ? `${start} - ${end}` : start;
  }

  private formatShortDate(value?: Date | null) {
    if (!value) {
      return "À confirmer";
    }

    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(value);
  }

  private formatTimeRange(startsAt?: Date | null, endsAt?: Date | null) {
    if (!startsAt) {
      return "Horaire à confirmer";
    }

    const formatter = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const start = formatter.format(startsAt);
    const end = endsAt ? formatter.format(endsAt) : "";

    return end ? `${start} - ${end}` : start;
  }

  private toAuthMeResponse(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    type: AccountType;
    status: AccountStatus;
    emailVerifiedAt: Date | null;
    profile: unknown;
    organizationProfile: unknown;
    partnerProfile: unknown;
  }) {
    return {
      user: this.toAuthUserResponse(user),
      profile: user.profile,
      organizationProfile: user.organizationProfile,
      partnerProfile: user.partnerProfile,
    };
  }

  private toAuthUserResponse(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    type: AccountType;
    status: AccountStatus;
    emailVerifiedAt: Date | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      type: user.type,
      status: user.status,
      emailVerified: !!user.emailVerifiedAt,
    };
  }
}
