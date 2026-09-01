"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileBadge,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UsersRound,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  createReferenceDiscipline,
  getAdminMembers,
  getAdminOverview,
  getAdminPublications,
  getAdminReports,
  getApiErrorMessage,
  getReferenceDisciplines,
  grantAdminAccess,
  issueMemberCertificate,
  updateAdminMemberStatus,
  updateAdminPublicationStatus,
  updateAdminReport,
} from "@/lib/api";
import type {
  AdminMember,
  AdminOverviewResponse,
  AdminPublication,
  AdminReport,
  IssueCertificatePayload,
  MemberCertificate,
  PublicationReportReason,
  PublicationReportStatus,
  PublicationStatus,
  PublicationType,
} from "@/lib/api";
import { accountTypeLabel, buildInitials } from "@/lib/member-display";
import { useAppSelector } from "@/store/hooks";
import { MemberShell } from "./member-shell";

type AdminTab = "overview" | "moderation" | "publications" | "members" | "certificates" | "references";
type CertificateFormState = {
  userId: string;
  title: string;
  status: "ISSUED" | "PENDING";
  fileUrl: string;
  badgeUrl: string;
};

const tabs: Array<{ value: AdminTab; label: string }> = [
  { value: "overview", label: "Vue d'ensemble" },
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

const memberStatusLabels: Record<AdminMember["status"], string> = {
  PENDING: "En attente",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  ARCHIVED: "Archivé",
};

export function AdminPage() {
  const { accessToken, user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [publications, setPublications] = useState<AdminPublication[]>([]);
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [disciplineName, setDisciplineName] = useState("");
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
      const [overviewResponse, reportResponse, publicationResponse, memberResponse, disciplineResponse] = await Promise.all([
        getAdminOverview(accessToken),
        getAdminReports(accessToken, { limit: 30 }),
        getAdminPublications(accessToken, { limit: 40 }),
        getAdminMembers(accessToken, { limit: 40 }),
        getReferenceDisciplines(),
      ]);

      setOverview(overviewResponse);
      setReports(reportResponse.reports);
      setPublications(publicationResponse.publications);
      setMembers(memberResponse.members);
      setDisciplines(disciplineResponse);
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

  async function handleCreateDiscipline() {
    if (!accessToken || !disciplineName.trim()) {
      return;
    }

    setBusyKey("discipline-create");
    setNotice(null);
    setError(null);

    try {
      await createReferenceDiscipline(accessToken, { name: disciplineName.trim() });
      setDisciplineName("");
      const nextDisciplines = await getReferenceDisciplines();
      setDisciplines(nextDisciplines);
      setNotice("Discipline ajoutée.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "La discipline n'a pas pu être ajoutée."));
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
              <Link className="member-primary-button" href="/espace-membre/publier">
                <Plus aria-hidden="true" /> Alimenter
              </Link>
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
                  <div className="admin-action-grid">
                    <AdminQuickAction href="/espace-membre/publier?type=ANNOUNCEMENT" icon={Megaphone} title="Annonce officielle" text="Communication CCA visible dans le réseau." />
                    <AdminQuickAction href="/espace-membre/publier?type=TRAINING" icon={GraduationCap} title="Formation" text="Programme, atelier, masterclass ou session certifiante." />
                    <AdminQuickAction href="/espace-membre/publier?type=OPPORTUNITY" icon={Lightbulb} title="Opportunité" text="Appel, mission, résidence, financement ou emploi." />
                    <AdminQuickAction href="/espace-membre/publier?type=EVENT" icon={CalendarDays} title="Événement" text="Rencontre, exposition, panel ou activation datée." />
                    <AdminQuickAction href="/espace-membre/publier?type=RESOURCE" icon={BookOpen} title="Ressource" text="Guide, PDF, modèle, replay ou document utile." />
                    <AdminQuickAction href="/espace-membre/publier?type=PROJECT" icon={Sparkles} title="Projet CCA" text="Initiative, campagne, production ou programme porté par CCA." />
                    <AdminQuickButton icon={FileBadge} title="Certificat CCA" text="Créer et attribuer un certificat officiel." onClick={() => setActiveTab("certificates")} />
                  </div>
                </section>

                <ReportsPanel reports={visibleReports} busyKey={busyKey} onAction={handleReportAction} compact />
                <PublicationsPanel publications={visiblePublications} busyKey={busyKey} onStatus={handlePublicationStatus} compact />
              </div>
            ) : null}

            {activeTab === "moderation" ? (
              <ReportsPanel reports={visibleReports} busyKey={busyKey} onAction={handleReportAction} />
            ) : null}

            {activeTab === "publications" ? (
              <PublicationsPanel publications={visiblePublications} busyKey={busyKey} onStatus={handlePublicationStatus} />
            ) : null}

            {activeTab === "members" ? (
              <MembersPanel members={visibleMembers} busyKey={busyKey} onStatus={handleMemberStatus} onGrantAdminAccess={handleGrantAdminAccess} />
            ) : null}

            {activeTab === "certificates" ? (
              <CertificatesAdminPanel
                members={certificateTargets}
                form={certificateForm}
                busyKey={busyKey}
                issuedCertificate={issuedCertificate}
                onChange={setCertificateForm}
                onSubmit={handleIssueCertificate}
              />
            ) : null}

            {activeTab === "references" ? (
              <ReferencesPanel
                disciplines={disciplines}
                disciplineName={disciplineName}
                busyKey={busyKey}
                onChangeDisciplineName={setDisciplineName}
                onCreateDiscipline={handleCreateDiscipline}
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

function AdminQuickButton({ icon: Icon, title, text, onClick }: { icon: LucideIcon; title: string; text: string; onClick: () => void }) {
  return (
    <button type="button" className="admin-quick-action" onClick={onClick}>
      <Icon aria-hidden="true" />
      <strong>{title}</strong>
      <span>{text}</span>
    </button>
  );
}

function ReportsPanel({
  reports,
  busyKey,
  onAction,
  compact = false,
}: {
  reports: AdminReport[];
  busyKey: string | null;
  onAction: (report: AdminReport, input: { status?: Exclude<PublicationReportStatus, "PENDING">; publicationStatus?: Exclude<PublicationStatus, "DRAFT"> }) => void;
  compact?: boolean;
}) {
  return (
    <section className="member-card admin-section">
      <SectionTitle icon={AlertTriangle} title="Modération" subtitle="Signalements envoyés par les membres." />
      <div className="admin-list">
        {reports.length ? reports.map((report) => (
          <article className="admin-list-item" key={report.id}>
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
              <small>{publicationTypeLabels[report.publication.type]} · {accountTypeLabel(report.publication.author.type)} · {formatDate(report.createdAt)}</small>
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
            </div>
          </article>
        )) : <EmptyAdminState title="Aucun signalement" text="La file de modération est vide pour le moment." />}
      </div>
    </section>
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
  busyKey,
  onStatus,
  onGrantAdminAccess,
}: {
  members: AdminMember[];
  busyKey: string | null;
  onStatus: (member: AdminMember, status: AdminMember["status"]) => void;
  onGrantAdminAccess: (member: AdminMember) => void;
}) {
  return (
    <section className="member-card admin-section">
      <SectionTitle icon={UsersRound} title="Membres" subtitle="Comptes inscrits et statut d'accès." />
      <div className="admin-list">
        {members.length ? members.map((member) => (
          <article className="admin-list-item" key={member.id}>
            <div className="admin-list-avatar">
              <Avatar member={member} />
            </div>
            <div className="admin-list-body">
              <div className="admin-list-heading">
                <div>
                  <strong>{member.displayName}</strong>
                  <span>{accountTypeLabel(member.type)} · {member.email}</span>
                </div>
                <StatusPill status={member.status} label={memberStatusLabels[member.status]} />
              </div>
              <small>{[member.discipline, member.city, member.country].filter(Boolean).join(" · ") || "Profil à compléter"} · {member.emailVerified ? "E-mail vérifié" : "E-mail non vérifié"}</small>
            </div>
            <div className="admin-list-actions">
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
  onChange,
  onSubmit,
}: {
  members: AdminMember[];
  form: CertificateFormState;
  busyKey: string | null;
  issuedCertificate: MemberCertificate | null;
  onChange: (nextForm: CertificateFormState) => void;
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

          <label>
            <span>Statut</span>
            <select
              value={form.status}
              onChange={(event) => onChange({ ...form, status: event.target.value as CertificateFormState["status"] })}
            >
              <option value="ISSUED">Délivrer maintenant</option>
              <option value="PENDING">Préparer seulement</option>
            </select>
          </label>

          <label>
            <span>Lien PDF du certificat</span>
            <input
              type="url"
              value={form.fileUrl}
              onChange={(event) => onChange({ ...form, fileUrl: event.target.value })}
              placeholder="https://..."
            />
          </label>

          <label>
            <span>Lien du badge</span>
            <input
              type="url"
              value={form.badgeUrl}
              onChange={(event) => onChange({ ...form, badgeUrl: event.target.value })}
              placeholder="https://..."
            />
          </label>

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
              <div>
                <strong>{selectedMember.displayName}</strong>
                <span>{accountTypeLabel(selectedMember.type)} · {selectedMember.email}</span>
                <small>{[selectedMember.discipline, selectedMember.city, selectedMember.country].filter(Boolean).join(" · ") || "Profil à compléter"}</small>
              </div>
            </div>
          ) : (
            <div className="admin-certificate-help">
              <FileBadge aria-hidden="true" />
              <strong>Choisissez un bénéficiaire</strong>
              <span>La liste affiche uniquement les apprenants et créateurs actifs, car ce sont les profils qui peuvent recevoir les certificats CCA.</span>
            </div>
          )}

          {issuedCertificate ? (
            <div className="admin-certificate-issued">
              <CheckCircle2 aria-hidden="true" />
              <div>
                <span>Dernier certificat créé</span>
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
  disciplineName,
  busyKey,
  onChangeDisciplineName,
  onCreateDiscipline,
}: {
  disciplines: string[];
  disciplineName: string;
  busyKey: string | null;
  onChangeDisciplineName: (value: string) => void;
  onCreateDiscipline: () => void;
}) {
  return (
    <section className="member-card admin-section">
      <SectionTitle icon={BookOpen} title="Références" subtitle="Données utilisées dans les formulaires et filtres." />
      <div className="admin-reference-form">
        <label>
          <span>Nouvelle discipline</span>
          <div>
            <Search aria-hidden="true" />
            <input
              value={disciplineName}
              onChange={(event) => onChangeDisciplineName(event.target.value)}
              placeholder="Ex. Production culturelle"
            />
          </div>
        </label>
        <button type="button" className="member-primary-button" onClick={onCreateDiscipline} disabled={!disciplineName.trim() || busyKey === "discipline-create"}>
          <Plus aria-hidden="true" /> Ajouter
        </button>
      </div>
      <div className="admin-discipline-grid">
        {disciplines.map((discipline) => (
          <span key={discipline}>{discipline}</span>
        ))}
      </div>
    </section>
  );
}

function Avatar({ member }: { member: AdminMember }) {
  return member.avatarUrl ? (
    <img src={member.avatarUrl} alt="" />
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
