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
    };
  }[];
};

export type NetworkMemberQuery = {
  q?: string;
  discipline?: string;
  country?: string;
  city?: string;
  language?: string;
  availability?: string;
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
  attachments: PublicationAttachment[];
  counts: {
    comments: number;
    reactions: number;
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

export type MemberTrainingResource = {
  title: string;
  type: string;
  url: string;
};

export type MemberTrainingEnrollment = {
  id: string;
  status: string;
  progress: number;
  enrolledAt: string;
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
  status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "SELECTED" | "REJECTED" | "WITHDRAWN";
  motivation: string | null;
  portfolioUrl: string | null;
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
  canManage: boolean;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  author: DirectMessageUser;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
};

export type DirectConversation = {
  id: string;
  target: DirectMessageUser | null;
  lastMessage: DirectMessage | null;
  unread: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
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

export type CommunityGroupMemberCandidate = {
  userId: string;
  accountType: string;
  displayName: string;
  avatarUrl: string | null;
  headline: string;
  city: string | null;
  country: string | null;
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

export function uploadProfileAsset(accessToken: string | null | undefined, kind: UploadProfileAssetKind, file: File) {
  const body = new FormData();
  body.append("kind", kind);
  body.append("file", file);

  return authenticatedApiRequest<UploadProfileAssetResponse>("/member/uploads", {
    method: "POST",
    body,
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

export function enrollInTraining(accessToken: string | null | undefined, trainingId: string) {
  return authenticatedApiRequest<TrainingEnrollmentResponse>(`/member/trainings/${trainingId}/enroll`, {
    method: "POST",
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

export function applyToOpportunity(
  accessToken: string | null | undefined,
  opportunityId: string,
  body: { status?: "DRAFT" | "SUBMITTED" | "draft" | "submitted"; motivation?: string; portfolioUrl?: string } = {},
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
    if (value === undefined || value === null || (typeof value === "string" && value === "")) {
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
    if (value === undefined || value === null || value === "") {
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

export function reactToPublication(accessToken: string | null | undefined, publicationId: string, type: PublicationReactionType = "LIKE") {
  return authenticatedApiRequest<{ active: boolean; type: PublicationReactionType; count: number }>(`/publications/${publicationId}/reactions`, {
    method: "POST",
    body: JSON.stringify({ type }),
  }, accessToken);
}

export function getCommunityGroups(accessToken?: string | null, query: CommunityGroupQuery = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
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
    if (value === undefined || value === null || value === "") {
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

export function getDirectConversations(accessToken?: string | null) {
  return authenticatedApiRequest<DirectConversation[]>("/messages/conversations", {
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

export function createDirectMessage(accessToken: string | null | undefined, conversationId: string, body: CreateDirectMessagePayload) {
  return authenticatedApiRequest<DirectMessage>(`/messages/conversations/${conversationId}/messages`, {
    method: "POST",
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

export function getReferenceDisciplines() {
  return apiRequest<string[]>("/reference/disciplines", {
    method: "GET",
  });
}
