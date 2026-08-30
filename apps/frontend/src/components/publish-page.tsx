"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Lightbulb,
  Link as LinkIcon,
  MessageCircleQuestion,
  Paperclip,
  Send,
  Sparkles,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MemberShell } from "@/components/member-shell";
import { createPublication, getApiErrorMessage, getPublicationCapabilities, uploadPublicationAttachment } from "@/lib/api";
import type { PublicationAudience, PublicationCapability, PublicationType, PublicationUploadResponse } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import styles from "./publish-page.module.css";

type PublishType = {
  id: PublicationType;
  label: string;
  description: string;
  intent: string;
  destination: string;
  destinations: string[];
  placeholder: string;
  icon: LucideIcon;
  allowed: boolean;
  defaultAudience: PublicationAudience;
};

const localPublishTypes: PublishType[] = [
  {
    id: "PROJECT",
    label: "Projet",
    description: "Présenter une initiative, une exposition, une campagne ou une production.",
    intent: "Je veux présenter quelque chose.",
    destination: "Réseau + Creative ID",
    destinations: ["network", "creative-id"],
    placeholder: "Décrivez le projet, les objectifs, le besoin et les profils recherchés...",
    icon: Sparkles,
    allowed: true,
    defaultAudience: "MEMBERS",
  },
  {
    id: "CREATION",
    label: "Création / œuvre",
    description: "Montrer une œuvre, une image, une vidéo, un design ou une réalisation.",
    intent: "Je veux montrer mon travail.",
    destination: "Réseau + Creative ID",
    destinations: ["network", "creative-id"],
    placeholder: "Présentez la création, le contexte et ce que vous souhaitez obtenir comme retour...",
    icon: ImageIcon,
    allowed: true,
    defaultAudience: "MEMBERS",
  },
  {
    id: "QUESTION",
    label: "Question",
    description: "Demander un avis, un conseil ou une réponse à la communauté.",
    intent: "Je veux demander de l'aide.",
    destination: "Réseau",
    destinations: ["network"],
    placeholder: "Posez votre question avec le contexte nécessaire pour recevoir de bonnes réponses...",
    icon: MessageCircleQuestion,
    allowed: true,
    defaultAudience: "MEMBERS",
  },
  {
    id: "COLLABORATION",
    label: "Collaboration",
    description: "Trouver une personne, une équipe, un lieu, un mentor ou un partenaire.",
    intent: "Je cherche quelqu'un.",
    destination: "Réseau",
    destinations: ["network"],
    placeholder: "Indiquez les profils recherchés, la période, la ville et le type de collaboration...",
    icon: UsersRound,
    allowed: true,
    defaultAudience: "MEMBERS",
  },
  {
    id: "OPPORTUNITY",
    label: "Opportunité",
    description: "Partager un appel à projets, une résidence, un casting, un concours ou un financement.",
    intent: "Je partage une opportunité.",
    destination: "Opportunités",
    destinations: ["opportunities", "network"],
    placeholder: "Ajoutez les critères, l’échéance, le lien de candidature et les disciplines concernées...",
    icon: Lightbulb,
    allowed: true,
    defaultAudience: "MEMBERS",
  },
  {
    id: "JOB",
    label: "Mission / emploi",
    description: "Recruter ou proposer une mission, un poste, une prestation ou un besoin freelance.",
    intent: "Je cherche un profil à engager.",
    destination: "Opportunités + Réseau",
    destinations: ["opportunities", "network"],
    placeholder: "Décrivez le poste, la rémunération si disponible, les livrables et le contact...",
    icon: BriefcaseBusiness,
    allowed: true,
    defaultAudience: "MEMBERS",
  },
  {
    id: "RESOURCE",
    label: "Ressource utile",
    description: "Partager un guide, modèle, lien utile, document ou retour d’expérience.",
    intent: "Je partage un contenu utile.",
    destination: "Ressources",
    destinations: ["resources", "network"],
    placeholder: "Expliquez la ressource, à qui elle sert et comment elle peut être utilisée...",
    icon: FileText,
    allowed: true,
    defaultAudience: "MEMBERS",
  },
  {
    id: "TRAINING",
    label: "Formation",
    description: "Proposer un atelier, un cours, une masterclass ou un parcours d’apprentissage.",
    intent: "Je propose une formation.",
    destination: "Formations + Agenda",
    destinations: ["trainings", "agenda"],
    placeholder: "Présentez le programme, le niveau, la durée, les prérequis et le mode d’inscription...",
    icon: FileText,
    allowed: true,
    defaultAudience: "MEMBERS",
  },
  {
    id: "EVENT",
    label: "Événement",
    description: "Annoncer une exposition, une rencontre, un workshop, un panel ou une activation.",
    intent: "J'annonce un événement.",
    destination: "Agenda + Réseau",
    destinations: ["agenda", "network"],
    placeholder: "Ajoutez le lieu, la date, le programme, les intervenants et le lien d’inscription...",
    icon: Lightbulb,
    allowed: true,
    defaultAudience: "MEMBERS",
  },
];

const audienceLabels: Record<PublicationAudience, string> = {
  MEMBERS: "Membres CCA",
  PUBLIC: "Public",
  GROUP: "Groupe seulement",
  PRIVATE: "Privé",
};
const categories = ["Arts visuels", "Mode & stylisme", "Business créatif", "Création de contenu", "Formation", "Opportunités", "Autre"];

export function PublishPage() {
  const router = useRouter();
  const { accessToken, user, profile, organizationProfile, partnerProfile } = useAppSelector((state) => state.auth);
  const [capabilities, setCapabilities] = useState<PublicationCapability[]>([]);
  const [capabilitiesLoaded, setCapabilitiesLoaded] = useState(false);
  const [capabilityStatus, setCapabilityStatus] = useState("");
  const [activeTypeId, setActiveTypeId] = useState<PublicationType>(localPublishTypes[0].id);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [audience, setAudience] = useState<PublicationAudience>("MEMBERS");
  const [link, setLink] = useState("");
  const [structuredDate, setStructuredDate] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [location, setLocation] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [attachments, setAttachments] = useState<PublicationUploadResponse[]>([]);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;

    getPublicationCapabilities(accessToken)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setCapabilities(response.types);
        const firstAllowed = response.types.find((type) => type.allowed)?.value;
        if (firstAllowed) {
          setActiveTypeId(firstAllowed);
          setAudience(response.types.find((type) => type.value === firstAllowed)?.defaultAudience ?? "MEMBERS");
        }
      })
      .catch((error) => {
        if (isMounted) {
          setCapabilityStatus(getApiErrorMessage(error, "Impossible de charger les droits de publication pour le moment."));
        }
      })
      .finally(() => {
        if (isMounted) {
          setCapabilitiesLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  const publishTypes = useMemo(() => (capabilitiesLoaded ? buildPublishTypes(capabilities) : []), [capabilities, capabilitiesLoaded]);
  const availablePublishTypes = publishTypes.filter((type) => type.allowed);
  const activeType = availablePublishTypes.find((type) => type.id === activeTypeId) ?? availablePublishTypes[0] ?? publishTypes[0] ?? localPublishTypes[0];
  const activeTypeAllowed = availablePublishTypes.some((type) => type.id === activeType.id);
  const ActiveIcon = activeType.icon;
  const authorName = profile?.publicName || organizationProfile?.name || partnerProfile?.name || user?.fullName || "Membre CCA";
  const showStructuredDate = usesStructuredDate(activeType.id);
  const showOpportunityFields = isOpportunityLike(activeType.id);
  const showEventFields = activeType.id === "EVENT" || activeType.id === "TRAINING";
  const completion = useMemo(() => {
    const checks = [activeTypeId, title.trim(), body.trim(), category, audience];

    if (usesStructuredDate(activeTypeId)) {
      checks.push(structuredDate);
    }

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [activeTypeId, audience, body, category, structuredDate, title]);

  const updateFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!selectedFiles.length) {
      return;
    }

    if (!accessToken) {
      setStatus("Connectez-vous pour envoyer des fichiers.");
      return;
    }

    setIsUploading(true);
    setStatus("");

    try {
      const uploadedFiles = await Promise.all(
        selectedFiles.map((file) => uploadPublicationAttachment(accessToken, file)),
      );
      setAttachments((current) => [...current, ...uploadedFiles].slice(0, 10));
      setStatus(`${uploadedFiles.length} fichier${uploadedFiles.length > 1 ? "s" : ""} ajouté${uploadedFiles.length > 1 ? "s" : ""}.`);
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Impossible d’envoyer ce fichier pour le moment."));
    } finally {
      setIsUploading(false);
    }
  };

  const submitPublication = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void savePublication(true);
  };

  const savePublication = async (publishNow: boolean) => {
    if (!accessToken) {
      setStatus("Connectez-vous pour publier dans le réseau CCA.");
      return;
    }

    if (!capabilitiesLoaded) {
      setStatus("Chargement des droits de publication. Réessayez dans un instant.");
      return;
    }

    if (!activeTypeAllowed) {
      setStatus("Votre type de compte ne peut pas publier ce type de contenu.");
      return;
    }

    if (!title.trim() || !body.trim()) {
      setStatus("Ajoutez un titre et un contenu avant de publier.");
      return;
    }

    if (activeType.id === "RESOURCE" && !link.trim() && !attachments.length) {
      setStatus("Ajoutez un lien utile ou un fichier pour publier une ressource.");
      return;
    }

    if (isUploading) {
      setStatus("Patientez pendant l’envoi des fichiers avant de publier.");
      return;
    }

    setIsSubmitting(true);
    setStatus("");

    try {
      const publication = await createPublication(accessToken, {
        type: activeType.id,
        title,
        content: body,
        category,
        audience,
        linkUrl: link.trim() || undefined,
        opportunityDeadline: showStructuredDate ? toIsoDate(structuredDate) : undefined,
        opportunityLocation: location.trim() || undefined,
        budgetRange: budgetRange.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        expiresAt: expiresAt ? toIsoDate(expiresAt) : undefined,
        discipline: profile?.discipline || organizationProfile?.sector || partnerProfile?.partnerType || undefined,
        country: profile?.country || organizationProfile?.country || partnerProfile?.country || undefined,
        city: location.trim() || profile?.city || organizationProfile?.city || partnerProfile?.city || undefined,
        attachments: attachments.map((attachment, index) => ({
          type: attachment.type,
          url: attachment.url,
          name: attachment.name,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
          order: index,
        })),
        publishNow,
      });

      if (!publishNow) {
        setStatus("Brouillon enregistré. Vous pourrez le publier depuis vos publications.");
        return;
      }

      setStatus("Publication envoyée. Redirection vers l’espace concerné...");
      router.push(destinationToHref(publication.routingDestinations, publication.type));
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Impossible d’enregistrer cette publication pour le moment."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MemberShell activeItem="Publier">
      <div className={styles.layout}>
        <section className={`member-module-hero ${styles.hero}`}>
          <div>
            <span className="member-kicker">Publier</span>
            <h1>Un seul point d’entrée pour alimenter le réseau CCA.</h1>
            <p>
              Projets, créations, questions, collaborations, offres, opportunités et ressources peuvent partir
              d’ici avant d’être diffusés dans les bons espaces.
            </p>
          </div>
          <div className={styles.heroPanel}>
            <ActiveIcon aria-hidden="true" strokeWidth={1.8} />
            <strong>{activeType.label}</strong>
            <span>{activeType.destination}</span>
          </div>
        </section>

        <div className={styles.grid}>
          <section className={styles.main}>
            <section className={`member-card ${styles.typeCard}`}>
              <div className="member-card-title">
                <div>
                  <h2>Que voulez-vous publier ?</h2>
                  <p>Le choix détermine où le contenu sera visible dans l’application.</p>
                </div>
              </div>
              {capabilityStatus ? <p className="auth-form-error">{capabilityStatus}</p> : null}
              <div className={styles.typeGrid}>
                {availablePublishTypes.length ? availablePublishTypes.map((type) => {
                  const Icon = type.icon;

                  return (
                    <button
                      key={type.id}
                      className={`${styles.typeButton}${type.id === activeTypeId ? ` ${styles.typeButtonActive}` : ""}`}
                      type="button"
                      onClick={() => {
                        setActiveTypeId(type.id);
                        setAudience(type.defaultAudience);
                      }}
                    >
                      <Icon aria-hidden="true" strokeWidth={1.8} />
                      <span>{type.label}</span>
                      <em>{type.intent}</em>
                      <small>{type.destination}</small>
                    </button>
                  );
                }) : (
                  <p className={styles.emptyTypes}>{capabilitiesLoaded ? "Aucun type de publication n’est disponible pour ce compte." : "Chargement des types autorisés..."}</p>
                )}
              </div>
            </section>

            <form className={`member-card ${styles.composerCard}`} onSubmit={submitPublication}>
              <div className="member-card-title">
                <div>
                  <h2>Composer la publication</h2>
                  <p>{activeType.description}</p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>Titre</span>
                  <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Recherche styliste pour clip culturel" />
                </label>
                <label className={styles.field}>
                  <span>Catégorie</span>
                  <select value={category} onChange={(event) => setCategory(event.target.value)}>
                    {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Audience</span>
                  <select value={audience} onChange={(event) => setAudience(event.target.value as PublicationAudience)}>
                    {Object.entries(audienceLabels)
                      .filter(([value]) => value !== "GROUP")
                      .map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Lien utile</span>
                  <input value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://..." />
                </label>
              </div>

              {showStructuredDate || showOpportunityFields || showEventFields ? (
                <div className={styles.contextPanel}>
                  <div>
                    <h3>Informations utiles aux autres onglets</h3>
                    <p>
                      Ces champs sont facultatifs, mais ils permettent à l’Agenda, aux Opportunités
                      et aux Formations de mieux classer votre publication.
                    </p>
                  </div>
                  <div className={styles.formGrid}>
                    {showStructuredDate ? (
                      <label className={styles.field}>
                        <span>{dateFieldLabel(activeType.id)}</span>
                        <input type="datetime-local" value={structuredDate} onChange={(event) => setStructuredDate(event.target.value)} />
                      </label>
                    ) : null}
                    <label className={styles.field}>
                      <span>{showEventFields ? "Lieu ou format" : "Lieu concerné"}</span>
                      <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Ex. Kinshasa, en ligne ou hybride" />
                    </label>
                    {showOpportunityFields ? (
                      <label className={styles.field}>
                        <span>Budget, prix ou rémunération</span>
                        <input value={budgetRange} onChange={(event) => setBudgetRange(event.target.value)} placeholder="Ex. 300-700 USD, bourse, prix..." />
                      </label>
                    ) : null}
                    <label className={styles.field}>
                      <span>Email de contact</span>
                      <input value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="contact@exemple.com" inputMode="email" />
                    </label>
                    <label className={styles.field}>
                      <span>Date de fin de visibilité</span>
                      <input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
                    </label>
                  </div>
                </div>
              ) : null}

              <label className={styles.bodyField}>
                <span>Contenu</span>
                <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder={activeType.placeholder} />
              </label>

              <div className={styles.attachments}>
                <label className={styles.attachmentButton}>
                  <Paperclip aria-hidden="true" strokeWidth={1.8} />
                  <span>{isUploading ? "Envoi en cours..." : attachments.length ? `${attachments.length} fichier${attachments.length > 1 ? "s" : ""}` : "Ajouter fichiers ou images"}</span>
                  <input type="file" multiple onChange={(event) => void updateFiles(event)} />
                </label>
                <button className={styles.mentionButton} type="button">
                  <LinkIcon aria-hidden="true" strokeWidth={1.8} />
                  Identifier un membre
                </button>
              </div>

              {attachments.length ? (
                <div className={styles.fileList}>
                  {attachments.map((file) => (
                    <span key={file.url}>
                      {file.name}
                      <button type="button" onClick={() => setAttachments((current) => current.filter((item) => item.url !== file.url))}>Retirer</button>
                    </span>
                  ))}
                </div>
              ) : null}

              {status ? <p className={isSuccessStatus(status) ? "auth-form-success" : "auth-form-error"}>{status}</p> : null}

              <div className={styles.actions}>
                <button className="member-secondary-button" type="button" disabled={isSubmitting || isUploading} onClick={() => void savePublication(false)}>Enregistrer brouillon</button>
                <button className="member-create-button" type="submit" disabled={isSubmitting || isUploading}>
                  <Send aria-hidden="true" strokeWidth={1.8} />
                  {isSubmitting ? "Envoi..." : "Publier"}
                </button>
              </div>
            </form>
          </section>

          <aside className={styles.side}>
            <section className={`member-card ${styles.previewCard}`}>
              <div className="member-card-title">
                <h2>Aperçu</h2>
              </div>
              <article className={styles.preview}>
                <header>
                  <span className={styles.avatar}>{authorName.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <strong>{authorName}</strong>
                    <small>{activeType.label} · {category}</small>
                  </div>
                </header>
                <h3>{title || "Votre titre apparaîtra ici"}</h3>
                <p>{body || "Le contenu de votre publication sera prévisualisé ici avant diffusion."}</p>
                {structuredDate ? <small>{dateFieldLabel(activeType.id)} : {formatLocalPreviewDate(structuredDate)}</small> : null}
                {location ? <small>{location}</small> : null}
                {link ? <small>{link}</small> : null}
              </article>
            </section>

            <section className={`member-card ${styles.checkCard}`}>
              <div className="member-card-title">
                <h2>Préparation</h2>
              </div>
              <div className={styles.progress}><span style={{ width: `${completion}%` }} /></div>
              <div className={styles.checkList}>
                <span className={title.trim() ? styles.done : undefined}><CheckCircle2 aria-hidden="true" /> Titre clair</span>
                <span className={body.trim() ? styles.done : undefined}><CheckCircle2 aria-hidden="true" /> Description utile</span>
                <span className={category ? styles.done : undefined}><CheckCircle2 aria-hidden="true" /> Catégorie choisie</span>
                <span className={audience ? styles.done : undefined}><CheckCircle2 aria-hidden="true" /> Audience définie</span>
                {showStructuredDate ? <span className={structuredDate ? styles.done : undefined}><CheckCircle2 aria-hidden="true" /> Date exploitable par l’agenda</span> : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </MemberShell>
  );
}

function buildPublishTypes(capabilities: PublicationCapability[]): PublishType[] {
  if (!capabilities.length) {
    return [];
  }

  return capabilities
    .map((capability) => {
      const localType = localPublishTypes.find((type) => type.id === capability.value);

      if (!localType) {
        return null;
      }

      return {
        ...localType,
        label: capability.label,
        description: capability.description,
        destination: capability.destinations.map(destinationLabel).join(" + "),
        destinations: capability.destinations,
        allowed: capability.allowed,
        defaultAudience: capability.defaultAudience,
      };
    })
    .filter((type): type is PublishType => !!type);
}

function destinationLabel(destination: string) {
  const labels: Record<string, string> = {
    network: "Réseau",
    "creative-id": "Creative ID",
    opportunities: "Opportunités",
    resources: "Ressources",
    groups: "Groupes",
    trainings: "Formations",
    agenda: "Agenda",
    notifications: "Notifications",
  };

  return labels[destination] ?? destination;
}

function destinationToHref(destinations: string[], type: PublicationType) {
  if (["PROJECT", "CREATION", "QUESTION", "COLLABORATION"].includes(type)) {
    return "/espace-membre/reseau";
  }

  if (destinations.includes("opportunities")) {
    return "/espace-membre/opportunites";
  }

  if (destinations.includes("resources")) {
    return "/espace-membre/ressources";
  }

  if (destinations.includes("groups")) {
    return "/espace-membre/groupes";
  }

  if (destinations.includes("trainings")) {
    return "/espace-membre/formations";
  }

  if (destinations.includes("agenda")) {
    return "/espace-membre/agenda";
  }

  if (type === "RESOURCE") {
    return "/espace-membre/ressources";
  }

  return "/espace-membre/reseau";
}

function usesStructuredDate(type: PublicationType) {
  return ["OPPORTUNITY", "JOB", "TRAINING", "EVENT"].includes(type);
}

function isOpportunityLike(type: PublicationType) {
  return type === "OPPORTUNITY" || type === "JOB";
}

function dateFieldLabel(type: PublicationType) {
  if (type === "OPPORTUNITY" || type === "JOB") {
    return "Date limite";
  }

  if (type === "TRAINING") {
    return "Date de début";
  }

  if (type === "EVENT") {
    return "Date et heure";
  }

  return "Date importante";
}

function toIsoDate(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function formatLocalPreviewDate(value: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isSuccessStatus(status: string) {
  return status.startsWith("Publication") || status.startsWith("Brouillon") || status.includes("fichier");
}
