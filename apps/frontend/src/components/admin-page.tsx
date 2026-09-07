"use client";

import { type ChangeEvent, type Dispatch, type FormEvent, type SetStateAction, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Edit3,
  Eye,
  EyeOff,
  FileBadge,
  FileText,
  GraduationCap,
  Globe2,
  Handshake,
  ImageIcon,
  LayoutDashboard,
  Lightbulb,
  Loader2,
  Megaphone,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UsersRound,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  createAdminEvent,
  createAdminDiscipline,
  createAdminOpportunity,
  createAdminPartner,
  createAdminResource,
  createAdminTraining,
  createGalleryAlbum,
  deleteAdminEvent,
  deleteAdminDiscipline,
  deleteAdminOpportunity,
  deleteAdminPartner,
  deleteAdminResource,
  deleteAdminTraining,
  deleteGalleryAlbum,
  exportAdminOpportunityApplicationsCsv,
  exportAdminTrainingEnrollmentsCsv,
  getAdminAccountEvolutionRequests,
  getAdminAuditLogs,
  getAdminEvents,
  getAdminDisciplines,
  getAdminGroupMessageReports,
  getAdminMembers,
  getAdminMessageReports,
  getAdminOverview,
  getAdminOpportunityApplications,
  getAdminOpportunities,
  getAdminPartners,
  getAdminPublications,
  getAdminReports,
  getAdminResources,
  getAdminRiskUsers,
  getAdminTrainings,
  getAdminTrainingEnrollments,
  getGalleryAlbums,
  getApiErrorMessage,
  grantAdminAccess,
  issueMemberCertificate,
  updateAdminEvent,
  updateAdminAccountEvolutionRequest,
  updateAdminDiscipline,
  updateAdminGroupMessageReport,
  updateAdminMemberStatus,
  updateAdminMemberVerification,
  updateAdminMessageReport,
  updateAdminOpportunityApplication,
  updateAdminOpportunity,
  updateAdminPartner,
  updateAdminPublicationStatus,
  updateAdminReport,
  updateAdminResource,
  updateAdminTraining,
  updateAdminTrainingEnrollment,
  updateGalleryAlbum,
  uploadAdminAsset,
} from "@/lib/api";
import type {
  AdminAccountEvolutionRequest,
  AdminUploadPurpose,
  AdminApplicationStatus,
  AdminAuditLog,
  AdminDirectMessageReport,
  AdminEvent,
  AdminEventType,
  AdminEnrollmentStatus,
  AdminGroupMessageReport,
  AdminDiscipline,
  AdminMember,
  AdminOpportunity,
  AdminOpportunityApplication,
  AdminOpportunityStatus,
  AdminOpportunityType,
  AdminOverviewResponse,
  AdminPartner,
  AdminPublication,
  AdminReport,
  AdminResource,
  AdminRiskUser,
  AdminResourceAccessLevel,
  AdminResourceType,
  AdminTrainingEnrollment,
  AdminTraining,
  AdminTrainingStatus,
  EventPayload,
  GalleryAlbum,
  GalleryAlbumCategory,
  GalleryAlbumPayload,
  IssueCertificatePayload,
  OpportunityPayload,
  MemberCertificate,
  PartnerPayload,
  PublicationReportReason,
  PublicationReportStatus,
  PublicationStatus,
  PublicationType,
  DirectMessageReportReason,
  DirectMessageReportStatus,
  ResourcePayload,
  TrainingPayload,
} from "@/lib/api";
import { accountTypeLabel, buildInitials } from "@/lib/member-display";
import { useAppSelector } from "@/store/hooks";
import { MemberShell } from "./member-shell";

type AdminTab = "overview" | "content" | "moderation" | "publications" | "members" | "certificates" | "references";
type CertificateFormState = {
  userId: string;
  title: string;
  status: "ISSUED" | "PENDING";
  fileUrl: string;
  badgeUrl: string;
};

type TrainingFormState = TrainingPayload;
type EventFormState = EventPayload;
type ResourceFormState = ResourcePayload;
type OpportunityFormState = OpportunityPayload;
type GalleryAlbumFormState = GalleryAlbumPayload & { photosText?: string };

const tabs: Array<{ value: AdminTab; label: string }> = [
  { value: "overview", label: "Vue d'ensemble" },
  { value: "content", label: "Alimenter" },
  { value: "moderation", label: "Modération" },
  { value: "publications", label: "Publications" },
  { value: "members", label: "Membres" },
  { value: "certificates", label: "Certificats" },
  { value: "references", label: "Références" },
];

const publicationTypeLabels: Record<PublicationType, string> = {
  PROJECT: "Projet",
  CREATION: "Création",
  QUESTION: "Question",
  COLLABORATION: "Collaboration",
  OPPORTUNITY: "Opportunité",
  JOB: "Mission / emploi",
  RESOURCE: "Ressource",
  GROUP_DISCUSSION: "Discussion",
  TRAINING: "Formation",
  EVENT: "Événement",
  ANNOUNCEMENT: "Annonce",
};

const publicationStatusLabels: Record<PublicationStatus, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  ARCHIVED: "Archivée",
  REJECTED: "Rejetée",
};

const reportReasonLabels: Record<PublicationReportReason, string> = {
  SPAM: "Spam",
  INAPPROPRIATE: "Contenu inapproprié",
  MISLEADING: "Information trompeuse",
  HARASSMENT: "Harcèlement",
  OTHER: "Autre raison",
};

const reportStatusLabels: Record<PublicationReportStatus, string> = {
  PENDING: "À traiter",
  REVIEWED: "Traité",
  DISMISSED: "Classé sans suite",
};

const directMessageReportReasonLabels: Record<DirectMessageReportReason, string> = {
  SPAM: "Spam",
  ABUSE: "Abus",
  HARASSMENT: "Harcèlement",
  INAPPROPRIATE: "Message inapproprié",
  OTHER: "Autre raison",
};

const directMessageReportStatusLabels: Record<DirectMessageReportStatus, string> = {
  PENDING: "À traiter",
  REVIEWED: "Traité",
  DISMISSED: "Classé sans suite",
};

const memberStatusLabels: Record<AdminMember["status"], string> = {
  PENDING: "En attente",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  ARCHIVED: "Archivé",
};

const accountEvolutionStatusLabel: Record<AdminAccountEvolutionRequest["status"], string> = {
  PENDING: "À traiter",
  APPROVED: "Approuvée",
  REJECTED: "Refusée",
  CANCELLED: "Annulée",
};

const trainingStatusLabels: Record<AdminTrainingStatus, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  COMPLETED: "Terminée",
  ARCHIVED: "Archivée",
};

const eventTypeLabels: Record<AdminEventType, string> = {
  WORKSHOP: "Workshop",
  MASTERCLASS: "Masterclass",
  CONFERENCE: "Conférence",
  PANEL: "Panel",
  ACTIVATION: "Activation",
  VISIT: "Visite",
  FESTIVAL: "Festival",
};

const trainingStatusOptions = Object.keys(trainingStatusLabels) as AdminTrainingStatus[];
const eventTypeOptions = Object.keys(eventTypeLabels) as AdminEventType[];

const resourceTypeLabels: Record<AdminResourceType, string> = {
  PDF: "PDF",
  TEMPLATE: "Template",
  CONTRACT: "Contrat",
  GUIDE: "Guide",
  VIDEO: "Vidéo",
  PODCAST: "Podcast",
};

const resourceAccessLabels: Record<AdminResourceAccessLevel, string> = {
  PUBLIC: "Public",
  MEMBERS: "Membres",
  ENROLLED: "Participants",
  ADMIN_ONLY: "Admin seulement",
};

const opportunityTypeLabels: Record<AdminOpportunityType, string> = {
  CONTEST: "Concours",
  RESIDENCY: "Résidence",
  MISSION: "Mission",
  FUNDING: "Financement",
  CASTING: "Casting",
  FESTIVAL: "Festival",
  TRAINING: "Formation",
};

const opportunityStatusLabels: Record<AdminOpportunityStatus, string> = {
  DRAFT: "Brouillon",
  OPEN: "Ouverte",
  CLOSED: "Fermée",
  ARCHIVED: "Archivée",
};

const applicationStatusLabels: Record<AdminApplicationStatus, string> = {
  DRAFT: "Brouillon",
  SUBMITTED: "Soumis",
  UNDER_REVIEW: "En étude",
  SELECTED: "Présélectionné",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  WITHDRAWN: "Retiré",
};

const enrollmentStatusLabels: Record<AdminEnrollmentStatus, string> = {
  ENROLLED: "Inscrit",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

const resourceTypeOptions = Object.keys(resourceTypeLabels) as AdminResourceType[];
const resourceAccessOptions = Object.keys(resourceAccessLabels) as AdminResourceAccessLevel[];
const opportunityTypeOptions = Object.keys(opportunityTypeLabels) as AdminOpportunityType[];
const opportunityStatusOptions = Object.keys(opportunityStatusLabels) as AdminOpportunityStatus[];
const applicationStatusOptions = Object.keys(applicationStatusLabels) as AdminApplicationStatus[];
const enrollmentStatusOptions = Object.keys(enrollmentStatusLabels) as AdminEnrollmentStatus[];

const galleryCategoryLabels: Record<GalleryAlbumCategory, string> = {
  FORMATION: "Formations",
  EVENT: "Événements",
  BACKSTAGE: "Backstage",
  ACTIVATION: "Activations",
  PARTNER: "Partenaires",
  VISIT: "Visites",
  CONFERENCE: "Conférences",
};

const galleryCategoryOptions = Object.keys(galleryCategoryLabels) as GalleryAlbumCategory[];

const adminContentActions = [
  {
    href: "/espace-membre/publier?type=ANNOUNCEMENT&audience=PUBLIC",
    icon: Megaphone,
    title: "Annonce officielle",
    text: "Communiqué CCA, information publique ou actualité importante.",
    destination: "Accueil, réseau et page publique si l'audience est publique",
  },
  {
    href: "/espace-membre/publier?type=TRAINING&audience=PUBLIC",
    icon: GraduationCap,
    title: "Formation CCA",
    text: "Atelier, masterclass, programme certifiant ou session à venir.",
    destination: "Formations, agenda si une date est renseignée",
  },
  {
    href: "/espace-membre/publier?type=OPPORTUNITY&audience=PUBLIC",
    icon: Lightbulb,
    title: "Opportunité",
    text: "Appel à projets, mission, résidence, financement ou collaboration.",
    destination: "Opportunités, accueil et agenda si date limite",
  },
  {
    href: "/espace-membre/publier?type=RESOURCE&audience=MEMBERS",
    icon: BookOpen,
    title: "Ressource",
    text: "Guide, modèle, replay, PDF ou document réservé aux bons profils.",
    destination: "Ressources et formations liées",
  },
  {
    href: "/espace-membre/publier?type=EVENT&audience=PUBLIC",
    icon: CalendarDays,
    title: "Événement",
    text: "Rencontre, exposition, panel, lancement ou activité datée.",
    destination: "Agenda, accueil et réseau",
  },
  {
    href: "/espace-membre/publier?type=PROJECT&audience=PUBLIC",
    icon: Sparkles,
    title: "Projet CCA",
    text: "Initiative ou programme porté par CCA pour fédérer la communauté.",
    destination: "Accueil, réseau et Creative ID CCA",
  },
];

const adminContentAnchors = [
  { href: "#admin-content-trainings", label: "Formations" },
  { href: "#admin-content-events", label: "Événements" },
  { href: "#admin-content-gallery", label: "Galerie" },
  { href: "#admin-content-resources", label: "Ressources" },
  { href: "#admin-content-opportunities", label: "Opportunités" },
];

export function AdminPage() {
  const { accessToken, user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [messageReports, setMessageReports] = useState<AdminDirectMessageReport[]>([]);
  const [groupMessageReports, setGroupMessageReports] = useState<AdminGroupMessageReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [riskUsers, setRiskUsers] = useState<AdminRiskUser[]>([]);
  const [publications, setPublications] = useState<AdminPublication[]>([]);
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [accountEvolutionRequests, setAccountEvolutionRequests] = useState<AdminAccountEvolutionRequest[]>([]);
  const [trainings, setTrainings] = useState<AdminTraining[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [opportunities, setOpportunities] = useState<AdminOpportunity[]>([]);
  const [opportunityApplications, setOpportunityApplications] = useState<AdminOpportunityApplication[]>([]);
  const [trainingEnrollments, setTrainingEnrollments] = useState<AdminTrainingEnrollment[]>([]);
  const [galleryAlbums, setGalleryAlbums] = useState<GalleryAlbum[]>([]);
  const [trainingForm, setTrainingForm] = useState<TrainingFormState>({
    title: "",
    description: "",
    startsAt: "",
    endsAt: "",
    location: "",
    coverImageUrl: "",
    capacity: undefined,
    priceCents: 0,
    currency: "USD",
    status: "DRAFT",
    certificateEnabled: true,
    featuredOnLanding: false,
  });
  const [eventForm, setEventForm] = useState<EventFormState>({
    title: "",
    description: "",
    type: "WORKSHOP",
    startsAt: "",
    endsAt: "",
    location: "",
    coverImageUrl: "",
    whatsappUrl: "",
    facebookEventUrl: "",
    published: false,
    featuredOnLanding: false,
  });
  const [resourceForm, setResourceForm] = useState<ResourceFormState>({
    title: "",
    description: "",
    type: "PDF",
    url: "",
    accessLevel: "MEMBERS",
    published: false,
    trainingId: "",
  });
  const [opportunityForm, setOpportunityForm] = useState<OpportunityFormState>({
    title: "",
    description: "",
    type: "FUNDING",
    status: "DRAFT",
    deadline: "",
    location: "",
    eligibilityUrl: "",
    published: false,
  });
  const [galleryAlbumForm, setGalleryAlbumForm] = useState<GalleryAlbumFormState>({
    title: "",
    description: "",
    category: "EVENT",
    coverImageUrl: "",
    published: false,
    featuredOnLanding: false,
    sortOrder: 1,
    photos: [],
    photosText: "",
  });
  const [disciplines, setDisciplines] = useState<AdminDiscipline[]>([]);
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [disciplineName, setDisciplineName] = useState("");
  const [disciplineNumber, setDisciplineNumber] = useState(1);
  const [partnerForm, setPartnerForm] = useState<PartnerPayload>({
    name: "",
    type: "",
    description: "",
    logoUrl: "",
    website: "",
    order: 1,
    published: true,
  });
  const [certificateForm, setCertificateForm] = useState<CertificateFormState>({
    userId: "",
    title: "",
    status: "ISSUED",
    fileUrl: "",
    badgeUrl: "",
  });
  const [issuedCertificate, setIssuedCertificate] = useState<MemberCertificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [editingReferenceKey, setEditingReferenceKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleReports = useMemo(() => reports.slice(0, activeTab === "overview" ? 4 : 50), [activeTab, reports]);
  const visiblePublications = useMemo(() => publications.slice(0, activeTab === "overview" ? 5 : 50), [activeTab, publications]);
  const visibleMembers = useMemo(() => members.slice(0, activeTab === "overview" ? 5 : 50), [activeTab, members]);
  const certificateTargets = useMemo(
    () => members.filter((member) => member.status === "ACTIVE" && (member.type === "CREATOR" || member.type === "LEARNER")),
    [members],
  );
  useEffect(() => {
    if (!accessToken || user?.type !== "ADMIN") {
      return;
    }

    loadAdminData();
  }, [accessToken, user?.type]);

  async function loadAdminData() {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [
        overviewResponse,
        reportResponse,
        messageReportResponse,
        groupMessageReportResponse,
        auditLogResponse,
        riskUserResponse,
        publicationResponse,
        memberResponse,
        accountEvolutionResponse,
        trainingResponse,
        eventResponse,
        resourceResponse,
        opportunityResponse,
        opportunityApplicationResponse,
        trainingEnrollmentResponse,
        galleryResponse,
        disciplineResponse,
        partnerResponse,
      ] = await Promise.all([
        getAdminOverview(accessToken),
        getAdminReports(accessToken, { limit: 30 }),
        getAdminMessageReports(accessToken, { limit: 80 }),
        getAdminGroupMessageReports(accessToken, { limit: 80 }),
        getAdminAuditLogs(accessToken, { limit: 80 }),
        getAdminRiskUsers(accessToken),
        getAdminPublications(accessToken, { limit: 40 }),
        getAdminMembers(accessToken, { limit: 40 }),
        getAdminAccountEvolutionRequests(accessToken, { limit: 40 }),
        getAdminTrainings(accessToken),
        getAdminEvents(accessToken),
        getAdminResources(accessToken),
        getAdminOpportunities(accessToken),
        getAdminOpportunityApplications(accessToken, { limit: 50 }),
        getAdminTrainingEnrollments(accessToken, { limit: 50 }),
        getGalleryAlbums(accessToken),
        getAdminDisciplines(accessToken),
        getAdminPartners(accessToken),
      ]);

      setOverview(overviewResponse);
      setReports(reportResponse.reports);
      setMessageReports(messageReportResponse.reports);
      setGroupMessageReports(groupMessageReportResponse.reports);
      setAuditLogs(auditLogResponse.logs);
      setRiskUsers(riskUserResponse.users);
      setPublications(publicationResponse.publications);
      setMembers(memberResponse.members);
      setAccountEvolutionRequests(accountEvolutionResponse.requests);
      setTrainings(trainingResponse.trainings);
      setEvents(eventResponse.events);
      setResources(resourceResponse.resources);
      setOpportunities(opportunityResponse.opportunities);
      setOpportunityApplications(opportunityApplicationResponse.applications);
      setTrainingEnrollments(trainingEnrollmentResponse.enrollments);
      setGalleryAlbums(galleryResponse.albums);
      setDisciplines(disciplineResponse.disciplines);
      setPartners(partnerResponse.partners);
      setDisciplineNumber(nextAvailableNumber(disciplineResponse.disciplines.map((discipline) => discipline.sortOrder)));
      setPartnerForm((current) => ({
        ...current,
        order: current.name.trim() ? current.order : nextAvailableNumber(partnerResponse.partners.map((partner) => partner.order)),
      }));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Impossible de charger l'espace admin pour le moment."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReportAction(report: AdminReport, input: { status?: Exclude<PublicationReportStatus, "PENDING">; publicationStatus?: Exclude<PublicationStatus, "DRAFT"> }) {
    if (!accessToken) {
      return;
    }

    setBusyKey(`report-${report.id}`);
    setNotice(null);
    setError(null);

    try {
      await updateAdminReport(accessToken, report.id, input);
      setNotice("Signalement mis à jour.");
      await loadAdminData();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Le signalement n'a pas pu être traité."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleMessageReportAction(report: AdminDirectMessageReport, input: { status: Exclude<DirectMessageReportStatus, "PENDING">; deleteMessage?: boolean; note?: string }) {
    if (!accessToken) {
      return;
    }

    setBusyKey(`message-report-${report.id}`);
    setNotice(null);
    setError(null);

    try {
      await updateAdminMessageReport(accessToken, report.id, input);
      setNotice(input.deleteMessage ? "Message supprimé et signalement traité." : "Signalement de message mis à jour.");
      await loadAdminData();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Le signalement de message n'a pas pu être traité."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleGroupMessageReportAction(report: AdminGroupMessageReport, input: { status: Exclude<DirectMessageReportStatus, "PENDING">; deleteMessage?: boolean; note?: string }) {
    if (!accessToken) {
      return;
    }

    setBusyKey(`group-message-report-${report.id}`);
    setNotice(null);
    setError(null);

    try {
      await updateAdminGroupMessageReport(accessToken, report.id, input);
      setNotice(input.deleteMessage ? "Message de groupe supprimé et signalement traité." : "Signalement de groupe mis à jour.");
      await loadAdminData();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Le signalement de groupe n'a pas pu être traité."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleModerationSuspend(member: AdminMember) {
    if (!accessToken) {
      return;
    }

    setBusyKey(`moderation-suspend-${member.id}`);
    setNotice(null);
    setError(null);

    try {
      await updateAdminMemberStatus(accessToken, member.id, "SUSPENDED");
      setNotice(`Le compte ${member.displayName} a été suspendu.`);
      await loadAdminData();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Le compte n'a pas pu être suspendu depuis la modération."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handlePublicationStatus(publication: AdminPublication, status: Exclude<PublicationStatus, "DRAFT">) {
    if (!accessToken) {
      return;
    }

    setBusyKey(`publication-${publication.id}-${status}`);
    setNotice(null);
    setError(null);

    try {
      await updateAdminPublicationStatus(accessToken, publication.id, status);
      setNotice("Publication mise à jour.");
      await loadAdminData();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "La publication n'a pas pu être mise à jour."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleMemberStatus(member: AdminMember, status: AdminMember["status"]) {
    if (!accessToken) {
      return;
    }

    setBusyKey(`member-${member.id}-${status}`);
    setNotice(null);
    setError(null);

    try {
      await updateAdminMemberStatus(accessToken, member.id, status);
      setNotice("Compte membre mis à jour.");
      await loadAdminData();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Le compte n'a pas pu être mis à jour."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleGrantAdminAccess(member: AdminMember) {
    if (!accessToken) {
      return;
    }

    setBusyKey(`member-${member.id}-admin`);
    setNotice(null);
    setError(null);

    try {
      await grantAdminAccess(accessToken, member.id);
      setNotice("Accès admin activé.");
      await loadAdminData();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "L'accès admin n'a pas pu être activé."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleMemberVerification(member: AdminMember, verified: boolean) {
    if (!accessToken) {
      return;
    }

    setBusyKey(`member-${member.id}-verification`);
    setError("");
    setNotice(null);

    try {
      await updateAdminMemberVerification(accessToken, member.id, verified);
      setMembers((current) => current.map((item) => (
        item.id === member.id ? { ...item, verifiedAt: verified ? new Date().toISOString() : null } : item
      )));
      setNotice(verified ? "Profil Creative ID vérifié." : "Vérification du profil retirée.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "La vérification du profil n'a pas pu être mise à jour."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleAccountEvolutionDecision(request: AdminAccountEvolutionRequest, status: "APPROVED" | "REJECTED") {
    if (!accessToken) {
      return;
    }

    setBusyKey(`account-evolution-${request.id}-${status}`);
    setError("");
    setNotice(null);

    try {
      await updateAdminAccountEvolutionRequest(accessToken, request.id, {
        status,
        note: status === "APPROVED" ? "Demande créateur validée par CCA." : "Demande créateur refusée par CCA.",
      });
      setNotice(status === "APPROVED" ? "Parcours créateur activé." : "Demande créateur refusée.");
      await loadAdminData();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "La demande de parcours n'a pas pu être traitée."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleCreateDiscipline() {
    if (!accessToken || !disciplineName.trim()) {
      return;
    }

    if (disciplineNumber < 1) {
      setError("Le numéro d'affichage doit être supérieur ou égal à 1.");
      return;
    }

    if (isNumberUsed(disciplines, "sortOrder", disciplineNumber)) {
      setError("Ce numéro est déjà utilisé. Choisissez un autre numéro.");
      return;
    }

    setBusyKey("discipline-create");
    setNotice(null);
    setError(null);

    try {
      await createAdminDiscipline(accessToken, { name: disciplineName.trim(), sortOrder: disciplineNumber });
      setDisciplineName("");
      const nextDisciplines = await getAdminDisciplines(accessToken);
      setDisciplines(nextDisciplines.disciplines);
      setDisciplineNumber(nextAvailableNumber(nextDisciplines.disciplines.map((discipline) => discipline.sortOrder)));
      setNotice("Discipline ajoutée.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "La discipline n'a pas pu être ajoutée."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleUpdateDiscipline(discipline: AdminDiscipline, input: { name?: string; sortOrder?: number; isActive?: boolean }) {
    if (!accessToken) {
      return;
    }

    if (input.sortOrder !== undefined && input.sortOrder < 1) {
      setError("Le numéro d'affichage doit être supérieur ou égal à 1.");
      return;
    }

    if (input.sortOrder !== undefined && isNumberUsed(disciplines, "sortOrder", input.sortOrder, discipline.id)) {
      setError("Ce numéro est déjà utilisé. Choisissez un autre numéro.");
      return;
    }

    setBusyKey(`discipline-${discipline.id}`);
    setNotice(null);
    setError(null);

    try {
      await updateAdminDiscipline(accessToken, discipline.id, input);
      setEditingReferenceKey(null);
      const response = await getAdminDisciplines(accessToken);
      setDisciplines(response.disciplines);
      setNotice("Discipline mise à jour.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "La discipline n'a pas pu être mise à jour."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDeleteDiscipline(discipline: AdminDiscipline) {
    if (!accessToken) {
      return;
    }

    const confirmed = window.confirm(`Supprimer la discipline "${discipline.name}" ?`);

    if (!confirmed) {
      return;
    }

    setBusyKey(`discipline-${discipline.id}-delete`);
    setNotice(null);
    setError(null);

    try {
      await deleteAdminDiscipline(accessToken, discipline.id);
      const response = await getAdminDisciplines(accessToken);
      setDisciplines(response.disciplines);
      setNotice("Discipline supprimée.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "La discipline n'a pas pu être supprimée."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleCreatePartner() {
    if (!accessToken || !partnerForm.name.trim()) {
      return;
    }

    const partnerNumber = partnerForm.order ?? 1;

    if (partnerNumber < 1) {
      setError("Le numéro d'affichage doit être supérieur ou égal à 1.");
      return;
    }

    if (isNumberUsed(partners, "order", partnerNumber)) {
      setError("Ce numéro est déjà utilisé. Choisissez un autre numéro.");
      return;
    }

    setBusyKey("partner-create");
    setNotice(null);
    setError(null);

    try {
      await createAdminPartner(accessToken, normalizePartnerCreatePayload(partnerForm));
      const response = await getAdminPartners(accessToken);
      setPartnerForm({
        name: "",
        type: "",
        description: "",
        logoUrl: "",
        website: "",
        order: nextAvailableNumber(response.partners.map((partner) => partner.order)),
        published: true,
      });
      setPartners(response.partners);
      setNotice("Partenaire ajouté.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Le partenaire n'a pas pu être ajouté."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleUpdatePartner(partner: AdminPartner, input: Partial<PartnerPayload>) {
    if (!accessToken) {
      return;
    }

    if (input.order !== undefined && input.order < 1) {
      setError("Le numéro d'affichage doit être supérieur ou égal à 1.");
      return;
    }

    if (input.order !== undefined && isNumberUsed(partners, "order", input.order, partner.id)) {
      setError("Ce numéro est déjà utilisé. Choisissez un autre numéro.");
      return;
    }

    setBusyKey(`partner-${partner.id}`);
    setNotice(null);
    setError(null);

    try {
      await updateAdminPartner(accessToken, partner.id, normalizePartnerPayload(input));
      setEditingReferenceKey(null);
      const response = await getAdminPartners(accessToken);
      setPartners(response.partners);
      setNotice("Partenaire mis à jour.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Le partenaire n'a pas pu être mis à jour."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDeletePartner(partner: AdminPartner) {
    if (!accessToken) {
      return;
    }

    const confirmed = window.confirm(`Supprimer le partenaire "${partner.name}" ?`);

    if (!confirmed) {
      return;
    }

    setBusyKey(`partner-${partner.id}-delete`);
    setNotice(null);
    setError(null);

    try {
      await deleteAdminPartner(accessToken, partner.id);
      const response = await getAdminPartners(accessToken);
      setPartners(response.partners);
      setNotice("Partenaire supprimé.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Le partenaire n'a pas pu être supprimé."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleCreateTraining(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken || !trainingForm.title.trim() || !trainingForm.description.trim()) {
      return;
    }

    setBusyKey("training-create");
    setNotice(null);
    setError(null);

    try {
      await createAdminTraining(accessToken, normalizeTrainingCreatePayload(trainingForm));
      const response = await getAdminTrainings(accessToken);
      setTrainings(response.trainings);
      setTrainingForm({
        title: "",
        description: "",
        startsAt: "",
        endsAt: "",
        location: "",
        coverImageUrl: "",
        capacity: undefined,
        priceCents: 0,
        currency: "USD",
        status: "DRAFT",
        certificateEnabled: true,
        featuredOnLanding: false,
      });
      setNotice("Formation ajoutée.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "La formation n'a pas pu être ajoutée."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleUpdateTraining(training: AdminTraining, input: Partial<TrainingPayload>) {
    if (!accessToken) {
      return;
    }

    setBusyKey(`training-${training.id}`);
    setNotice(null);
    setError(null);

    try {
      await updateAdminTraining(accessToken, training.id, normalizeTrainingPayload(input));
      setEditingReferenceKey(null);
      const response = await getAdminTrainings(accessToken);
      setTrainings(response.trainings);
      setNotice("Formation mise à jour.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "La formation n'a pas pu être mise à jour."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDeleteTraining(training: AdminTraining) {
    if (!accessToken) {
      return;
    }

    const confirmed = window.confirm(`Supprimer la formation "${training.title}" ?`);

    if (!confirmed) {
      return;
    }

    setBusyKey(`training-${training.id}-delete`);
    setNotice(null);
    setError(null);

    try {
      await deleteAdminTraining(accessToken, training.id);
      const response = await getAdminTrainings(accessToken);
      setTrainings(response.trainings);
      setNotice("Formation supprimée.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "La formation n'a pas pu être supprimée."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleUpdateTrainingEnrollment(enrollment: AdminTrainingEnrollment, input: { status?: AdminEnrollmentStatus; progress?: number; adminNote?: string }) {
    if (!accessToken) {
      return;
    }

    setBusyKey(`training-enrollment-${enrollment.id}`);
    setNotice(null);
    setError(null);

    try {
      const updated = await updateAdminTrainingEnrollment(accessToken, enrollment.id, input);
      setTrainingEnrollments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setNotice("Inscription mise à jour.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "L'inscription n'a pas pu être mise à jour."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken || !eventForm.title.trim() || !eventForm.description.trim() || !eventForm.startsAt || !eventForm.endsAt || !eventForm.location.trim()) {
      return;
    }

    setBusyKey("event-create");
    setNotice(null);
    setError(null);

    try {
      await createAdminEvent(accessToken, normalizeEventCreatePayload(eventForm));
      const response = await getAdminEvents(accessToken);
      setEvents(response.events);
      setEventForm({
        title: "",
        description: "",
        type: "WORKSHOP",
        startsAt: "",
        endsAt: "",
        location: "",
        coverImageUrl: "",
        whatsappUrl: "",
        facebookEventUrl: "",
        published: false,
        featuredOnLanding: false,
      });
      setNotice("Événement ajouté.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "L'événement n'a pas pu être ajouté."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleUpdateEvent(event: AdminEvent, input: Partial<EventPayload>) {
    if (!accessToken) {
      return;
    }

    setBusyKey(`event-${event.id}`);
    setNotice(null);
    setError(null);

    try {
      await updateAdminEvent(accessToken, event.id, normalizeEventPayload(input));
      setEditingReferenceKey(null);
      const response = await getAdminEvents(accessToken);
      setEvents(response.events);
      setNotice("Événement mis à jour.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "L'événement n'a pas pu être mis à jour."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDeleteEvent(event: AdminEvent) {
    if (!accessToken) {
      return;
    }

    const confirmed = window.confirm(`Supprimer l'événement "${event.title}" ?`);

    if (!confirmed) {
      return;
    }

    setBusyKey(`event-${event.id}-delete`);
    setNotice(null);
    setError(null);

    try {
      await deleteAdminEvent(accessToken, event.id);
      const response = await getAdminEvents(accessToken);
      setEvents(response.events);
      setNotice("Événement supprimé.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "L'événement n'a pas pu être supprimé."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleCreateResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken || !resourceForm.title.trim() || !resourceForm.url.trim()) {
      return;
    }

    setBusyKey("resource-create");
    setNotice(null);
    setError(null);

    try {
      await createAdminResource(accessToken, normalizeResourceCreatePayload(resourceForm));
      const response = await getAdminResources(accessToken);
      setResources(response.resources);
      setResourceForm({
        title: "",
        description: "",
        type: "PDF",
        url: "",
        accessLevel: "MEMBERS",
        published: false,
        trainingId: "",
      });
      setNotice("Ressource ajoutée.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "La ressource n'a pas pu être ajoutée."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleUpdateResource(resource: AdminResource, input: Partial<ResourcePayload>) {
    if (!accessToken) {
      return;
    }

    setBusyKey(`resource-${resource.id}`);
    setNotice(null);
    setError(null);

    try {
      await updateAdminResource(accessToken, resource.id, normalizeResourcePayload(input));
      setEditingReferenceKey(null);
      const response = await getAdminResources(accessToken);
      setResources(response.resources);
      setNotice("Ressource mise à jour.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "La ressource n'a pas pu être mise à jour."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDeleteResource(resource: AdminResource) {
    if (!accessToken) {
      return;
    }

    const confirmed = window.confirm(`Supprimer la ressource "${resource.title}" ?`);

    if (!confirmed) {
      return;
    }

    setBusyKey(`resource-${resource.id}-delete`);
    setNotice(null);
    setError(null);

    try {
      await deleteAdminResource(accessToken, resource.id);
      const response = await getAdminResources(accessToken);
      setResources(response.resources);
      setNotice("Ressource supprimée.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "La ressource n'a pas pu être supprimée."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleCreateOpportunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken || !opportunityForm.title.trim() || !opportunityForm.description.trim()) {
      return;
    }

    setBusyKey("opportunity-create");
    setNotice(null);
    setError(null);

    try {
      await createAdminOpportunity(accessToken, normalizeOpportunityCreatePayload(opportunityForm));
      const response = await getAdminOpportunities(accessToken);
      setOpportunities(response.opportunities);
      setOpportunityForm({
        title: "",
        description: "",
        type: "FUNDING",
        status: "DRAFT",
        deadline: "",
        location: "",
        eligibilityUrl: "",
        published: false,
      });
      setNotice("Opportunité ajoutée.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "L'opportunité n'a pas pu être ajoutée."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleUpdateOpportunity(opportunity: AdminOpportunity, input: Partial<OpportunityPayload>) {
    if (!accessToken) {
      return;
    }

    setBusyKey(`opportunity-${opportunity.id}`);
    setNotice(null);
    setError(null);

    try {
      await updateAdminOpportunity(accessToken, opportunity.id, normalizeOpportunityPayload(input));
      setEditingReferenceKey(null);
      const response = await getAdminOpportunities(accessToken);
      setOpportunities(response.opportunities);
      setNotice("Opportunité mise à jour.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "L'opportunité n'a pas pu être mise à jour."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDeleteOpportunity(opportunity: AdminOpportunity) {
    if (!accessToken) {
      return;
    }

    const confirmed = window.confirm(`Supprimer l'opportunité "${opportunity.title}" ?`);

    if (!confirmed) {
      return;
    }

    setBusyKey(`opportunity-${opportunity.id}-delete`);
    setNotice(null);
    setError(null);

    try {
      await deleteAdminOpportunity(accessToken, opportunity.id);
      const response = await getAdminOpportunities(accessToken);
      setOpportunities(response.opportunities);
      setNotice("Opportunité supprimée.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "L'opportunité n'a pas pu être supprimée."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleUpdateOpportunityApplication(application: AdminOpportunityApplication, input: { status?: AdminApplicationStatus; adminNote?: string }) {
    if (!accessToken) {
      return;
    }

    setBusyKey(`opportunity-application-${application.id}`);
    setNotice(null);
    setError(null);

    try {
      const updated = await updateAdminOpportunityApplication(accessToken, application.id, input);
      setOpportunityApplications((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setNotice("Candidature mise à jour.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "La candidature n'a pas pu être mise à jour."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleCreateGalleryAlbum(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken || !galleryAlbumForm.title.trim()) {
      return;
    }

    setBusyKey("gallery-create");
    setNotice(null);
    setError(null);

    try {
      await createGalleryAlbum(accessToken, normalizeGalleryAlbumCreatePayload(galleryAlbumForm));
      const response = await getGalleryAlbums(accessToken);
      setGalleryAlbums(response.albums);
      setGalleryAlbumForm({
        title: "",
        description: "",
        category: "EVENT",
        coverImageUrl: "",
        published: false,
        featuredOnLanding: false,
        sortOrder: nextAvailableNumber(response.albums.map((album) => album.sortOrder)),
        photos: [],
        photosText: "",
      });
      setNotice("Album ajouté à la galerie officielle.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "L'album n'a pas pu être ajouté."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleUpdateGalleryAlbum(album: GalleryAlbum, input: Partial<GalleryAlbumPayload>) {
    if (!accessToken) {
      return;
    }

    setBusyKey(`gallery-${album.id}`);
    setNotice(null);
    setError(null);

    try {
      await updateGalleryAlbum(accessToken, album.id, normalizeGalleryAlbumPayload(input));
      setEditingReferenceKey(null);
      const response = await getGalleryAlbums(accessToken);
      setGalleryAlbums(response.albums);
      setNotice("Album mis à jour.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "L'album n'a pas pu être mis à jour."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDeleteGalleryAlbum(album: GalleryAlbum) {
    if (!accessToken) {
      return;
    }

    const confirmed = window.confirm(`Supprimer l'album "${album.title}" et ses photos ?`);

    if (!confirmed) {
      return;
    }

    setBusyKey(`gallery-${album.id}-delete`);
    setNotice(null);
    setError(null);

    try {
      await deleteGalleryAlbum(accessToken, album.id);
      const response = await getGalleryAlbums(accessToken);
      setGalleryAlbums(response.albums);
      setNotice("Album supprimé.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "L'album n'a pas pu être supprimé."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleIssueCertificate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken || !certificateForm.userId || !certificateForm.title.trim()) {
      return;
    }

    const payload: IssueCertificatePayload = {
      userId: certificateForm.userId,
      title: certificateForm.title.trim(),
      status: certificateForm.status,
    };

    if (certificateForm.fileUrl.trim()) {
      payload.fileUrl = certificateForm.fileUrl.trim();
    }

    if (certificateForm.badgeUrl.trim()) {
      payload.badgeUrl = certificateForm.badgeUrl.trim();
    }

    setBusyKey("certificate-issue");
    setNotice(null);
    setError(null);

    try {
      const response = await issueMemberCertificate(accessToken, payload);
      setIssuedCertificate(response.certificate);
      setCertificateForm((current) => ({
        ...current,
        title: "",
        fileUrl: "",
        badgeUrl: "",
      }));
      setNotice(
        response.certificate.status === "ISSUED"
          ? `Certificat ${response.certificate.number} délivré au membre.`
          : `Certificat ${response.certificate.number} préparé pour le membre.`,
      );
      await loadAdminData();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Le certificat n'a pas pu être créé."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleAdminUpload(purpose: AdminUploadPurpose, file: File, key: string) {
    if (!accessToken) {
      throw new Error("Connectez-vous avec un compte administrateur.");
    }

    setUploadingKey(key);
    setNotice(null);
    setError(null);

    try {
      const response = await uploadAdminAsset(accessToken, purpose, file);
      setNotice(`Fichier importé : ${response.name}`);
      return response.url;
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, "Le fichier n'a pas pu être importé.");
      setError(message);
      throw new Error(message);
    } finally {
      setUploadingKey(null);
    }
  }

  if (user && user.type !== "ADMIN") {
    return (
      <MemberShell activeItem="Admin">
        <section className="admin-page">
          <div className="member-card admin-restricted-card">
            <ShieldCheck aria-hidden="true" />
            <div>
              <span className="member-kicker">Admin CCA</span>
              <h1>Accès réservé à l'équipe CCA</h1>
              <p>Votre compte membre ne permet pas d'ouvrir le back-office.</p>
            </div>
          </div>
        </section>
      </MemberShell>
    );
  }

  return (
    <MemberShell activeItem="Admin">
      <section className="admin-page">
        <section className="admin-hero">
          <div>
            <span className="member-kicker">Back-office</span>
            <h1>Piloter la plateforme CCA avec clarté.</h1>
            <p>Modération, comptes, contenus, disciplines et actions prioritaires sont réunis pour l'équipe.</p>
            <div className="admin-hero-actions">
              <button type="button" className="member-primary-button" onClick={() => setActiveTab("content")}>
                <Plus aria-hidden="true" /> Alimenter
              </button>
              <button type="button" className="member-secondary-button" onClick={loadAdminData} disabled={isLoading}>
                <RefreshCw aria-hidden="true" /> Actualiser
              </button>
            </div>
          </div>

          <div className="admin-hero-panel" aria-label="Priorités admin">
            <AdminHeroMetric icon={AlertTriangle} value={overview?.summary.pendingReports ?? 0} label="signalements" tone="warning" />
            <AdminHeroMetric icon={UserCheck} value={overview?.summary.pendingMembers ?? 0} label="comptes en attente" />
            <AdminHeroMetric icon={FileText} value={overview?.summary.draftPublications ?? 0} label="brouillons" />
          </div>
        </section>

        <nav className="admin-tabs" aria-label="Sections admin">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={activeTab === tab.value ? "is-active" : ""}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {notice ? <p className="admin-notice is-success">{notice}</p> : null}
        {error ? <p className="admin-notice is-error">{error}</p> : null}
        {isLoading ? (
          <div className="member-card admin-loading-card">
            <Loader2 aria-hidden="true" />
            <span>Chargement du back-office...</span>
          </div>
        ) : null}

        {!isLoading && overview ? (
          <>
            {activeTab === "overview" ? (
              <div className="admin-dashboard-grid">
                <section className="member-card admin-section">
                  <SectionTitle icon={LayoutDashboard} title="Vue d'ensemble" subtitle="Les chiffres utiles pour décider vite." />
                  <div className="admin-stat-grid">
                    <StatCard label="Membres actifs" value={overview.summary.activeMembers} helper={`${overview.summary.membersTotal} comptes au total`} />
                    <StatCard label="Publications" value={overview.summary.publishedPublications} helper={`${overview.summary.draftPublications} brouillons`} />
                    <StatCard label="Signalements" value={overview.summary.pendingReports} helper="À vérifier en priorité" />
                    <StatCard label="Candidatures" value={overview.summary.applicationsPending} helper="En attente de revue" />
                  </div>
                </section>

                <section className="member-card admin-section">
                  <SectionTitle icon={Sparkles} title="Alimenter l'application" subtitle="Créer les contenus qui donnent de la valeur aux membres." />
                  <div className="admin-action-grid is-compact">
                    {adminContentActions.slice(0, 4).map((action) => (
                      <AdminQuickAction key={action.title} {...action} />
                    ))}
                    <AdminQuickButton icon={FileBadge} title="Certificat CCA" text="Créer et attribuer un certificat officiel." onClick={() => setActiveTab("certificates")} />
                  </div>
                </section>

                <ReportsPanel reports={visibleReports} busyKey={busyKey} onAction={handleReportAction} compact />
                <PublicationsPanel publications={visiblePublications} busyKey={busyKey} onStatus={handlePublicationStatus} compact />
              </div>
            ) : null}

            {activeTab === "content" ? (
              <ContentAdminPanel
                trainings={trainings}
                events={events}
                resources={resources}
                opportunities={opportunities}
                opportunityApplications={opportunityApplications}
                trainingEnrollments={trainingEnrollments}
                galleryAlbums={galleryAlbums}
                trainingForm={trainingForm}
                eventForm={eventForm}
                resourceForm={resourceForm}
                opportunityForm={opportunityForm}
                galleryAlbumForm={galleryAlbumForm}
                busyKey={busyKey}
                uploadingKey={uploadingKey}
                editingReferenceKey={editingReferenceKey}
                onChangeTrainingForm={setTrainingForm}
                onChangeEventForm={setEventForm}
                onChangeResourceForm={setResourceForm}
                onChangeOpportunityForm={setOpportunityForm}
                onChangeGalleryAlbumForm={setGalleryAlbumForm}
                onChangeEditingReferenceKey={setEditingReferenceKey}
                onCreateTraining={handleCreateTraining}
                onUpdateTraining={handleUpdateTraining}
                onDeleteTraining={handleDeleteTraining}
                onUpdateTrainingEnrollment={handleUpdateTrainingEnrollment}
                onCreateEvent={handleCreateEvent}
                onUpdateEvent={handleUpdateEvent}
                onDeleteEvent={handleDeleteEvent}
                onCreateResource={handleCreateResource}
                onUpdateResource={handleUpdateResource}
                onDeleteResource={handleDeleteResource}
                onCreateOpportunity={handleCreateOpportunity}
                onUpdateOpportunity={handleUpdateOpportunity}
                onDeleteOpportunity={handleDeleteOpportunity}
                onUpdateOpportunityApplication={handleUpdateOpportunityApplication}
                onCreateGalleryAlbum={handleCreateGalleryAlbum}
                onUpdateGalleryAlbum={handleUpdateGalleryAlbum}
                onDeleteGalleryAlbum={handleDeleteGalleryAlbum}
                onUpload={handleAdminUpload}
                onOpenCertificates={() => setActiveTab("certificates")}
              />
            ) : null}

            {activeTab === "moderation" ? (
              <ReportsPanel
                reports={reports}
                messageReports={messageReports}
                groupMessageReports={groupMessageReports}
                auditLogs={auditLogs}
                riskUsers={riskUsers}
                busyKey={busyKey}
                onAction={handleReportAction}
                onMessageAction={handleMessageReportAction}
                onGroupMessageAction={handleGroupMessageReportAction}
                onSuspend={handleModerationSuspend}
              />
            ) : null}

            {activeTab === "publications" ? (
              <PublicationsPanel publications={visiblePublications} busyKey={busyKey} onStatus={handlePublicationStatus} />
            ) : null}

            {activeTab === "members" ? (
              <MembersPanel
                members={visibleMembers}
                accountEvolutionRequests={accountEvolutionRequests}
                busyKey={busyKey}
                onStatus={handleMemberStatus}
                onGrantAdminAccess={handleGrantAdminAccess}
                onVerification={handleMemberVerification}
                onAccountEvolutionDecision={handleAccountEvolutionDecision}
              />
            ) : null}

            {activeTab === "certificates" ? (
              <CertificatesAdminPanel
                members={certificateTargets}
                form={certificateForm}
                busyKey={busyKey}
                issuedCertificate={issuedCertificate}
                uploadingKey={uploadingKey}
                onChange={setCertificateForm}
                onUpload={handleAdminUpload}
                onSubmit={handleIssueCertificate}
              />
            ) : null}

            {activeTab === "references" ? (
              <ReferencesPanel
                disciplines={disciplines}
                partners={partners}
                disciplineName={disciplineName}
                disciplineNumber={disciplineNumber}
                partnerForm={partnerForm}
                busyKey={busyKey}
                uploadingKey={uploadingKey}
                editingReferenceKey={editingReferenceKey}
                onChangeDisciplineName={setDisciplineName}
                onChangeDisciplineNumber={setDisciplineNumber}
                onChangePartnerForm={setPartnerForm}
                onChangeEditingReferenceKey={setEditingReferenceKey}
                onCreateDiscipline={handleCreateDiscipline}
                onUpdateDiscipline={handleUpdateDiscipline}
                onDeleteDiscipline={handleDeleteDiscipline}
                onCreatePartner={handleCreatePartner}
                onUpdatePartner={handleUpdatePartner}
                onDeletePartner={handleDeletePartner}
                onUpload={handleAdminUpload}
              />
            ) : null}
          </>
        ) : null}
      </section>
    </MemberShell>
  );
}

function AdminHeroMetric({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  tone?: "warning";
}) {
  return (
    <article className={tone === "warning" && value > 0 ? "is-warning" : ""}>
      <Icon aria-hidden="true" />
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle: string }) {
  return (
    <div className="admin-section-title">
      <Icon aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <article className="admin-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function AdminQuickAction({ href, icon: Icon, title, text }: { href: string; icon: LucideIcon; title: string; text: string }) {
  return (
    <Link className="admin-quick-action" href={href}>
      <Icon aria-hidden="true" />
      <strong>{title}</strong>
      <span>{text}</span>
    </Link>
  );
}

function ContentAdminPanel({
  trainings,
  events,
  resources,
  opportunities,
  opportunityApplications,
  trainingEnrollments,
  galleryAlbums,
  trainingForm,
  eventForm,
  resourceForm,
  opportunityForm,
  galleryAlbumForm,
  busyKey,
  uploadingKey,
  editingReferenceKey,
  onChangeTrainingForm,
  onChangeEventForm,
  onChangeResourceForm,
  onChangeOpportunityForm,
  onChangeGalleryAlbumForm,
  onChangeEditingReferenceKey,
  onCreateTraining,
  onUpdateTraining,
  onDeleteTraining,
  onUpdateTrainingEnrollment,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  onCreateResource,
  onUpdateResource,
  onDeleteResource,
  onCreateOpportunity,
  onUpdateOpportunity,
  onDeleteOpportunity,
  onUpdateOpportunityApplication,
  onCreateGalleryAlbum,
  onUpdateGalleryAlbum,
  onDeleteGalleryAlbum,
  onUpload,
  onOpenCertificates,
}: {
  trainings: AdminTraining[];
  events: AdminEvent[];
  resources: AdminResource[];
  opportunities: AdminOpportunity[];
  opportunityApplications: AdminOpportunityApplication[];
  trainingEnrollments: AdminTrainingEnrollment[];
  galleryAlbums: GalleryAlbum[];
  trainingForm: TrainingFormState;
  eventForm: EventFormState;
  resourceForm: ResourceFormState;
  opportunityForm: OpportunityFormState;
  galleryAlbumForm: GalleryAlbumFormState;
  busyKey: string | null;
  uploadingKey: string | null;
  editingReferenceKey: string | null;
  onChangeTrainingForm: Dispatch<SetStateAction<TrainingFormState>>;
  onChangeEventForm: Dispatch<SetStateAction<EventFormState>>;
  onChangeResourceForm: Dispatch<SetStateAction<ResourceFormState>>;
  onChangeOpportunityForm: Dispatch<SetStateAction<OpportunityFormState>>;
  onChangeGalleryAlbumForm: Dispatch<SetStateAction<GalleryAlbumFormState>>;
  onChangeEditingReferenceKey: (value: string | null) => void;
  onCreateTraining: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateTraining: (training: AdminTraining, input: Partial<TrainingPayload>) => void;
  onDeleteTraining: (training: AdminTraining) => void;
  onUpdateTrainingEnrollment: (enrollment: AdminTrainingEnrollment, input: { status?: AdminEnrollmentStatus; progress?: number; adminNote?: string }) => void;
  onCreateEvent: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateEvent: (event: AdminEvent, input: Partial<EventPayload>) => void;
  onDeleteEvent: (event: AdminEvent) => void;
  onCreateResource: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateResource: (resource: AdminResource, input: Partial<ResourcePayload>) => void;
  onDeleteResource: (resource: AdminResource) => void;
  onCreateOpportunity: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateOpportunity: (opportunity: AdminOpportunity, input: Partial<OpportunityPayload>) => void;
  onDeleteOpportunity: (opportunity: AdminOpportunity) => void;
  onUpdateOpportunityApplication: (application: AdminOpportunityApplication, input: { status?: AdminApplicationStatus; adminNote?: string }) => void;
  onCreateGalleryAlbum: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateGalleryAlbum: (album: GalleryAlbum, input: Partial<GalleryAlbumPayload>) => void;
  onDeleteGalleryAlbum: (album: GalleryAlbum) => void;
  onUpload: (purpose: AdminUploadPurpose, file: File, key: string) => Promise<string>;
  onOpenCertificates: () => void;
}) {
  const contentPageSize = 6;
  const [trainingPage, setTrainingPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);
  const [resourcePage, setResourcePage] = useState(1);
  const [opportunityPage, setOpportunityPage] = useState(1);
  const [galleryPage, setGalleryPage] = useState(1);
  const trainingPagination = paginateItems(trainings, trainingPage, contentPageSize);
  const eventPagination = paginateItems(events, eventPage, contentPageSize);
  const resourcePagination = paginateItems(resources, resourcePage, contentPageSize);
  const opportunityPagination = paginateItems(opportunities, opportunityPage, contentPageSize);
  const galleryPagination = paginateItems(galleryAlbums, galleryPage, contentPageSize);
  const resourceUsageStats = useMemo(() => {
    const totals = resources.reduce(
      (accumulator, resource) => ({
        views: accumulator.views + resource.counts.views,
        downloads: accumulator.downloads + resource.counts.downloads,
        usefulMarks: accumulator.usefulMarks + resource.counts.usefulMarks,
      }),
      { views: 0, downloads: 0, usefulMarks: 0 },
    );
    const topResources = [...resources]
      .sort((first, second) => {
        const firstScore = first.counts.views + first.counts.downloads * 2 + first.counts.usefulMarks;
        const secondScore = second.counts.views + second.counts.downloads * 2 + second.counts.usefulMarks;

        return secondScore - firstScore || first.title.localeCompare(second.title);
      })
      .slice(0, 3);

    return { ...totals, topResources };
  }, [resources]);

  useEffect(() => {
    setTrainingPage(1);
  }, [trainings.length]);

  useEffect(() => {
    setEventPage(1);
  }, [events.length]);

  useEffect(() => {
    setResourcePage(1);
  }, [resources.length]);

  useEffect(() => {
    setOpportunityPage(1);
  }, [opportunities.length]);

  useEffect(() => {
    setGalleryPage(1);
  }, [galleryAlbums.length]);

  return (
    <section className="member-card admin-section admin-content-panel">
      <SectionTitle
        icon={Globe2}
        title="Alimenter la plateforme"
        subtitle="Gérer les contenus structurants du site public et de l'espace membre."
      />

      <nav className="admin-content-jump-nav" aria-label="Accès rapide aux blocs à alimenter">
        {adminContentAnchors.map((anchor) => (
          <a key={anchor.href} href={anchor.href}>
            {anchor.label}
          </a>
        ))}
        <button type="button" onClick={onOpenCertificates}>
          Certificats
        </button>
      </nav>

      <ContentShortcutsPanel onOpenCertificates={onOpenCertificates} />

      <DossierManagementPanel
        opportunityApplications={opportunityApplications}
        trainingEnrollments={trainingEnrollments}
        busyKey={busyKey}
        onUpdateOpportunityApplication={onUpdateOpportunityApplication}
        onUpdateTrainingEnrollment={onUpdateTrainingEnrollment}
      />

      <ReferenceBlockHeader
        id="admin-content-trainings"
        eyebrow="Programme CCA"
        title="Formations et workshops"
        text="Créez les parcours, masterclass et ateliers qui pourront ensuite recevoir des inscriptions, ressources, présences et certificats."
      />

      <div className="admin-reference-layout admin-content-editor-layout">
        <div className="admin-reference-copy">
          <h3>{trainings.filter((training) => training.status === "PUBLISHED").length} formations publiées</h3>
          <p>Les formations alimentent le catalogue membre, l'agenda, les ressources associées et les certificats.</p>
        </div>

        <form className="admin-reference-form admin-content-form" onSubmit={onCreateTraining}>
          <label>
            <span>Titre</span>
            <div>
              <GraduationCap aria-hidden="true" />
              <input value={trainingForm.title} onChange={(event) => onChangeTrainingForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex. Marketing digital pour artistes" />
            </div>
          </label>
          <label>
            <span>Statut</span>
            <select value={trainingForm.status} onChange={(event) => onChangeTrainingForm((current) => ({ ...current, status: event.target.value as AdminTrainingStatus }))}>
              {trainingStatusOptions.map((status) => <option key={status} value={status}>{trainingStatusLabels[status]}</option>)}
            </select>
          </label>
          <label>
            <span>Lieu</span>
            <div>
              <Globe2 aria-hidden="true" />
              <input value={trainingForm.location} onChange={(event) => onChangeTrainingForm((current) => ({ ...current, location: event.target.value }))} placeholder="Silikin Village, Kinshasa" />
            </div>
          </label>
          <label>
            <span>Début</span>
            <input type="datetime-local" value={trainingForm.startsAt} onChange={(event) => onChangeTrainingForm((current) => ({ ...current, startsAt: event.target.value }))} />
          </label>
          <label>
            <span>Fin</span>
            <input type="datetime-local" value={trainingForm.endsAt} onChange={(event) => onChangeTrainingForm((current) => ({ ...current, endsAt: event.target.value }))} />
          </label>
          <AdminUploadField
            label="Image"
            value={trainingForm.coverImageUrl ?? ""}
            placeholder="/assets/cc-event-flyer.png"
            purpose="training"
            uploadKey="training-cover"
            uploadingKey={uploadingKey}
            accept="image/*"
            onChange={(value) => onChangeTrainingForm((current) => ({ ...current, coverImageUrl: value }))}
            onUpload={onUpload}
          />
          <label>
            <span>Places</span>
            <input type="number" min={1} value={trainingForm.capacity ?? ""} onChange={(event) => onChangeTrainingForm((current) => ({ ...current, capacity: event.target.value ? Number(event.target.value) : undefined }))} />
          </label>
          <label>
            <span>Prix en centimes</span>
            <input type="number" min={0} value={trainingForm.priceCents ?? 0} onChange={(event) => onChangeTrainingForm((current) => ({ ...current, priceCents: Number(event.target.value) }))} />
          </label>
          <label className="admin-reference-toggle">
            <input type="checkbox" checked={trainingForm.certificateEnabled} onChange={(event) => onChangeTrainingForm((current) => ({ ...current, certificateEnabled: event.target.checked }))} />
            <span>Certificat prévu</span>
          </label>
          <label className="admin-reference-toggle">
            <input type="checkbox" checked={trainingForm.featuredOnLanding} onChange={(event) => onChangeTrainingForm((current) => ({ ...current, featuredOnLanding: event.target.checked, status: event.target.checked ? "PUBLISHED" : current.status }))} />
            <span>Mis en avant sur l'accueil</span>
          </label>
          <label className="admin-reference-textarea">
            <span>Description</span>
            <textarea value={trainingForm.description} onChange={(event) => onChangeTrainingForm((current) => ({ ...current, description: event.target.value }))} placeholder="Objectif, public cible, contenu et bénéfices pour les créatifs." />
          </label>
          <button type="submit" className="member-primary-button" disabled={!trainingForm.title.trim() || !trainingForm.description.trim() || busyKey === "training-create"}>
            <Plus aria-hidden="true" /> Ajouter la formation
          </button>
        </form>
      </div>

      <div className="admin-reference-list">
        <div className="admin-reference-list-header">
          <div className="admin-reference-list-copy">
            <h3>Catalogue formations</h3>
            <p>Publiez les formations prêtes, archivez les anciennes et gardez les brouillons hors catalogue.</p>
          </div>
          <span className="admin-reference-count">{trainings.length} éléments</span>
        </div>
        <div className="admin-reference-table">
          {trainingPagination.items.map((training) => (
            <TrainingContentRow
              key={training.id}
              training={training}
              busyKey={busyKey}
              uploadingKey={uploadingKey}
              isEditing={editingReferenceKey === `training-${training.id}`}
              onEdit={() => onChangeEditingReferenceKey(`training-${training.id}`)}
              onCancel={() => onChangeEditingReferenceKey(null)}
              onUpdate={onUpdateTraining}
              onDelete={onDeleteTraining}
              onUpload={onUpload}
            />
          ))}
          {!trainings.length ? <EmptyAdminState title="Aucune formation" text="Ajoutez une première formation pour préparer le catalogue CCA." /> : null}
        </div>
        <ReferencePagination label="formations" page={trainingPagination.page} pageCount={trainingPagination.pageCount} total={trainings.length} pageSize={contentPageSize} onChange={setTrainingPage} />
      </div>

      <ReferenceBlockHeader
        id="admin-content-events"
        eyebrow="Vitrine publique"
        title="Événements officiels"
        text="Préparez les événements publics : journées de formation, panels, activations, visites, festivals et rencontres partenaires."
      />

      <div className="admin-reference-layout admin-content-editor-layout">
        <div className="admin-reference-copy">
          <h3>{events.filter((event) => event.published).length} événements publiés</h3>
          <p>Ces événements pourront alimenter l'agenda membre, les appels à réservation et les sections publiques.</p>
        </div>

        <form className="admin-reference-form admin-content-form" onSubmit={onCreateEvent}>
          <label>
            <span>Titre</span>
            <div>
              <CalendarDays aria-hidden="true" />
              <input value={eventForm.title} onChange={(event) => onChangeEventForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex. Creative Currencies Africa 2026" />
            </div>
          </label>
          <label>
            <span>Type</span>
            <select value={eventForm.type} onChange={(event) => onChangeEventForm((current) => ({ ...current, type: event.target.value as AdminEventType }))}>
              {eventTypeOptions.map((type) => <option key={type} value={type}>{eventTypeLabels[type]}</option>)}
            </select>
          </label>
          <label>
            <span>Lieu</span>
            <div>
              <Globe2 aria-hidden="true" />
              <input value={eventForm.location} onChange={(event) => onChangeEventForm((current) => ({ ...current, location: event.target.value }))} placeholder="Silikin Village, Kinshasa" />
            </div>
          </label>
          <label>
            <span>Début</span>
            <input type="datetime-local" value={eventForm.startsAt} onChange={(event) => onChangeEventForm((current) => ({ ...current, startsAt: event.target.value }))} />
          </label>
          <label>
            <span>Fin</span>
            <input type="datetime-local" value={eventForm.endsAt} onChange={(event) => onChangeEventForm((current) => ({ ...current, endsAt: event.target.value }))} />
          </label>
          <AdminUploadField
            label="Image"
            value={eventForm.coverImageUrl ?? ""}
            placeholder="/assets/cc-event-banner.png"
            purpose="event"
            uploadKey="event-cover"
            uploadingKey={uploadingKey}
            accept="image/*"
            onChange={(value) => onChangeEventForm((current) => ({ ...current, coverImageUrl: value }))}
            onUpload={onUpload}
          />
          <label>
            <span>WhatsApp</span>
            <input value={eventForm.whatsappUrl} onChange={(event) => onChangeEventForm((current) => ({ ...current, whatsappUrl: event.target.value }))} placeholder="https://wa.me/..." />
          </label>
          <label>
            <span>Facebook</span>
            <input value={eventForm.facebookEventUrl} onChange={(event) => onChangeEventForm((current) => ({ ...current, facebookEventUrl: event.target.value }))} placeholder="https://facebook.com/..." />
          </label>
          <label className="admin-reference-toggle">
            <input type="checkbox" checked={eventForm.published} onChange={(event) => onChangeEventForm((current) => ({ ...current, published: event.target.checked }))} />
            <span>Publié sur le site</span>
          </label>
          <label className="admin-reference-toggle">
            <input type="checkbox" checked={eventForm.featuredOnLanding} onChange={(event) => onChangeEventForm((current) => ({ ...current, featuredOnLanding: event.target.checked, published: event.target.checked ? true : current.published }))} />
            <span>Mis en avant sur l'accueil</span>
          </label>
          <label className="admin-reference-textarea">
            <span>Description</span>
            <textarea value={eventForm.description} onChange={(event) => onChangeEventForm((current) => ({ ...current, description: event.target.value }))} placeholder="Programme, objectif et appel à participation." />
          </label>
          <button type="submit" className="member-primary-button" disabled={!eventForm.title.trim() || !eventForm.description.trim() || !eventForm.startsAt || !eventForm.endsAt || !eventForm.location.trim() || busyKey === "event-create"}>
            <Plus aria-hidden="true" /> Ajouter l'événement
          </button>
        </form>
      </div>

      <div className="admin-reference-list">
        <div className="admin-reference-list-header">
          <div className="admin-reference-list-copy">
            <h3>Agenda officiel</h3>
            <p>Les événements publiés deviennent visibles, les brouillons restent préparatoires.</p>
          </div>
          <span className="admin-reference-count">{events.length} éléments</span>
        </div>
        <div className="admin-reference-table">
          {eventPagination.items.map((event) => (
            <EventContentRow
              key={event.id}
              event={event}
              busyKey={busyKey}
              uploadingKey={uploadingKey}
              isEditing={editingReferenceKey === `event-${event.id}`}
              onEdit={() => onChangeEditingReferenceKey(`event-${event.id}`)}
              onCancel={() => onChangeEditingReferenceKey(null)}
              onUpdate={onUpdateEvent}
              onDelete={onDeleteEvent}
              onUpload={onUpload}
            />
          ))}
          {!events.length ? <EmptyAdminState title="Aucun événement" text="Ajoutez un premier événement officiel pour préparer l'agenda." /> : null}
        </div>
        <ReferencePagination label="événements" page={eventPagination.page} pageCount={eventPagination.pageCount} total={events.length} pageSize={contentPageSize} onChange={setEventPage} />
      </div>

      <ReferenceBlockHeader
        id="admin-content-gallery"
        eyebrow="Image publique"
        title="Galerie officielle"
        text="Organisez les photos validées par CCA : formations, événements, backstage, activations, partenaires, visites et conférences."
      />

      <div className="admin-reference-layout admin-content-editor-layout">
        <div className="admin-reference-copy">
          <h3>{galleryAlbums.filter((album) => album.published).length} albums publiés</h3>
          <p>La galerie publique reste sélectionnée et maîtrisée, même si les images viennent ensuite d'actions terrain ou de publications CCA.</p>
        </div>

        <form className="admin-reference-form admin-content-form" onSubmit={onCreateGalleryAlbum}>
          <label>
            <span>Titre</span>
            <div>
              <ImageIcon aria-hidden="true" />
              <input value={galleryAlbumForm.title} onChange={(event) => onChangeGalleryAlbumForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex. Backstage Creative Currencies 2026" />
            </div>
          </label>
          <label>
            <span>Catégorie</span>
            <select value={galleryAlbumForm.category} onChange={(event) => onChangeGalleryAlbumForm((current) => ({ ...current, category: event.target.value as GalleryAlbumCategory }))}>
              {galleryCategoryOptions.map((category) => <option key={category} value={category}>{galleryCategoryLabels[category]}</option>)}
            </select>
          </label>
          <label>
            <span>Numéro</span>
            <input type="number" min={0} value={galleryAlbumForm.sortOrder ?? 0} onChange={(event) => onChangeGalleryAlbumForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} />
          </label>
          <AdminUploadField
            label="Couverture"
            value={galleryAlbumForm.coverImageUrl ?? ""}
            placeholder="/assets/gallery/cover.jpg"
            purpose="gallery"
            uploadKey="gallery-cover"
            uploadingKey={uploadingKey}
            accept="image/*"
            onChange={(value) => onChangeGalleryAlbumForm((current) => ({ ...current, coverImageUrl: value }))}
            onUpload={onUpload}
          />
          <label className="admin-reference-toggle">
            <input type="checkbox" checked={galleryAlbumForm.published} onChange={(event) => onChangeGalleryAlbumForm((current) => ({ ...current, published: event.target.checked }))} />
            <span>Visible sur le site</span>
          </label>
          <label className="admin-reference-toggle">
            <input type="checkbox" checked={galleryAlbumForm.featuredOnLanding} onChange={(event) => onChangeGalleryAlbumForm((current) => ({ ...current, featuredOnLanding: event.target.checked, published: event.target.checked ? true : current.published }))} />
            <span>Mis en avant sur l'accueil</span>
          </label>
          <label className="admin-reference-textarea">
            <span>Description</span>
            <textarea value={galleryAlbumForm.description} onChange={(event) => onChangeGalleryAlbumForm((current) => ({ ...current, description: event.target.value }))} placeholder="Présentez le contexte de l'album et ce qu'il documente." />
          </label>
          <label className="admin-reference-textarea">
            <span>Photos</span>
            <textarea value={galleryAlbumForm.photosText} onChange={(event) => onChangeGalleryAlbumForm((current) => ({ ...current, photosText: event.target.value }))} placeholder={"/assets/gallery/photo-01.jpg\n/assets/gallery/photo-02.jpg"} />
          </label>
          <button type="submit" className="member-primary-button" disabled={!galleryAlbumForm.title.trim() || busyKey === "gallery-create"}>
            <Plus aria-hidden="true" /> Ajouter l'album
          </button>
        </form>
      </div>

      <div className="admin-reference-list">
        <div className="admin-reference-list-header">
          <div className="admin-reference-list-copy">
            <h3>Albums officiels</h3>
            <p>Publiez les albums prêts et gardez les sélections en préparation en brouillon.</p>
          </div>
          <span className="admin-reference-count">{galleryAlbums.length} éléments</span>
        </div>
        <div className="admin-reference-table">
          {galleryPagination.items.map((album) => (
            <GalleryAlbumRow
              key={album.id}
              album={album}
              busyKey={busyKey}
              uploadingKey={uploadingKey}
              isEditing={editingReferenceKey === `gallery-${album.id}`}
              onEdit={() => onChangeEditingReferenceKey(`gallery-${album.id}`)}
              onCancel={() => onChangeEditingReferenceKey(null)}
              onUpdate={onUpdateGalleryAlbum}
              onDelete={onDeleteGalleryAlbum}
              onUpload={onUpload}
            />
          ))}
          {!galleryAlbums.length ? <EmptyAdminState title="Aucun album" text="Ajoutez un premier album officiel pour organiser la galerie publique." /> : null}
        </div>
        <ReferencePagination label="albums" page={galleryPagination.page} pageCount={galleryPagination.pageCount} total={galleryAlbums.length} pageSize={contentPageSize} onChange={setGalleryPage} />
      </div>

      <ReferenceBlockHeader
        id="admin-content-resources"
        eyebrow="Bibliothèque membre"
        title="Ressources pédagogiques"
        text="Ajoutez les syllabus, guides, modèles, contrats, replays et documents utiles aux parcours des créatifs."
      />

      <div className="admin-reference-layout admin-content-editor-layout">
        <div className="admin-reference-copy">
          <h3>{resources.filter((resource) => resource.published).length} ressources publiées</h3>
          <p>Les ressources peuvent être ouvertes au public, réservées aux membres ou liées à une formation précise.</p>
        </div>

        <form className="admin-reference-form admin-content-form" onSubmit={onCreateResource}>
          <label>
            <span>Titre</span>
            <div>
              <BookOpen aria-hidden="true" />
              <input value={resourceForm.title} onChange={(event) => onChangeResourceForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex. Syllabus - Business of Fashion" />
            </div>
          </label>
          <label>
            <span>Type</span>
            <select value={resourceForm.type} onChange={(event) => onChangeResourceForm((current) => ({ ...current, type: event.target.value as AdminResourceType }))}>
              {resourceTypeOptions.map((type) => <option key={type} value={type}>{resourceTypeLabels[type]}</option>)}
            </select>
          </label>
          <label>
            <span>Accès</span>
            <select value={resourceForm.accessLevel} onChange={(event) => onChangeResourceForm((current) => ({ ...current, accessLevel: event.target.value as AdminResourceAccessLevel }))}>
              {resourceAccessOptions.map((level) => <option key={level} value={level}>{resourceAccessLabels[level]}</option>)}
            </select>
          </label>
          <AdminUploadField
            label="Fichier ou lien"
            value={resourceForm.url}
            placeholder="/assets/resources/document.pdf"
            purpose="resource"
            uploadKey="resource-file"
            uploadingKey={uploadingKey}
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            icon={FileText}
            onChange={(value) => onChangeResourceForm((current) => ({ ...current, url: value }))}
            onUpload={onUpload}
          />
          <label>
            <span>Formation liée</span>
            <select value={resourceForm.trainingId ?? ""} onChange={(event) => onChangeResourceForm((current) => ({ ...current, trainingId: event.target.value }))}>
              <option value="">Bibliothèque générale</option>
              {trainings.map((training) => <option key={training.id} value={training.id}>{training.title}</option>)}
            </select>
          </label>
          <label className="admin-reference-toggle">
            <input type="checkbox" checked={resourceForm.published} onChange={(event) => onChangeResourceForm((current) => ({ ...current, published: event.target.checked }))} />
            <span>Visible dans la bibliothèque</span>
          </label>
          <label className="admin-reference-textarea">
            <span>Description</span>
            <textarea value={resourceForm.description} onChange={(event) => onChangeResourceForm((current) => ({ ...current, description: event.target.value }))} placeholder="Expliquez à quoi sert cette ressource et pour qui elle est utile." />
          </label>
          <button type="submit" className="member-primary-button" disabled={!resourceForm.title.trim() || !resourceForm.url.trim() || busyKey === "resource-create"}>
            <Plus aria-hidden="true" /> Ajouter la ressource
          </button>
        </form>
      </div>

      <div className="admin-resource-stats">
        <article>
          <strong>{resourceUsageStats.views}</strong>
          <span>Consultations</span>
          <p>Nombre de fois où les membres ont ouvert une ressource officielle.</p>
        </article>
        <article>
          <strong>{resourceUsageStats.downloads}</strong>
          <span>Téléchargements</span>
          <p>Chaque téléchargement passe par le contrôle d'accès membre.</p>
        </article>
        <article>
          <strong>{resourceUsageStats.usefulMarks}</strong>
          <span>Marquées utiles</span>
          <p>Signal faible pour repérer les documents qui aident vraiment les parcours.</p>
        </article>
        <article className="admin-resource-top">
          <span>Ressources suivies</span>
          {resourceUsageStats.topResources.length ? (
            resourceUsageStats.topResources.map((resource) => (
              <small key={resource.id}>
                {resource.title} · {resource.counts.views} vues · {resource.counts.downloads} téléchargements
              </small>
            ))
          ) : (
            <small>Aucune donnée pour le moment.</small>
          )}
        </article>
      </div>

      <div className="admin-reference-list">
        <div className="admin-reference-list-header">
          <div className="admin-reference-list-copy">
            <h3>Bibliothèque</h3>
            <p>Publiez uniquement les documents prêts à être consultés par les bons profils.</p>
          </div>
          <span className="admin-reference-count">{resources.length} éléments</span>
        </div>
        <div className="admin-reference-table">
          {resourcePagination.items.map((resource) => (
            <ResourceContentRow
              key={resource.id}
              resource={resource}
              trainings={trainings}
              busyKey={busyKey}
              uploadingKey={uploadingKey}
              isEditing={editingReferenceKey === `resource-${resource.id}`}
              onEdit={() => onChangeEditingReferenceKey(`resource-${resource.id}`)}
              onCancel={() => onChangeEditingReferenceKey(null)}
              onUpdate={onUpdateResource}
              onDelete={onDeleteResource}
              onUpload={onUpload}
            />
          ))}
          {!resources.length ? <EmptyAdminState title="Aucune ressource" text="Ajoutez un premier guide, syllabus ou document utile aux membres." /> : null}
        </div>
        <ReferencePagination label="ressources" page={resourcePagination.page} pageCount={resourcePagination.pageCount} total={resources.length} pageSize={contentPageSize} onChange={setResourcePage} />
      </div>

      <ReferenceBlockHeader
        id="admin-content-opportunities"
        eyebrow="Accès aux opportunités"
        title="Appels, concours et missions"
        text="Centralisez les concours, résidences, financements, castings et missions qui peuvent faire avancer les parcours."
      />

      <div className="admin-reference-layout admin-content-editor-layout">
        <div className="admin-reference-copy">
          <h3>{opportunities.filter((opportunity) => opportunity.published).length} opportunités publiées</h3>
          <p>Une opportunité publiée devient visible dans l'espace membre et peut recevoir des dossiers de candidature.</p>
        </div>

        <form className="admin-reference-form admin-content-form" onSubmit={onCreateOpportunity}>
          <label>
            <span>Titre</span>
            <div>
              <Lightbulb aria-hidden="true" />
              <input value={opportunityForm.title} onChange={(event) => onChangeOpportunityForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex. Africa Design Fund" />
            </div>
          </label>
          <label>
            <span>Type</span>
            <select value={opportunityForm.type} onChange={(event) => onChangeOpportunityForm((current) => ({ ...current, type: event.target.value as AdminOpportunityType }))}>
              {opportunityTypeOptions.map((type) => <option key={type} value={type}>{opportunityTypeLabels[type]}</option>)}
            </select>
          </label>
          <label>
            <span>Statut</span>
            <select value={opportunityForm.status} onChange={(event) => onChangeOpportunityForm((current) => ({ ...current, status: event.target.value as AdminOpportunityStatus }))}>
              {opportunityStatusOptions.map((status) => <option key={status} value={status}>{opportunityStatusLabels[status]}</option>)}
            </select>
          </label>
          <label>
            <span>Date limite</span>
            <input type="datetime-local" value={opportunityForm.deadline} onChange={(event) => onChangeOpportunityForm((current) => ({ ...current, deadline: event.target.value }))} />
          </label>
          <label>
            <span>Lieu</span>
            <input value={opportunityForm.location} onChange={(event) => onChangeOpportunityForm((current) => ({ ...current, location: event.target.value }))} placeholder="Kinshasa, Afrique francophone..." />
          </label>
          <label>
            <span>Lien de candidature</span>
            <input value={opportunityForm.eligibilityUrl} onChange={(event) => onChangeOpportunityForm((current) => ({ ...current, eligibilityUrl: event.target.value }))} placeholder="https://..." />
          </label>
          <label className="admin-reference-toggle">
            <input type="checkbox" checked={opportunityForm.published} onChange={(event) => onChangeOpportunityForm((current) => ({ ...current, published: event.target.checked, status: event.target.checked ? "OPEN" : current.status }))} />
            <span>Visible dans les opportunités</span>
          </label>
          <label className="admin-reference-textarea">
            <span>Description</span>
            <textarea value={opportunityForm.description} onChange={(event) => onChangeOpportunityForm((current) => ({ ...current, description: event.target.value }))} placeholder="Présentez les conditions, le public visé et les bénéfices pour les créatifs." />
          </label>
          <button type="submit" className="member-primary-button" disabled={!opportunityForm.title.trim() || !opportunityForm.description.trim() || busyKey === "opportunity-create"}>
            <Plus aria-hidden="true" /> Ajouter l'opportunité
          </button>
        </form>
      </div>

      <div className="admin-reference-list">
        <div className="admin-reference-list-header">
          <div className="admin-reference-list-copy">
            <h3>Catalogue opportunités</h3>
            <p>Ouvrez, fermez ou archivez les appels pour garder une information claire côté membre.</p>
          </div>
          <span className="admin-reference-count">{opportunities.length} éléments</span>
        </div>
        <div className="admin-reference-table">
          {opportunityPagination.items.map((opportunity) => (
            <OpportunityContentRow
              key={opportunity.id}
              opportunity={opportunity}
              busyKey={busyKey}
              isEditing={editingReferenceKey === `opportunity-${opportunity.id}`}
              onEdit={() => onChangeEditingReferenceKey(`opportunity-${opportunity.id}`)}
              onCancel={() => onChangeEditingReferenceKey(null)}
              onUpdate={onUpdateOpportunity}
              onDelete={onDeleteOpportunity}
            />
          ))}
          {!opportunities.length ? <EmptyAdminState title="Aucune opportunité" text="Ajoutez un premier appel à projets, concours ou financement." /> : null}
        </div>
        <ReferencePagination label="opportunités" page={opportunityPagination.page} pageCount={opportunityPagination.pageCount} total={opportunities.length} pageSize={contentPageSize} onChange={setOpportunityPage} />
      </div>

    </section>
  );
}

function ContentShortcutsPanel({ onOpenCertificates }: { onOpenCertificates: () => void }) {
  return (
    <div className="admin-content-layout">
      <div className="admin-content-main">
        {adminContentActions.filter((action) => action.title !== "Formation CCA" && action.title !== "Événement").map((action) => {
          const Icon = action.icon;

          return (
            <Link className="admin-content-action" href={action.href} key={action.title}>
              <span className="admin-content-action-icon">
                <Icon aria-hidden="true" />
              </span>
              <span className="admin-content-action-body">
                <strong>{action.title}</strong>
                <small>{action.text}</small>
                <em>{action.destination}</em>
              </span>
              <span className="admin-content-action-cta">Préparer</span>
            </Link>
          );
        })}
      </div>

      <aside className="admin-content-aside">
        <div className="admin-content-aside-card">
          <FileBadge aria-hidden="true" />
          <h3>Certificats CCA</h3>
          <p>Les certificats restent un produit officiel CCA : l'équipe les crée et les attribue aux apprenants ou créateurs.</p>
          <button type="button" className="member-primary-button" onClick={onOpenCertificates}>
            Créer un certificat
          </button>
        </div>
        <div className="admin-content-aside-card">
          <ShieldCheck aria-hidden="true" />
          <h3>Contrôle éditorial</h3>
          <p>Les annonces, opportunités et ressources passeront ensuite par des CRUD dédiés ou par la publication assistée.</p>
        </div>
      </aside>
    </div>
  );
}

function DossierManagementPanel({
  opportunityApplications,
  trainingEnrollments,
  busyKey,
  onUpdateOpportunityApplication,
  onUpdateTrainingEnrollment,
}: {
  opportunityApplications: AdminOpportunityApplication[];
  trainingEnrollments: AdminTrainingEnrollment[];
  busyKey: string | null;
  onUpdateOpportunityApplication: (application: AdminOpportunityApplication, input: { status?: AdminApplicationStatus; adminNote?: string }) => void;
  onUpdateTrainingEnrollment: (enrollment: AdminTrainingEnrollment, input: { status?: AdminEnrollmentStatus; progress?: number; adminNote?: string }) => void;
}) {
  const [applicationFilter, setApplicationFilter] = useState<AdminApplicationStatus | "ALL">("ALL");
  const [enrollmentFilter, setEnrollmentFilter] = useState<AdminEnrollmentStatus | "ALL">("ALL");
  const [applicationQuery, setApplicationQuery] = useState("");
  const [applicationOpportunityId, setApplicationOpportunityId] = useState("ALL");
  const [applicationDiscipline, setApplicationDiscipline] = useState("");
  const [applicationCity, setApplicationCity] = useState("");
  const [enrollmentQuery, setEnrollmentQuery] = useState("");
  const [enrollmentTrainingId, setEnrollmentTrainingId] = useState("ALL");
  const [applicationPage, setApplicationPage] = useState(1);
  const [enrollmentPage, setEnrollmentPage] = useState(1);
  const [exportBusy, setExportBusy] = useState<"applications" | "enrollments" | null>(null);
  const [exportFeedback, setExportFeedback] = useState<{ target: "applications" | "enrollments"; tone: "success" | "error"; text: string } | null>(null);
  const opportunityOptions = Array.from(new Map(opportunityApplications.map((application) => [application.opportunity.id, application.opportunity])).values());
  const trainingOptions = Array.from(new Map(trainingEnrollments.map((enrollment) => [enrollment.training.id, enrollment.training])).values());
  const filteredApplications = opportunityApplications
    .filter((application) => {
      const haystack = normalizeAdminSearch([
        application.opportunity.title,
        application.member.displayName,
        application.member.email,
        application.motivation ?? "",
        application.discipline ?? application.member.discipline ?? "",
        application.city ?? application.member.city ?? "",
      ].join(" "));
      const matchesStatus = applicationFilter === "ALL" || application.status === applicationFilter;
      const matchesOpportunity = applicationOpportunityId === "ALL" || application.opportunity.id === applicationOpportunityId;
      const matchesDiscipline = !applicationDiscipline.trim() || normalizeAdminSearch(application.discipline ?? application.member.discipline ?? "").includes(normalizeAdminSearch(applicationDiscipline));
      const matchesCity = !applicationCity.trim() || normalizeAdminSearch(application.city ?? application.member.city ?? "").includes(normalizeAdminSearch(applicationCity));
      const matchesQuery = !applicationQuery.trim() || haystack.includes(normalizeAdminSearch(applicationQuery));

      return matchesStatus && matchesOpportunity && matchesDiscipline && matchesCity && matchesQuery;
    });
  const filteredEnrollments = trainingEnrollments
    .filter((enrollment) => {
      const haystack = normalizeAdminSearch([
        enrollment.training.title,
        enrollment.member.displayName,
        enrollment.member.email,
        enrollment.member.discipline ?? "",
        enrollment.member.city ?? "",
        enrollment.motivation ?? "",
      ].join(" "));

      return (
        (enrollmentFilter === "ALL" || enrollment.status === enrollmentFilter) &&
        (enrollmentTrainingId === "ALL" || enrollment.training.id === enrollmentTrainingId) &&
        (!enrollmentQuery.trim() || haystack.includes(normalizeAdminSearch(enrollmentQuery)))
      );
    });
  const applicationPagination = paginateItems(filteredApplications, applicationPage, 6);
  const enrollmentPagination = paginateItems(filteredEnrollments, enrollmentPage, 6);

  useEffect(() => {
    setApplicationPage(1);
  }, [applicationFilter, applicationQuery, applicationOpportunityId, applicationDiscipline, applicationCity, opportunityApplications.length]);

  useEffect(() => {
    setEnrollmentPage(1);
  }, [enrollmentFilter, enrollmentQuery, enrollmentTrainingId, trainingEnrollments.length]);

  const exportApplications = async () => {
    if (!filteredApplications.length) {
      setExportFeedback({ target: "applications", tone: "error", text: "Aucune candidature à exporter avec les filtres actuels." });
      return;
    }

    setExportFeedback(null);
    setExportBusy("applications");

    try {
      const csv = await exportAdminOpportunityApplicationsCsv(undefined, {
        q: applicationQuery || undefined,
        status: applicationFilter === "ALL" ? undefined : applicationFilter,
        opportunityId: applicationOpportunityId === "ALL" ? undefined : applicationOpportunityId,
        discipline: applicationDiscipline || undefined,
        city: applicationCity || undefined,
      });
      if (!csvHasRows(csv)) {
        setExportFeedback({ target: "applications", tone: "error", text: "Aucune candidature à exporter avec les filtres actuels." });
        return;
      }
      downloadCsv(csv, "candidatures-opportunites-cca.csv");
      setExportFeedback({ target: "applications", tone: "success", text: "Export des candidatures généré avec succès." });
    } catch (requestError) {
      setExportFeedback({ target: "applications", tone: "error", text: getApiErrorMessage(requestError, "L'export des candidatures n'a pas pu être généré.") });
    } finally {
      setExportBusy(null);
    }
  };

  const exportEnrollments = async () => {
    if (!filteredEnrollments.length) {
      setExportFeedback({ target: "enrollments", tone: "error", text: "Aucune inscription à exporter avec les filtres actuels." });
      return;
    }

    setExportFeedback(null);
    setExportBusy("enrollments");

    try {
      const csv = await exportAdminTrainingEnrollmentsCsv(undefined, {
        q: enrollmentQuery || undefined,
        status: enrollmentFilter === "ALL" ? undefined : enrollmentFilter,
        trainingId: enrollmentTrainingId === "ALL" ? undefined : enrollmentTrainingId,
      });
      if (!csvHasRows(csv)) {
        setExportFeedback({ target: "enrollments", tone: "error", text: "Aucune inscription à exporter avec les filtres actuels." });
        return;
      }
      downloadCsv(csv, "inscriptions-formations-cca.csv");
      setExportFeedback({ target: "enrollments", tone: "success", text: "Export des inscriptions généré avec succès." });
    } catch (requestError) {
      setExportFeedback({ target: "enrollments", tone: "error", text: getApiErrorMessage(requestError, "L'export des inscriptions n'a pas pu être généré.") });
    } finally {
      setExportBusy(null);
    }
  };

  return (
    <section className="admin-dossier-panel" aria-label="Gestion des candidatures et inscriptions">
      <div className="admin-dossier-card">
        <div className="admin-reference-list-header">
          <div className="admin-reference-list-copy">
            <span className="member-kicker">Dossiers membres</span>
            <h3>Candidatures aux opportunités</h3>
            <p>Suivez les dossiers reçus, filtrez par statut et notifiez les candidats quand une décision avance.</p>
          </div>
          <div className="admin-dossier-header-actions">
            <span className="admin-reference-count">{opportunityApplications.length} dossiers</span>
            <button type="button" className="member-secondary-button" onClick={() => void exportApplications()} disabled={exportBusy === "applications"}>
              {exportBusy === "applications" ? "Export..." : "Exporter CSV"}
            </button>
          </div>
        </div>
        {exportFeedback?.target === "applications" ? (
          <p className={`admin-dossier-feedback is-${exportFeedback.tone}`}>
            {exportFeedback.text}
          </p>
        ) : null}
        <div className="admin-dossier-filters">
          <button type="button" className={applicationFilter === "ALL" ? "is-active" : undefined} onClick={() => setApplicationFilter("ALL")}>Toutes</button>
          {applicationStatusOptions.map((status) => (
            <button key={status} type="button" className={applicationFilter === status ? "is-active" : undefined} onClick={() => setApplicationFilter(status)}>
              {applicationStatusLabels[status]}
            </button>
          ))}
        </div>
        <div className="admin-dossier-filter-fields">
          <label>
            <span>Recherche</span>
            <input value={applicationQuery} onChange={(event) => setApplicationQuery(event.target.value)} placeholder="Nom, e-mail, appel..." />
          </label>
          <label>
            <span>Opportunité</span>
            <select value={applicationOpportunityId} onChange={(event) => setApplicationOpportunityId(event.target.value)}>
              <option value="ALL">Toutes les opportunités</option>
              {opportunityOptions.map((opportunity) => <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>)}
            </select>
          </label>
          <label>
            <span>Discipline</span>
            <input value={applicationDiscipline} onChange={(event) => setApplicationDiscipline(event.target.value)} placeholder="Mode, design, photo..." />
          </label>
          <label>
            <span>Ville</span>
            <input value={applicationCity} onChange={(event) => setApplicationCity(event.target.value)} placeholder="Kinshasa, Lubumbashi..." />
          </label>
        </div>
        <div className="admin-dossier-list">
          {applicationPagination.items.map((application) => (
            <article key={application.id} className="admin-dossier-row">
              <div className="admin-dossier-main">
                <span>{application.opportunity.title}</span>
                <strong>{application.member.displayName}</strong>
                <small>{[application.discipline ?? application.member.discipline, application.city ?? application.member.city, application.submittedAt ? `envoyé le ${formatDate(application.submittedAt)}` : "brouillon"].filter(Boolean).join(" · ")}</small>
                <p>{application.motivation || "Aucune motivation renseignée pour le moment."}</p>
                <div className="admin-dossier-links">
                  {application.portfolioUrl ? <a href={application.portfolioUrl} target="_blank" rel="noreferrer">Portfolio</a> : null}
                  {application.cvUrl ? <a href={application.cvUrl} target="_blank" rel="noreferrer">CV</a> : null}
                  {application.fileUrl ? <a href={application.fileUrl} target="_blank" rel="noreferrer">Dossier</a> : null}
                </div>
              </div>
              <div className="admin-dossier-controls">
                <select
                  value={application.status}
                  onChange={(event) => onUpdateOpportunityApplication(application, { status: event.target.value as AdminApplicationStatus })}
                  disabled={busyKey === `opportunity-application-${application.id}`}
                >
                  {applicationStatusOptions.map((status) => <option key={status} value={status}>{applicationStatusLabels[status]}</option>)}
                </select>
                <textarea
                  defaultValue={application.adminNote ?? ""}
                  placeholder="Note interne pour l'équipe ou le jury"
                  onBlur={(event) => {
                    if (event.target.value.trim() !== (application.adminNote ?? "")) {
                      onUpdateOpportunityApplication(application, { adminNote: event.target.value });
                    }
                  }}
                />
              </div>
            </article>
          ))}
          {!filteredApplications.length ? <EmptyAdminState title="Aucune candidature" text="Les dossiers apparaîtront ici dès qu'un membre postule." /> : null}
        </div>
        <ReferencePagination label="candidatures" page={applicationPagination.page} pageCount={applicationPagination.pageCount} total={filteredApplications.length} pageSize={6} onChange={setApplicationPage} />
      </div>

      <div className="admin-dossier-card">
        <div className="admin-reference-list-header">
          <div className="admin-reference-list-copy">
            <span className="member-kicker">Suivi formation</span>
            <h3>Inscriptions aux formations</h3>
            <p>Contrôlez les inscrits, la progression, les certificats à préparer et les notes internes.</p>
          </div>
          <div className="admin-dossier-header-actions">
            <span className="admin-reference-count">{trainingEnrollments.length} inscrits</span>
            <button type="button" className="member-secondary-button" onClick={() => void exportEnrollments()} disabled={exportBusy === "enrollments"}>
              {exportBusy === "enrollments" ? "Export..." : "Exporter CSV"}
            </button>
          </div>
        </div>
        {exportFeedback?.target === "enrollments" ? (
          <p className={`admin-dossier-feedback is-${exportFeedback.tone}`}>
            {exportFeedback.text}
          </p>
        ) : null}
        <div className="admin-dossier-filters">
          <button type="button" className={enrollmentFilter === "ALL" ? "is-active" : undefined} onClick={() => setEnrollmentFilter("ALL")}>Toutes</button>
          {enrollmentStatusOptions.map((status) => (
            <button key={status} type="button" className={enrollmentFilter === status ? "is-active" : undefined} onClick={() => setEnrollmentFilter(status)}>
              {enrollmentStatusLabels[status]}
            </button>
          ))}
        </div>
        <div className="admin-dossier-filter-fields">
          <label>
            <span>Recherche</span>
            <input value={enrollmentQuery} onChange={(event) => setEnrollmentQuery(event.target.value)} placeholder="Nom, e-mail, formation..." />
          </label>
          <label>
            <span>Formation</span>
            <select value={enrollmentTrainingId} onChange={(event) => setEnrollmentTrainingId(event.target.value)}>
              <option value="ALL">Toutes les formations</option>
              {trainingOptions.map((training) => <option key={training.id} value={training.id}>{training.title}</option>)}
            </select>
          </label>
        </div>
        <div className="admin-dossier-list">
          {enrollmentPagination.items.map((enrollment) => (
            <article key={enrollment.id} className="admin-dossier-row">
              <div className="admin-dossier-main">
                <span>{enrollment.training.title}</span>
                <strong>{enrollment.member.displayName}</strong>
                <small>{[enrollment.member.discipline, enrollment.member.city, `inscrit le ${formatDate(enrollment.enrolledAt)}`].filter(Boolean).join(" · ")}</small>
                <p>{enrollment.motivation || "Aucune motivation renseignée pour le moment."}</p>
              </div>
              <div className="admin-dossier-controls">
                <select
                  value={enrollment.status}
                  onChange={(event) => onUpdateTrainingEnrollment(enrollment, { status: event.target.value as AdminEnrollmentStatus })}
                  disabled={busyKey === `training-enrollment-${enrollment.id}`}
                >
                  {enrollmentStatusOptions.map((status) => <option key={status} value={status}>{enrollmentStatusLabels[status]}</option>)}
                </select>
                <label>
                  <span>Progression</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={enrollment.progress}
                    onBlur={(event) => {
                      const progress = Number(event.target.value);
                      if (Number.isFinite(progress) && progress !== enrollment.progress) {
                        onUpdateTrainingEnrollment(enrollment, { progress });
                      }
                    }}
                  />
                </label>
                <textarea
                  defaultValue={enrollment.adminNote ?? ""}
                  placeholder="Note interne sur la présence, le suivi ou le certificat"
                  onBlur={(event) => {
                    if (event.target.value.trim() !== (enrollment.adminNote ?? "")) {
                      onUpdateTrainingEnrollment(enrollment, { adminNote: event.target.value });
                    }
                  }}
                />
              </div>
            </article>
          ))}
          {!filteredEnrollments.length ? <EmptyAdminState title="Aucune inscription" text="Les inscriptions apparaîtront ici dès qu'un membre rejoint une formation." /> : null}
        </div>
        <ReferencePagination label="inscriptions" page={enrollmentPagination.page} pageCount={enrollmentPagination.pageCount} total={filteredEnrollments.length} pageSize={6} onChange={setEnrollmentPage} />
      </div>
    </section>
  );
}

function AdminQuickButton({ icon: Icon, title, text, onClick }: { icon: LucideIcon; title: string; text: string; onClick: () => void }) {
  return (
    <button type="button" className="admin-quick-action" onClick={onClick}>
      <Icon aria-hidden="true" />
      <strong>{title}</strong>
      <span>{text}</span>
    </button>
  );
}

function TrainingContentRow({
  training,
  busyKey,
  uploadingKey,
  isEditing,
  onEdit,
  onCancel,
  onUpdate,
  onDelete,
  onUpload,
}: {
  training: AdminTraining;
  busyKey: string | null;
  uploadingKey: string | null;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onUpdate: (training: AdminTraining, input: Partial<TrainingPayload>) => void;
  onDelete: (training: AdminTraining) => void;
  onUpload: (purpose: AdminUploadPurpose, file: File, key: string) => Promise<string>;
}) {
  const [form, setForm] = useState<TrainingFormState>({
    title: training.title,
    description: training.description,
    startsAt: toDateTimeInputValue(training.startsAt),
    endsAt: toDateTimeInputValue(training.endsAt),
    location: training.location ?? "",
    coverImageUrl: training.coverImageUrl ?? "",
    capacity: training.capacity ?? undefined,
    priceCents: training.priceCents ?? 0,
    currency: training.currency,
    status: training.status,
    certificateEnabled: training.certificateEnabled,
    featuredOnLanding: training.featuredOnLanding,
  });

  useEffect(() => {
    setForm({
      title: training.title,
      description: training.description,
      startsAt: toDateTimeInputValue(training.startsAt),
      endsAt: toDateTimeInputValue(training.endsAt),
      location: training.location ?? "",
      coverImageUrl: training.coverImageUrl ?? "",
      capacity: training.capacity ?? undefined,
      priceCents: training.priceCents ?? 0,
      currency: training.currency,
      status: training.status,
      certificateEnabled: training.certificateEnabled,
      featuredOnLanding: training.featuredOnLanding,
    });
  }, [training]);

  if (isEditing) {
    return (
      <article className="admin-reference-row is-editing admin-content-row">
        <div className="admin-reference-edit-grid admin-content-edit-grid">
          <label>
            <span>Titre</span>
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label>
            <span>Statut</span>
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as AdminTrainingStatus }))}>
              {trainingStatusOptions.map((status) => <option key={status} value={status}>{trainingStatusLabels[status]}</option>)}
            </select>
          </label>
          <label>
            <span>Lieu</span>
            <input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
          </label>
          <label>
            <span>Début</span>
            <input type="datetime-local" value={form.startsAt} onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))} />
          </label>
          <label>
            <span>Fin</span>
            <input type="datetime-local" value={form.endsAt} onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))} />
          </label>
          <AdminUploadField
            label="Image"
            value={form.coverImageUrl ?? ""}
            purpose="training"
            uploadKey={`training-${training.id}-cover`}
            uploadingKey={uploadingKey}
            accept="image/*"
            onChange={(value) => setForm((current) => ({ ...current, coverImageUrl: value }))}
            onUpload={onUpload}
          />
          <label>
            <span>Places</span>
            <input type="number" min={1} value={form.capacity ?? ""} onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value ? Number(event.target.value) : undefined }))} />
          </label>
          <label className="admin-reference-toggle">
            <input type="checkbox" checked={form.certificateEnabled} onChange={(event) => setForm((current) => ({ ...current, certificateEnabled: event.target.checked }))} />
            <span>Certificat</span>
          </label>
          <label className="admin-reference-toggle">
            <input type="checkbox" checked={form.featuredOnLanding} onChange={(event) => setForm((current) => ({ ...current, featuredOnLanding: event.target.checked, status: event.target.checked ? "PUBLISHED" : current.status }))} />
            <span>Accueil</span>
          </label>
          <label className="admin-reference-textarea">
            <span>Description</span>
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </label>
        </div>
        <div className="admin-reference-row-actions">
          <button type="button" onClick={() => onUpdate(training, form)} disabled={!form.title.trim() || !form.description.trim() || busyKey === `training-${training.id}`}>
            <Edit3 aria-hidden="true" /> Enregistrer
          </button>
          <button type="button" onClick={onCancel}>
            <XCircle aria-hidden="true" /> Annuler
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="admin-reference-row admin-content-row">
      <div className="admin-reference-logo">
        {training.coverImageUrl ? <img src={training.coverImageUrl} alt="" loading="lazy" decoding="async" /> : <GraduationCap aria-hidden="true" />}
      </div>
      <div className="admin-reference-row-main">
        <strong>{training.title}</strong>
        <span>{[training.location, formatDateRange(training.startsAt, training.endsAt), training.certificateEnabled ? "certificat" : null, training.featuredOnLanding ? "accueil" : null].filter(Boolean).join(" · ")}</span>
        <small>{training.counts.enrollments} inscrits · {training.counts.modules} modules · {training.counts.resources} ressources</small>
      </div>
      <StatusPill status={training.status} label={trainingStatusLabels[training.status]} />
      <div className="admin-reference-row-actions">
        <button type="button" onClick={() => onUpdate(training, { featuredOnLanding: !training.featuredOnLanding })} disabled={busyKey === `training-${training.id}`}>
          <Sparkles aria-hidden="true" />
          {training.featuredOnLanding ? "Retirer accueil" : "Mettre accueil"}
        </button>
        <button type="button" onClick={() => onUpdate(training, { status: training.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" })} disabled={busyKey === `training-${training.id}`}>
          {training.status === "PUBLISHED" ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          {training.status === "PUBLISHED" ? "Masquer" : "Publier"}
        </button>
        <button type="button" onClick={onEdit}>
          <Edit3 aria-hidden="true" /> Modifier
        </button>
        <button type="button" className="is-danger" onClick={() => onDelete(training)} disabled={busyKey === `training-${training.id}-delete`}>
          <Trash2 aria-hidden="true" /> Supprimer
        </button>
      </div>
    </article>
  );
}

function EventContentRow({
  event,
  busyKey,
  uploadingKey,
  isEditing,
  onEdit,
  onCancel,
  onUpdate,
  onDelete,
  onUpload,
}: {
  event: AdminEvent;
  busyKey: string | null;
  uploadingKey: string | null;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onUpdate: (event: AdminEvent, input: Partial<EventPayload>) => void;
  onDelete: (event: AdminEvent) => void;
  onUpload: (purpose: AdminUploadPurpose, file: File, key: string) => Promise<string>;
}) {
  const [form, setForm] = useState<EventFormState>({
    title: event.title,
    description: event.description,
    type: event.type,
    startsAt: toDateTimeInputValue(event.startsAt),
    endsAt: toDateTimeInputValue(event.endsAt),
    location: event.location,
    coverImageUrl: event.coverImageUrl ?? "",
    whatsappUrl: event.whatsappUrl ?? "",
    facebookEventUrl: event.facebookEventUrl ?? "",
    published: event.published,
    featuredOnLanding: event.featuredOnLanding,
  });

  useEffect(() => {
    setForm({
      title: event.title,
      description: event.description,
      type: event.type,
      startsAt: toDateTimeInputValue(event.startsAt),
      endsAt: toDateTimeInputValue(event.endsAt),
      location: event.location,
      coverImageUrl: event.coverImageUrl ?? "",
      whatsappUrl: event.whatsappUrl ?? "",
      facebookEventUrl: event.facebookEventUrl ?? "",
      published: event.published,
      featuredOnLanding: event.featuredOnLanding,
    });
  }, [event]);

  if (isEditing) {
    return (
      <article className="admin-reference-row is-editing admin-content-row">
        <div className="admin-reference-edit-grid admin-content-edit-grid">
          <label>
            <span>Titre</span>
            <input value={form.title} onChange={(inputEvent) => setForm((current) => ({ ...current, title: inputEvent.target.value }))} />
          </label>
          <label>
            <span>Type</span>
            <select value={form.type} onChange={(inputEvent) => setForm((current) => ({ ...current, type: inputEvent.target.value as AdminEventType }))}>
              {eventTypeOptions.map((type) => <option key={type} value={type}>{eventTypeLabels[type]}</option>)}
            </select>
          </label>
          <label>
            <span>Lieu</span>
            <input value={form.location} onChange={(inputEvent) => setForm((current) => ({ ...current, location: inputEvent.target.value }))} />
          </label>
          <label>
            <span>Début</span>
            <input type="datetime-local" value={form.startsAt} onChange={(inputEvent) => setForm((current) => ({ ...current, startsAt: inputEvent.target.value }))} />
          </label>
          <label>
            <span>Fin</span>
            <input type="datetime-local" value={form.endsAt} onChange={(inputEvent) => setForm((current) => ({ ...current, endsAt: inputEvent.target.value }))} />
          </label>
          <AdminUploadField
            label="Image"
            value={form.coverImageUrl ?? ""}
            purpose="event"
            uploadKey={`event-${event.id}-cover`}
            uploadingKey={uploadingKey}
            accept="image/*"
            onChange={(value) => setForm((current) => ({ ...current, coverImageUrl: value }))}
            onUpload={onUpload}
          />
          <label>
            <span>WhatsApp</span>
            <input value={form.whatsappUrl} onChange={(inputEvent) => setForm((current) => ({ ...current, whatsappUrl: inputEvent.target.value }))} />
          </label>
          <label>
            <span>Facebook</span>
            <input value={form.facebookEventUrl} onChange={(inputEvent) => setForm((current) => ({ ...current, facebookEventUrl: inputEvent.target.value }))} />
          </label>
          <label className="admin-reference-toggle">
            <input type="checkbox" checked={form.published} onChange={(inputEvent) => setForm((current) => ({ ...current, published: inputEvent.target.checked }))} />
            <span>Publié</span>
          </label>
          <label className="admin-reference-toggle">
            <input type="checkbox" checked={form.featuredOnLanding} onChange={(inputEvent) => setForm((current) => ({ ...current, featuredOnLanding: inputEvent.target.checked, published: inputEvent.target.checked ? true : current.published }))} />
            <span>Accueil</span>
          </label>
          <label className="admin-reference-textarea">
            <span>Description</span>
            <textarea value={form.description} onChange={(inputEvent) => setForm((current) => ({ ...current, description: inputEvent.target.value }))} />
          </label>
        </div>
        <div className="admin-reference-row-actions">
          <button type="button" onClick={() => onUpdate(event, form)} disabled={!form.title.trim() || !form.description.trim() || !form.startsAt || !form.endsAt || !form.location.trim() || busyKey === `event-${event.id}`}>
            <Edit3 aria-hidden="true" /> Enregistrer
          </button>
          <button type="button" onClick={onCancel}>
            <XCircle aria-hidden="true" /> Annuler
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="admin-reference-row admin-content-row">
      <div className="admin-reference-logo">
        {event.coverImageUrl ? <img src={event.coverImageUrl} alt="" loading="lazy" decoding="async" /> : <CalendarDays aria-hidden="true" />}
      </div>
      <div className="admin-reference-row-main">
        <strong>{event.title}</strong>
        <span>{[eventTypeLabels[event.type], event.location, formatDateRange(event.startsAt, event.endsAt), event.featuredOnLanding ? "accueil" : null].filter(Boolean).join(" · ")}</span>
        <small>{event.counts.registrations} réservations · {event.whatsappUrl ? "WhatsApp" : "sans WhatsApp"} · {event.facebookEventUrl ? "Facebook" : "sans Facebook"}</small>
      </div>
      <StatusPill status={event.published ? "PUBLISHED" : "DRAFT"} label={event.published ? "Publié" : "Masqué"} />
      <div className="admin-reference-row-actions">
        <button type="button" onClick={() => onUpdate(event, { featuredOnLanding: !event.featuredOnLanding })} disabled={busyKey === `event-${event.id}`}>
          <Sparkles aria-hidden="true" />
          {event.featuredOnLanding ? "Retirer accueil" : "Mettre accueil"}
        </button>
        <button type="button" onClick={() => onUpdate(event, { published: !event.published })} disabled={busyKey === `event-${event.id}`}>
          {event.published ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          {event.published ? "Masquer" : "Publier"}
        </button>
        <button type="button" onClick={onEdit}>
          <Edit3 aria-hidden="true" /> Modifier
        </button>
        <button type="button" className="is-danger" onClick={() => onDelete(event)} disabled={busyKey === `event-${event.id}-delete`}>
          <Trash2 aria-hidden="true" /> Supprimer
        </button>
      </div>
    </article>
  );
}

function ResourceContentRow({
  resource,
  trainings,
  busyKey,
  uploadingKey,
  isEditing,
  onEdit,
  onCancel,
  onUpdate,
  onDelete,
  onUpload,
}: {
  resource: AdminResource;
  trainings: AdminTraining[];
  busyKey: string | null;
  uploadingKey: string | null;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onUpdate: (resource: AdminResource, input: Partial<ResourcePayload>) => void;
  onDelete: (resource: AdminResource) => void;
  onUpload: (purpose: AdminUploadPurpose, file: File, key: string) => Promise<string>;
}) {
  const [form, setForm] = useState<ResourceFormState>({
    title: resource.title,
    description: resource.description ?? "",
    type: resource.type,
    url: resource.url,
    accessLevel: resource.accessLevel,
    published: resource.published,
    trainingId: resource.training?.id ?? "",
  });

  useEffect(() => {
    setForm({
      title: resource.title,
      description: resource.description ?? "",
      type: resource.type,
      url: resource.url,
      accessLevel: resource.accessLevel,
      published: resource.published,
      trainingId: resource.training?.id ?? "",
    });
  }, [resource]);

  if (isEditing) {
    return (
      <article className="admin-reference-row is-editing admin-content-row">
        <div className="admin-reference-edit-grid admin-content-edit-grid">
          <label>
            <span>Titre</span>
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label>
            <span>Type</span>
            <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as AdminResourceType }))}>
              {resourceTypeOptions.map((type) => <option key={type} value={type}>{resourceTypeLabels[type]}</option>)}
            </select>
          </label>
          <label>
            <span>Accès</span>
            <select value={form.accessLevel} onChange={(event) => setForm((current) => ({ ...current, accessLevel: event.target.value as AdminResourceAccessLevel }))}>
              {resourceAccessOptions.map((level) => <option key={level} value={level}>{resourceAccessLabels[level]}</option>)}
            </select>
          </label>
          <AdminUploadField
            label="Fichier ou lien"
            value={form.url}
            purpose="resource"
            uploadKey={`resource-${resource.id}-file`}
            uploadingKey={uploadingKey}
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            icon={FileText}
            onChange={(value) => setForm((current) => ({ ...current, url: value }))}
            onUpload={onUpload}
          />
          <label>
            <span>Formation liée</span>
            <select value={form.trainingId ?? ""} onChange={(event) => setForm((current) => ({ ...current, trainingId: event.target.value }))}>
              <option value="">Bibliothèque générale</option>
              {trainings.map((training) => <option key={training.id} value={training.id}>{training.title}</option>)}
            </select>
          </label>
          <label className="admin-reference-toggle">
            <input type="checkbox" checked={form.published} onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked }))} />
            <span>Visible</span>
          </label>
          <label className="admin-reference-textarea">
            <span>Description</span>
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </label>
        </div>
        <div className="admin-reference-row-actions">
          <button type="button" onClick={() => onUpdate(resource, form)} disabled={!form.title.trim() || !form.url.trim() || busyKey === `resource-${resource.id}`}>
            <Edit3 aria-hidden="true" /> Enregistrer
          </button>
          <button type="button" onClick={onCancel}>
            <XCircle aria-hidden="true" /> Annuler
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="admin-reference-row admin-content-row">
      <div className="admin-reference-logo">
        <BookOpen aria-hidden="true" />
      </div>
      <div className="admin-reference-row-main">
        <strong>{resource.title}</strong>
        <span>{[resourceTypeLabels[resource.type], resourceAccessLabels[resource.accessLevel], resource.training?.title].filter(Boolean).join(" · ")}</span>
        <small>{resource.description ?? resource.url}</small>
        <small>{resource.counts.views} vues · {resource.counts.downloads} téléchargements · {resource.counts.usefulMarks} utiles</small>
      </div>
      <StatusPill status={resource.published ? "PUBLISHED" : "DRAFT"} label={resource.published ? "Publiée" : "Masquée"} />
      <div className="admin-reference-row-actions">
        <button type="button" onClick={() => onUpdate(resource, { published: !resource.published })} disabled={busyKey === `resource-${resource.id}`}>
          {resource.published ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          {resource.published ? "Masquer" : "Publier"}
        </button>
        <button type="button" onClick={onEdit}>
          <Edit3 aria-hidden="true" /> Modifier
        </button>
        <button type="button" className="is-danger" onClick={() => onDelete(resource)} disabled={busyKey === `resource-${resource.id}-delete`}>
          <Trash2 aria-hidden="true" /> Supprimer
        </button>
      </div>
    </article>
  );
}

function GalleryAlbumRow({
  album,
  busyKey,
  uploadingKey,
  isEditing,
  onEdit,
  onCancel,
  onUpdate,
  onDelete,
  onUpload,
}: {
  album: GalleryAlbum;
  busyKey: string | null;
  uploadingKey: string | null;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onUpdate: (album: GalleryAlbum, input: Partial<GalleryAlbumPayload>) => void;
  onDelete: (album: GalleryAlbum) => void;
  onUpload: (purpose: AdminUploadPurpose, file: File, key: string) => Promise<string>;
}) {
  const [form, setForm] = useState<GalleryAlbumFormState>({
    title: album.title,
    description: album.description ?? "",
    category: album.category,
    coverImageUrl: album.coverImageUrl ?? "",
    published: album.published,
    featuredOnLanding: album.featuredOnLanding,
    sortOrder: album.sortOrder,
    photosText: album.photos.map((photo) => photo.imageUrl).join("\n"),
  });

  useEffect(() => {
    setForm({
      title: album.title,
      description: album.description ?? "",
      category: album.category,
      coverImageUrl: album.coverImageUrl ?? "",
      published: album.published,
      featuredOnLanding: album.featuredOnLanding,
      sortOrder: album.sortOrder,
      photosText: album.photos.map((photo) => photo.imageUrl).join("\n"),
    });
  }, [album]);

  if (isEditing) {
    return (
      <article className="admin-reference-row is-editing admin-content-row">
        <div className="admin-reference-edit-grid admin-content-edit-grid">
          <label>
            <span>Titre</span>
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label>
            <span>Catégorie</span>
            <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as GalleryAlbumCategory }))}>
              {galleryCategoryOptions.map((category) => <option key={category} value={category}>{galleryCategoryLabels[category]}</option>)}
            </select>
          </label>
          <label>
            <span>Numéro</span>
            <input type="number" min={0} value={form.sortOrder ?? 0} onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} />
          </label>
          <AdminUploadField
            label="Couverture"
            value={form.coverImageUrl ?? ""}
            purpose="gallery"
            uploadKey={`gallery-${album.id}-cover`}
            uploadingKey={uploadingKey}
            accept="image/*"
            onChange={(value) => setForm((current) => ({ ...current, coverImageUrl: value }))}
            onUpload={onUpload}
          />
          <label className="admin-reference-toggle">
            <input type="checkbox" checked={form.published} onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked }))} />
            <span>Visible</span>
          </label>
          <label className="admin-reference-toggle">
            <input type="checkbox" checked={form.featuredOnLanding} onChange={(event) => setForm((current) => ({ ...current, featuredOnLanding: event.target.checked, published: event.target.checked ? true : current.published }))} />
            <span>Accueil</span>
          </label>
          <label className="admin-reference-textarea">
            <span>Description</span>
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </label>
        </div>
        <div className="admin-reference-row-actions">
          <button type="button" onClick={() => onUpdate(album, form)} disabled={!form.title.trim() || busyKey === `gallery-${album.id}`}>
            <Edit3 aria-hidden="true" /> Enregistrer
          </button>
          <button type="button" onClick={onCancel}>
            <XCircle aria-hidden="true" /> Annuler
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="admin-reference-row admin-content-row">
      <div className="admin-reference-logo">
        {album.coverImageUrl ? <img src={album.coverImageUrl} alt="" loading="lazy" decoding="async" /> : <ImageIcon aria-hidden="true" />}
      </div>
      <div className="admin-reference-row-main">
        <strong>{album.title}</strong>
        <span>{[galleryCategoryLabels[album.category], `${album.photos.length} photo${album.photos.length > 1 ? "s" : ""}`, album.featuredOnLanding ? "accueil" : null].filter(Boolean).join(" · ")}</span>
        <small>{album.description ?? "Album officiel Creative Currencies Africa."}</small>
      </div>
      <StatusPill status={album.published ? "PUBLISHED" : "DRAFT"} label={album.published ? "Publié" : "Masqué"} />
      <div className="admin-reference-row-actions">
        <button type="button" onClick={() => onUpdate(album, { featuredOnLanding: !album.featuredOnLanding, published: !album.featuredOnLanding ? true : album.published })} disabled={busyKey === `gallery-${album.id}`}>
          <Sparkles aria-hidden="true" />
          {album.featuredOnLanding ? "Retirer accueil" : "Mettre accueil"}
        </button>
        <button type="button" onClick={() => onUpdate(album, { published: !album.published })} disabled={busyKey === `gallery-${album.id}`}>
          {album.published ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          {album.published ? "Masquer" : "Publier"}
        </button>
        <button type="button" onClick={onEdit}>
          <Edit3 aria-hidden="true" /> Modifier
        </button>
        <button type="button" className="is-danger" onClick={() => onDelete(album)} disabled={busyKey === `gallery-${album.id}-delete`}>
          <Trash2 aria-hidden="true" /> Supprimer
        </button>
      </div>
    </article>
  );
}

function OpportunityContentRow({
  opportunity,
  busyKey,
  isEditing,
  onEdit,
  onCancel,
  onUpdate,
  onDelete,
}: {
  opportunity: AdminOpportunity;
  busyKey: string | null;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onUpdate: (opportunity: AdminOpportunity, input: Partial<OpportunityPayload>) => void;
  onDelete: (opportunity: AdminOpportunity) => void;
}) {
  const [form, setForm] = useState<OpportunityFormState>({
    title: opportunity.title,
    description: opportunity.description,
    type: opportunity.type,
    status: opportunity.status,
    deadline: toDateTimeInputValue(opportunity.deadline),
    location: opportunity.location ?? "",
    eligibilityUrl: opportunity.eligibilityUrl ?? "",
    published: opportunity.published,
  });

  useEffect(() => {
    setForm({
      title: opportunity.title,
      description: opportunity.description,
      type: opportunity.type,
      status: opportunity.status,
      deadline: toDateTimeInputValue(opportunity.deadline),
      location: opportunity.location ?? "",
      eligibilityUrl: opportunity.eligibilityUrl ?? "",
      published: opportunity.published,
    });
  }, [opportunity]);

  if (isEditing) {
    return (
      <article className="admin-reference-row is-editing admin-content-row">
        <div className="admin-reference-edit-grid admin-content-edit-grid">
          <label>
            <span>Titre</span>
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label>
            <span>Type</span>
            <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as AdminOpportunityType }))}>
              {opportunityTypeOptions.map((type) => <option key={type} value={type}>{opportunityTypeLabels[type]}</option>)}
            </select>
          </label>
          <label>
            <span>Statut</span>
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as AdminOpportunityStatus }))}>
              {opportunityStatusOptions.map((status) => <option key={status} value={status}>{opportunityStatusLabels[status]}</option>)}
            </select>
          </label>
          <label>
            <span>Date limite</span>
            <input type="datetime-local" value={form.deadline} onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))} />
          </label>
          <label>
            <span>Lieu</span>
            <input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
          </label>
          <label>
            <span>Lien de candidature</span>
            <input value={form.eligibilityUrl} onChange={(event) => setForm((current) => ({ ...current, eligibilityUrl: event.target.value }))} />
          </label>
          <label className="admin-reference-toggle">
            <input type="checkbox" checked={form.published} onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked, status: event.target.checked ? "OPEN" : current.status }))} />
            <span>Visible</span>
          </label>
          <label className="admin-reference-textarea">
            <span>Description</span>
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </label>
        </div>
        <div className="admin-reference-row-actions">
          <button type="button" onClick={() => onUpdate(opportunity, form)} disabled={!form.title.trim() || !form.description.trim() || busyKey === `opportunity-${opportunity.id}`}>
            <Edit3 aria-hidden="true" /> Enregistrer
          </button>
          <button type="button" onClick={onCancel}>
            <XCircle aria-hidden="true" /> Annuler
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="admin-reference-row admin-content-row">
      <div className="admin-reference-logo">
        <ClipboardList aria-hidden="true" />
      </div>
      <div className="admin-reference-row-main">
        <strong>{opportunity.title}</strong>
        <span>{[opportunityTypeLabels[opportunity.type], opportunity.location, opportunity.deadline ? `limite ${formatDate(opportunity.deadline)}` : null].filter(Boolean).join(" · ")}</span>
        <small>{opportunity.counts.applications} candidatures · {opportunity.description}</small>
      </div>
      <StatusPill status={opportunity.status} label={opportunityStatusLabels[opportunity.status]} />
      <div className="admin-reference-row-actions">
        <button type="button" onClick={() => onUpdate(opportunity, { published: !opportunity.published })} disabled={busyKey === `opportunity-${opportunity.id}`}>
          {opportunity.published ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          {opportunity.published ? "Masquer" : "Publier"}
        </button>
        <button type="button" onClick={onEdit}>
          <Edit3 aria-hidden="true" /> Modifier
        </button>
        <button type="button" className="is-danger" onClick={() => onDelete(opportunity)} disabled={busyKey === `opportunity-${opportunity.id}-delete`}>
          <Trash2 aria-hidden="true" /> Supprimer
        </button>
      </div>
    </article>
  );
}

function ReportsPanel({
  reports,
  messageReports = [],
  groupMessageReports = [],
  auditLogs = [],
  riskUsers = [],
  busyKey,
  onAction,
  onMessageAction,
  onGroupMessageAction,
  onSuspend,
  compact = false,
}: {
  reports: AdminReport[];
  messageReports?: AdminDirectMessageReport[];
  groupMessageReports?: AdminGroupMessageReport[];
  auditLogs?: AdminAuditLog[];
  riskUsers?: AdminRiskUser[];
  busyKey: string | null;
  onAction: (report: AdminReport, input: { status?: Exclude<PublicationReportStatus, "PENDING">; publicationStatus?: Exclude<PublicationStatus, "DRAFT"> }) => void;
  onMessageAction?: (report: AdminDirectMessageReport, input: { status: Exclude<DirectMessageReportStatus, "PENDING">; deleteMessage?: boolean; note?: string }) => void;
  onGroupMessageAction?: (report: AdminGroupMessageReport, input: { status: Exclude<DirectMessageReportStatus, "PENDING">; deleteMessage?: boolean; note?: string }) => void;
  onSuspend?: (member: AdminMember) => void;
  compact?: boolean;
}) {
  const [moderationTab, setModerationTab] = useState<"publications" | "messages" | "groups" | "risk" | "history">("publications");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [reasonFilter, setReasonFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  if (compact) {
    return (
      <section className="member-card admin-section">
        <SectionTitle icon={AlertTriangle} title="Modération" subtitle="Signalements envoyés par les membres." />
        <div className="admin-list">
          {reports.length ? reports.map((report) => (
            <PublicationReportRow
              key={report.id}
              report={report}
              busyKey={busyKey}
              onAction={onAction}
              onSuspend={onSuspend}
              compact
            />
          )) : <EmptyAdminState title="Aucun signalement" text="La file de modération est vide pour le moment." />}
        </div>
      </section>
    );
  }

  const currentStatusOptions = moderationTab === "messages" || moderationTab === "groups"
    ? Object.keys(directMessageReportStatusLabels)
    : Object.keys(reportStatusLabels);
  const currentReasonOptions = moderationTab === "messages" || moderationTab === "groups"
    ? Object.entries(directMessageReportReasonLabels)
    : Object.entries(reportReasonLabels);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visiblePublicationReports = reports.filter((report) => (
    matchesModerationFilters({
      createdAt: report.createdAt,
      status: report.status,
      reason: report.reason,
      searchable: [
        report.publication.title,
        report.publication.content,
        report.publication.author.displayName,
        report.publication.author.email,
        report.reporter.displayName,
        report.reporter.email,
      ],
      statusFilter,
      reasonFilter,
      query: normalizedQuery,
      fromDate,
      toDate,
    })
  ));
  const visibleMessageReports = messageReports.filter((report) => (
    matchesModerationFilters({
      createdAt: report.createdAt,
      status: report.status,
      reason: report.reason,
      searchable: [
        report.directMessage.content,
        report.directMessage.author.displayName,
        report.directMessage.author.email,
        report.reporter.displayName,
        report.reporter.email,
        report.message,
      ],
      statusFilter,
      reasonFilter,
      query: normalizedQuery,
      fromDate,
      toDate,
    })
  ));
  const visibleGroupMessageReports = groupMessageReports.filter((report) => (
    matchesModerationFilters({
      createdAt: report.createdAt,
      status: report.status,
      reason: report.reason,
      searchable: [
        report.groupMessage.content,
        report.groupMessage.groupName,
        report.groupMessage.author.displayName,
        report.groupMessage.author.email,
        report.reporter.displayName,
        report.reporter.email,
        report.message,
      ],
      statusFilter,
      reasonFilter,
      query: normalizedQuery,
      fromDate,
      toDate,
    })
  ));
  const visibleRiskUsers = riskUsers.filter((entry) => (
    !normalizedQuery
    || [entry.member.displayName, entry.member.email, entry.member.discipline, entry.member.city, ...entry.reasons].some((value) => value?.toLowerCase().includes(normalizedQuery))
  ));
  const visibleAuditLogs = auditLogs.filter((log) => (
    !normalizedQuery
    || [log.action, log.entityType, log.message, log.admin?.displayName, log.targetUser?.displayName].some((value) => value?.toLowerCase().includes(normalizedQuery))
  ));

  return (
    <section className="member-card admin-section admin-moderation-panel">
      <SectionTitle icon={AlertTriangle} title="Modération" subtitle="Traitez les signalements, suivez les comptes à risque et gardez une trace des décisions admin." />
      <div className="admin-moderation-tabs" aria-label="Sections de modération">
        <button type="button" className={moderationTab === "publications" ? "is-active" : undefined} onClick={() => setModerationTab("publications")}>
          Publications signalées <span>{reports.filter((report) => report.status === "PENDING").length}</span>
        </button>
        <button type="button" className={moderationTab === "messages" ? "is-active" : undefined} onClick={() => setModerationTab("messages")}>
          Messages privés <span>{messageReports.filter((report) => report.status === "PENDING").length}</span>
        </button>
        <button type="button" className={moderationTab === "groups" ? "is-active" : undefined} onClick={() => setModerationTab("groups")}>
          Messages de groupe <span>{groupMessageReports.filter((report) => report.status === "PENDING").length}</span>
        </button>
        <button type="button" className={moderationTab === "risk" ? "is-active" : undefined} onClick={() => setModerationTab("risk")}>
          Comptes à risque <span>{riskUsers.length}</span>
        </button>
        <button type="button" className={moderationTab === "history" ? "is-active" : undefined} onClick={() => setModerationTab("history")}>
          Historique <span>{auditLogs.length}</span>
        </button>
      </div>

      <div className="admin-moderation-filters">
        <label className="admin-search-field">
          <Search aria-hidden="true" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Membre, e-mail, contenu, raison..." />
        </label>
        {moderationTab === "publications" || moderationTab === "messages" || moderationTab === "groups" ? (
          <>
            <label>
              <span>Statut</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="ALL">Tous les statuts</option>
                {currentStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {moderationTab === "messages" ? directMessageReportStatusLabels[status as DirectMessageReportStatus] : reportStatusLabels[status as PublicationReportStatus]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Raison</span>
              <select value={reasonFilter} onChange={(event) => setReasonFilter(event.target.value)}>
                <option value="ALL">Toutes les raisons</option>
                {currentReasonOptions.map(([reason, label]) => <option key={reason} value={reason}>{label}</option>)}
              </select>
            </label>
            <label>
              <span>Depuis</span>
              <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </label>
            <label>
              <span>Jusqu'au</span>
              <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </label>
          </>
        ) : null}
      </div>

      {moderationTab === "publications" ? (
        <div className="admin-list">
          {visiblePublicationReports.length ? visiblePublicationReports.map((report) => (
            <PublicationReportRow key={report.id} report={report} busyKey={busyKey} onAction={onAction} onSuspend={onSuspend} />
          )) : <EmptyAdminState title="Aucune publication signalée" text="Aucune publication ne correspond aux filtres actuels." />}
        </div>
      ) : null}

      {moderationTab === "messages" ? (
        <div className="admin-list">
          {visibleMessageReports.length && onMessageAction ? visibleMessageReports.map((report) => (
            <MessageReportRow key={report.id} report={report} busyKey={busyKey} onAction={onMessageAction} onSuspend={onSuspend} />
          )) : <EmptyAdminState title="Aucun message signalé" text="Aucun message privé ne correspond aux filtres actuels." />}
        </div>
      ) : null}

      {moderationTab === "groups" ? (
        <div className="admin-list">
          {visibleGroupMessageReports.length && onGroupMessageAction ? visibleGroupMessageReports.map((report) => (
            <GroupMessageReportRow key={report.id} report={report} busyKey={busyKey} onAction={onGroupMessageAction} onSuspend={onSuspend} />
          )) : <EmptyAdminState title="Aucun message de groupe signalé" text="Aucun message de groupe ne correspond aux filtres actuels." />}
        </div>
      ) : null}

      {moderationTab === "risk" ? (
        <div className="admin-risk-grid">
          {visibleRiskUsers.length ? visibleRiskUsers.map((entry) => (
            <article key={entry.member.id} className="admin-risk-card">
              <div className="admin-member-identity">
                <div className="admin-list-avatar"><Avatar member={entry.member} /></div>
                <div className="admin-member-copy">
                  <strong>{entry.member.displayName}</strong>
                  <span>{[accountTypeLabel(entry.member.type), entry.member.discipline, entry.member.city].filter(Boolean).join(" · ")}</span>
                  <small>{entry.member.email}</small>
                </div>
              </div>
              <div className="admin-risk-metrics">
                <span>{entry.totalReports} signalements</span>
                <span>{entry.pendingReports} à traiter</span>
                <span>{entry.publicationReports} publications</span>
                <span>{entry.messageReports} messages</span>
                <span>{entry.groupMessageReports ?? 0} groupes</span>
              </div>
              <p>Dernier signalement : {formatDate(entry.lastReportedAt)} · {entry.reasons.map((reason) => reportReasonLabels[reason as PublicationReportReason] ?? directMessageReportReasonLabels[reason as DirectMessageReportReason] ?? reason).join(", ")}</p>
              {entry.member.status !== "SUSPENDED" && onSuspend ? (
                <div className="admin-list-actions">
                  <button type="button" className="is-danger" onClick={() => onSuspend(entry.member)} disabled={busyKey === `moderation-suspend-${entry.member.id}`}>
                    <XCircle aria-hidden="true" /> Suspendre
                  </button>
                </div>
              ) : null}
            </article>
          )) : <EmptyAdminState title="Aucun compte à risque" text="Les comptes signalés plusieurs fois apparaîtront ici." />}
        </div>
      ) : null}

      {moderationTab === "history" ? (
        <div className="admin-audit-list">
          {visibleAuditLogs.length ? visibleAuditLogs.map((log) => (
            <article key={log.id}>
              <div>
                <strong>{formatAuditAction(log.action)}</strong>
                <span>{log.entityType} · {formatDate(log.createdAt)}</span>
              </div>
              <p>{log.message || "Action enregistrée sans note complémentaire."}</p>
              <small>{log.admin?.displayName ?? "Admin"} → {log.targetUser?.displayName ?? "Cible non liée"}</small>
            </article>
          )) : <EmptyAdminState title="Aucun historique" text="Les actions sensibles de modération apparaîtront ici." />}
        </div>
      ) : null}
    </section>
  );
}

function PublicationReportRow({
  report,
  busyKey,
  onAction,
  onSuspend,
  compact = false,
}: {
  report: AdminReport;
  busyKey: string | null;
  onAction: (report: AdminReport, input: { status?: Exclude<PublicationReportStatus, "PENDING">; publicationStatus?: Exclude<PublicationStatus, "DRAFT"> }) => void;
  onSuspend?: (member: AdminMember) => void;
  compact?: boolean;
}) {
  return (
    <article className="admin-list-item admin-moderation-row">
      <div className="admin-list-avatar">
        <Avatar member={report.reporter} />
      </div>
      <div className="admin-list-body">
        <div className="admin-list-heading">
          <div>
            <strong>{report.publication.title}</strong>
            <span>{reportReasonLabels[report.reason]} par {report.reporter.displayName}</span>
          </div>
          <StatusPill status={report.status} label={reportStatusLabels[report.status]} />
        </div>
        {!compact && report.message ? <p>{report.message}</p> : null}
        <small>{publicationTypeLabels[report.publication.type]} · auteur : {report.publication.author.displayName} · {formatDate(report.createdAt)}</small>
        {!compact ? (
          <details className="admin-report-detail">
            <summary>Voir le détail</summary>
            <div>
              <p>{report.publication.content || report.publication.excerpt || "Aucun contenu détaillé disponible."}</p>
              <small>Signalé par {report.reporter.displayName} · Auteur {report.publication.author.displayName} · Statut publication : {publicationStatusLabels[report.publication.status]}</small>
            </div>
          </details>
        ) : null}
      </div>
      <div className="admin-list-actions">
        <button type="button" onClick={() => onAction(report, { status: "DISMISSED" })} disabled={busyKey === `report-${report.id}`}>
          <CheckCircle2 aria-hidden="true" /> Classer
        </button>
        <button type="button" onClick={() => onAction(report, { status: "REVIEWED", publicationStatus: "ARCHIVED" })} disabled={busyKey === `report-${report.id}`}>
          <Archive aria-hidden="true" /> Archiver
        </button>
        <button type="button" className="is-danger" onClick={() => onAction(report, { status: "REVIEWED", publicationStatus: "REJECTED" })} disabled={busyKey === `report-${report.id}`}>
          <XCircle aria-hidden="true" /> Rejeter
        </button>
        {!compact && report.publication.author.status !== "SUSPENDED" && onSuspend ? (
          <button type="button" className="is-danger" onClick={() => onSuspend(report.publication.author)} disabled={busyKey === `moderation-suspend-${report.publication.author.id}`}>
            <ShieldCheck aria-hidden="true" /> Suspendre
          </button>
        ) : null}
      </div>
    </article>
  );
}

function MessageReportRow({
  report,
  busyKey,
  onAction,
  onSuspend,
}: {
  report: AdminDirectMessageReport;
  busyKey: string | null;
  onAction: (report: AdminDirectMessageReport, input: { status: Exclude<DirectMessageReportStatus, "PENDING">; deleteMessage?: boolean; note?: string }) => void;
  onSuspend?: (member: AdminMember) => void;
}) {
  const isDeleted = !!report.directMessage.deletedAt;

  return (
    <article className="admin-list-item admin-moderation-row">
      <div className="admin-list-avatar">
        <Avatar member={report.reporter} />
      </div>
      <div className="admin-list-body">
        <div className="admin-list-heading">
          <div>
            <strong>Message de {report.directMessage.author.displayName}</strong>
            <span>{directMessageReportReasonLabels[report.reason]} par {report.reporter.displayName}</span>
          </div>
          <StatusPill status={report.status} label={directMessageReportStatusLabels[report.status]} />
        </div>
        <p>{report.directMessage.content}</p>
        <small>{isDeleted ? "Message déjà supprimé" : "Message visible"} · {formatDate(report.createdAt)}</small>
        <details className="admin-report-detail">
          <summary>Voir le contexte</summary>
          <div>
            <p>{report.message || "Aucune note de signalement ajoutée."}</p>
            <small>Signalé par {report.reporter.displayName} · Auteur {report.directMessage.author.displayName} · Conversation {report.directMessage.conversationId}</small>
          </div>
        </details>
      </div>
      <div className="admin-list-actions">
        <button type="button" onClick={() => onAction(report, { status: "DISMISSED" })} disabled={busyKey === `message-report-${report.id}`}>
          <CheckCircle2 aria-hidden="true" /> Classer
        </button>
        <button type="button" onClick={() => onAction(report, { status: "REVIEWED" })} disabled={busyKey === `message-report-${report.id}`}>
          <ShieldCheck aria-hidden="true" /> Traiter
        </button>
        <button type="button" className="is-danger" onClick={() => onAction(report, { status: "REVIEWED", deleteMessage: true, note: "Message supprimé depuis le back-office de modération." })} disabled={isDeleted || busyKey === `message-report-${report.id}`}>
          <Trash2 aria-hidden="true" /> Supprimer
        </button>
        {report.directMessage.author.status !== "SUSPENDED" && onSuspend ? (
          <button type="button" className="is-danger" onClick={() => onSuspend(report.directMessage.author)} disabled={busyKey === `moderation-suspend-${report.directMessage.author.id}`}>
            <XCircle aria-hidden="true" /> Suspendre
          </button>
        ) : null}
      </div>
    </article>
  );
}

function GroupMessageReportRow({
  report,
  busyKey,
  onAction,
  onSuspend,
}: {
  report: AdminGroupMessageReport;
  busyKey: string | null;
  onAction: (report: AdminGroupMessageReport, input: { status: Exclude<DirectMessageReportStatus, "PENDING">; deleteMessage?: boolean; note?: string }) => void;
  onSuspend?: (member: AdminMember) => void;
}) {
  const isDeleted = !!report.groupMessage.deletedAt;

  return (
    <article className="admin-list-item admin-moderation-row">
      <div className="admin-list-avatar">
        <Avatar member={report.reporter} />
      </div>
      <div className="admin-list-body">
        <div className="admin-list-heading">
          <div>
            <strong>{report.groupMessage.groupName}</strong>
            <span>{directMessageReportReasonLabels[report.reason]} par {report.reporter.displayName}</span>
          </div>
          <StatusPill status={report.status} label={directMessageReportStatusLabels[report.status]} />
        </div>
        <p>{report.groupMessage.content}</p>
        <small>{isDeleted ? "Message déjà supprimé" : "Message visible"} · auteur : {report.groupMessage.author.displayName} · {formatDate(report.createdAt)}</small>
        <details className="admin-report-detail">
          <summary>Voir le contexte</summary>
          <div>
            <p>{report.message || "Aucune note de signalement ajoutée."}</p>
            <small>Groupe {report.groupMessage.groupName} · Signalé par {report.reporter.displayName} · Auteur {report.groupMessage.author.displayName}</small>
          </div>
        </details>
      </div>
      <div className="admin-list-actions">
        <button type="button" onClick={() => onAction(report, { status: "DISMISSED" })} disabled={busyKey === `group-message-report-${report.id}`}>
          <CheckCircle2 aria-hidden="true" /> Classer
        </button>
        <button type="button" onClick={() => onAction(report, { status: "REVIEWED" })} disabled={busyKey === `group-message-report-${report.id}`}>
          <ShieldCheck aria-hidden="true" /> Traiter
        </button>
        <button type="button" className="is-danger" onClick={() => onAction(report, { status: "REVIEWED", deleteMessage: true, note: "Message de groupe supprimé depuis le back-office de modération." })} disabled={isDeleted || busyKey === `group-message-report-${report.id}`}>
          <Trash2 aria-hidden="true" /> Supprimer
        </button>
        {report.groupMessage.author.status !== "SUSPENDED" && onSuspend ? (
          <button type="button" className="is-danger" onClick={() => onSuspend(report.groupMessage.author)} disabled={busyKey === `moderation-suspend-${report.groupMessage.author.id}`}>
            <XCircle aria-hidden="true" /> Suspendre
          </button>
        ) : null}
      </div>
    </article>
  );
}

function PublicationsPanel({
  publications,
  busyKey,
  onStatus,
  compact = false,
}: {
  publications: AdminPublication[];
  busyKey: string | null;
  onStatus: (publication: AdminPublication, status: Exclude<PublicationStatus, "DRAFT">) => void;
  compact?: boolean;
}) {
  return (
    <section className="member-card admin-section">
      <SectionTitle icon={FileText} title="Publications" subtitle="Contenus publiés, brouillons et contenus retirés." />
      <div className="admin-list">
        {publications.length ? publications.map((publication) => (
          <article className="admin-list-item" key={publication.id}>
            <div className="admin-list-avatar">
              <Avatar member={publication.author} />
            </div>
            <div className="admin-list-body">
              <div className="admin-list-heading">
                <div>
                  <strong>{publication.title}</strong>
                  <span>{publicationTypeLabels[publication.type]} par {publication.author.displayName}</span>
                </div>
                <StatusPill status={publication.status} label={publicationStatusLabels[publication.status]} />
              </div>
              {!compact ? <p>{publication.excerpt ?? publication.content}</p> : null}
              <small>{publication.counts.reactions} réactions · {publication.counts.comments} commentaires · {publication.counts.reports} signalements</small>
            </div>
            <div className="admin-list-actions">
              {publication.status !== "PUBLISHED" ? (
                <button type="button" onClick={() => onStatus(publication, "PUBLISHED")} disabled={busyKey === `publication-${publication.id}-PUBLISHED`}>
                  <CheckCircle2 aria-hidden="true" /> Publier
                </button>
              ) : null}
              {publication.status !== "ARCHIVED" ? (
                <button type="button" onClick={() => onStatus(publication, "ARCHIVED")} disabled={busyKey === `publication-${publication.id}-ARCHIVED`}>
                  <Archive aria-hidden="true" /> Archiver
                </button>
              ) : null}
              {publication.status !== "REJECTED" ? (
                <button type="button" className="is-danger" onClick={() => onStatus(publication, "REJECTED")} disabled={busyKey === `publication-${publication.id}-REJECTED`}>
                  <XCircle aria-hidden="true" /> Rejeter
                </button>
              ) : null}
            </div>
          </article>
        )) : <EmptyAdminState title="Aucune publication" text="Les contenus apparaîtront ici dès qu'ils seront créés." />}
      </div>
    </section>
  );
}

function MembersPanel({
  members,
  accountEvolutionRequests,
  busyKey,
  onStatus,
  onGrantAdminAccess,
  onVerification,
  onAccountEvolutionDecision,
}: {
  members: AdminMember[];
  accountEvolutionRequests: AdminAccountEvolutionRequest[];
  busyKey: string | null;
  onStatus: (member: AdminMember, status: AdminMember["status"]) => void;
  onGrantAdminAccess: (member: AdminMember) => void;
  onVerification: (member: AdminMember, verified: boolean) => void;
  onAccountEvolutionDecision: (request: AdminAccountEvolutionRequest, status: "APPROVED" | "REJECTED") => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | AdminMember["status"]>("ALL");
  const filteredMembers = members.filter((member) => {
    const searchable = [
      member.displayName,
      member.email,
      accountTypeLabel(member.type),
      member.discipline,
      member.city,
      member.country,
    ].filter(Boolean).join(" ").toLowerCase();
    const matchesQuery = !query.trim() || searchable.includes(query.trim().toLowerCase());
    const matchesStatus = statusFilter === "ALL" || member.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  return (
    <section className="member-card admin-section admin-members-section">
      <SectionTitle icon={UsersRound} title="Membres" subtitle="Comptes inscrits, vérification et évolution des parcours." />

      <div className="admin-subsection-card">
        <div className="admin-subsection-heading">
          <div>
            <span>Dossiers membres</span>
            <h3>Demandes de passage créateur</h3>
            <p>Validez les profils publics ou apprenants qui souhaitent rejoindre le réseau des créateurs CCA.</p>
          </div>
          <strong>{accountEvolutionRequests.filter((request) => request.status === "PENDING").length} en attente</strong>
        </div>

        <div className="admin-members-list admin-evolution-list">
          {accountEvolutionRequests.length ? accountEvolutionRequests.map((request) => (
            <article className="admin-member-row" key={request.id}>
              <div className="admin-member-identity">
                <div className="admin-list-avatar">
                  <Avatar member={request.user} />
                </div>
                <div className="admin-member-copy">
                  <strong>{request.user.displayName}</strong>
                  <span>{accountTypeLabel(request.fromType)} vers {accountTypeLabel(request.requestedType)} · {request.user.email}</span>
                  <small>{[request.user.discipline, request.user.city, request.user.country].filter(Boolean).join(" · ") || "Profil à vérifier"}</small>
                  {request.motivation ? <p>{request.motivation}</p> : null}
                </div>
              </div>

              <div className="admin-member-badges">
                <StatusPill status={request.status === "PENDING" ? "PENDING" : request.status === "APPROVED" ? "ACTIVE" : "ARCHIVED"} label={accountEvolutionStatusLabel[request.status]} />
                {request.portfolioUrl ? <a href={request.portfolioUrl} target="_blank" rel="noreferrer">Portfolio</a> : null}
                {request.cvUrl ? <a href={request.cvUrl} target="_blank" rel="noreferrer">CV</a> : null}
              </div>

              {request.status === "PENDING" ? (
                <div className="admin-list-actions admin-member-actions">
                  <button type="button" onClick={() => onAccountEvolutionDecision(request, "APPROVED")} disabled={busyKey === `account-evolution-${request.id}-APPROVED`}>
                    <UserCheck aria-hidden="true" /> Accepter créateur
                  </button>
                  <button type="button" className="is-danger" onClick={() => onAccountEvolutionDecision(request, "REJECTED")} disabled={busyKey === `account-evolution-${request.id}-REJECTED`}>
                    <XCircle aria-hidden="true" /> Refuser
                  </button>
                </div>
              ) : null}
            </article>
          )) : <EmptyAdminState title="Aucune demande" text="Les demandes de passage créateur apparaîtront ici." />}
        </div>
      </div>

      <div className="admin-members-toolbar">
        <label className="admin-search-field">
          <Search aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un membre, email, ville..." />
        </label>
        <div className="admin-filter-pills" aria-label="Filtrer les membres par statut">
          {(["ALL", "ACTIVE", "PENDING", "SUSPENDED"] as const).map((status) => (
            <button
              key={status}
              type="button"
              className={statusFilter === status ? "is-active" : ""}
              onClick={() => setStatusFilter(status)}
            >
              {status === "ALL" ? "Tous" : memberStatusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-members-list">
        {filteredMembers.length ? filteredMembers.map((member) => (
          <article className="admin-member-row" key={member.id}>
            <div className="admin-member-identity">
              <div className="admin-list-avatar">
                <Avatar member={member} />
              </div>
              <div className="admin-member-copy">
                <strong>{member.displayName}</strong>
                <span>{accountTypeLabel(member.type)} · {member.email}</span>
                <small>{[member.discipline, member.city, member.country].filter(Boolean).join(" · ") || "Profil à compléter"}</small>
              </div>
            </div>

            <div className="admin-member-badges">
              <StatusPill status={member.status} label={memberStatusLabels[member.status]} />
              <span className={member.emailVerified ? "is-verified" : ""}>{member.emailVerified ? "E-mail vérifié" : "E-mail non vérifié"}</span>
              <span className={member.verifiedAt ? "is-verified" : ""}>{member.verifiedAt ? "Profil vérifié" : "Profil non vérifié"}</span>
            </div>

            <div className="admin-list-actions admin-member-actions">
              {member.memberNumber || member.type === "ORGANIZATION" || member.type === "PARTNER" ? (
                <button
                  type="button"
                  onClick={() => onVerification(member, !member.verifiedAt)}
                  disabled={busyKey === `member-${member.id}-verification`}
                >
                  <BadgeCheck aria-hidden="true" /> {member.verifiedAt ? "Retirer vérification" : "Vérifier le profil"}
                </button>
              ) : null}
              {member.type !== "ADMIN" ? (
                <button type="button" onClick={() => onGrantAdminAccess(member)} disabled={busyKey === `member-${member.id}-admin`}>
                  <ShieldCheck aria-hidden="true" /> Nommer admin
                </button>
              ) : null}
              {member.status !== "ACTIVE" ? (
                <button type="button" onClick={() => onStatus(member, "ACTIVE")} disabled={busyKey === `member-${member.id}-ACTIVE`}>
                  <UserCheck aria-hidden="true" /> Activer
                </button>
              ) : null}
              {member.status !== "SUSPENDED" ? (
                <button type="button" className="is-danger" onClick={() => onStatus(member, "SUSPENDED")} disabled={busyKey === `member-${member.id}-SUSPENDED`}>
                  <XCircle aria-hidden="true" /> Suspendre
                </button>
              ) : null}
            </div>
          </article>
        )) : <EmptyAdminState title="Aucun compte" text="Aucun membre ne correspond aux critères actuels." />}
      </div>
    </section>
  );
}

function CertificatesAdminPanel({
  members,
  form,
  busyKey,
  issuedCertificate,
  uploadingKey,
  onChange,
  onUpload,
  onSubmit,
}: {
  members: AdminMember[];
  form: CertificateFormState;
  busyKey: string | null;
  issuedCertificate: MemberCertificate | null;
  uploadingKey: string | null;
  onChange: (nextForm: CertificateFormState) => void;
  onUpload: (purpose: AdminUploadPurpose, file: File, key: string) => Promise<string>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const selectedMember = members.find((member) => member.id === form.userId) ?? null;
  const isSubmitting = busyKey === "certificate-issue";

  return (
    <section className="member-card admin-section admin-certificate-section">
      <SectionTitle
        icon={FileBadge}
        title="Certificats CCA"
        subtitle="Créer un certificat officiel CCA et l'attribuer à un apprenant ou créateur actif."
      />

      <div className="admin-certificate-layout">
        <form className="admin-certificate-form" onSubmit={onSubmit}>
          <div className="admin-form-intro">
            <h3>Nouveau certificat</h3>
            <p>Renseignez le bénéficiaire, le titre et les liens lorsque le document est prêt.</p>
          </div>

          <label>
            <span>Bénéficiaire</span>
            <select
              value={form.userId}
              onChange={(event) => onChange({ ...form, userId: event.target.value })}
              required
            >
              <option value="">Sélectionner un apprenant ou créateur</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.displayName} · {accountTypeLabel(member.type)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Titre du certificat</span>
            <input
              value={form.title}
              onChange={(event) => onChange({ ...form, title: event.target.value })}
              placeholder="Ex. Certificat atelier photographie CCA"
              required
            />
          </label>

          <fieldset className="admin-certificate-status">
            <legend>Statut</legend>
            <button
              type="button"
              className={form.status === "ISSUED" ? "is-active" : ""}
              onClick={() => onChange({ ...form, status: "ISSUED" })}
            >
              <CheckCircle2 aria-hidden="true" />
              <span>Délivrer maintenant</span>
            </button>
            <button
              type="button"
              className={form.status === "PENDING" ? "is-active" : ""}
              onClick={() => onChange({ ...form, status: "PENDING" })}
            >
              <Archive aria-hidden="true" />
              <span>Préparer seulement</span>
            </button>
          </fieldset>

          <AdminUploadField
            label="PDF du certificat"
            value={form.fileUrl}
            placeholder="https://..."
            purpose="certificate"
            uploadKey="certificate-pdf"
            uploadingKey={uploadingKey}
            accept="application/pdf"
            icon={FileText}
            onChange={(value) => onChange({ ...form, fileUrl: value })}
            onUpload={onUpload}
          />

          <AdminUploadField
            label="Badge"
            value={form.badgeUrl}
            placeholder="https://..."
            purpose="certificate"
            uploadKey="certificate-badge"
            uploadingKey={uploadingKey}
            accept="image/*"
            onChange={(value) => onChange({ ...form, badgeUrl: value })}
            onUpload={onUpload}
          />

          <button
            type="submit"
            className="member-primary-button"
            disabled={isSubmitting || !form.userId || !form.title.trim()}
          >
            {isSubmitting ? <Loader2 aria-hidden="true" /> : <FileBadge aria-hidden="true" />}
            Créer le certificat
          </button>
        </form>

        <aside className="admin-certificate-side">
          {selectedMember ? (
            <div className="admin-certificate-target">
              <div className="admin-list-avatar">
                <Avatar member={selectedMember} />
              </div>
              <div className="admin-certificate-target-copy">
                <strong>{selectedMember.displayName}</strong>
                <span>{accountTypeLabel(selectedMember.type)} · {selectedMember.email}</span>
                <small>{[selectedMember.discipline, selectedMember.city, selectedMember.country].filter(Boolean).join(" · ") || "Profil à compléter"}</small>
              </div>
            </div>
          ) : (
            <div className="admin-certificate-help">
              <FileBadge aria-hidden="true" />
              <h3>Choisissez un bénéficiaire</h3>
              <p>La liste affiche uniquement les apprenants et créateurs actifs. Les autres profils ne voient pas cet onglet tant que CCA ne certifie pas leurs contenus.</p>
            </div>
          )}

          {issuedCertificate ? (
            <div className="admin-certificate-issued">
              <CheckCircle2 aria-hidden="true" />
              <div>
                <p>Dernier certificat créé</p>
                <strong>{issuedCertificate.number}</strong>
                <small>{issuedCertificate.title} · {issuedCertificate.statusLabel}</small>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function ReferencesPanel({
  disciplines,
  partners,
  disciplineName,
  disciplineNumber,
  partnerForm,
  busyKey,
  uploadingKey,
  editingReferenceKey,
  onChangeDisciplineName,
  onChangeDisciplineNumber,
  onChangePartnerForm,
  onChangeEditingReferenceKey,
  onCreateDiscipline,
  onUpdateDiscipline,
  onDeleteDiscipline,
  onCreatePartner,
  onUpdatePartner,
  onDeletePartner,
  onUpload,
}: {
  disciplines: AdminDiscipline[];
  partners: AdminPartner[];
  disciplineName: string;
  disciplineNumber: number;
  partnerForm: PartnerPayload;
  busyKey: string | null;
  uploadingKey: string | null;
  editingReferenceKey: string | null;
  onChangeDisciplineName: (value: string) => void;
  onChangeDisciplineNumber: (value: number) => void;
  onChangePartnerForm: Dispatch<SetStateAction<PartnerPayload>>;
  onChangeEditingReferenceKey: (value: string | null) => void;
  onCreateDiscipline: () => void;
  onUpdateDiscipline: (discipline: AdminDiscipline, input: { name?: string; sortOrder?: number; isActive?: boolean }) => void;
  onDeleteDiscipline: (discipline: AdminDiscipline) => void;
  onCreatePartner: () => void;
  onUpdatePartner: (partner: AdminPartner, input: Partial<PartnerPayload>) => void;
  onDeletePartner: (partner: AdminPartner) => void;
  onUpload: (purpose: AdminUploadPurpose, file: File, key: string) => Promise<string>;
}) {
  const referencePageSize = 8;
  const [partnerPage, setPartnerPage] = useState(1);
  const [disciplinePage, setDisciplinePage] = useState(1);
  const activeDisciplines = disciplines.filter((discipline) => discipline.isActive).length;
  const publishedPartners = partners.filter((partner) => partner.published).length;
  const partnerPagination = paginateItems(partners, partnerPage, referencePageSize);
  const disciplinePagination = paginateItems(disciplines, disciplinePage, referencePageSize);

  useEffect(() => {
    setPartnerPage(1);
  }, [partners.length]);

  useEffect(() => {
    setDisciplinePage(1);
  }, [disciplines.length]);

  return (
    <section className="member-card admin-section admin-reference-section">
      <SectionTitle icon={BookOpen} title="Références" subtitle="Données administrables utilisées par le site public, les formulaires et l'espace membre." />

      <ReferenceBlockHeader
        eyebrow="Vitrine publique"
        title="Gestion des partenaires"
        text="Ajoutez les institutions, marques, médias et soutiens qui doivent apparaître sur le site public. Le statut publié contrôle leur visibilité sur la landing page."
      />

      <div className="admin-reference-layout">
        <div className="admin-reference-copy">
          <h3>{publishedPartners} partenaires publiés</h3>
          <p>Cette liste pourra alimenter la landing page via API, avec les logos statiques en secours.</p>
        </div>

        <div className="admin-reference-form admin-reference-form--partner">
          <label>
            <span>Nom du partenaire</span>
            <div>
              <Handshake aria-hidden="true" />
              <input
                value={partnerForm.name}
                onChange={(event) => onChangePartnerForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ex. Congo Resilience"
              />
            </div>
          </label>
          <label>
            <span>Type</span>
            <div>
              <Sparkles aria-hidden="true" />
              <input
                value={partnerForm.type}
                onChange={(event) => onChangePartnerForm((current) => ({ ...current, type: event.target.value }))}
                placeholder="Institution, média, sponsor..."
              />
            </div>
          </label>
          <AdminUploadField
            label="Logo"
            value={partnerForm.logoUrl ?? ""}
            placeholder="/assets/partners/transparent/logo.png"
            purpose="partner"
            uploadKey="partner-logo"
            uploadingKey={uploadingKey}
            accept="image/*"
            onChange={(value) => onChangePartnerForm((current) => ({ ...current, logoUrl: value }))}
            onUpload={onUpload}
          />
          <label>
            <span>Site web</span>
            <div>
              <Globe2 aria-hidden="true" />
              <input
                value={partnerForm.website}
                onChange={(event) => onChangePartnerForm((current) => ({ ...current, website: event.target.value }))}
                placeholder="https://..."
              />
            </div>
          </label>
          <label>
            <span>Numéro</span>
            <div>
              <FileText aria-hidden="true" />
              <input
                type="number"
                min={1}
                value={partnerForm.order}
                onChange={(event) => onChangePartnerForm((current) => ({ ...current, order: Number(event.target.value) }))}
              />
            </div>
          </label>
          <label className="admin-reference-toggle">
            <input
              type="checkbox"
              checked={partnerForm.published}
              onChange={(event) => onChangePartnerForm((current) => ({ ...current, published: event.target.checked }))}
            />
            <span>Publié sur le site</span>
          </label>
          <label className="admin-reference-textarea">
            <span>Description courte</span>
            <textarea
              value={partnerForm.description}
              onChange={(event) => onChangePartnerForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Rôle du partenaire dans l'écosystème Creative Currencies Africa."
            />
          </label>
          <button type="button" className="member-primary-button" onClick={onCreatePartner} disabled={!partnerForm.name.trim() || busyKey === "partner-create"}>
            <Plus aria-hidden="true" /> Ajouter le partenaire
          </button>
        </div>
      </div>

      <div className="admin-reference-list">
        <div className="admin-reference-list-header">
          <div className="admin-reference-list-copy">
            <h3>Partenaires landing page</h3>
            <p>Le statut publié décide ce qui sera exposé au site public.</p>
          </div>
          <span className="admin-reference-count">{partners.length} éléments</span>
        </div>

        <div className="admin-reference-table">
          {partnerPagination.items.map((partner) => (
            <PartnerReferenceRow
              key={partner.id}
              partner={partner}
              busyKey={busyKey}
              isEditing={editingReferenceKey === `partner-${partner.id}`}
              onEdit={() => onChangeEditingReferenceKey(`partner-${partner.id}`)}
              onCancel={() => onChangeEditingReferenceKey(null)}
              onUpdate={onUpdatePartner}
              onDelete={onDeletePartner}
              uploadingKey={uploadingKey}
              onUpload={onUpload}
            />
          ))}
        </div>
        <ReferencePagination
          label="partenaires"
          page={partnerPagination.page}
          pageCount={partnerPagination.pageCount}
          total={partners.length}
          pageSize={referencePageSize}
          onChange={setPartnerPage}
        />
      </div>

      <ReferenceBlockHeader
        eyebrow="Paramètres métier"
        title="Gestion des disciplines"
        text="Organisez les disciplines proposées aux créateurs, apprenants et organisations. Elles alimentent l'inscription, les profils, les publications et les filtres de recherche."
      />

      <div className="admin-reference-layout">
        <div className="admin-reference-copy">
          <h3>{activeDisciplines} disciplines actives</h3>
          <p>Ajoutez, corrigez, classez ou désactivez les disciplines sans modifier le code.</p>
        </div>

        <div className="admin-reference-form admin-reference-form--discipline">
          <label>
            <span>Ajouter une discipline</span>
            <div>
              <Search aria-hidden="true" />
              <input
                value={disciplineName}
                onChange={(event) => onChangeDisciplineName(event.target.value)}
                placeholder="Ex. Production culturelle"
              />
            </div>
          </label>
          <label>
            <span>Numéro</span>
            <div>
              <FileText aria-hidden="true" />
              <input
                type="number"
                min={1}
                value={disciplineNumber}
                onChange={(event) => onChangeDisciplineNumber(Number(event.target.value))}
              />
            </div>
          </label>
          <button type="button" className="member-primary-button" onClick={onCreateDiscipline} disabled={!disciplineName.trim() || busyKey === "discipline-create"}>
            <Plus aria-hidden="true" /> Ajouter
          </button>
        </div>
      </div>

      <div className="admin-reference-list">
        <div className="admin-reference-list-header">
          <div className="admin-reference-list-copy">
            <h3>Catalogue disciplines</h3>
            <p>Valeurs visibles côté inscription, Creative ID, publication et filtres.</p>
          </div>
          <span className="admin-reference-count">{disciplines.length} éléments</span>
        </div>

        <div className="admin-reference-table">
          {disciplinePagination.items.map((discipline) => (
            <DisciplineReferenceRow
              key={discipline.id}
              discipline={discipline}
              busyKey={busyKey}
              isEditing={editingReferenceKey === `discipline-${discipline.id}`}
              onEdit={() => onChangeEditingReferenceKey(`discipline-${discipline.id}`)}
              onCancel={() => onChangeEditingReferenceKey(null)}
              onUpdate={onUpdateDiscipline}
              onDelete={onDeleteDiscipline}
            />
          ))}
        </div>
        <ReferencePagination
          label="disciplines"
          page={disciplinePagination.page}
          pageCount={disciplinePagination.pageCount}
          total={disciplines.length}
          pageSize={referencePageSize}
          onChange={setDisciplinePage}
        />
      </div>
    </section>
  );
}

function ReferenceBlockHeader({ id, eyebrow, title, text }: { id?: string; eyebrow: string; title: string; text: string }) {
  return (
    <div className="admin-reference-block-header" id={id}>
      <span>{eyebrow}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function DisciplineReferenceRow({
  discipline,
  busyKey,
  isEditing,
  onEdit,
  onCancel,
  onUpdate,
  onDelete,
}: {
  discipline: AdminDiscipline;
  busyKey: string | null;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onUpdate: (discipline: AdminDiscipline, input: { name?: string; sortOrder?: number; isActive?: boolean }) => void;
  onDelete: (discipline: AdminDiscipline) => void;
}) {
  const [form, setForm] = useState({
    name: discipline.name,
    sortOrder: discipline.sortOrder,
    isActive: discipline.isActive,
  });

  useEffect(() => {
    setForm({
      name: discipline.name,
      sortOrder: discipline.sortOrder,
      isActive: discipline.isActive,
    });
  }, [discipline.id, discipline.name, discipline.sortOrder, discipline.isActive]);

  if (isEditing) {
    return (
      <article className="admin-reference-row is-editing">
        <div className="admin-reference-edit-grid">
          <label>
            <span>Discipline</span>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label>
            <span>Numéro</span>
            <input
              type="number"
              min={1}
              value={form.sortOrder}
              onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
            />
          </label>
          <label className="admin-reference-toggle">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
            />
            <span>Active</span>
          </label>
        </div>
        <div className="admin-reference-row-actions">
          <button type="button" onClick={() => onUpdate(discipline, form)} disabled={!form.name.trim() || busyKey === `discipline-${discipline.id}`}>
            <Edit3 aria-hidden="true" /> Enregistrer
          </button>
          <button type="button" onClick={onCancel}>
            <XCircle aria-hidden="true" /> Annuler
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="admin-reference-row">
      <div className="admin-reference-row-main">
        <strong>{discipline.name}</strong>
        <span>{discipline.slug} · numéro {discipline.sortOrder}</span>
      </div>
      <StatusPill status={discipline.isActive ? "ACTIVE" : "ARCHIVED"} label={discipline.isActive ? "Active" : "Inactive"} />
      <div className="admin-reference-row-actions">
        <button type="button" onClick={() => onUpdate(discipline, { isActive: !discipline.isActive })} disabled={busyKey === `discipline-${discipline.id}`}>
          {discipline.isActive ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          {discipline.isActive ? "Désactiver" : "Activer"}
        </button>
        <button type="button" onClick={onEdit}>
          <Edit3 aria-hidden="true" /> Modifier
        </button>
        <button type="button" className="is-danger" onClick={() => onDelete(discipline)} disabled={busyKey === `discipline-${discipline.id}-delete`}>
          <Trash2 aria-hidden="true" /> Supprimer
        </button>
      </div>
    </article>
  );
}

function PartnerReferenceRow({
  partner,
  busyKey,
  uploadingKey,
  isEditing,
  onEdit,
  onCancel,
  onUpdate,
  onDelete,
  onUpload,
}: {
  partner: AdminPartner;
  busyKey: string | null;
  uploadingKey: string | null;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onUpdate: (partner: AdminPartner, input: Partial<PartnerPayload>) => void;
  onDelete: (partner: AdminPartner) => void;
  onUpload: (purpose: AdminUploadPurpose, file: File, key: string) => Promise<string>;
}) {
  const [form, setForm] = useState<PartnerPayload>({
    name: partner.name,
    type: partner.type ?? "",
    description: partner.description ?? "",
    logoUrl: partner.logoUrl ?? "",
    website: partner.website ?? "",
    order: partner.order,
    published: partner.published,
  });

  useEffect(() => {
    setForm({
      name: partner.name,
      type: partner.type ?? "",
      description: partner.description ?? "",
      logoUrl: partner.logoUrl ?? "",
      website: partner.website ?? "",
      order: partner.order,
      published: partner.published,
    });
  }, [partner]);

  if (isEditing) {
    return (
      <article className="admin-reference-row is-editing">
        <div className="admin-reference-edit-grid admin-reference-edit-grid--partner">
          <label>
            <span>Nom</span>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label>
            <span>Type</span>
            <input value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} />
          </label>
          <AdminUploadField
            label="Logo"
            value={form.logoUrl ?? ""}
            purpose="partner"
            uploadKey={`partner-${partner.id}-logo`}
            uploadingKey={uploadingKey}
            accept="image/*"
            onChange={(value) => setForm((current) => ({ ...current, logoUrl: value }))}
            onUpload={onUpload}
          />
          <label>
            <span>Site web</span>
            <input value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} />
          </label>
          <label>
            <span>Numéro</span>
            <input type="number" min={1} value={form.order} onChange={(event) => setForm((current) => ({ ...current, order: Number(event.target.value) }))} />
          </label>
          <label className="admin-reference-toggle">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked }))}
            />
            <span>Publié</span>
          </label>
          <label className="admin-reference-textarea">
            <span>Description</span>
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </label>
        </div>
        <div className="admin-reference-row-actions">
          <button type="button" onClick={() => onUpdate(partner, form)} disabled={!form.name.trim() || busyKey === `partner-${partner.id}`}>
            <Edit3 aria-hidden="true" /> Enregistrer
          </button>
          <button type="button" onClick={onCancel}>
            <XCircle aria-hidden="true" /> Annuler
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="admin-reference-row">
      <div className="admin-reference-logo">
        {partner.logoUrl ? <img src={partner.logoUrl} alt="" loading="lazy" decoding="async" /> : <Handshake aria-hidden="true" />}
      </div>
      <div className="admin-reference-row-main">
        <strong>{partner.name}</strong>
        <span>{[partner.type, partner.website, `numéro ${partner.order}`].filter(Boolean).join(" · ")}</span>
        {partner.description ? <small>{partner.description}</small> : null}
      </div>
      <StatusPill status={partner.published ? "PUBLISHED" : "DRAFT"} label={partner.published ? "Publié" : "Masqué"} />
      <div className="admin-reference-row-actions">
        <button type="button" onClick={() => onUpdate(partner, { published: !partner.published })} disabled={busyKey === `partner-${partner.id}`}>
          {partner.published ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          {partner.published ? "Masquer" : "Publier"}
        </button>
        <button type="button" onClick={onEdit}>
          <Edit3 aria-hidden="true" /> Modifier
        </button>
        <button type="button" className="is-danger" onClick={() => onDelete(partner)} disabled={busyKey === `partner-${partner.id}-delete`}>
          <Trash2 aria-hidden="true" /> Supprimer
        </button>
      </div>
    </article>
  );
}

function AdminUploadField({
  label,
  value,
  placeholder = "https://...",
  purpose,
  uploadKey,
  uploadingKey,
  accept,
  icon: Icon = ImageIcon,
  onChange,
  onUpload,
}: {
  label: string;
  value: string;
  placeholder?: string;
  purpose: AdminUploadPurpose;
  uploadKey: string;
  uploadingKey: string | null;
  accept: string;
  icon?: LucideIcon;
  onChange: (value: string) => void;
  onUpload: (purpose: AdminUploadPurpose, file: File, key: string) => Promise<string>;
}) {
  const inputId = useId();
  const isUploading = uploadingKey === uploadKey;

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const url = await onUpload(purpose, file, uploadKey);
    onChange(url);
  }

  return (
    <div className="admin-upload-field">
      <span>{label}</span>
      <div className="admin-upload-control">
        <Icon aria-hidden="true" />
        <input aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
        <button
          type="button"
          className="admin-upload-action"
          onClick={(event) => {
            event.preventDefault();
            document.getElementById(inputId)?.click();
          }}
          disabled={isUploading}
        >
          {isUploading ? <Loader2 aria-hidden="true" /> : <Plus aria-hidden="true" />}
          <em>{isUploading ? "Import..." : "Importer"}</em>
        </button>
      </div>
      <input className="admin-upload-native-input" id={inputId} type="file" accept={accept} onChange={handleFileChange} disabled={isUploading} />
    </div>
  );
}

function ReferencePagination({
  label,
  page,
  pageCount,
  total,
  pageSize,
  onChange,
}: {
  label: string;
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  if (total <= pageSize) {
    return null;
  }

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="admin-reference-pagination">
      <span>
        {first}-{last} sur {total} {label}
      </span>
      <div>
        <button type="button" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1}>
          Précédent
        </button>
        <strong>{page} / {pageCount}</strong>
        <button type="button" onClick={() => onChange(Math.min(pageCount, page + 1))} disabled={page >= pageCount}>
          Suivant
        </button>
      </div>
    </div>
  );
}

function Avatar({ member }: { member: AdminMember }) {
  return member.avatarUrl ? (
    <img src={member.avatarUrl} alt="" loading="lazy" decoding="async" />
  ) : (
    <span>{buildInitials(member.displayName)}</span>
  );
}

function StatusPill({ status, label }: { status: string; label: string }) {
  const className = status === "PENDING" || status === "DRAFT"
    ? "is-pending"
    : status === "ACTIVE" || status === "PUBLISHED" || status === "REVIEWED"
      ? "is-active"
      : status === "SUSPENDED" || status === "REJECTED"
        ? "is-danger"
        : "";

  return <span className={`admin-status-pill ${className}`}>{label}</span>;
}

function EmptyAdminState({ title, text }: { title: string; text: string }) {
  return (
    <div className="admin-empty-state">
      <ShieldCheck aria-hidden="true" />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function matchesModerationFilters({
  createdAt,
  status,
  reason,
  searchable,
  statusFilter,
  reasonFilter,
  query,
  fromDate,
  toDate,
}: {
  createdAt: string;
  status: string;
  reason: string;
  searchable: Array<string | null | undefined>;
  statusFilter: string;
  reasonFilter: string;
  query: string;
  fromDate: string;
  toDate: string;
}) {
  if (statusFilter !== "ALL" && status !== statusFilter) {
    return false;
  }

  if (reasonFilter !== "ALL" && reason !== reasonFilter) {
    return false;
  }

  const reportDate = new Date(createdAt).getTime();

  if (fromDate && reportDate < new Date(fromDate).getTime()) {
    return false;
  }

  if (toDate) {
    const endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);
    if (reportDate > endDate.getTime()) {
      return false;
    }
  }

  if (!query) {
    return true;
  }

  return searchable.some((value) => value?.toLowerCase().includes(query));
}

function formatAuditAction(action: string) {
  const labels: Record<string, string> = {
    MESSAGE_DELETED: "Message supprimé",
    MESSAGE_REPORT_REVIEWED: "Signalement message traité",
    MESSAGE_REPORT_DISMISSED: "Signalement message classé",
    PUBLICATION_ARCHIVED: "Publication archivée",
    PUBLICATION_REJECTED: "Publication rejetée",
    PUBLICATION_REPORT_REVIEWED: "Signalement publication traité",
    PUBLICATION_REPORT_DISMISSED: "Signalement publication classé",
    MEMBER_ACTIVE: "Compte réactivé",
    MEMBER_SUSPENDED: "Compte suspendu",
    MEMBER_ARCHIVED: "Compte archivé",
    MEMBER_PENDING: "Compte remis en attente",
  };

  return labels[action] ?? action.replaceAll("_", " ").toLowerCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function normalizeAdminSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatDateRange(startsAt: string | null, endsAt: string | null) {
  if (!startsAt && !endsAt) {
    return null;
  }

  const start = startsAt ? formatDate(startsAt) : null;
  const end = endsAt ? formatDate(endsAt) : null;

  return start && end && start !== end ? `${start} - ${end}` : start ?? end;
}

function toDateTimeInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 16);
}

function toApiDateTime(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function normalizePartnerPayload(input: Partial<PartnerPayload>) {
  return Object.fromEntries(
    Object.entries(input)
      .map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
      .filter(([, value]) => value !== ""),
  ) as Partial<PartnerPayload>;
}

function normalizePartnerCreatePayload(input: PartnerPayload) {
  return {
    ...normalizePartnerPayload(input),
    name: input.name.trim(),
  } as PartnerPayload;
}

function normalizeTrainingPayload(input: Partial<TrainingPayload>) {
  const payload = normalizeContentPayload(input) as Partial<TrainingPayload>;

  if (input.startsAt !== undefined) {
    payload.startsAt = toApiDateTime(input.startsAt);
  }

  if (input.endsAt !== undefined) {
    payload.endsAt = toApiDateTime(input.endsAt);
  }

  return payload;
}

function normalizeTrainingCreatePayload(input: TrainingPayload) {
  return {
    ...normalizeTrainingPayload(input),
    title: input.title.trim(),
    description: input.description.trim(),
  } as TrainingPayload;
}

function normalizeEventPayload(input: Partial<EventPayload>) {
  const payload = normalizeContentPayload(input) as Partial<EventPayload>;

  if (input.startsAt !== undefined) {
    payload.startsAt = toApiDateTime(input.startsAt) ?? "";
  }

  if (input.endsAt !== undefined) {
    payload.endsAt = toApiDateTime(input.endsAt) ?? "";
  }

  return payload;
}

function normalizeEventCreatePayload(input: EventPayload) {
  return {
    ...normalizeEventPayload(input),
    title: input.title.trim(),
    description: input.description.trim(),
    location: input.location.trim(),
  } as EventPayload;
}

function normalizeResourcePayload(input: Partial<ResourcePayload>) {
  return normalizeContentPayload(input) as Partial<ResourcePayload>;
}

function normalizeResourceCreatePayload(input: ResourcePayload) {
  return {
    ...normalizeResourcePayload(input),
    title: input.title.trim(),
    url: input.url.trim(),
  } as ResourcePayload;
}

function normalizeOpportunityPayload(input: Partial<OpportunityPayload>) {
  const payload = normalizeContentPayload(input) as Partial<OpportunityPayload>;

  if (input.deadline !== undefined) {
    payload.deadline = toApiDateTime(input.deadline);
  }

  return payload;
}

function normalizeOpportunityCreatePayload(input: OpportunityPayload) {
  return {
    ...normalizeOpportunityPayload(input),
    title: input.title.trim(),
    description: input.description.trim(),
  } as OpportunityPayload;
}

function normalizeGalleryAlbumPayload(input: Partial<GalleryAlbumFormState>) {
  const payload = normalizeContentPayload(input) as Partial<GalleryAlbumPayload>;
  delete (payload as Partial<GalleryAlbumFormState>).photosText;

  return payload;
}

function normalizeGalleryAlbumCreatePayload(input: GalleryAlbumFormState) {
  const photos = (input.photosText ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((imageUrl, index) => ({
      imageUrl,
      sortOrder: index + 1,
      published: true,
    }));

  return {
    ...normalizeGalleryAlbumPayload(input),
    title: input.title.trim(),
    photos,
  } as GalleryAlbumPayload;
}

function normalizeContentPayload(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input)
      .map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
      .filter(([, value]) => value !== "" && value !== undefined),
  );
}

function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageCount,
  };
}

function downloadCsv(csv: string, filename: string) {
  if (typeof window === "undefined") {
    return;
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function csvHasRows(csv: string) {
  return csv.trim().split(/\r?\n/).length > 1;
}

function isNumberUsed<T extends { id: string }>(items: T[], key: keyof T, value: number, currentId?: string) {
  return items.some((item) => item.id !== currentId && Number(item[key]) === value);
}

function nextAvailableNumber(numbers: number[]) {
  const usedNumbers = new Set(numbers.filter((number) => number > 0));
  let candidate = 1;

  while (usedNumbers.has(candidate)) {
    candidate += 1;
  }

  return candidate;
}
