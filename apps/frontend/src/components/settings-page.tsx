"use client";

import { FormEvent, useEffect, useState } from "react";
import type { ChangeEvent, ComponentType, FocusEvent, KeyboardEvent, ReactNode } from "react";
import {
  AtSign,
  Bell,
  ChevronDown,
  Eye,
  FileText,
  Globe2,
  Languages,
  Link2,
  LockKeyhole,
  MapPin,
  Palette,
  Phone,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  Workflow,
  X,
} from "lucide-react";
import { MemberShell } from "@/components/member-shell";
import { useReferenceDisciplines } from "@/hooks/use-reference-disciplines";
import {
  changePassword,
  getApiErrorMessage,
  getMemberAccountEvolution,
  getNotificationPreferences,
  requestMemberAccountEvolution,
  updateMemberProfile,
  updateNotificationPreferences,
  uploadProfileAsset,
} from "@/lib/api";
import type {
  AccountEvolutionRequest,
  AuthMeResponse,
  AuthUser,
  MemberAccountEvolutionResponse,
  MemberNotificationPreference,
  MemberProfile,
  NotificationFrequency,
  NotificationType,
  OrganizationProfile,
  PartnerProfile,
  UploadProfileAssetKind,
} from "@/lib/api";
import { buildInitials, getMemberDisplayName } from "@/lib/member-display";
import {
  formatCustomLanguage,
  normalizeProfileOption,
  profileLanguageOptions,
} from "@/lib/profile-options";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCurrentMember } from "@/store/slices/auth-slice";

type SettingsForm = {
  firstName: string;
  lastName: string;
  phone: string;
  publicName: string;
  country: string;
  city: string;
  profession: string;
  birthDate: string;
  gender: string;
  discipline: string;
  otherDiscipline: string;
  bio: string;
  portfolioUrl: string;
  websiteUrl: string;
  avatarUrl: string;
  cvUrl: string;
  organizationLogoUrl: string;
  partnerLogoUrl: string;
  skills: string;
  languages: string;
  availability: string;
  visibility: "PRIVATE" | "MEMBERS" | "PUBLIC";
  organizationName: string;
  organizationLegalName: string;
  organizationSector: string;
  organizationDescription: string;
  partnerName: string;
  partnerType: string;
  partnerDescription: string;
};

type ProfileEditorProps = {
  accessToken: string | null;
  user: AuthUser | null;
  profile: MemberProfile | null;
  organizationProfile: OrganizationProfile | null;
  partnerProfile: PartnerProfile | null;
  initialForm: SettingsForm;
};

type SettingsTabId = "profile" | "account" | "journey" | "security" | "notifications" | "privacy" | "accessibility" | "activity";

const settingsTabs: Array<{ id: SettingsTabId; label: string; icon: ComponentType<{ "aria-hidden"?: boolean; strokeWidth?: number }> }> = [
  { id: "profile", label: "Profil", icon: UserRound },
  { id: "account", label: "Compte", icon: AtSign },
  { id: "journey", label: "Parcours", icon: Workflow },
  { id: "security", label: "Sécurité", icon: LockKeyhole },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Confidentialité", icon: Eye },
  { id: "accessibility", label: "Accessibilité", icon: Sparkles },
  { id: "activity", label: "Activité", icon: FileText },
];

const notificationLabels: Record<NotificationType, { title: string; text: string }> = {
  SYSTEM: {
    title: "Informations importantes",
    text: "Sécurité, compte, annonces officielles et décisions CCA.",
  },
  TRAINING: {
    title: "Formations",
    text: "Workshops, masterclass, rappels, inscriptions et certificats liés.",
  },
  OPPORTUNITY: {
    title: "Opportunités",
    text: "Appels à projets, missions, résidences, financements et concours.",
  },
  CERTIFICATE: {
    title: "Certificats",
    text: "Badges, attestations et documents disponibles dans votre parcours.",
  },
  MESSAGE: {
    title: "Messages privés",
    text: "Conversations, réponses, collaborations et nouvelles mises en relation.",
  },
};

const privacySettings = [
  { title: "Creative ID visible", text: "Afficher votre profil dans l’espace membre CCA.", icon: Eye, enabled: true },
  { title: "Recommandations partenaires", text: "Autoriser CCA à recommander votre profil aux partenaires pertinents.", icon: Eye, enabled: true },
  { title: "Visibilité internationale", text: "Inclure votre profil dans les recherches hors RDC.", icon: Globe2, enabled: false },
];

const accessibilitySettings = [
  { title: "Contraste renforcé", text: "Améliorer la lisibilité des textes et bordures.", icon: Sparkles, enabled: false },
  { title: "Réduire les animations", text: "Limiter les mouvements visuels dans l’espace membre.", icon: Sparkles, enabled: false },
  { title: "Interface compacte", text: "Afficher plus d’informations à l’écran.", icon: Sparkles, enabled: false },
];

export function SettingsPage() {
  const { accessToken, user, profile, organizationProfile, partnerProfile } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<SettingsTabId>("profile");
  const displayName = getMemberDisplayName({ user, profile, organizationProfile, partnerProfile });
  const initialForm = buildSettingsForm({ user, profile, organizationProfile, partnerProfile });
  const formKey = JSON.stringify(initialForm);
  const activeTabLabel = settingsTabs.find((tab) => tab.id === activeTab)?.label ?? "Profil";
  const initials = buildInitials(displayName);
  const accountAvatarUrl = profile?.avatarUrl ?? organizationProfile?.logoUrl ?? partnerProfile?.logoUrl ?? user?.avatarUrl ?? "";
  const profileCompletion = profile?.profileCompletion ?? 0;

  const openPasswordSection = () => {
    setActiveTab("security");
    window.requestAnimationFrame(() => {
      document.getElementById("changer-mot-de-passe")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <MemberShell activeItem="Paramètres">
      <div className="member-module-layout settings-module-layout">
        <section className="member-module-hero settings-hero">
          <div>
            <span className="member-kicker">Paramètres</span>
            <h1>Centre de paramètres</h1>
            <p>Gérez votre profil, votre sécurité, vos préférences et la confidentialité de votre espace membre.</p>
          </div>
          <div className="settings-security-card">
            <ShieldCheck aria-hidden="true" strokeWidth={1.8} />
            <strong>{user?.emailVerified ? "Compte vérifié" : "Vérification requise"}</strong>
            <span>{user?.emailVerified ? "E-mail vérifié" : "E-mail à vérifier"} · {displayName}</span>
          </div>
        </section>

        <div className="member-module-grid settings-module-grid">
          <section className="member-module-main">
            <section className="member-card settings-hub-card">
              <nav className="settings-tabs" aria-label="Sections des paramètres">
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon;

                  return (
                    <button
                      key={tab.id}
                      className={tab.id === activeTab ? "is-active" : undefined}
                      type="button"
                      aria-pressed={tab.id === activeTab}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <Icon aria-hidden={true} strokeWidth={1.8} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </section>

            {activeTab === "profile" ? (
              <SettingsProfileEditor
                key={formKey}
                accessToken={accessToken}
                user={user}
                profile={profile}
                organizationProfile={organizationProfile}
                partnerProfile={partnerProfile}
                initialForm={initialForm}
              />
            ) : null}

            {activeTab === "account" ? <SettingsAccountPanel user={user} displayName={displayName} /> : null}
            {activeTab === "journey" ? <SettingsJourneyPanel accessToken={accessToken} user={user} profile={profile} /> : null}
            {activeTab === "security" ? <SettingsSecurityPanel accessToken={accessToken} user={user} /> : null}
            {activeTab === "notifications" ? <SettingsNotificationPanel accessToken={accessToken} /> : null}
            {activeTab === "privacy" ? <SettingsTogglePanel title="Confidentialité" items={privacySettings} /> : null}
            {activeTab === "accessibility" ? <SettingsAccessibilityPanel /> : null}
            {activeTab === "activity" ? <SettingsActivityPanel user={user} profile={profile} /> : null}
          </section>

          <aside className="member-module-side settings-module-side">
            <section className="member-card settings-profile-summary-card">
              <div className="settings-summary-avatar">
                {accountAvatarUrl ? <img src={accountAvatarUrl} alt="" loading="lazy" decoding="async" /> : initials}
              </div>
              <div>
                <span>Connecté en tant que</span>
                <strong>{displayName}</strong>
                <small>{accountTypeName(user?.type)}</small>
              </div>
              <dl>
                <div>
                  <dt>E-mail</dt>
                  <dd>{user?.emailVerified ? "Vérifié" : "À vérifier"}</dd>
                </div>
                <div>
                  <dt>Section</dt>
                  <dd>{activeTabLabel}</dd>
                </div>
                {profile ? (
                  <div>
                    <dt>Creative ID</dt>
                    <dd>{profileCompletion}%</dd>
                  </div>
                ) : null}
              </dl>
            </section>
            <section className="member-card certificate-lock-card">
              <LockKeyhole aria-hidden="true" strokeWidth={1.8} />
              <strong>Sécurité</strong>
              <p>Changez votre mot de passe depuis votre session active, avec confirmation du mot de passe actuel.</p>
              <button className="member-secondary-button" type="button" onClick={openPasswordSection}>
                Changer le mot de passe
              </button>
            </section>
          </aside>
        </div>
      </div>
    </MemberShell>
  );
}

function SettingsAccountPanel({ user, displayName }: { user: AuthUser | null; displayName: string }) {
  return (
    <section className="member-card settings-panel">
      <div className="member-card-title">
        <div>
          <h2>Compte</h2>
          <p>Identité de connexion et statut du compte membre.</p>
        </div>
      </div>
      <div className="settings-field-grid">
        <SettingsInfo icon={UserRound} label="Nom affiché" value={displayName} />
        <SettingsInfo icon={AtSign} label="Adresse e-mail" value={user?.email ?? "Non renseignée"} />
        <SettingsInfo icon={ShieldCheck} label="Vérification e-mail" value={user?.emailVerified ? "Vérifié" : "À vérifier"} />
        <SettingsInfo icon={Sparkles} label="Type de compte" value={accountTypeName(user?.type)} />
        <SettingsInfo icon={Eye} label="Statut" value={accountStatusName(user?.status)} />
        <SettingsInfo icon={Phone} label="Téléphone" value={user?.phone ?? "Non renseigné"} />
      </div>
    </section>
  );
}

function SettingsJourneyPanel({ accessToken, user, profile }: { accessToken: string | null; user: AuthUser | null; profile: MemberProfile | null }) {
  const [evolution, setEvolution] = useState<MemberAccountEvolutionResponse | null>(null);
  const [motivation, setMotivation] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.portfolioUrl ?? "");
  const [cvUrl, setCvUrl] = useState(profile?.cvUrl ?? "");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    if (!accessToken) {
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    getMemberAccountEvolution(accessToken)
      .then((response) => {
        if (isMounted) {
          setEvolution(response);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getApiErrorMessage(requestError, "Le parcours n'a pas pu être chargé."));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  const hasPendingCreatorRequest = evolution?.requests.some((request) => (
    request.requestedType === "CREATOR" && request.status === "PENDING"
  )) ?? false;
  const canRequestCreator = evolution?.availableTargets.some((target) => target.type === "CREATOR" && target.mode === "request") ?? false;
  const hasAutomaticLearner = evolution?.availableTargets.some((target) => target.type === "LEARNER" && target.mode === "automatic_training") ?? false;
  const accountType = evolution?.accountType ?? user?.type ?? "";
  const isPublic = accountType === "PUBLIC";
  const isLearner = accountType === "LEARNER";
  const isCreator = accountType === "CREATOR";
  const isStructure = accountType === "ORGANIZATION" || accountType === "PARTNER";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken || !canRequestCreator || hasPendingCreatorRequest) {
      return;
    }

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await requestMemberAccountEvolution(accessToken, {
        requestedType: "CREATOR",
        motivation,
        portfolioUrl,
        cvUrl,
      });
      const refreshed = await getMemberAccountEvolution(accessToken);
      setEvolution(refreshed);
      setMotivation("");
      setMessage(response.message);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "La demande n'a pas pu être envoyée."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="member-card settings-panel settings-journey-panel">
      <div className="member-card-title">
        <div>
          <h2>Parcours</h2>
          <p>{journeyIntroText(accountType)}</p>
        </div>
      </div>

      {isLoading ? <p className="settings-muted">Chargement du parcours...</p> : null}
      {error ? <p className="settings-form-error">{error}</p> : null}
      {message ? <p className="settings-form-success">{message}</p> : null}

      <div className="settings-journey-stack">
        <article className="settings-journey-status-card">
          <span className="settings-journey-status-icon">
            <Sparkles aria-hidden="true" strokeWidth={1.8} />
          </span>
          <div>
            <span>Statut actuel</span>
            <strong>{accountTypeName(accountType)}</strong>
            <p>{journeyCurrentText(accountType)}</p>
          </div>
        </article>

        {isPublic && hasAutomaticLearner ? (
          <div className="settings-note-card settings-journey-action-card">
            <strong>Prochaine étape : devenir apprenant</strong>
            <p>Inscrivez-vous à une formation CCA pour activer automatiquement votre parcours apprenant.</p>
            <a className="member-secondary-button" href="/espace-membre/formations">Voir les formations</a>
          </div>
        ) : null}

        {canRequestCreator ? (
          <form className="settings-journey-form" onSubmit={handleSubmit}>
            <div className="member-card-title">
              <div>
                <h3>{isLearner ? "Prochaine étape : passer créateur" : "Demander un profil créateur"}</h3>
                <p>{isLearner ? "Lorsque votre démarche et votre portfolio sont prêts, CCA peut valider votre profil créateur." : "Si vous avez déjà une pratique créative claire, vous pouvez demander une validation CCA."}</p>
              </div>
            </div>
            <div className="settings-field-grid">
              <SettingsInput label="Portfolio" icon={Link2} value={portfolioUrl} onChange={(event) => setPortfolioUrl(event.target.value)} placeholder="https://..." />
              <SettingsInput label="CV ou dossier" icon={FileText} value={cvUrl} onChange={(event) => setCvUrl(event.target.value)} placeholder="https://..." />
            </div>
            <SettingsTextarea
              label="Motivation"
              value={motivation}
              onChange={(event) => setMotivation(event.target.value)}
              placeholder="Expliquez votre discipline, votre démarche et pourquoi votre profil doit être validé comme créateur."
            />
            <button className="settings-save-button" type="submit" disabled={isSaving || hasPendingCreatorRequest}>
              <ShieldCheck aria-hidden="true" strokeWidth={1.8} />
              {hasPendingCreatorRequest ? "Demande en attente" : isSaving ? "Envoi..." : "Envoyer la demande"}
            </button>
          </form>
        ) : null}

        {isCreator ? (
          <div className="settings-note-card settings-journey-action-card">
            <strong>Profil créateur actif</strong>
            <p>Votre prochaine priorité est de maintenir votre Creative ID, votre portfolio et vos disponibilités à jour.</p>
            <a className="member-secondary-button" href="/espace-membre/creative-id">Mettre à jour le Creative ID</a>
          </div>
        ) : null}

        {isStructure ? (
          <div className="settings-note-card settings-journey-action-card">
            <strong>Compte structure actif</strong>
            <p>Votre parcours se concentre sur les opportunités, les collaborations et la visibilité de votre structure.</p>
          </div>
        ) : null}

        {evolution?.requests.length ? <AccountEvolutionHistory requests={evolution.requests} /> : null}
      </div>
    </section>
  );
}

function AccountEvolutionHistory({ requests }: { requests: AccountEvolutionRequest[] }) {
  return (
    <div className="settings-note-card">
      <strong>Historique des demandes</strong>
      {requests.length ? (
        <div className="settings-history-list">
          {requests.map((request) => (
            <article key={request.id}>
              <div>
                <span>{accountTypeName(request.fromType)} vers {accountTypeName(request.requestedType)}</span>
                <small>{new Date(request.createdAt).toLocaleDateString("fr-FR")}</small>
              </div>
              <strong>{accountEvolutionStatusName(request.status)}</strong>
              {request.note ? <p>{request.note}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        <p>Aucune demande de changement de parcours pour le moment.</p>
      )}
    </div>
  );
}

function SettingsSecurityPanel({ accessToken, user }: { accessToken: string | null; user: AuthUser | null }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const updateCurrentPassword = (event: ChangeEvent<HTMLInputElement>) => {
    setCurrentPassword(event.target.value);
    setMessage("");
    setError("");
  };

  const updateNewPassword = (event: ChangeEvent<HTMLInputElement>) => {
    setNewPassword(event.target.value);
    setMessage("");
    setError("");
  };

  const updateConfirmPassword = (event: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(event.target.value);
    setMessage("");
    setError("");
  };

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!accessToken) {
      setError("Votre connexion a expiré. Connectez-vous à nouveau.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await changePassword(accessToken, { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage(response.message);
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de changer le mot de passe pour le moment."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="member-card settings-panel" onSubmit={submitPassword}>
      <div className="member-card-title">
        <div>
          <h2>Sécurité</h2>
          <p>Accès, mot de passe et protection du compte.</p>
        </div>
      </div>
      <div className="settings-field-grid">
        <SettingsInfo icon={AtSign} label="E-mail du compte" value={user?.email ?? "Non renseignée"} />
        <SettingsInfo icon={ShieldCheck} label="État" value={user?.emailVerified ? "E-mail vérifié" : "E-mail à vérifier"} />
        <SettingsInfo icon={LockKeyhole} label="Connexion" value="Mot de passe actif" />
      </div>

      <div className="settings-section-title settings-password-section-title" id="changer-mot-de-passe">
        <LockKeyhole aria-hidden="true" strokeWidth={1.8} />
        <span>Changer le mot de passe</span>
        <strong>Session active</strong>
      </div>

      <div className="settings-form-grid">
        <SettingsInput label="Mot de passe actuel" icon={LockKeyhole} type="password" value={currentPassword} onChange={updateCurrentPassword} autoComplete="current-password" placeholder="Entrez votre mot de passe actuel" required />
        <SettingsInput label="Nouveau mot de passe" icon={LockKeyhole} type="password" value={newPassword} onChange={updateNewPassword} autoComplete="new-password" placeholder="Choisissez un nouveau mot de passe" required />
        <SettingsInput label="Confirmer le nouveau mot de passe" icon={LockKeyhole} type="password" value={confirmPassword} onChange={updateConfirmPassword} autoComplete="new-password" placeholder="Répétez le nouveau mot de passe" required wide />
      </div>
      <div className="settings-form-actions">
        <button className="settings-save-button" type="submit" disabled={isSaving}>
          <LockKeyhole aria-hidden="true" strokeWidth={1.8} />
          {isSaving ? "Mise à jour..." : "Enregistrer le nouveau mot de passe"}
        </button>
      </div>
      <div className="settings-note-card">
        <strong>Règle de sécurité</strong>
        <p>Le mot de passe oublié reste volontairement neutre : il ne confirme jamais si une adresse e-mail existe. Ici, le changement se fait uniquement avec votre session active et votre mot de passe actuel.</p>
      </div>
      {message ? <p className="auth-form-success">{message}</p> : null}
      {error ? <p className="auth-form-error" role="alert">{error}</p> : null}
    </form>
  );
}

function SettingsTogglePanel({
  title,
  items,
}: {
  title: string;
  items: Array<{ title: string; text: string; icon: ComponentType<{ "aria-hidden"?: boolean; strokeWidth?: number }>; enabled: boolean }>;
}) {
  return (
    <section className="member-card settings-panel">
      <div className="member-card-title">
        <div>
          <h2>{title}</h2>
          <p>Choisissez les réglages adaptés à votre expérience CCA.</p>
        </div>
      </div>
      <div className="settings-preference-list">
        {items.map((item) => (
          <SettingsToggle key={item.title} {...item} />
        ))}
      </div>
    </section>
  );
}

function SettingsNotificationPanel({ accessToken }: { accessToken: string | null }) {
  const [preferences, setPreferences] = useState<MemberNotificationPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    if (!accessToken) {
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    getNotificationPreferences(accessToken)
      .then((items) => {
        if (isMounted) {
          setPreferences(sortNotificationPreferences(items));
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(getApiErrorMessage(err, "Impossible de charger les préférences de notifications."));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  async function savePreference(nextPreference: MemberNotificationPreference) {
    if (!accessToken) {
      setError("Connectez-vous pour modifier vos notifications.");
      return;
    }

    const nextPreferences = preferences.map((preference) =>
      preference.type === nextPreference.type ? nextPreference : preference,
    );

    setPreferences(nextPreferences);
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const saved = await updateNotificationPreferences(accessToken, nextPreferences.map(toNotificationPreferencePayload));
      setPreferences(sortNotificationPreferences(saved));
      setMessage("Préférences mises à jour.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de sauvegarder ces préférences."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="member-card settings-panel">
      <div className="member-card-title">
        <div>
          <h2>Notifications</h2>
          <p>Choisissez les alertes utiles à votre parcours CCA et les canaux à préparer.</p>
        </div>
      </div>

      {error ? <p className="auth-form-error">{error}</p> : null}
      {message ? <p className="auth-form-success">{message}</p> : null}

      {isLoading ? (
        <div className="settings-empty-state">Chargement des préférences...</div>
      ) : (
        <div className="settings-notification-list" aria-busy={isSaving}>
          {preferences.map((preference) => {
            const label = notificationLabels[preference.type];

            return (
              <article key={preference.type} className="settings-notification-item">
                <Bell aria-hidden="true" strokeWidth={1.8} />
                <div>
                  <strong>{label.title}</strong>
                  <span>{label.text}</span>
                </div>
                <div className="settings-notification-controls">
                  <NotificationSwitch
                    label="Plateforme"
                    enabled={preference.platform}
                    onToggle={() => savePreference({ ...preference, platform: !preference.platform })}
                  />
                  <NotificationSwitch
                    label="E-mail"
                    enabled={preference.email}
                    onToggle={() => savePreference({ ...preference, email: !preference.email })}
                  />
                  <NotificationSwitch
                    label="WhatsApp"
                    enabled={preference.whatsapp}
                    onToggle={() => savePreference({ ...preference, whatsapp: !preference.whatsapp })}
                  />
                  <NotificationSwitch
                    label="Push"
                    enabled={preference.push}
                    onToggle={() => savePreference({ ...preference, push: !preference.push })}
                  />
                  <label>
                    <span>Fréquence</span>
                    <select
                      value={preference.frequency}
                      onChange={(event) => savePreference({ ...preference, frequency: event.target.value as NotificationFrequency })}
                    >
                      <option value="IMMEDIATE">Immédiat</option>
                      <option value="DAILY">Résumé quotidien</option>
                      <option value="WEEKLY">Résumé hebdomadaire</option>
                      <option value="DISABLED">Désactivé</option>
                    </select>
                  </label>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function NotificationSwitch({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button className={enabled ? "is-enabled" : undefined} type="button" aria-pressed={enabled} onClick={onToggle}>
      {label}
      <span>{enabled ? "Actif" : "Off"}</span>
    </button>
  );
}

function SettingsAccessibilityPanel() {
  const [textSize, setTextSize] = useState("normal");

  return (
    <section className="member-card settings-panel">
      <div className="member-card-title">
        <div>
          <h2>Accessibilité</h2>
          <p>Confort visuel et densité d’affichage.</p>
        </div>
      </div>
      <div className="settings-preference-list">
        {accessibilitySettings.map((item) => (
          <SettingsToggle key={item.title} {...item} />
        ))}
      </div>
      <div className="settings-section-title">
        <Sparkles aria-hidden="true" strokeWidth={1.8} />
        <span>Taille du texte</span>
      </div>
      <div className="settings-segmented" role="group" aria-label="Taille du texte">
        {[
          { id: "small", label: "Compact" },
          { id: "normal", label: "Normal" },
          { id: "large", label: "Grand" },
        ].map((option) => (
          <button
            key={option.id}
            className={textSize === option.id ? "is-active" : undefined}
            type="button"
            onClick={() => setTextSize(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function SettingsActivityPanel({ user, profile }: { user: AuthUser | null; profile: MemberProfile | null }) {
  return (
    <section className="member-card settings-panel">
      <div className="member-card-title">
        <div>
          <h2>Activité du compte</h2>
          <p>Repères récents liés au compte membre.</p>
        </div>
      </div>
      <div className="settings-activity-list">
        <SettingsActivityItem title="Compte créé" text={user?.email ? `Compte associé à ${user.email}` : "Compte membre CCA"} />
        <SettingsActivityItem title="E-mail" text={user?.emailVerified ? "Adresse e-mail vérifiée" : "Vérification e-mail en attente"} />
        <SettingsActivityItem title="Creative ID" text={profile?.memberNumber ? `Numéro ${profile.memberNumber}` : "Numéro membre en cours"} />
        <SettingsActivityItem title="Profil" text={`${profile?.profileCompletion ?? 0}% complété`} />
      </div>
    </section>
  );
}

function SettingsInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ "aria-hidden"?: boolean; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <article>
      <Icon aria-hidden={true} strokeWidth={1.8} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function SettingsToggle({
  title,
  text,
  icon: Icon,
  enabled,
}: {
  title: string;
  text: string;
  icon: ComponentType<{ "aria-hidden"?: boolean; strokeWidth?: number }>;
  enabled: boolean;
}) {
  const [isEnabled, setIsEnabled] = useState(enabled);

  return (
    <article>
      <Icon aria-hidden={true} strokeWidth={1.8} />
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
      <button
        className={isEnabled ? "is-enabled" : undefined}
        type="button"
        aria-pressed={isEnabled}
        onClick={() => setIsEnabled((current) => !current)}
      >
        {isEnabled ? "Activé" : "Désactivé"}
      </button>
    </article>
  );
}

function SettingsActivityItem({ title, text }: { title: string; text: string }) {
  return (
    <article>
      <span />
      <div>
        <strong>{title}</strong>
        <small>{text}</small>
      </div>
    </article>
  );
}

function sortNotificationPreferences(preferences: MemberNotificationPreference[]) {
  const order: NotificationType[] = ["SYSTEM", "MESSAGE", "OPPORTUNITY", "TRAINING", "CERTIFICATE"];

  return [...preferences].sort((left, right) => order.indexOf(left.type) - order.indexOf(right.type));
}

function toNotificationPreferencePayload(preference: MemberNotificationPreference) {
  return {
    type: preference.type,
    platform: preference.platform,
    email: preference.email,
    whatsapp: preference.whatsapp,
    push: preference.push,
    frequency: preference.frequency,
  };
}

function SettingsProfileEditor({
  accessToken,
  user,
  profile,
  organizationProfile,
  partnerProfile,
  initialForm,
}: ProfileEditorProps) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<SettingsForm>(initialForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isCreativeProfile = !!profile;
  const isOrganizationProfile = !!organizationProfile;
  const isPartnerProfile = !!partnerProfile;
  const isAdminProfile = user?.type === "ADMIN";
  const disciplineOptions = useReferenceDisciplines();

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const profilePayload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        publicName: form.publicName,
        country: form.country,
        city: form.city,
        profession: form.profession,
        birthDate: form.birthDate || undefined,
        gender: form.gender || undefined,
        discipline: form.discipline,
        otherDiscipline: form.otherDiscipline,
        bio: form.bio,
        portfolioUrl: form.portfolioUrl,
        websiteUrl: form.websiteUrl,
        avatarUrl: form.avatarUrl,
        cvUrl: form.cvUrl,
        organizationLogoUrl: form.organizationLogoUrl,
        partnerLogoUrl: form.partnerLogoUrl,
        skills: splitList(form.skills),
        languages: splitList(form.languages),
        availability: form.availability,
        visibility: form.visibility,
        organizationName: form.organizationName,
        organizationLegalName: form.organizationLegalName,
        organizationSector: form.organizationSector,
        organizationDescription: form.organizationDescription,
        partnerName: form.partnerName,
        partnerType: form.partnerType,
        partnerDescription: form.partnerDescription,
      };
      const response = await updateMemberProfile(accessToken, profilePayload);

      dispatch(setCurrentMember(response));
      persistCurrentMember(response);
      setForm(buildSettingsForm(response));
      setMessage("Profil mis à jour avec succès.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de mettre à jour le profil pour le moment."));
    } finally {
      setIsSaving(false);
    }
  }

  const updateField =
    (field: keyof SettingsForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = event.target.value;

      setForm((current) => ({
        ...current,
        [field]: value,
        ...(field === "discipline" && value !== "Autre" ? { otherDiscipline: "" } : {}),
      }));
      setError("");
      setMessage("");
    };

  const updateStringField = (field: keyof SettingsForm) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setMessage("");
  };

  const uploadAsset = (kind: UploadProfileAssetKind) => async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await uploadProfileAsset(accessToken, kind, file);
      dispatch(setCurrentMember(response));
      persistCurrentMember(response);
      setForm(buildSettingsForm(response));
      setMessage(kind === "CV" ? "CV envoyé avec succès." : kind === "LOGO" ? "Logo envoyé avec succès." : "Photo envoyée avec succès.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible d'envoyer ce fichier pour le moment."));
    } finally {
      setIsSaving(false);
    }
  };

  const removeUploadedAsset = (kind: UploadProfileAssetKind) => async () => {
    setIsSaving(true);
    setError("");
    setMessage("");

    const clearPayload =
      kind === "AVATAR"
        ? { avatarUrl: "" }
        : kind === "CV"
          ? { cvUrl: "" }
          : isOrganizationProfile
            ? { organizationLogoUrl: "" }
            : { partnerLogoUrl: "" };

    try {
      const response = await updateMemberProfile(accessToken, clearPayload);
      dispatch(setCurrentMember(response));
      persistCurrentMember(response);
      setForm(buildSettingsForm(response));
      setMessage(kind === "CV" ? "CV retiré." : kind === "LOGO" ? "Logo retiré." : "Photo retirée.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de retirer ce fichier pour le moment."));
    } finally {
      setIsSaving(false);
    }
  };

  const featuredUpload =
    isCreativeProfile
      ? { label: "Photo de profil", value: form.avatarUrl, kind: "AVATAR" as const }
      : isOrganizationProfile
        ? { label: "Logo", value: form.organizationLogoUrl, kind: "LOGO" as const }
        : isPartnerProfile
          ? { label: "Logo", value: form.partnerLogoUrl, kind: "LOGO" as const }
          : isAdminProfile
            ? { label: "Photo du compte admin", value: form.avatarUrl, kind: "AVATAR" as const }
            : null;

  return (
    <form className="member-card settings-profile-form" onSubmit={submitProfile}>
      <div className="member-card-title">
        <div>
          <h2>Informations du compte</h2>
          <p>L’e-mail reste verrouillé pour le moment. Il pourra être modifié plus tard avec une vérification dédiée.</p>
        </div>
        <button className="settings-save-button" type="submit" disabled={isSaving}>
          <Save aria-hidden="true" strokeWidth={1.8} />
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>

      {featuredUpload ? (
        <SettingsFileUpload
          label={featuredUpload.label}
          value={featuredUpload.value}
          accept="image/jpeg,image/png,image/webp"
          preview="image"
          featured
          onChange={uploadAsset(featuredUpload.kind)}
          onRemove={featuredUpload.value ? removeUploadedAsset(featuredUpload.kind) : undefined}
        />
      ) : null}

      <div className="settings-form-grid">
        <SettingsInput label="Prénom" icon={UserRound} value={form.firstName} onChange={updateField("firstName")} />
        <SettingsInput label="Nom" icon={UserRound} value={form.lastName} onChange={updateField("lastName")} />
        <SettingsInput label="Adresse e-mail" icon={AtSign} value={user?.email ?? ""} disabled />
        <SettingsInput label="Téléphone" icon={Phone} value={form.phone} onChange={updateField("phone")} placeholder="+243 898 192 765" />
        <SettingsInput label="Pays" icon={Globe2} value={form.country} onChange={updateField("country")} placeholder="Congo RDC" />
        <SettingsInput label="Ville" icon={MapPin} value={form.city} onChange={updateField("city")} placeholder="Kinshasa" />
      </div>

      {isCreativeProfile ? (
        <>
          <div className="settings-section-title">
            <Sparkles aria-hidden="true" strokeWidth={1.8} />
            <span>Creative ID</span>
            <strong>{profile?.profileCompletion ?? 0}% complété</strong>
          </div>

          <div className="settings-form-grid">
            <SettingsInput label="Nom affiché sur le profil" icon={UserRound} value={form.publicName} onChange={updateField("publicName")} placeholder="Nom affiché sur le Creative ID" />
            <SettingsInput label="Profession" icon={Sparkles} value={form.profession} onChange={updateField("profession")} placeholder="Photographe, styliste, designer..." />
            <SettingsSelect label="Discipline" icon={Palette} value={form.discipline} onChange={updateField("discipline")}>
              <option value="">Choisir une discipline</option>
              {disciplineOptions.map((discipline) => (
                <option key={discipline} value={discipline}>{discipline}</option>
              ))}
            </SettingsSelect>
            {form.discipline === "Autre" ? (
              <SettingsInput label="Précisez votre discipline" icon={Palette} value={form.otherDiscipline} onChange={updateField("otherDiscipline")} placeholder="Exemple : scénographie, création sonore..." />
            ) : null}
            <SettingsInput label="Date de naissance" icon={UserRound} type="date" value={form.birthDate} onChange={updateField("birthDate")} />
            <SettingsSelect label="Genre" icon={UserRound} value={form.gender} onChange={updateField("gender")}>
              <option value="">Sélectionner</option>
              <option value="FEMALE">Féminin</option>
              <option value="MALE">Masculin</option>
              <option value="OTHER">Autre</option>
              <option value="PREFER_NOT_TO_SAY">Préfère ne pas répondre</option>
            </SettingsSelect>
            <SettingsInput label="Compétences clés" icon={Sparkles} value={form.skills} onChange={updateField("skills")} placeholder="Portrait, retouche, storytelling visuel" />
            <SettingsLanguageMultiSelect value={form.languages} onChange={updateStringField("languages")} />
            <SettingsInput label="Portfolio" icon={Link2} value={form.portfolioUrl} onChange={updateField("portfolioUrl")} placeholder="https://portfolio.com/votre-nom" />
            <SettingsInput label="Site web" icon={Globe2} value={form.websiteUrl} onChange={updateField("websiteUrl")} placeholder="https://monsite.com" />
            <SettingsFileUpload label="CV" value={form.cvUrl} accept="application/pdf" onChange={uploadAsset("CV")} onRemove={form.cvUrl ? removeUploadedAsset("CV") : undefined} />
            <SettingsSelect label="Visibilité du Creative ID" icon={Eye} value={form.visibility} onChange={updateField("visibility")}>
              <option value="PRIVATE">Privé</option>
              <option value="MEMBERS">Membres CCA</option>
              <option value="PUBLIC">Public</option>
            </SettingsSelect>
          </div>

          <SettingsTextarea label="Bio" value={form.bio} onChange={updateField("bio")} placeholder="Présentez votre parcours, votre univers et vos projets." />
          <SettingsTextarea label="Disponibilité" value={form.availability} onChange={updateField("availability")} placeholder="Disponible pour workshops, missions, collaborations..." />
        </>
      ) : null}

      {isOrganizationProfile ? (
        <>
          <div className="settings-section-title">
            <Sparkles aria-hidden="true" strokeWidth={1.8} />
            <span>Profil organisation</span>
          </div>
          <div className="settings-form-grid">
            <SettingsInput label="Nom de l'organisation" icon={UserRound} value={form.organizationName} onChange={updateField("organizationName")} />
            <SettingsInput label="Nom légal" icon={FileText} value={form.organizationLegalName} onChange={updateField("organizationLegalName")} />
            <SettingsInput label="Secteur" icon={Palette} value={form.organizationSector} onChange={updateField("organizationSector")} />
            <SettingsInput label="Site web" icon={Globe2} value={form.websiteUrl} onChange={updateField("websiteUrl")} />
          </div>
          <SettingsTextarea label="Description" value={form.organizationDescription} onChange={updateField("organizationDescription")} />
        </>
      ) : null}

      {isPartnerProfile ? (
        <>
          <div className="settings-section-title">
            <Sparkles aria-hidden="true" strokeWidth={1.8} />
            <span>Profil partenaire</span>
          </div>
          <div className="settings-form-grid">
            <SettingsInput label="Nom du partenaire" icon={UserRound} value={form.partnerName} onChange={updateField("partnerName")} />
            <SettingsInput label="Type de partenaire" icon={Palette} value={form.partnerType} onChange={updateField("partnerType")} />
            <SettingsInput label="Site web" icon={Globe2} value={form.websiteUrl} onChange={updateField("websiteUrl")} />
          </div>
          <SettingsTextarea label="Description" value={form.partnerDescription} onChange={updateField("partnerDescription")} />
        </>
      ) : null}

      {message ? <p className="auth-form-success">{message}</p> : null}
      {error ? <p className="auth-form-error" role="alert">{error}</p> : null}
    </form>
  );
}

function SettingsInput({
  label,
  icon: Icon,
  wide = false,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: ComponentType<{ "aria-hidden"?: boolean; strokeWidth?: number }>;
  wide?: boolean;
}) {
  return (
    <label className={`settings-field${wide ? " settings-field--wide" : ""}`}>
      <span>{label}{props.required ? <b aria-label="obligatoire">*</b> : null}</span>
      <div>
        <Icon aria-hidden={true} strokeWidth={1.8} />
        <input {...props} />
      </div>
    </label>
  );
}

function SettingsSelect({
  label,
  icon: Icon,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  icon: ComponentType<{ "aria-hidden"?: boolean; strokeWidth?: number }>;
  children: ReactNode;
}) {
  return (
    <label className="settings-field">
      <span>{label}{props.required ? <b aria-label="obligatoire">*</b> : null}</span>
      <div>
        <Icon aria-hidden={true} strokeWidth={1.8} />
        <select {...props}>{children}</select>
      </div>
    </label>
  );
}

function SettingsFileUpload({
  label,
  value,
  accept,
  preview = "file",
  featured = false,
  onChange,
  onRemove,
}: {
  label: string;
  value: string;
  accept: string;
  preview?: "image" | "file";
  featured?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove?: () => void;
}) {
  const isImagePreview = preview === "image";
  const displayText = value ? fileNameFromUrl(value) : isImagePreview ? "Ajouter une image" : "Choisir un fichier";
  const canRemove = !!value && !!onRemove;

  return (
    <div className={`settings-field settings-file-upload${isImagePreview ? " settings-file-upload--image" : ""}${featured ? " settings-file-upload--featured" : ""}${canRemove ? " settings-file-upload--removable" : ""}`}>
      <span>{label}</span>
      <div className="settings-file-upload-row">
        <label className="settings-file-upload-control">
          <span
            className={`settings-file-preview${value && isImagePreview ? " has-preview" : ""}`}
            style={value && isImagePreview ? { backgroundImage: `url(${value})` } : undefined}
            aria-hidden="true"
          >
            {!value || !isImagePreview ? <Upload aria-hidden={true} strokeWidth={1.8} /> : null}
          </span>
          {featured ? null : <span>{displayText}</span>}
          <input accept={accept} type="file" onChange={onChange} />
        </label>
        {canRemove ? (
          <button className="settings-file-remove" type="button" aria-label={`Retirer ${label}`} onClick={onRemove}>
            <Trash2 aria-hidden="true" strokeWidth={1.8} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SettingsLanguageMultiSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedLanguages = splitList(value);
  const selectedKeys = new Set(selectedLanguages.map(normalizeProfileOption));
  const optionKeys = new Set(profileLanguageOptions.map(normalizeProfileOption));
  const normalizedQuery = normalizeProfileOption(query);
  const filteredLanguages = profileLanguageOptions.filter((language) => {
    return !selectedKeys.has(normalizeProfileOption(language)) && normalizeProfileOption(language).includes(normalizedQuery);
  });
  const trimmedQuery = query.trim();
  const canAddCustom =
    trimmedQuery.length > 0 &&
    !selectedKeys.has(normalizeProfileOption(trimmedQuery)) &&
    !optionKeys.has(normalizeProfileOption(trimmedQuery));

  const commitLanguages = (languages: string[]) => {
    onChange(languages.join(", "));
  };

  const addLanguage = (language: string) => {
    const nextLanguage = formatCustomLanguage(language);

    if (!nextLanguage || selectedKeys.has(normalizeProfileOption(nextLanguage))) {
      return;
    }

    commitLanguages([...selectedLanguages, nextLanguage]);
    setQuery("");
    setIsOpen(true);
  };

  const removeLanguage = (language: string) => {
    commitLanguages(selectedLanguages.filter((item) => normalizeProfileOption(item) !== normalizeProfileOption(language)));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();

      if (canAddCustom) {
        addLanguage(trimmedQuery);
        return;
      }

      if (filteredLanguages.length === 1) {
        addLanguage(filteredLanguages[0]);
      }
    }

    if (event.key === "Backspace" && !query && selectedLanguages.length > 0) {
      removeLanguage(selectedLanguages[selectedLanguages.length - 1]);
    }
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;

    if (!nextTarget || !event.currentTarget.contains(nextTarget as Node)) {
      setIsOpen(false);
    }
  };

  return (
    <div className="settings-field settings-language-field" onBlur={handleBlur}>
      <span>Langues parlées</span>
      <div className="settings-language-control" onClick={() => setIsOpen(true)}>
        <Languages aria-hidden={true} strokeWidth={1.8} />
        <div className="settings-language-value">
          {selectedLanguages.map((language) => (
            <span className="settings-language-tag" key={language}>
              {language}
              <button
                type="button"
                aria-label={`Retirer ${language}`}
                onClick={(event) => {
                  event.stopPropagation();
                  removeLanguage(language);
                }}
              >
                <X aria-hidden="true" strokeWidth={1.8} />
              </button>
            </span>
          ))}
          <label className="settings-language-search">
            <Search aria-hidden="true" strokeWidth={1.8} />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={selectedLanguages.length > 0 ? "Ajouter" : "Rechercher ou ajouter une langue"}
            />
          </label>
        </div>
        <button
          className="settings-language-open"
          type="button"
          aria-label="Choisir les langues"
          onClick={(event) => {
            event.stopPropagation();
            setIsOpen((current) => !current);
          }}
        >
          <ChevronDown aria-hidden="true" strokeWidth={1.8} />
        </button>
      </div>

      {isOpen ? (
        <section className="settings-language-options" aria-label="Suggestions de langues">
          {canAddCustom ? (
            <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => addLanguage(trimmedQuery)}>
              Ajouter : {formatCustomLanguage(trimmedQuery)}
            </button>
          ) : null}
          {filteredLanguages.length > 0 ? (
            filteredLanguages.map((language) => (
              <button type="button" key={language} onMouseDown={(event) => event.preventDefault()} onClick={() => addLanguage(language)}>
                {language}
              </button>
            ))
          ) : !canAddCustom ? (
            <p>Aucune langue trouvée</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function SettingsTextarea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
}) {
  return (
    <label className="settings-field settings-field--wide">
      <span>{label}</span>
      <textarea {...props} />
    </label>
  );
}

function buildSettingsForm({
  user,
  profile,
  organizationProfile,
  partnerProfile,
}: {
  user: AuthUser | null;
  profile: MemberProfile | null;
  organizationProfile: OrganizationProfile | null;
  partnerProfile: PartnerProfile | null;
}): SettingsForm {
  return {
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    publicName: profile?.publicName ?? "",
    country: profile?.country ?? organizationProfile?.country ?? partnerProfile?.country ?? "",
    city: profile?.city ?? organizationProfile?.city ?? partnerProfile?.city ?? "",
    profession: profile?.profession ?? "",
    birthDate: toDateInputValue(profile?.birthDate),
    gender: profile?.gender ?? "",
    discipline: profile?.discipline ?? "",
    otherDiscipline: profile?.otherDiscipline ?? "",
    bio: profile?.bio ?? "",
    portfolioUrl: profile?.portfolioUrl ?? "",
    websiteUrl: profile?.websiteUrl ?? organizationProfile?.websiteUrl ?? partnerProfile?.websiteUrl ?? "",
    avatarUrl: profile?.avatarUrl ?? user?.avatarUrl ?? "",
    cvUrl: profile?.cvUrl ?? "",
    organizationLogoUrl: organizationProfile?.logoUrl ?? "",
    partnerLogoUrl: partnerProfile?.logoUrl ?? "",
    skills: profile?.skills.join(", ") ?? "",
    languages: profile?.languages.join(", ") ?? "",
    availability: profile?.availability ?? "",
    visibility: profile?.visibility ?? "MEMBERS",
    organizationName: organizationProfile?.name ?? "",
    organizationLegalName: organizationProfile?.legalName ?? "",
    organizationSector: organizationProfile?.sector ?? "",
    organizationDescription: organizationProfile?.description ?? "",
    partnerName: partnerProfile?.name ?? "",
    partnerType: partnerProfile?.partnerType ?? "",
    partnerDescription: partnerProfile?.description ?? "",
  };
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function fileNameFromUrl(value: string) {
  const rawFileName = value.split("/").pop()?.split("?")[0] ?? "";

  if (!rawFileName) {
    return "Fichier sélectionné";
  }

  const decoded = decodeURIComponent(rawFileName)
    .replace(/^[a-z]+-\d+-/i, "")
    .replace(/-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\.[^.]+$)/i, "");

  return decoded || "Fichier sélectionné";
}

function toDateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function persistCurrentMember(response: AuthMeResponse) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("cca.user", JSON.stringify(response.user));
  window.localStorage.setItem("cca.profile", JSON.stringify(response.profile));
  window.localStorage.setItem("cca.organizationProfile", JSON.stringify(response.organizationProfile));
  window.localStorage.setItem("cca.partnerProfile", JSON.stringify(response.partnerProfile));
}

function accountTypeName(type?: string) {
  const labels: Record<string, string> = {
    PUBLIC: "Public",
    CREATOR: "Créateur",
    LEARNER: "Apprenant",
    ORGANIZATION: "Organisation",
    PARTNER: "Partenaire",
    ADMIN: "Administrateur",
  };

  return type ? labels[type] ?? "Membre" : "Membre";
}

function journeyIntroText(type?: string) {
  const labels: Record<string, string> = {
    PUBLIC: "Commencez par une formation CCA ou demandez une validation créateur si votre démarche est déjà prête.",
    LEARNER: "Votre prochaine évolution naturelle est le profil créateur, après validation de votre démarche par CCA.",
    CREATOR: "Votre statut créateur est actif. Gardez votre Creative ID et votre portfolio à jour.",
    ORGANIZATION: "Votre compte structure est actif. Les actions utiles concernent la visibilité et les collaborations.",
    PARTNER: "Votre compte partenaire est actif. Les actions utiles concernent les opportunités et collaborations.",
    ADMIN: "Votre compte admin sert à gérer, valider et accompagner les parcours membres.",
  };

  return type ? labels[type] ?? "Consultez les actions disponibles pour votre compte." : "Consultez les actions disponibles pour votre compte.";
}

function journeyCurrentText(type?: string) {
  const labels: Record<string, string> = {
    PUBLIC: "Vous pouvez consulter l'espace membre et commencer votre parcours avec une formation CCA.",
    LEARNER: "Vous suivez un parcours d'apprentissage et pouvez évoluer vers un profil créateur validé.",
    CREATOR: "Votre profil créatif est reconnu dans la communauté CCA.",
    ORGANIZATION: "Votre espace sert à présenter votre structure et gérer ses collaborations.",
    PARTNER: "Votre espace sert à suivre vos collaborations et opportunités avec CCA.",
    ADMIN: "Vous disposez des droits de gestion et de validation des parcours.",
  };

  return type ? labels[type] ?? "Votre compte est actif dans l'espace membre CCA." : "Votre compte est actif dans l'espace membre CCA.";
}

function accountEvolutionStatusName(status?: string) {
  const labels: Record<string, string> = {
    PENDING: "En attente",
    APPROVED: "Approuvée",
    REJECTED: "Refusée",
    CANCELLED: "Annulée",
  };

  return status ? labels[status] ?? "En attente" : "En attente";
}

function accountStatusName(status?: string) {
  const labels: Record<string, string> = {
    PENDING: "En attente",
    ACTIVE: "Actif",
    SUSPENDED: "Suspendu",
    ARCHIVED: "Archivé",
  };

  return status ? labels[status] ?? "Actif" : "Actif";
}
