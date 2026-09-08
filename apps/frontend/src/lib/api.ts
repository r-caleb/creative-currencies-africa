const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  type: string;
  status: string;
  emailVerified: boolean;
};

export type MemberProfile = {
  id: string;
  publicName: string | null;
  country: string;
  city: string;
  profession: string | null;
  birthDate: string | null;
  gender: string | null;
  discipline: string;
  otherDiscipline: string | null;
  bio: string | null;
  portfolioUrl: string | null;
  websiteUrl: string | null;
  avatarUrl: string | null;
  cvUrl: string | null;
  memberNumber: string;
  qrCodeUrl: string | null;
  skills: string[];
  languages: string[];
  availability: string | null;
  visibility: "PRIVATE" | "MEMBERS" | "PUBLIC";
  profileCompletion: number;
  verifiedAt: string | null;
};

export type OrganizationProfile = {
  id: string;
  name: string;
  legalName: string | null;
  sector: string | null;
  country: string;
  city: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  description: string | null;
  verifiedAt: string | null;
};

export type PartnerProfile = {
  id: string;
  name: string;
  partnerType: string;
  country: string;
  city: string | null;
  description: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  verifiedAt: string | null;
};

export type AuthMeResponse = {
  user: AuthUser;
  profile: MemberProfile | null;
  organizationProfile: OrganizationProfile | null;
  partnerProfile: PartnerProfile | null;
};

export type RegistrationPendingResponse = {
  verificationRequired: boolean;
  message: string;
  verificationExpiresAt: string;
  user: AuthUser;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type RefreshSessionResponse = {
  accessToken: string;
  refreshToken: string;
};

export type ForgotPasswordResponse = {
  success: boolean;
  message: string;
  resetExpiresAt: string;
};

export type ResetPasswordResponse = {
  success: boolean;
  message: string;
};

export type VerifyPasswordResetCodeResponse = {
  success: boolean;
  message: string;
};

export type UpdateMemberProfilePayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  publicName?: string;
  country?: string;
  city?: string;
  profession?: string;
  birthDate?: string;
  gender?: string;
  discipline?: string;
  otherDiscipline?: string;
  bio?: string;
  portfolioUrl?: string;
  websiteUrl?: string;
  avatarUrl?: string;
  cvUrl?: string;
  skills?: string[];
  languages?: string[];
  availability?: string;
  visibility?: "PRIVATE" | "MEMBERS" | "PUBLIC";
  organizationName?: string;
  organizationLegalName?: string;
  organizationSector?: string;
  organizationDescription?: string;
  organizationLogoUrl?: string;
  partnerName?: string;
  partnerType?: string;
  partnerDescription?: string;
  partnerLogoUrl?: string;
};

export type UploadProfileAssetKind = "AVATAR" | "LOGO" | "CV";

export type UploadProfileAssetResponse = AuthMeResponse & {
  fileUrl: string;
};

export type NetworkMember = {
  id: string;
  userId: string;
  isCurrentMember: boolean;
  publicName: string;
  accountType: string;
  memberNumber: string;
  city: string;
  country: string;
  profession: string | null;
  discipline: string;
  bio: string | null;
  avatarUrl: string | null;
  skills: string[];
  languages: string[];
  availability: string | null;
  visibility: "PRIVATE" | "MEMBERS" | "PUBLIC";
  profileCompletion: number;
  connected: boolean;
  connectedAt: string | null;
  connectionKind: "CONNECTION" | "FOLLOW";
  connectionStatus: "PENDING" | "ACCEPTED" | "DECLINED" | null;
  connectionDirection: "OUTGOING" | "INCOMING" | null;
  mutualConnectionCount: number;
  mutualConnections: {
    userId: string;
    publicName: string;
    avatarUrl: string | null;
  }[];
  emailVerified: boolean;
  profileVerified: boolean;
  updatedAt: string;
};

export type NetworkMemberProfile = {
  profile: NetworkMember & {
    portfolioUrl: string | null;
    websiteUrl: string | null;
    cvUrl: string | null;
  };
  socialLinks: {
    id: string;
    network: string;
    url: string;
  }[];
  portfolioItems: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    mediaUrl: string | null;
    externalUrl: string | null;
    year: number | null;
    featured: boolean;
  }[];
  publications: {
    id: string;
    type: PublicationType;
    typeLabel: string;
    audience: PublicationAudience;
    title: string;
    excerpt: string | null;
    category: string | null;
    discipline: string | null;
    country: string | null;
    city: string | null;
    tags: string[];
    routingDestinations: string[];
    linkUrl: string | null;
    coverImageUrl: string | null;
    publishedAt: string | null;
    updatedAt: string;
    attachments: {
      id: string;
      type: PublicationAttachmentType;
      url: string;
      name: string | null;
      mimeType: string | null;
    }[];
    counts: {
      comments: number;
      reactions: number;
      shares: number;
    };
  }[];
};

export type CreativeIdPortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  mediaUrl: string | null;
  externalUrl: string | null;
  year: number | null;
  featured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type CreativeIdHistoryItem = {
  kind: "training" | "event" | "opportunity" | "certificate";
  label: string;
  title: string;
  status: string;
  statusLabel: string;
  date: string;
  meta: string;
  href: string;
};

export type CreativeIdRecord = {
  profile: MemberProfile & {
    socialLinks?: never;
  };
  socialLinks: {
    id: string;
    network: string;
    url: string;
  }[];
  portfolioItems: CreativeIdPortfolioItem[];
  history: CreativeIdHistoryItem[];
  badges: {
    title: string;
    text: string;
    status: string;
  }[];
  stats: {
    portfolioItems: number;
    trainings: number;
    certificates: number;
    opportunities: number;
    events: number;
  };
};

export type PortfolioItemPayload = {
  title: string;
  category: string;
  description?: string;
  mediaUrl?: string;
  externalUrl?: string;
  year?: number;
  featured?: boolean;
  order?: number;
};

export type NetworkMemberQuery = {
  q?: string;
  discipline?: string;
  country?: string;
  city?: string;
  language?: string;
  availability?: string;
};

export type GlobalSearchKind = "creator" | "publication" | "training" | "opportunity" | "resource" | "partner";

export type GlobalSearchItem = {
  id: string;
  type: GlobalSearchKind;
  label: string;
  title: string;
  description: string;
  meta: string;
  href: string;
  imageUrl: string | null;
};

export type GlobalSearchResponse = {
  query: string;
  total: number;
  results: GlobalSearchItem[];
  sections: {
    creators: GlobalSearchItem[];
    publications: GlobalSearchItem[];
    trainings: GlobalSearchItem[];
    opportunities: GlobalSearchItem[];
    resources: GlobalSearchItem[];
    partners: GlobalSearchItem[];
  };
};

export type PublicationType =
  | "PROJECT"
  | "CREATION"
  | "QUESTION"
  | "COLLABORATION"
  | "OPPORTUNITY"
  | "JOB"
  | "RESOURCE"
  | "GROUP_DISCUSSION"
  | "TRAINING"
  | "EVENT"
  | "ANNOUNCEMENT";

export type PublicationStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "REJECTED";
export type PublicationAudience = "PRIVATE" | "MEMBERS" | "PUBLIC" | "GROUP";
export type PublicationAttachmentType = "IMAGE" | "VIDEO" | "PDF" | "DOCUMENT" | "LINK" | "OTHER";
export type PublicationReactionType = "LIKE" | "SUPPORT" | "SAVE";
export type PublicationReportReason = "SPAM" | "INAPPROPRIATE" | "MISLEADING" | "HARASSMENT" | "OTHER";
export type PublicationReportStatus = "PENDING" | "REVIEWED" | "DISMISSED";

export type PublicationCapability = {
  value: PublicationType;
  label: string;
  description: string;
  destinations: string[];
  defaultAudience: PublicationAudience;
  allowed: boolean;
  allowedAccountTypes: string[];
  requiredFields: string[];
};

export type PublicationCapabilitiesResponse = {
  accountType: string;
  types: PublicationCapability[];
  audiences: PublicationAudience[];
};

export type PublicationAttachment = {
  id: string;
  publicationId: string;
  type: PublicationAttachmentType;
  url: string;
  name: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  order: number;
  createdAt: string;
};

export type PublicationUploadResponse = {
  type: PublicationAttachmentType;
  url: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
};

export type PublicationAuthor = {
  id: string;
  accountType: string;
  displayName: string;
  avatarUrl: string | null;
  memberNumber?: string;
  discipline: string | null;
  country: string | null;
  city: string | null;
  verified: boolean;
};

export type Publication = {
  id: string;
  type: PublicationType;
  typeLabel: string;
  status: PublicationStatus;
  audience: PublicationAudience;
  title: string;
  content: string;
  excerpt: string | null;
  category: string | null;
  discipline: string | null;
  country: string | null;
  city: string | null;
  tags: string[];
  routingDestinations: string[];
  linkUrl: string | null;
  coverImageUrl: string | null;
  groupId: string | null;
  opportunityDeadline: string | null;
  opportunityLocation: string | null;
  budgetRange: string | null;
  contactEmail: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: PublicationAuthor;
  mentions?: PublicationAuthor[];
  attachments: PublicationAttachment[];
  counts: {
    comments: number;
    reactions: number;
    shares: number;
  };
  permissions: {
    canEdit: boolean;
    canArchive: boolean;
  };
};

export type PublicationComment = {
  id: string;
  publicationId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    accountType: string;
    displayName: string;
    avatarUrl: string | null;
    memberNumber?: string;
    discipline: string | null;
    country: string | null;
    city: string | null;
    verified: boolean;
  };
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
};

export type PublicationReport = {
  id: string;
  reason: PublicationReportReason;
  message: string | null;
  status: PublicationReportStatus;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reporter: Publication["author"];
  publication: Publication;
};

export type PublicationReportsResponse = {
  reports: PublicationReport[];
  total: number;
  pending: number;
};

export type AdminMember = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl: string | null;
  type: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  phone: string | null;
  emailVerified: boolean;
  memberNumber: string | null;
  profileCompletion: number | null;
  discipline: string | null;
  country: string | null;
  city: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminPublication = Omit<Publication, "author" | "counts" | "permissions" | "typeLabel"> & {
  author: AdminMember;
  counts: {
    comments: number;
    reactions: number;
    shares: number;
    reports: number;
  };
};

export type AdminReport = Omit<PublicationReport, "reporter" | "publication"> & {
  reporter: AdminMember;
  publication: AdminPublication;
};

export type AdminDirectMessage = Omit<DirectMessage, "author" | "readAt"> & {
  author: AdminMember;
};

export type AdminDirectMessageReport = Omit<DirectMessageReport, "reporter" | "directMessage"> & {
  reporter: AdminMember;
  directMessage: AdminDirectMessage;
};

export type AdminGroupMessage = {
  id: string;
  groupId: string;
  groupName: string;
  content: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentMimeType: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  author: AdminMember;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
};

export type AdminGroupMessageReport = Omit<DirectMessageReport, "reporter" | "directMessage"> & {
  reporter: AdminMember;
  groupMessage: AdminGroupMessage;
};

export type AdminAuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  message: string | null;
  metadata: unknown;
  createdAt: string;
  admin: AdminMember | null;
  targetUser: AdminMember | null;
};

export type AdminRiskUser = {
  member: AdminMember;
  totalReports: number;
  publicationReports: number;
  messageReports: number;
  groupMessageReports?: number;
  pendingReports: number;
  reasons: string[];
  lastReportedAt: string;
};

export type AdminOverviewResponse = {
  summary: {
    membersTotal: number;
    activeMembers: number;
    pendingMembers: number;
    suspendedMembers: number;
    pendingReports: number;
    publishedPublications: number;
    draftPublications: number;
    rejectedPublications: number;
    applicationsPending: number;
  };
  content: {
    trainings: number;
    opportunities: number;
    resources: number;
    groups: number;
    certificatesIssued: number;
  };
  recentReports: AdminReport[];
  recentMembers: AdminMember[];
  recentPublications: AdminPublication[];
};

export type AdminMembersResponse = {
  members: AdminMember[];
  total: number;
};

export type AccountEvolutionStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type AccountEvolutionRequest = {
  id: string;
  fromType: string;
  requestedType: string;
  status: AccountEvolutionStatus;
  motivation: string | null;
  portfolioUrl: string | null;
  cvUrl: string | null;
  note: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AccountEvolutionTarget = {
  type: string;
  mode: "automatic_training" | "request";
  title: string;
  text: string;
};

export type MemberAccountEvolutionResponse = {
  accountType: string;
  availableTargets: AccountEvolutionTarget[];
  requests: AccountEvolutionRequest[];
};

export type AdminAccountEvolutionRequest = AccountEvolutionRequest & {
  user: AdminMember;
  reviewedBy: AdminMember | null;
};

export type AdminAccountEvolutionRequestsResponse = {
  requests: AdminAccountEvolutionRequest[];
  total: number;
  pending: number;
  page: number;
  limit: number;
};

export type AdminPublicationsResponse = {
  publications: AdminPublication[];
  total: number;
};

export type AdminReportsResponse = {
  reports: AdminReport[];
  total: number;
  pending: number;
};

export type AdminDirectMessageReportsResponse = {
  reports: AdminDirectMessageReport[];
  total: number;
  pending: number;
};

export type AdminGroupMessageReportsResponse = {
  reports: AdminGroupMessageReport[];
  total: number;
  pending: number;
};

export type AdminAuditLogsResponse = {
  logs: AdminAuditLog[];
  total: number;
};

export type AdminRiskUsersResponse = {
  users: AdminRiskUser[];
  total: number;
};

export type AdminDiscipline = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminDisciplinesResponse = {
  disciplines: AdminDiscipline[];
  total: number;
};

export type AdminPartner = {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublicPartner = Pick<AdminPartner, "id" | "name" | "type" | "description" | "logoUrl" | "website" | "order">;

export type PublicLandingEvent = Pick<
  AdminEvent,
  | "id"
  | "title"
  | "description"
  | "type"
  | "types"
  | "startsAt"
  | "endsAt"
  | "location"
  | "coverImageUrl"
  | "whatsappUrl"
  | "facebookEventUrl"
  | "featuredOnLanding"
>;

export type AdminPartnersResponse = {
  partners: AdminPartner[];
  total: number;
};

export type PartnerPayload = {
  name: string;
  type?: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  order?: number;
  published?: boolean;
};

export type AdminTrainingStatus = "DRAFT" | "PUBLISHED" | "COMPLETED" | "ARCHIVED";
export type AdminEventType = "WORKSHOP" | "MASTERCLASS" | "CONFERENCE" | "PANEL" | "NETWORKING" | "ACTIVATION" | "VISIT" | "FESTIVAL";
export type AdminResourceType = "PDF" | "TEMPLATE" | "CONTRACT" | "GUIDE" | "VIDEO" | "PODCAST";
export type AdminResourceAccessLevel = "PUBLIC" | "MEMBERS" | "ENROLLED" | "ADMIN_ONLY";
export type AdminOpportunityType = "CONTEST" | "RESIDENCY" | "MISSION" | "FUNDING" | "CASTING" | "FESTIVAL" | "TRAINING";
export type AdminOpportunityStatus = "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
export type AdminApplicationStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "SELECTED" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
export type AdminEnrollmentStatus = "ENROLLED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type GalleryAlbumCategory = "FORMATION" | "EVENT" | "BACKSTAGE" | "ACTIVATION" | "PARTNER" | "VISIT" | "CONFERENCE";

export type AdminTraining = {
  id: string;
  title: string;
  slug: string;
  description: string;
  startsAt: string | null;
  endsAt: string | null;
  location: string | null;
  coverImageUrl: string | null;
  capacity: number | null;
  priceCents: number | null;
  currency: string;
  status: AdminTrainingStatus;
  certificateEnabled: boolean;
  featuredOnLanding: boolean;
  createdAt: string;
  updatedAt: string;
  counts: {
    modules: number;
    enrollments: number;
    resources: number;
    certificates: number;
  };
};

export type AdminEvent = {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: AdminEventType;
  types: AdminEventType[];
  startsAt: string;
  endsAt: string;
  location: string;
  coverImageUrl: string | null;
  whatsappUrl: string | null;
  facebookEventUrl: string | null;
  published: boolean;
  featuredOnLanding: boolean;
  createdAt: string;
  updatedAt: string;
  counts: {
    registrations: number;
  };
};

export type AdminResource = {
  id: string;
  title: string;
  description: string | null;
  type: AdminResourceType;
  url: string;
  accessLevel: AdminResourceAccessLevel;
  published: boolean;
  training: { id: string; title: string; slug: string } | null;
  counts: {
    views: number;
    downloads: number;
    usefulMarks: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type AdminOpportunity = {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: AdminOpportunityType;
  status: AdminOpportunityStatus;
  deadline: string | null;
  location: string | null;
  eligibilityUrl: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  counts: {
    applications: number;
  };
};

export type AdminDossierMember = {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  type: string;
  phone: string | null;
  discipline: string | null;
  country: string | null;
  city: string | null;
  portfolioUrl: string | null;
  cvUrl: string | null;
};

export type AdminOpportunityApplication = {
  id: string;
  status: AdminApplicationStatus;
  statusLabel: string;
  motivation: string | null;
  discipline: string | null;
  city: string | null;
  phone: string | null;
  portfolioUrl: string | null;
  cvUrl: string | null;
  fileUrl: string | null;
  links: string[];
  socialLinks: string[];
  submittedAt: string | null;
  reviewedAt: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  opportunity: {
    id: string;
    title: string;
    slug: string;
    type: AdminOpportunityType;
    status: AdminOpportunityStatus;
    deadline: string | null;
    location: string | null;
  };
  member: AdminDossierMember;
};

export type AdminTrainingEnrollment = {
  id: string;
  status: AdminEnrollmentStatus;
  statusLabel: string;
  progress: number;
  motivation: string | null;
  phone: string | null;
  adminNote: string | null;
  enrolledAt: string;
  reviewedAt: string | null;
  completedAt: string | null;
  training: {
    id: string;
    title: string;
    slug: string;
    status: AdminTrainingStatus;
    startsAt: string | null;
    endsAt: string | null;
    location: string | null;
    certificateEnabled: boolean;
  };
  member: AdminDossierMember;
};

export type GalleryPhoto = {
  id: string;
  title: string | null;
  caption: string | null;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GalleryAlbum = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: GalleryAlbumCategory;
  coverImageUrl: string | null;
  published: boolean;
  featuredOnLanding: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  photos: GalleryPhoto[];
};

export type AdminTrainingsResponse = {
  trainings: AdminTraining[];
  total: number;
};

export type AdminEventsResponse = {
  events: AdminEvent[];
  total: number;
};

export type AdminResourcesResponse = {
  resources: AdminResource[];
  total: number;
  stats: {
    total: number;
    published: number;
    views: number;
    downloads: number;
    usefulMarks: number;
    topViewed: Array<{ id: string; title: string; type: AdminResourceType; views: number; downloads: number; usefulMarks: number }>;
    topDownloaded: Array<{ id: string; title: string; type: AdminResourceType; views: number; downloads: number; usefulMarks: number }>;
  };
};

export type AdminOpportunitiesResponse = {
  opportunities: AdminOpportunity[];
  total: number;
};

export type AdminOpportunityApplicationsResponse = {
  applications: AdminOpportunityApplication[];
  total: number;
  page: number;
  limit: number;
};

export type AdminTrainingEnrollmentsResponse = {
  enrollments: AdminTrainingEnrollment[];
  total: number;
  page: number;
  limit: number;
};

export type GalleryAlbumsResponse = {
  albums: GalleryAlbum[];
  total: number;
};

export type PublicLandingGalleryAlbum = Pick<
  GalleryAlbum,
  "id" | "title" | "slug" | "description" | "category" | "coverImageUrl" | "featuredOnLanding" | "sortOrder"
> & {
  photos: Array<Pick<GalleryPhoto, "id" | "title" | "caption" | "imageUrl" | "altText" | "sortOrder">>;
};

export type PublicGalleryAlbum = Pick<
  GalleryAlbum,
  "id" | "title" | "slug" | "description" | "category" | "coverImageUrl" | "featuredOnLanding" | "sortOrder" | "createdAt"
> & {
  photos: Array<Pick<GalleryPhoto, "id" | "title" | "caption" | "imageUrl" | "altText" | "sortOrder" | "createdAt">>;
};

export type TrainingPayload = {
  title: string;
  description: string;
  startsAt?: string;
  endsAt?: string;
  location?: string;
  coverImageUrl?: string;
  capacity?: number;
  priceCents?: number;
  currency?: string;
  status?: AdminTrainingStatus;
  certificateEnabled?: boolean;
  featuredOnLanding?: boolean;
};

export type EventPayload = {
  title: string;
  description: string;
  type?: AdminEventType;
  types?: AdminEventType[];
  startsAt: string;
  endsAt: string;
  location: string;
  coverImageUrl?: string;
  whatsappUrl?: string;
  facebookEventUrl?: string;
  published?: boolean;
  featuredOnLanding?: boolean;
};

export type ResourcePayload = {
  title: string;
  description?: string;
  type: AdminResourceType;
  url: string;
  accessLevel?: AdminResourceAccessLevel;
  published?: boolean;
  trainingId?: string;
};

export type OpportunityPayload = {
  title: string;
  description: string;
  type: AdminOpportunityType;
  status?: AdminOpportunityStatus;
  deadline?: string;
  location?: string;
  eligibilityUrl?: string;
  published?: boolean;
};

export type GalleryPhotoPayload = {
  imageUrl: string;
  title?: string;
  caption?: string;
  altText?: string;
  sortOrder?: number;
  published?: boolean;
};

export type GalleryAlbumPayload = {
  title: string;
  description?: string;
  category?: GalleryAlbumCategory;
  coverImageUrl?: string;
  published?: boolean;
  featuredOnLanding?: boolean;
  sortOrder?: number;
  photos?: GalleryPhotoPayload[];
};

export type AdminUploadPurpose = "training" | "event" | "gallery" | "resource" | "partner" | "certificate";

export type AdminUploadResponse = {
  url: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  purpose: AdminUploadPurpose;
  uploadedById: string;
};

export type MemberTrainingResource = {
  title: string;
  type: string;
  url: string;
};

export type MemberTrainingEnrollment = {
  id: string;
  status: string;
  progress: number;
  motivation: string | null;
  phone: string | null;
  adminNote: string | null;
  enrolledAt: string;
  reviewedAt: string | null;
  completedAt: string | null;
};

export type MemberTraining = {
  id: string;
  publicationId?: string;
  source: "training" | "publication";
  title: string;
  category: string;
  level: string;
  mode: "Présentiel" | "En ligne" | "Hybride";
  location: string;
  dates: string;
  seats: number | null;
  enrolledCount: number;
  progress: number;
  certificate: boolean;
  recommended: boolean;
  official: boolean;
  organizerName: string;
  description: string;
  modules: string[];
  sessions: Array<{ date: string; title: string; time: string }>;
  resources: MemberTrainingResource[];
  linkUrl: string | null;
  coverImageUrl: string | null;
  status: string;
  canEnroll: boolean;
  canManage: boolean;
  enrollment: MemberTrainingEnrollment | null;
};

export type MemberTrainingsResponse = {
  accountType: string;
  canPublishTraining: boolean;
  catalog: MemberTraining[];
  myEnrollments: MemberTraining[];
  myPublished: MemberTraining[];
};

export type TrainingEnrollmentResponse = {
  success: boolean;
  enrollment: MemberTrainingEnrollment;
  trainings: MemberTrainingsResponse;
};

export type MemberOpportunityApplication = {
  id: string;
  status: AdminApplicationStatus;
  motivation: string | null;
  discipline: string | null;
  city: string | null;
  phone: string | null;
  portfolioUrl: string | null;
  cvUrl: string | null;
  fileUrl: string | null;
  links: string[];
  socialLinks: string[];
  submittedAt: string | null;
  reviewedAt: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MemberOpportunity = {
  id: string;
  publicationId?: string;
  source: "opportunity" | "publication";
  title: string;
  category: string;
  status: string;
  deadline: string | null;
  deadlineLabel: string;
  location: string;
  mode: "Présentiel" | "En ligne" | "Hybride";
  fit: number;
  description: string;
  organizer: string;
  reward: string;
  requirements: string[];
  disciplines: string[];
  official: boolean;
  linkUrl: string | null;
  canApply: boolean;
  canManage: boolean;
  application: MemberOpportunityApplication | null;
};

export type MemberOpportunitiesResponse = {
  accountType: string;
  canPublishOpportunity: boolean;
  catalog: MemberOpportunity[];
  myApplications: MemberOpportunity[];
  myPublished: MemberOpportunity[];
};

export type OpportunityApplicationResponse = {
  success: boolean;
  application: MemberOpportunityApplication;
  opportunities: MemberOpportunitiesResponse;
};

export type MemberResourceAccessRule = {
  level: string;
  label: string;
  description: string;
  canCreate: boolean;
};

export type MemberResource = {
  id: string;
  publicationId?: string;
  source: "resource" | "publication";
  title: string;
  type: string;
  category: string;
  accessLevel: string;
  accessLabel: string;
  status: string;
  description: string;
  href: string | null;
  authorName: string;
  meta: string;
  official: boolean;
  recommended: boolean;
  training: { id: string; title: string; slug: string } | null;
  attachments: Array<{ name: string; type: string; url: string }>;
  isUseful: boolean;
  secureDownload: boolean;
  counts: {
    views: number;
    downloads: number;
    usefulMarks: number;
  };
  canManage: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MemberResourceActionResponse = {
  success: boolean;
  useful?: boolean;
  url?: string;
  filename?: string;
  resource: MemberResource;
};

export type MemberResourcesResponse = {
  accountType: string;
  canPublishResource: boolean;
  accessRules: MemberResourceAccessRule[];
  library: MemberResource[];
  trainingResources: MemberResource[];
  myPublished: MemberResource[];
};

export type MemberAgendaItem = {
  id: string;
  publicationId?: string;
  source: "event" | "training" | "opportunity" | "publication";
  sourceId: string;
  kind: string;
  kindLabel: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string | null;
  dateLabel: string;
  timeLabel: string;
  location: string;
  organizerName: string;
  href: string | null;
  routeHref: string;
  actionLabel: string;
  canRegister: boolean;
  registrationStatus: string | null;
  enrollmentStatus: string | null;
  applicationStatus: string | null;
  official: boolean;
  status: string;
  canManage?: boolean;
  fit?: number;
  budgetRange?: string | null;
  contactEmail?: string | null;
};

export type MemberAgendaResponse = {
  accountType: string;
  canPublishEvent: boolean;
  items: MemberAgendaItem[];
  upcoming: MemberAgendaItem[];
  deadlines: MemberAgendaItem[];
  registered: MemberAgendaItem[];
};

export type AgendaEventRegistrationResponse = {
  success: boolean;
  registration: {
    id: string;
    eventId: string;
    userId: string;
    status: string;
    registeredAt: string;
    attendedAt: string | null;
  };
  agenda: MemberAgendaResponse;
};

export type MemberCertificate = {
  id: string;
  title: string;
  number: string;
  status: "PENDING" | "ISSUED" | "REVOKED";
  statusLabel: string;
  issuedAt: string | null;
  expiresAt: string | null;
  fileUrl: string | null;
  badgeUrl: string | null;
  verificationUrl: string;
  training: {
    id: string;
    title: string;
    slug: string;
    startsAt: string | null;
    certificateEnabled: boolean;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type MemberCertificateBadge = {
  title: string;
  text: string;
  status: string;
};

export type MemberCertificatesResponse = {
  accountType: string;
  canViewCertificates: boolean;
  memberNumber: string | null;
  holderName: string;
  certificates: MemberCertificate[];
  badges: MemberCertificateBadge[];
  stats: {
    issued: number;
    pending: number;
    revoked: number;
    visibleBadges: number;
  };
};

export type IssueCertificatePayload = {
  userId: string;
  title: string;
  status?: "PENDING" | "ISSUED";
  trainingId?: string;
  fileUrl?: string;
  badgeUrl?: string;
};

export type IssueCertificateResponse = {
  success: boolean;
  certificate: MemberCertificate;
};

export type CreatePublicationPayload = {
  type: PublicationType;
  title: string;
  content: string;
  audience?: PublicationAudience;
  category?: string;
  discipline?: string;
  country?: string;
  city?: string;
  tags?: string[];
  linkUrl?: string;
  coverImageUrl?: string;
  groupId?: string;
  opportunityDeadline?: string;
  opportunityLocation?: string;
  budgetRange?: string;
  contactEmail?: string;
  expiresAt?: string;
  attachments?: {
    type: PublicationAttachmentType;
    url: string;
    name?: string;
    mimeType?: string;
    sizeBytes?: number;
    order?: number;
  }[];
  mentionedUserIds?: string[];
  publishNow?: boolean;
};

export type PublicationQuery = {
  q?: string;
  type?: PublicationType;
  audience?: PublicationAudience;
  status?: PublicationStatus;
  category?: string;
  destination?: string;
  mine?: boolean;
  paginated?: boolean;
  cursor?: string;
  limit?: number;
};

export type PublicationPage = {
  items: Publication[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type CommunityGroupStatus = "ACTIVE" | "ARCHIVED";
export type CommunityGroupVisibility = "MEMBERS" | "PUBLIC" | "PRIVATE";
export type CommunityGroupRole = "OWNER" | "MODERATOR" | "MEMBER";
export type CommunityGroupInvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";
export type CommunityGroupMessageType = "TEXT" | "FILE" | "SYSTEM";
export type NotificationType = "SYSTEM" | "TRAINING" | "OPPORTUNITY" | "CERTIFICATE" | "MESSAGE";
export type NotificationFrequency = "IMMEDIATE" | "DAILY" | "WEEKLY" | "DISABLED";
export type DirectMessageReportReason = "SPAM" | "ABUSE" | "HARASSMENT" | "INAPPROPRIATE" | "OTHER";
export type DirectMessageReportStatus = "PENDING" | "REVIEWED" | "DISMISSED";

export type MemberNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string | null;
  readAt: string | null;
  read: boolean;
  createdAt: string;
};

export type MemberNotificationPreference = {
  id: string;
  userId: string;
  type: NotificationType;
  platform: boolean;
  email: boolean;
  whatsapp: boolean;
  push: boolean;
  frequency: NotificationFrequency;
  createdAt: string;
  updatedAt: string;
};

export type MemberNotificationSummary = {
  total: number;
  unread: number;
  last7Days: number;
  last30Days: number;
  byType: Array<{
    type: NotificationType;
    total: number;
    unread: number;
    lastAt: string | null;
  }>;
  latest: MemberNotification[];
  digestPreview: {
    enabled: boolean;
    preferences: MemberNotificationPreference[];
    dailyEligible: number;
    weeklyEligible: number;
  };
  channels: {
    platform: boolean;
    email: boolean;
    whatsapp: boolean;
    push: boolean;
  };
};

export type DirectMessageUser = {
  id: string;
  accountType: string;
  displayName: string;
  avatarUrl: string | null;
  memberNumber: string | null;
  headline: string;
};

export type DirectMessage = {
  id: string;
  conversationId: string;
  content: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentMimeType: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  readAt?: string | null;
  createdAt: string;
  author: DirectMessageUser;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
};

export type DirectMessageReport = {
  id: string;
  reason: DirectMessageReportReason;
  message: string | null;
  status: DirectMessageReportStatus;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reporter: DirectMessageUser;
  directMessage: DirectMessage;
};

export type DirectConversation = {
  id: string;
  target: DirectMessageUser | null;
  lastMessage: DirectMessage | null;
  unread: number;
  lastMessageAt: string | null;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DirectConversationAttachment = {
  id: string;
  url: string | null;
  name: string;
  mimeType: string | null;
  kind: "image" | "document" | "file";
  createdAt: string;
  author: DirectMessageUser;
};

export type DirectMessageSearchResponse = {
  results: Array<{
    message: DirectMessage;
    conversation: DirectConversation;
  }>;
  total: number;
};

export type DirectConversationAttachmentsResponse = {
  attachments: DirectConversationAttachment[];
  total: number;
  images: number;
  documents: number;
};

export type CreateDirectConversationPayload = {
  memberId?: string;
  memberNumber?: string;
  initialMessage?: string;
};

export type CreateDirectMessagePayload = {
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMimeType?: string;
};

export type CommunityGroup = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  avatarUrl: string | null;
  city: string | null;
  country: string | null;
  tags: string[];
  visibility: CommunityGroupVisibility;
  status: CommunityGroupStatus;
  members: number;
  posts: number;
  isJoined: boolean;
  pendingJoinRequestId?: string | null;
  pendingJoinRequestStatus?: CommunityGroupInvitationStatus | null;
  currentUserRole: CommunityGroupRole | null;
  canManage: boolean;
  lastActivity: string;
  owner: {
    id: string;
    accountType: string;
    displayName: string;
    avatarUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
};

export type CommunityGroupJoinRequest = {
  id: string;
  groupId: string;
  requesterId: string;
  status: CommunityGroupInvitationStatus;
  message: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  group: CommunityGroup;
  requester: CommunityGroupMemberCandidate;
  reviewedBy: CommunityGroupMemberCandidate | null;
  permissions: {
    canAccept: boolean;
    canDecline: boolean;
  };
};

export type CommunityGroupMemberCandidate = {
  userId: string;
  accountType: string;
  displayName: string;
  avatarUrl: string | null;
  headline: string;
  city: string | null;
  country: string | null;
  isConnected?: boolean;
  pendingInvitationId: string | null;
  pendingInvitationStatus: CommunityGroupInvitationStatus | null;
};

export type CommunityGroupMember = CommunityGroupMemberCandidate & {
  role: CommunityGroupRole;
  joinedAt: string;
  isCurrentUser: boolean;
  permissions: {
    canPromote: boolean;
    canDemote: boolean;
    canRemove: boolean;
  };
};

export type CommunityGroupMessage = {
  id: string;
  groupId: string;
  type: CommunityGroupMessageType;
  content: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentMimeType: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  author: {
    id: string;
    accountType: string;
    displayName: string;
    avatarUrl: string | null;
  };
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
};

export type CreateCommunityGroupPayload = {
  name: string;
  category: string;
  description: string;
  city?: string;
  country?: string;
  tags?: string[];
  visibility?: CommunityGroupVisibility;
};

export type UpdateCommunityGroupPayload = Partial<CreateCommunityGroupPayload>;

export type AddCommunityGroupMemberPayload = {
  userId: string;
  role?: "MEMBER" | "MODERATOR";
};

export type CreateCommunityGroupInvitationPayload = {
  userId: string;
  role?: "MEMBER" | "MODERATOR";
  message?: string;
};

export type CommunityGroupInvitation = {
  id: string;
  groupId: string;
  inviterId: string;
  inviteeId: string;
  role: CommunityGroupRole;
  status: CommunityGroupInvitationStatus;
  message: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  group: CommunityGroup;
  inviter: CommunityGroupMemberCandidate;
  invitee: CommunityGroupMemberCandidate;
  permissions: {
    canAccept: boolean;
    canDecline: boolean;
    canCancel: boolean;
  };
};

export type CommunityGroupInvitationActionResponse = {
  invitation: CommunityGroupInvitation;
  group: CommunityGroup;
};

export type CommunityGroupQuery = {
  q?: string;
  category?: string;
  city?: string;
  mine?: boolean;
  limit?: number;
};

export type CreateCommunityGroupMessagePayload = {
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMimeType?: string;
};

type ApiErrorPayload = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

type AuthTokenSnapshot = {
  accessToken: string | null;
  refreshToken: string | null;
};

type AuthTokenHandlers = {
  getTokens?: () => AuthTokenSnapshot;
  onTokensRefreshed?: (tokens: RefreshSessionResponse) => void;
  onUnauthorized?: () => void;
};

let authTokenHandlers: AuthTokenHandlers = {};
let refreshPromise: Promise<RefreshSessionResponse> | null = null;

export class ApiError extends Error {
  status: number;
  details: string[];

  constructor(message: string, status: number, details: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function getApiErrorMessage(error: unknown, fallback = "Quelque chose n'a pas fonctionné. Réessayez dans un instant.") {
  if (error instanceof ApiError) {
    const details = error.details.map(toUserMessage);
    return details.length > 1 ? details.slice(0, 4).join("\n") : toUserMessage(error.message);
  }

  if (error instanceof Error && error.message.trim()) {
    return toUserMessage(error.message);
  }

  return fallback;
}

export function configureAuthTokenHandlers(handlers: AuthTokenHandlers) {
  authTokenHandlers = handlers;
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError("Impossible de joindre le service. Vérifiez votre connexion internet puis réessayez.", 0);
  }

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw buildApiError(response.status, payload);
  }

  return payload as T;
}

async function authenticatedApiRequest<T>(path: string, init: RequestInit = {}, accessToken?: string | null): Promise<T> {
  const tokens = getAuthTokens();
  const token = accessToken ?? tokens.accessToken;

  if (!token) {
    const refreshToken = tokens.refreshToken ?? getAuthTokens().refreshToken;

    if (!refreshToken) {
      authTokenHandlers.onUnauthorized?.();
      throw new ApiError("Votre connexion a expiré. Connectez-vous à nouveau.", 401);
    }

    const nextTokens = await refreshAccessToken(refreshToken);
    return apiRequest<T>(path, withAuthorization(init, nextTokens.accessToken));
  }

  try {
    return await apiRequest<T>(path, withAuthorization(init, token));
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    const refreshToken = getAuthTokens().refreshToken ?? tokens.refreshToken;

    if (!refreshToken) {
      authTokenHandlers.onUnauthorized?.();
      throw error;
    }

    const nextTokens = await refreshAccessToken(refreshToken);
    return apiRequest<T>(path, withAuthorization(init, nextTokens.accessToken));
  }
}

async function authenticatedTextRequest(path: string, init: RequestInit = {}, accessToken?: string | null): Promise<string> {
  const tokens = getAuthTokens();
  const token = accessToken ?? tokens.accessToken;

  if (!token) {
    throw new ApiError("Votre connexion a expiré. Connectez-vous à nouveau.", 401);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, withAuthorization(init, token));
  } catch {
    throw new ApiError("Impossible de joindre le service. Vérifiez votre connexion internet puis réessayez.", 0);
  }

  const payload = await response.text();

  if (!response.ok) {
    throw new ApiError(payload || fallbackMessageByStatus(response.status), response.status);
  }

  return payload;
}

function withAuthorization(init: RequestInit, accessToken: string): RequestInit {
  return {
    ...init,
    headers: {
      ...headersToObject(init.headers),
      Authorization: `Bearer ${accessToken}`,
    },
  };
}

function headersToObject(headers?: HeadersInit) {
  if (!headers) {
    return {};
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
}

function getAuthTokens(): AuthTokenSnapshot {
  return authTokenHandlers.getTokens?.() ?? getStoredAuthTokens();
}

function getStoredAuthTokens(): AuthTokenSnapshot {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null };
  }

  try {
    return {
      accessToken: window.localStorage.getItem("cca.accessToken"),
      refreshToken: window.localStorage.getItem("cca.refreshToken"),
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

function persistAuthTokens(tokens: RefreshSessionResponse) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem("cca.accessToken", tokens.accessToken);
    window.localStorage.setItem("cca.refreshToken", tokens.refreshToken);
  } catch {
    // Le store Redux reste la source active si localStorage est indisponible.
  }
}

async function refreshAccessToken(refreshToken: string) {
  if (!refreshPromise) {
    refreshPromise = refreshSession(refreshToken)
      .then((tokens) => {
        persistAuthTokens(tokens);
        authTokenHandlers.onTokensRefreshed?.(tokens);
        return tokens;
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          authTokenHandlers.onUnauthorized?.();
        }

        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function parseJsonResponse(response: Response) {
  return response.json().catch(() => null) as Promise<ApiErrorPayload | unknown>;
}

function buildApiError(status: number, payload: unknown) {
  const errorPayload = payload && typeof payload === "object" ? (payload as ApiErrorPayload) : null;
  const details = normalizeMessages(errorPayload?.message);
  const fallback = fallbackMessageByStatus(status);
  const message = details[0] ?? fallback;

  return new ApiError(message, status, details);
}

function normalizeMessages(message: ApiErrorPayload["message"]) {
  if (Array.isArray(message)) {
    return message.map((item) => item.trim()).filter(Boolean);
  }

  if (typeof message === "string" && message.trim()) {
    return [message.trim()];
  }

  return [];
}

function fallbackMessageByStatus(status: number) {
  if (status === 400) {
    return "Vérifiez les informations saisies, puis réessayez.";
  }

  if (status === 401) {
    return "Votre connexion a expiré. Connectez-vous à nouveau.";
  }

  if (status === 403) {
    return "Vous ne pouvez pas faire cette action pour le moment.";
  }

  if (status === 404) {
    return "Cette information est introuvable.";
  }

  if (status === 409) {
    return "Ces informations existent déjà. Vérifiez ce que vous avez saisi.";
  }

  if (status === 429) {
    return "Trop de tentatives. Patientez un moment avant de réessayer.";
  }

  if (status >= 500) {
    return "Le service rencontre un problème. Réessayez dans un instant.";
  }

  return "Quelque chose n'a pas fonctionné. Réessayez dans un instant.";
}

function toUserMessage(message: string) {
  const normalized = message.trim();

  if (!normalized) {
    return "Quelque chose n'a pas fonctionné. Réessayez dans un instant.";
  }

  const replacements: Record<string, string> = {
    "Identifiants invalides": "Email ou mot de passe incorrect.",
    "Session invalide": "Votre connexion n'est plus valide. Connectez-vous à nouveau.",
    "Session expirée": "Votre connexion a expiré. Connectez-vous à nouveau.",
    "Refresh token invalide": "Votre connexion n'est plus valide. Connectez-vous à nouveau.",
    "Le refresh token est requis": "Votre connexion n'est plus valide. Connectez-vous à nouveau.",
    "Adresse e-mail invalide": "Entrez une adresse e-mail valide.",
    "Type de compte invalide": "Choisissez un type de compte valide.",
    "Code de vérification invalide": "Le code saisi est incorrect.",
    "Code de vérification expiré": "Ce code a expiré. Demandez un nouveau code pour continuer.",
    "Code de réinitialisation invalide": "Le code saisi est incorrect ou n'est plus valide.",
    "Code de réinitialisation expiré": "Ce code a expiré. Demandez un nouveau code pour continuer.",
  };

  return replacements[normalized] ?? normalized;
}

export function registerMember(body: Record<string, unknown>) {
  return apiRequest<RegistrationPendingResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function loginMember(body: { email: string; password: string; deviceId?: string }) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function verifyEmail(body: { email: string; code: string }) {
  return apiRequest<AuthResponse>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function resendVerification(body: { email: string }) {
  return apiRequest<{ success: boolean; verificationExpiresAt: string }>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function forgotPassword(body: { email: string }) {
  return apiRequest<ForgotPasswordResponse>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function verifyPasswordResetCode(body: { email: string; code: string }) {
  return apiRequest<VerifyPasswordResetCodeResponse>("/auth/verify-password-reset-code", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function resetPassword(body: { email: string; code: string; password: string }) {
  return apiRequest<ResetPasswordResponse>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function changePassword(accessToken: string | null | undefined, body: { currentPassword: string; newPassword: string }) {
  return authenticatedApiRequest<{ success: boolean; message: string }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function refreshSession(refreshToken: string) {
  return apiRequest<RefreshSessionResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function getCurrentMember(accessToken?: string | null) {
  return authenticatedApiRequest<AuthMeResponse>("/auth/me", {
    method: "GET",
  }, accessToken);
}

export function logoutSession(refreshToken?: string | null) {
  const token = refreshToken ?? getAuthTokens().refreshToken;

  return apiRequest<{ success: boolean }>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken: token }),
  });
}

export function updateMemberProfile(accessToken: string | null | undefined, body: UpdateMemberProfilePayload) {
  return authenticatedApiRequest<AuthMeResponse>("/member/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
  }, accessToken);
}

export function getCreativeIdRecord(accessToken?: string | null) {
  return authenticatedApiRequest<CreativeIdRecord>("/member/creative-id", {
    method: "GET",
  }, accessToken);
}

export function createPortfolioItem(accessToken: string | null | undefined, body: PortfolioItemPayload) {
  return authenticatedApiRequest<CreativeIdPortfolioItem>("/member/creative-id/portfolio", {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function updatePortfolioItem(accessToken: string | null | undefined, id: string, body: Partial<PortfolioItemPayload>) {
  return authenticatedApiRequest<CreativeIdPortfolioItem>(`/member/creative-id/portfolio/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }, accessToken);
}

export function deletePortfolioItem(accessToken: string | null | undefined, id: string) {
  return authenticatedApiRequest<{ success: boolean }>(`/member/creative-id/portfolio/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }, accessToken);
}

export function uploadProfileAsset(accessToken: string | null | undefined, kind: UploadProfileAssetKind, file: File) {
  const body = new FormData();
  body.append("kind", kind);
  body.append("file", file);

  return authenticatedApiRequest<UploadProfileAssetResponse>("/member/uploads", {
    method: "POST",
    body,
  }, accessToken);
}

export function getMemberAccountEvolution(accessToken?: string | null) {
  return authenticatedApiRequest<MemberAccountEvolutionResponse>("/member/account-evolution", {
    method: "GET",
  }, accessToken);
}

export function requestMemberAccountEvolution(
  accessToken: string | null | undefined,
  body: { requestedType: "CREATOR"; motivation?: string; portfolioUrl?: string; cvUrl?: string },
) {
  return authenticatedApiRequest<{ success: boolean; message: string; request: AccountEvolutionRequest }>("/member/account-evolution", {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function searchMemberGlobal(accessToken?: string | null, query: { q?: string; limit?: number } = {}) {
  return authenticatedApiRequest<GlobalSearchResponse>(`/member/search${buildQueryString(query)}`, {
    method: "GET",
  }, accessToken);
}

export function getNetworkMembers(accessToken?: string | null, query: NetworkMemberQuery = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value?.trim()) {
      params.set(key, value.trim());
    }
  });

  const suffix = params.toString() ? `?${params.toString()}` : "";

  return authenticatedApiRequest<NetworkMember[]>(`/member/network${suffix}`, {
    method: "GET",
  }, accessToken);
}

export function getNetworkMemberProfile(accessToken: string | null | undefined, memberNumber: string) {
  return authenticatedApiRequest<NetworkMemberProfile>(`/member/network/profile/${encodeURIComponent(memberNumber)}`, {
    method: "GET",
  }, accessToken);
}

export function saveNetworkMember(accessToken: string | null | undefined, userId: string) {
  return authenticatedApiRequest<{
    success: boolean;
    connected: boolean;
    connectedAt: string | null;
    connectionKind: "CONNECTION" | "FOLLOW";
    connectionStatus: "PENDING" | "ACCEPTED" | "DECLINED";
  }>(`/member/network/${userId}/save`, {
    method: "POST",
  }, accessToken);
}

export function removeNetworkMember(accessToken: string | null | undefined, userId: string) {
  return authenticatedApiRequest<{ success: boolean; connected: boolean }>(`/member/network/${userId}/save`, {
    method: "DELETE",
  }, accessToken);
}

export function getPublicationCapabilities(accessToken?: string | null) {
  return authenticatedApiRequest<PublicationCapabilitiesResponse>("/publications/capabilities", {
    method: "GET",
  }, accessToken);
}

export function getMemberTrainings(accessToken?: string | null) {
  return authenticatedApiRequest<MemberTrainingsResponse>("/member/trainings", {
    method: "GET",
  }, accessToken);
}

export function enrollInTraining(accessToken: string | null | undefined, trainingId: string, body: { motivation?: string; phone?: string } = {}) {
  return authenticatedApiRequest<TrainingEnrollmentResponse>(`/member/trainings/${trainingId}/enroll`, {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function getMemberOpportunities(accessToken?: string | null) {
  return authenticatedApiRequest<MemberOpportunitiesResponse>("/member/opportunities", {
    method: "GET",
  }, accessToken);
}

export function getMemberResources(accessToken?: string | null) {
  return authenticatedApiRequest<MemberResourcesResponse>("/member/resources", {
    method: "GET",
  }, accessToken);
}

export function viewMemberResource(accessToken: string | null | undefined, id: string) {
  return authenticatedApiRequest<MemberResourceActionResponse>(`/member/resources/${id}/view`, {
    method: "POST",
  }, accessToken);
}

export function downloadMemberResource(accessToken: string | null | undefined, id: string) {
  return authenticatedApiRequest<MemberResourceActionResponse>(`/member/resources/${id}/download`, {
    method: "GET",
  }, accessToken);
}

export function toggleMemberResourceUseful(accessToken: string | null | undefined, id: string) {
  return authenticatedApiRequest<MemberResourceActionResponse>(`/member/resources/${id}/useful`, {
    method: "POST",
  }, accessToken);
}

export function getMemberAgenda(accessToken?: string | null) {
  return authenticatedApiRequest<MemberAgendaResponse>("/member/agenda", {
    method: "GET",
  }, accessToken);
}

export function registerAgendaEvent(accessToken: string | null | undefined, eventId: string) {
  return authenticatedApiRequest<AgendaEventRegistrationResponse>(`/member/agenda/events/${eventId}/register`, {
    method: "POST",
  }, accessToken);
}

export function getMemberCertificates(accessToken?: string | null) {
  return authenticatedApiRequest<MemberCertificatesResponse>("/member/certificates", {
    method: "GET",
  }, accessToken);
}

export function issueMemberCertificate(accessToken: string | null | undefined, body: IssueCertificatePayload) {
  return authenticatedApiRequest<IssueCertificateResponse>("/member/certificates/issue", {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function applyToOpportunity(
  accessToken: string | null | undefined,
  opportunityId: string,
  body: {
    status?: "DRAFT" | "SUBMITTED" | "draft" | "submitted";
    motivation?: string;
    discipline?: string;
    city?: string;
    phone?: string;
    portfolioUrl?: string;
    cvUrl?: string;
    fileUrl?: string;
    links?: string[];
    socialLinks?: string[];
  } = {},
) {
  return authenticatedApiRequest<OpportunityApplicationResponse>(`/member/opportunities/${opportunityId}/apply`, {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function createPublication(accessToken: string | null | undefined, body: CreatePublicationPayload) {
  return authenticatedApiRequest<Publication>("/publications", {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function uploadPublicationAttachment(accessToken: string | null | undefined, file: File) {
  const body = new FormData();
  body.append("file", file);

  return authenticatedApiRequest<PublicationUploadResponse>("/publications/uploads", {
    method: "POST",
    body,
  }, accessToken);
}

export function uploadMessageAttachment(accessToken: string | null | undefined, file: File) {
  const body = new FormData();
  body.append("file", file);

  return authenticatedApiRequest<PublicationUploadResponse>("/messages/uploads", {
    method: "POST",
    body,
  }, accessToken);
}

export function getPublications(accessToken?: string | null, query: PublicationQuery = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    params.set(key, String(value));
  });

  const suffix = params.toString() ? `?${params.toString()}` : "";

  return authenticatedApiRequest<Publication[]>(`/publications${suffix}`, {
    method: "GET",
  }, accessToken);
}

export function getPublicationsPage(accessToken?: string | null, query: PublicationQuery = {}) {
  const params = new URLSearchParams();
  const paginatedQuery = { ...query, paginated: true };

  Object.entries(paginatedQuery).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    params.set(key, String(value));
  });

  const suffix = params.toString() ? `?${params.toString()}` : "";

  return authenticatedApiRequest<PublicationPage>(`/publications${suffix}`, {
    method: "GET",
  }, accessToken);
}

export function getMyPublications(accessToken?: string | null, query: PublicationQuery = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || (typeof value === "string" && value === "")) {
      return;
    }

    params.set(key, String(value));
  });

  const suffix = params.toString() ? `?${params.toString()}` : "";

  return authenticatedApiRequest<Publication[]>(`/publications/mine${suffix}`, {
    method: "GET",
  }, accessToken);
}

export function getPublicationComments(accessToken: string | null | undefined, publicationId: string) {
  return authenticatedApiRequest<PublicationComment[]>(`/publications/${publicationId}/comments`, {
    method: "GET",
  }, accessToken);
}

export function commentPublication(accessToken: string | null | undefined, publicationId: string, content: string, parentId?: string) {
  return authenticatedApiRequest<PublicationComment>(`/publications/${publicationId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content, parentId }),
  }, accessToken);
}

export function deletePublicationComment(accessToken: string | null | undefined, publicationId: string, commentId: string) {
  return authenticatedApiRequest<{ success: boolean; publicationId: string; commentId: string }>(`/publications/${publicationId}/comments/${commentId}`, {
    method: "DELETE",
  }, accessToken);
}

export function reactToPublication(accessToken: string | null | undefined, publicationId: string, type: PublicationReactionType = "LIKE") {
  return authenticatedApiRequest<{ active: boolean; type: PublicationReactionType; count: number }>(`/publications/${publicationId}/reactions`, {
    method: "POST",
    body: JSON.stringify({ type }),
  }, accessToken);
}

export function sharePublication(accessToken: string | null | undefined, publicationId: string, content?: string) {
  return authenticatedApiRequest<{ success: boolean; shared: boolean; shareId: string; count: number }>(`/publications/${publicationId}/shares`, {
    method: "POST",
    body: JSON.stringify({ content }),
  }, accessToken);
}

export function reportPublication(accessToken: string | null | undefined, publicationId: string, reason: PublicationReportReason, message?: string) {
  return authenticatedApiRequest<{ success: boolean; reportId: string; status: PublicationReportStatus }>(`/publications/${publicationId}/reports`, {
    method: "POST",
    body: JSON.stringify({ reason, message }),
  }, accessToken);
}

export function getPublicationReports(accessToken?: string | null, query: { status?: PublicationReportStatus; reason?: PublicationReportReason; limit?: number } = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    params.set(key, String(value));
  });

  const suffix = params.toString() ? `?${params.toString()}` : "";

  return authenticatedApiRequest<PublicationReportsResponse>(`/publications/reports${suffix}`, {
    method: "GET",
  }, accessToken);
}

export function moderatePublicationReport(
  accessToken: string | null | undefined,
  reportId: string,
  input: { status?: PublicationReportStatus; publicationStatus?: Exclude<PublicationStatus, "DRAFT"> },
) {
  return authenticatedApiRequest<{ success: boolean; report: PublicationReport | null }>(`/publications/reports/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }, accessToken);
}

export function getAdminOverview(accessToken?: string | null) {
  return authenticatedApiRequest<AdminOverviewResponse>("/admin/overview", {
    method: "GET",
  }, accessToken);
}

export function getAdminMembers(accessToken?: string | null, query: { q?: string; type?: string; status?: string; limit?: number } = {}) {
  return authenticatedApiRequest<AdminMembersResponse>(`/admin/members${buildQueryString(query)}`, {
    method: "GET",
  }, accessToken);
}

export function updateAdminMemberStatus(accessToken: string | null | undefined, memberId: string, status: AdminMember["status"]) {
  return authenticatedApiRequest<AdminMember>(`/admin/members/${memberId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }, accessToken);
}

export function grantAdminAccess(accessToken: string | null | undefined, memberId: string) {
  return authenticatedApiRequest<AdminMember>(`/admin/members/${memberId}/admin-access`, {
    method: "PATCH",
  }, accessToken);
}

export function updateAdminMemberVerification(accessToken: string | null | undefined, memberId: string, verified: boolean) {
  return authenticatedApiRequest<AdminMember>(`/admin/members/${memberId}/verification`, {
    method: "PATCH",
    body: JSON.stringify({ verified }),
  }, accessToken);
}

export function getAdminAccountEvolutionRequests(
  accessToken?: string | null,
  query: { q?: string; status?: AccountEvolutionStatus; requestedType?: string; page?: number; limit?: number } = {},
) {
  return authenticatedApiRequest<AdminAccountEvolutionRequestsResponse>(`/admin/account-evolution-requests${buildQueryString(query)}`, {
    method: "GET",
  }, accessToken);
}

export function updateAdminAccountEvolutionRequest(
  accessToken: string | null | undefined,
  id: string,
  body: { status: Exclude<AccountEvolutionStatus, "PENDING">; note?: string },
) {
  return authenticatedApiRequest<AdminAccountEvolutionRequest>(`/admin/account-evolution-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }, accessToken);
}

export function getAdminPublications(
  accessToken?: string | null,
  query: { q?: string; type?: PublicationType; status?: PublicationStatus; limit?: number } = {},
) {
  return authenticatedApiRequest<AdminPublicationsResponse>(`/admin/publications${buildQueryString(query)}`, {
    method: "GET",
  }, accessToken);
}

export function updateAdminPublicationStatus(
  accessToken: string | null | undefined,
  publicationId: string,
  status: Exclude<PublicationStatus, "DRAFT">,
) {
  return authenticatedApiRequest<AdminPublication>(`/admin/publications/${publicationId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }, accessToken);
}

export function getAdminReports(
  accessToken?: string | null,
  query: { status?: PublicationReportStatus; reason?: PublicationReportReason; limit?: number } = {},
) {
  return authenticatedApiRequest<AdminReportsResponse>(`/admin/reports${buildQueryString(query)}`, {
    method: "GET",
  }, accessToken);
}

export function updateAdminReport(
  accessToken: string | null | undefined,
  reportId: string,
  input: { status?: Exclude<PublicationReportStatus, "PENDING">; publicationStatus?: Exclude<PublicationStatus, "DRAFT"> },
) {
  return authenticatedApiRequest<{ success: boolean; report: AdminReport | null }>(`/admin/reports/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }, accessToken);
}

export function getAdminMessageReports(
  accessToken?: string | null,
  query: { status?: DirectMessageReportStatus; reason?: DirectMessageReportReason; q?: string; from?: string; to?: string; limit?: number } = {},
) {
  return authenticatedApiRequest<AdminDirectMessageReportsResponse>(`/admin/message-reports${buildQueryString(query)}`, {
    method: "GET",
  }, accessToken);
}

export function updateAdminMessageReport(
  accessToken: string | null | undefined,
  reportId: string,
  input: { status: Exclude<DirectMessageReportStatus, "PENDING">; deleteMessage?: boolean; note?: string },
) {
  return authenticatedApiRequest<{ success: boolean; report: AdminDirectMessageReport }>(`/admin/message-reports/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }, accessToken);
}

export function getAdminGroupMessageReports(
  accessToken?: string | null,
  query: { status?: DirectMessageReportStatus; reason?: DirectMessageReportReason; q?: string; from?: string; to?: string; limit?: number } = {},
) {
  return authenticatedApiRequest<AdminGroupMessageReportsResponse>(`/admin/group-message-reports${buildQueryString(query)}`, {
    method: "GET",
  }, accessToken);
}

export function updateAdminGroupMessageReport(
  accessToken: string | null | undefined,
  reportId: string,
  input: { status: Exclude<DirectMessageReportStatus, "PENDING">; deleteMessage?: boolean; note?: string },
) {
  return authenticatedApiRequest<{ success: boolean; report: AdminGroupMessageReport }>(`/admin/group-message-reports/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }, accessToken);
}

export function getAdminAuditLogs(
  accessToken?: string | null,
  query: { action?: string; entityType?: string; limit?: number } = {},
) {
  return authenticatedApiRequest<AdminAuditLogsResponse>(`/admin/audit-logs${buildQueryString(query)}`, {
    method: "GET",
  }, accessToken);
}

export function getAdminRiskUsers(accessToken?: string | null) {
  return authenticatedApiRequest<AdminRiskUsersResponse>("/admin/risk-users", {
    method: "GET",
  }, accessToken);
}

export function getAdminTrainings(
  accessToken?: string | null,
  query: { q?: string; status?: AdminTrainingStatus } = {},
) {
  return authenticatedApiRequest<AdminTrainingsResponse>(`/admin/trainings${buildQueryString(query)}`, {
    method: "GET",
  }, accessToken);
}

export function createAdminTraining(accessToken: string | null | undefined, body: TrainingPayload) {
  return authenticatedApiRequest<AdminTraining>("/admin/trainings", {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function updateAdminTraining(accessToken: string | null | undefined, id: string, body: Partial<TrainingPayload>) {
  return authenticatedApiRequest<AdminTraining>(`/admin/trainings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }, accessToken);
}

export function deleteAdminTraining(accessToken: string | null | undefined, id: string) {
  return authenticatedApiRequest<{ success: boolean }>(`/admin/trainings/${id}`, {
    method: "DELETE",
  }, accessToken);
}

export function getAdminTrainingEnrollments(
  accessToken?: string | null,
  query: { q?: string; status?: AdminEnrollmentStatus; trainingId?: string; page?: number; limit?: number } = {},
) {
  return authenticatedApiRequest<AdminTrainingEnrollmentsResponse>(`/admin/training-enrollments${buildQueryString(query)}`, {
    method: "GET",
  }, accessToken);
}

export function exportAdminTrainingEnrollmentsCsv(
  accessToken?: string | null,
  query: { q?: string; status?: AdminEnrollmentStatus; trainingId?: string; page?: number; limit?: number } = {},
) {
  return authenticatedTextRequest(`/admin/training-enrollments/export.csv${buildQueryString(query)}`, {
    method: "GET",
  }, accessToken);
}

export function updateAdminTrainingEnrollment(
  accessToken: string | null | undefined,
  id: string,
  body: { status?: AdminEnrollmentStatus; progress?: number; adminNote?: string },
) {
  return authenticatedApiRequest<AdminTrainingEnrollment>(`/admin/training-enrollments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }, accessToken);
}

export function uploadAdminAsset(accessToken: string | null | undefined, purpose: AdminUploadPurpose, file: File) {
  const body = new FormData();
  body.append("purpose", purpose);
  body.append("file", file);

  return authenticatedApiRequest<AdminUploadResponse>("/admin/uploads", {
    method: "POST",
    body,
  }, accessToken);
}

export function getAdminEvents(
  accessToken?: string | null,
  query: { q?: string; type?: AdminEventType; published?: boolean } = {},
) {
  return authenticatedApiRequest<AdminEventsResponse>(`/admin/events${buildQueryString(query)}`, {
    method: "GET",
  }, accessToken);
}

export function createAdminEvent(accessToken: string | null | undefined, body: EventPayload) {
  return authenticatedApiRequest<AdminEvent>("/admin/events", {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function updateAdminEvent(accessToken: string | null | undefined, id: string, body: Partial<EventPayload>) {
  return authenticatedApiRequest<AdminEvent>(`/admin/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }, accessToken);
}

export function deleteAdminEvent(accessToken: string | null | undefined, id: string) {
  return authenticatedApiRequest<{ success: boolean }>(`/admin/events/${id}`, {
    method: "DELETE",
  }, accessToken);
}

export function getAdminResources(
  accessToken?: string | null,
  query: { q?: string; type?: AdminResourceType; accessLevel?: AdminResourceAccessLevel; published?: boolean } = {},
) {
  return authenticatedApiRequest<AdminResourcesResponse>(`/admin/resources${buildQueryString(query)}`, {
    method: "GET",
  }, accessToken);
}

export function createAdminResource(accessToken: string | null | undefined, body: ResourcePayload) {
  return authenticatedApiRequest<AdminResource>("/admin/resources", {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function updateAdminResource(accessToken: string | null | undefined, id: string, body: Partial<ResourcePayload>) {
  return authenticatedApiRequest<AdminResource>(`/admin/resources/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }, accessToken);
}

export function deleteAdminResource(accessToken: string | null | undefined, id: string) {
  return authenticatedApiRequest<{ success: boolean }>(`/admin/resources/${id}`, {
    method: "DELETE",
  }, accessToken);
}

export function getAdminOpportunities(
  accessToken?: string | null,
  query: { q?: string; type?: AdminOpportunityType; status?: AdminOpportunityStatus; published?: boolean } = {},
) {
  return authenticatedApiRequest<AdminOpportunitiesResponse>(`/admin/opportunities${buildQueryString(query)}`, {
    method: "GET",
  }, accessToken);
}

export function createAdminOpportunity(accessToken: string | null | undefined, body: OpportunityPayload) {
  return authenticatedApiRequest<AdminOpportunity>("/admin/opportunities", {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function updateAdminOpportunity(accessToken: string | null | undefined, id: string, body: Partial<OpportunityPayload>) {
  return authenticatedApiRequest<AdminOpportunity>(`/admin/opportunities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }, accessToken);
}

export function deleteAdminOpportunity(accessToken: string | null | undefined, id: string) {
  return authenticatedApiRequest<{ success: boolean }>(`/admin/opportunities/${id}`, {
    method: "DELETE",
  }, accessToken);
}

export function getAdminOpportunityApplications(
  accessToken?: string | null,
  query: {
    q?: string;
    status?: AdminApplicationStatus;
    opportunityId?: string;
    discipline?: string;
    city?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  return authenticatedApiRequest<AdminOpportunityApplicationsResponse>(`/admin/opportunity-applications${buildQueryString(query)}`, {
    method: "GET",
  }, accessToken);
}

export function exportAdminOpportunityApplicationsCsv(
  accessToken?: string | null,
  query: {
    q?: string;
    status?: AdminApplicationStatus;
    opportunityId?: string;
    discipline?: string;
    city?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  return authenticatedTextRequest(`/admin/opportunity-applications/export.csv${buildQueryString(query)}`, {
    method: "GET",
  }, accessToken);
}

export function updateAdminOpportunityApplication(
  accessToken: string | null | undefined,
  id: string,
  body: { status?: AdminApplicationStatus; adminNote?: string },
) {
  return authenticatedApiRequest<AdminOpportunityApplication>(`/admin/opportunity-applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }, accessToken);
}

export function getGalleryAlbums(
  accessToken?: string | null,
  query: { q?: string; category?: GalleryAlbumCategory; published?: boolean } = {},
) {
  return authenticatedApiRequest<GalleryAlbumsResponse>(`/admin/gallery/albums${buildQueryString(query)}`, {
    method: "GET",
  }, accessToken);
}

export function createGalleryAlbum(accessToken: string | null | undefined, body: GalleryAlbumPayload) {
  return authenticatedApiRequest<GalleryAlbum>("/admin/gallery/albums", {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function updateGalleryAlbum(accessToken: string | null | undefined, id: string, body: Partial<GalleryAlbumPayload>) {
  return authenticatedApiRequest<GalleryAlbum>(`/admin/gallery/albums/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }, accessToken);
}

export function deleteGalleryAlbum(accessToken: string | null | undefined, id: string) {
  return authenticatedApiRequest<{ success: boolean }>(`/admin/gallery/albums/${id}`, {
    method: "DELETE",
  }, accessToken);
}

export function createGalleryPhoto(accessToken: string | null | undefined, albumId: string, body: GalleryPhotoPayload) {
  return authenticatedApiRequest<GalleryPhoto>(`/admin/gallery/albums/${albumId}/photos`, {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function updateGalleryPhoto(accessToken: string | null | undefined, id: string, body: Partial<GalleryPhotoPayload>) {
  return authenticatedApiRequest<GalleryPhoto>(`/admin/gallery/photos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }, accessToken);
}

export function deleteGalleryPhoto(accessToken: string | null | undefined, id: string) {
  return authenticatedApiRequest<{ success: boolean }>(`/admin/gallery/photos/${id}`, {
    method: "DELETE",
  }, accessToken);
}

export function getAdminDisciplines(
  accessToken?: string | null,
  query: { q?: string; isActive?: boolean } = {},
) {
  return authenticatedApiRequest<AdminDisciplinesResponse>(`/admin/disciplines${buildQueryString(query)}`, {
    method: "GET",
  }, accessToken);
}

export function createAdminDiscipline(
  accessToken: string | null | undefined,
  body: { name: string; slug?: string; sortOrder?: number; isActive?: boolean },
) {
  return authenticatedApiRequest<AdminDiscipline>("/admin/disciplines", {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function updateAdminDiscipline(
  accessToken: string | null | undefined,
  id: string,
  body: { name?: string; slug?: string; sortOrder?: number; isActive?: boolean },
) {
  return authenticatedApiRequest<AdminDiscipline>(`/admin/disciplines/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }, accessToken);
}

export function deleteAdminDiscipline(accessToken: string | null | undefined, id: string) {
  return authenticatedApiRequest<{ success: boolean }>(`/admin/disciplines/${id}`, {
    method: "DELETE",
  }, accessToken);
}

export function getAdminPartners(
  accessToken?: string | null,
  query: { q?: string; published?: boolean } = {},
) {
  return authenticatedApiRequest<AdminPartnersResponse>(`/admin/partners${buildQueryString(query)}`, {
    method: "GET",
  }, accessToken);
}

export function getPublicPartners() {
  return apiRequest<PublicPartner[]>("/reference/partners", {
    method: "GET",
  });
}

export function getPublicLandingEvent() {
  return apiRequest<PublicLandingEvent | null>("/reference/landing-event", {
    method: "GET",
  });
}

export function getPublicLandingGalleryAlbums() {
  return apiRequest<PublicLandingGalleryAlbum[]>("/reference/landing-gallery", {
    method: "GET",
  });
}

export function getPublicGalleryAlbums() {
  return apiRequest<PublicGalleryAlbum[]>("/reference/gallery-albums", {
    method: "GET",
  });
}

export function createAdminPartner(accessToken: string | null | undefined, body: PartnerPayload) {
  return authenticatedApiRequest<AdminPartner>("/admin/partners", {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function updateAdminPartner(accessToken: string | null | undefined, id: string, body: Partial<PartnerPayload>) {
  return authenticatedApiRequest<AdminPartner>(`/admin/partners/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }, accessToken);
}

export function deleteAdminPartner(accessToken: string | null | undefined, id: string) {
  return authenticatedApiRequest<{ success: boolean }>(`/admin/partners/${id}`, {
    method: "DELETE",
  }, accessToken);
}

export function getCommunityGroups(accessToken?: string | null, query: CommunityGroupQuery = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || (typeof value === "string" && value === "")) {
      return;
    }

    params.set(key, String(value));
  });

  const suffix = params.toString() ? `?${params.toString()}` : "";

  return authenticatedApiRequest<CommunityGroup[]>(`/groups${suffix}`, {
    method: "GET",
  }, accessToken);
}

export function createCommunityGroup(accessToken: string | null | undefined, body: CreateCommunityGroupPayload) {
  return authenticatedApiRequest<CommunityGroup>("/groups", {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function updateCommunityGroup(accessToken: string | null | undefined, groupId: string, body: UpdateCommunityGroupPayload) {
  return authenticatedApiRequest<CommunityGroup>(`/groups/${groupId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }, accessToken);
}

export function deleteCommunityGroup(accessToken: string | null | undefined, groupId: string) {
  return authenticatedApiRequest<CommunityGroup>(`/groups/${groupId}`, {
    method: "DELETE",
  }, accessToken);
}

export function joinCommunityGroup(accessToken: string | null | undefined, groupId: string) {
  return authenticatedApiRequest<CommunityGroup>(`/groups/${groupId}/join`, {
    method: "POST",
  }, accessToken);
}

export function leaveCommunityGroup(accessToken: string | null | undefined, groupId: string) {
  return authenticatedApiRequest<CommunityGroup>(`/groups/${groupId}/leave`, {
    method: "POST",
  }, accessToken);
}

export function getCommunityGroupMemberCandidates(
  accessToken: string | null | undefined,
  groupId: string,
  query: { q?: string; limit?: number } = {},
) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || (typeof value === "string" && value === "")) {
      return;
    }

    params.set(key, String(value));
  });

  const suffix = params.toString() ? `?${params.toString()}` : "";

  return authenticatedApiRequest<CommunityGroupMemberCandidate[]>(`/groups/${groupId}/member-candidates${suffix}`, {
    method: "GET",
  }, accessToken);
}

export function getCommunityGroupMembers(accessToken: string | null | undefined, groupId: string) {
  return authenticatedApiRequest<CommunityGroupMember[]>(`/groups/${groupId}/members`, {
    method: "GET",
  }, accessToken);
}

export function getMyCommunityGroupInvitations(accessToken: string | null | undefined) {
  return authenticatedApiRequest<CommunityGroupInvitation[]>("/groups/invitations", {
    method: "GET",
  }, accessToken);
}

export function getCommunityGroupInvitations(accessToken: string | null | undefined, groupId: string) {
  return authenticatedApiRequest<CommunityGroupInvitation[]>(`/groups/${groupId}/invitations`, {
    method: "GET",
  }, accessToken);
}

export function getCommunityGroupJoinRequests(accessToken: string | null | undefined, groupId: string) {
  return authenticatedApiRequest<CommunityGroupJoinRequest[]>(`/groups/${groupId}/join-requests`, {
    method: "GET",
  }, accessToken);
}

export function reviewCommunityGroupJoinRequest(
  accessToken: string | null | undefined,
  groupId: string,
  requestId: string,
  body: { status: "ACCEPTED" | "DECLINED"; note?: string },
) {
  return authenticatedApiRequest<{ request: CommunityGroupJoinRequest; group: CommunityGroup }>(`/groups/${groupId}/join-requests/${requestId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }, accessToken);
}

export function addCommunityGroupMember(
  accessToken: string | null | undefined,
  groupId: string,
  body: AddCommunityGroupMemberPayload,
) {
  return authenticatedApiRequest<CommunityGroup>(`/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function uploadCommunityGroupPhoto(accessToken: string | null | undefined, groupId: string, file: File) {
  const body = new FormData();
  body.append("file", file);

  return authenticatedApiRequest<CommunityGroup>(`/groups/${groupId}/photo`, {
    method: "POST",
    body,
  }, accessToken);
}

export function inviteCommunityGroupMember(
  accessToken: string | null | undefined,
  groupId: string,
  body: CreateCommunityGroupInvitationPayload,
) {
  return authenticatedApiRequest<CommunityGroupInvitation>(`/groups/${groupId}/invitations`, {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function acceptCommunityGroupInvitation(accessToken: string | null | undefined, invitationId: string) {
  return authenticatedApiRequest<CommunityGroupInvitationActionResponse>(`/groups/invitations/${invitationId}/accept`, {
    method: "PATCH",
  }, accessToken);
}

export function declineCommunityGroupInvitation(accessToken: string | null | undefined, invitationId: string) {
  return authenticatedApiRequest<CommunityGroupInvitation>(`/groups/invitations/${invitationId}/decline`, {
    method: "PATCH",
  }, accessToken);
}

export function cancelCommunityGroupInvitation(
  accessToken: string | null | undefined,
  groupId: string,
  invitationId: string,
) {
  return authenticatedApiRequest<CommunityGroupInvitation>(`/groups/${groupId}/invitations/${invitationId}`, {
    method: "DELETE",
  }, accessToken);
}

export function updateCommunityGroupMemberRole(
  accessToken: string | null | undefined,
  groupId: string,
  userId: string,
  role: "MEMBER" | "MODERATOR",
) {
  return authenticatedApiRequest<CommunityGroup>(`/groups/${groupId}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  }, accessToken);
}

export function removeCommunityGroupMember(accessToken: string | null | undefined, groupId: string, userId: string) {
  return authenticatedApiRequest<CommunityGroup>(`/groups/${groupId}/members/${userId}`, {
    method: "DELETE",
  }, accessToken);
}

export function getCommunityGroupMessages(accessToken: string | null | undefined, groupId: string) {
  return authenticatedApiRequest<CommunityGroupMessage[]>(`/groups/${groupId}/messages`, {
    method: "GET",
  }, accessToken);
}

export function createCommunityGroupMessage(
  accessToken: string | null | undefined,
  groupId: string,
  body: CreateCommunityGroupMessagePayload,
) {
  return authenticatedApiRequest<CommunityGroupMessage>(`/groups/${groupId}/messages`, {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function updateCommunityGroupMessage(
  accessToken: string | null | undefined,
  groupId: string,
  messageId: string,
  content: string,
) {
  return authenticatedApiRequest<CommunityGroupMessage>(`/groups/${groupId}/messages/${messageId}`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  }, accessToken);
}

export function deleteCommunityGroupMessage(accessToken: string | null | undefined, groupId: string, messageId: string) {
  return authenticatedApiRequest<CommunityGroupMessage>(`/groups/${groupId}/messages/${messageId}`, {
    method: "DELETE",
  }, accessToken);
}

export function reportCommunityGroupMessage(
  accessToken: string | null | undefined,
  groupId: string,
  messageId: string,
  body: { reason: DirectMessageReportReason; message?: string },
) {
  return authenticatedApiRequest<{ success: boolean; reportId: string; status: DirectMessageReportStatus }>(`/groups/${groupId}/messages/${messageId}/reports`, {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function getDirectConversations(accessToken?: string | null) {
  return authenticatedApiRequest<DirectConversation[]>("/messages/conversations", {
    method: "GET",
  }, accessToken);
}

export function getArchivedDirectConversations(accessToken?: string | null) {
  return authenticatedApiRequest<DirectConversation[]>("/messages/conversations/archived", {
    method: "GET",
  }, accessToken);
}

export function searchDirectMessages(accessToken: string | null | undefined, query: { q?: string; limit?: number }) {
  return authenticatedApiRequest<DirectMessageSearchResponse>(`/messages/search${buildQueryString(query)}`, {
    method: "GET",
  }, accessToken);
}

export function getUnreadMessageCount(accessToken?: string | null) {
  return authenticatedApiRequest<{ unreadCount: number }>("/messages/unread-count", {
    method: "GET",
  }, accessToken);
}

export function createDirectConversation(accessToken: string | null | undefined, body: CreateDirectConversationPayload) {
  return authenticatedApiRequest<DirectConversation>("/messages/conversations", {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function getDirectConversationMessages(accessToken: string | null | undefined, conversationId: string) {
  return authenticatedApiRequest<DirectMessage[]>(`/messages/conversations/${conversationId}/messages`, {
    method: "GET",
  }, accessToken);
}

export function markDirectConversationRead(accessToken: string | null | undefined, conversationId: string) {
  return authenticatedApiRequest<{ success: boolean; unreadCount: number }>(`/messages/conversations/${conversationId}/read`, {
    method: "PATCH",
  }, accessToken);
}

export function archiveDirectConversation(accessToken: string | null | undefined, conversationId: string) {
  return authenticatedApiRequest<{ success: boolean; conversationId: string; archived: boolean }>(`/messages/conversations/${conversationId}/archive`, {
    method: "PATCH",
  }, accessToken);
}

export function unarchiveDirectConversation(accessToken: string | null | undefined, conversationId: string) {
  return authenticatedApiRequest<{ success: boolean; conversation: DirectConversation }>(`/messages/conversations/${conversationId}/unarchive`, {
    method: "PATCH",
  }, accessToken);
}

export function getDirectConversationAttachments(accessToken: string | null | undefined, conversationId: string) {
  return authenticatedApiRequest<DirectConversationAttachmentsResponse>(`/messages/conversations/${conversationId}/attachments`, {
    method: "GET",
  }, accessToken);
}

export function createDirectMessage(accessToken: string | null | undefined, conversationId: string, body: CreateDirectMessagePayload) {
  return authenticatedApiRequest<DirectMessage>(`/messages/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function reportDirectMessage(
  accessToken: string | null | undefined,
  conversationId: string,
  messageId: string,
  body: { reason: DirectMessageReportReason; message?: string },
) {
  return authenticatedApiRequest<{ success: boolean; reportId: string; status: DirectMessageReportStatus }>(`/messages/conversations/${conversationId}/messages/${messageId}/reports`, {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function blockDirectMessageUser(accessToken: string | null | undefined, userId: string, reason?: string) {
  return authenticatedApiRequest<{ success: boolean; blockId: string; blockedUser: DirectMessageUser }>(`/messages/blocks/${userId}`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  }, accessToken);
}

export function getDirectMessageReports(accessToken: string | null | undefined) {
  return authenticatedApiRequest<{ reports: DirectMessageReport[]; total: number; pending: number }>("/messages/reports", {
    method: "GET",
  }, accessToken);
}

export function moderateDirectMessageReport(
  accessToken: string | null | undefined,
  reportId: string,
  body: { status: DirectMessageReportStatus; deleteMessage?: boolean; note?: string },
) {
  return authenticatedApiRequest<{ success: boolean; report: DirectMessageReport }>(`/messages/reports/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }, accessToken);
}

export function getNotifications(accessToken?: string | null, query: { type?: NotificationType; unreadOnly?: boolean; limit?: number } = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    params.set(key, String(value));
  });

  const suffix = params.toString() ? `?${params.toString()}` : "";

  return authenticatedApiRequest<MemberNotification[]>(`/notifications${suffix}`, {
    method: "GET",
  }, accessToken);
}

export function getUnreadNotificationCount(accessToken?: string | null) {
  return authenticatedApiRequest<{ unreadCount: number }>("/notifications/unread-count", {
    method: "GET",
  }, accessToken);
}

export function getNotificationSummary(accessToken?: string | null) {
  return authenticatedApiRequest<MemberNotificationSummary>("/notifications/summary", {
    method: "GET",
  }, accessToken);
}

export function markNotificationRead(accessToken: string | null | undefined, id: string) {
  return authenticatedApiRequest<MemberNotification>(`/notifications/${id}/read`, {
    method: "PATCH",
  }, accessToken);
}

export function markAllNotificationsRead(accessToken?: string | null) {
  return authenticatedApiRequest<{ success: boolean; unreadCount: number }>("/notifications/read-all", {
    method: "PATCH",
  }, accessToken);
}

export function getNotificationPreferences(accessToken?: string | null) {
  return authenticatedApiRequest<MemberNotificationPreference[]>("/notifications/preferences", {
    method: "GET",
  }, accessToken);
}

export function updateNotificationPreferences(
  accessToken: string | null | undefined,
  preferences: Array<Pick<MemberNotificationPreference, "type" | "platform" | "email" | "whatsapp" | "push" | "frequency">>,
) {
  return authenticatedApiRequest<MemberNotificationPreference[]>("/notifications/preferences", {
    method: "PATCH",
    body: JSON.stringify({ preferences }),
  }, accessToken);
}

export function getReferenceDisciplines() {
  return apiRequest<string[]>("/reference/disciplines", {
    method: "GET",
  });
}

export function createReferenceDiscipline(
  accessToken: string | null | undefined,
  body: { name: string; sortOrder?: number; isActive?: boolean },
) {
  return authenticatedApiRequest<{ id: string; name: string; slug: string; isActive: boolean; sortOrder: number }>("/reference/disciplines", {
    method: "POST",
    body: JSON.stringify(body),
  }, accessToken);
}

export function updateReferenceDiscipline(
  accessToken: string | null | undefined,
  id: string,
  body: { name?: string; sortOrder?: number; isActive?: boolean },
) {
  return authenticatedApiRequest<{ id: string; name: string; slug: string; isActive: boolean; sortOrder: number }>(`/reference/disciplines/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }, accessToken);
}

function buildQueryString(query: Record<string, string | number | boolean | undefined | null>) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}
