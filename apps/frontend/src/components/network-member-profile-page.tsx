"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe2,
  Image as ImageIcon,
  Languages,
  Link2,
  Loader2,
  MapPin,
  MessageCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { MemberShell } from "@/components/member-shell";
import {
  getApiErrorMessage,
  getNetworkMemberProfile,
  removeNetworkMember,
  saveNetworkMember,
} from "@/lib/api";
import type { NetworkMember, NetworkMemberProfile } from "@/lib/api";
import { accountTypeLabel, buildInitials } from "@/lib/member-display";
import { useAppSelector } from "@/store/hooks";

export function NetworkMemberProfilePage({ memberNumber }: { memberNumber: string }) {
  const { accessToken } = useAppSelector((state) => state.auth);
  const [data, setData] = useState<NetworkMemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionStatus, setActionStatus] = useState("");
  const [isUpdatingConnection, setIsUpdatingConnection] = useState(false);
  const [activeCreationIndex, setActiveCreationIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;

    getNetworkMemberProfile(accessToken, memberNumber)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setData(response);
        setError("");
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getApiErrorMessage(requestError, "Impossible de charger ce profil pour le moment."));
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
  }, [accessToken, memberNumber]);

  const profile = data?.profile ?? null;
  const location = profile ? [profile.city, profile.country].filter(Boolean).join(", ") : "";
  const professionalTitle = profile ? [accountTypeLabel(profile.accountType), profile.profession, profile.discipline].filter(Boolean).join(" · ") : "";
  const hasLinks = !!(profile?.portfolioUrl || profile?.websiteUrl || profile?.cvUrl || data?.socialLinks.length);
  const creationPublications = useMemo(
    () => data?.publications.filter((publication) => publication.type === "CREATION").slice(0, 9) ?? [],
    [data?.publications],
  );
  const projectPublications = useMemo(
    () => data?.publications
      .filter((publication) => publication.type !== "CREATION" && (publication.type === "PROJECT" || publication.routingDestinations.includes("creative-id")))
      .slice(0, 6) ?? [],
    [data?.publications],
  );
  const recentPublications = data?.publications.slice(0, 8) ?? [];
  const showCreationShowcase = !!profile && (profile.accountType === "CREATOR" || creationPublications.length > 0);
  const activeCreation = activeCreationIndex === null ? null : creationPublications[activeCreationIndex] ?? null;
  const activeCreationMedia = activeCreation ? getPublicationMedia(activeCreation) : null;

  useEffect(() => {
    if (!activeCreationMedia) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveCreationIndex(null);
      }

      if (event.key === "ArrowLeft") {
        setActiveCreationIndex((current) => getPreviousIndex(current, creationPublications.length));
      }

      if (event.key === "ArrowRight") {
        setActiveCreationIndex((current) => getNextIndex(current, creationPublications.length));
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeCreationMedia, creationPublications.length]);

  async function toggleNetworkConnection() {
    if (!accessToken || !profile || profile.isCurrentMember || isUpdatingConnection) {
      return;
    }

    setIsUpdatingConnection(true);
    setActionStatus("");

    try {
      if (profile.connected) {
        await removeNetworkMember(accessToken, profile.userId);
        updateProfileConnection(false, null, null);
        setActionStatus(`${profile.publicName} a été retiré de votre réseau.`);
      } else {
        const response = await saveNetworkMember(accessToken, profile.userId);
        updateProfileConnection(response.connected, response.connectedAt, response.connectionStatus);
        setActionStatus(networkProfileStatusMessage(profile, response.connectionStatus));
      }
    } catch (requestError) {
      setActionStatus(getApiErrorMessage(requestError, "Impossible de mettre à jour votre réseau pour le moment."));
    } finally {
      setIsUpdatingConnection(false);
    }
  }

  function updateProfileConnection(connected: boolean, connectedAt: string | null, connectionStatus: NetworkMember["connectionStatus"]) {
    setData((current) => current ? {
      ...current,
      profile: {
        ...current.profile,
        connected,
        connectedAt,
        connectionStatus,
        connectionDirection: connectionStatus ? "OUTGOING" : null,
      },
    } : current);
  }

  return (
    <MemberShell activeItem="Réseau">
      <div className="network-profile-layout">
        <Link className="network-profile-back" href="/espace-membre/reseau">
          <ArrowLeft aria-hidden="true" strokeWidth={1.8} />
          Annuaire membres
        </Link>

        {isLoading ? (
          <section className="member-card network-profile-loading">
            <Loader2 aria-hidden="true" strokeWidth={1.8} />
            <span>Chargement du profil...</span>
          </section>
        ) : error || !profile ? (
          <section className="member-card">
            <div className="member-empty-state">
              <UserRound aria-hidden="true" strokeWidth={1.8} />
              <strong>Profil indisponible</strong>
              <p>{error || "Ce profil n'est pas accessible."}</p>
            </div>
          </section>
        ) : (
          <>
            <section className="network-profile-hero">
              <div className="network-profile-cover" />
              <div className="network-profile-identity">
                <NetworkProfileAvatar profile={profile} />
                <div>
                  <span className="member-kicker">Profil membre</span>
                  <h1>{profile.publicName}</h1>
                  <p>{professionalTitle}</p>
                  <div className="network-profile-badges">
                    <span><ShieldCheck aria-hidden="true" /> {visibilityLabel(profile.visibility)}</span>
                    {profile.profileVerified ? <span><BadgeCheck aria-hidden="true" /> Profil vérifié</span> : null}
                    {location ? <span><MapPin aria-hidden="true" /> {location}</span> : null}
                  </div>
                </div>
              </div>

              <div className="network-profile-actions">
                {!profile.isCurrentMember ? (
                  <button
                    className={profile.connected ? "member-secondary-button is-connected" : "member-create-button"}
                    type="button"
                    disabled={isUpdatingConnection || networkProfileActionDisabled(profile)}
                    onClick={toggleNetworkConnection}
                  >
                    <UsersRound aria-hidden="true" strokeWidth={1.8} />
                    {isUpdatingConnection
                      ? "Mise à jour..."
                      : profile.connected
                        ? networkProfileConnectedLabel(profile)
                        : networkProfileActionLabel(profile)}
                  </button>
                ) : null}
                {!profile.isCurrentMember ? (
                  <Link className="member-secondary-button" href={`/espace-membre/messages?memberId=${profile.userId}`}>
                    <MessageCircle aria-hidden="true" strokeWidth={1.8} />
                    Message
                  </Link>
                ) : null}
              </div>
              {actionStatus ? <p className="network-action-status">{actionStatus}</p> : null}
            </section>

            <div className="network-profile-grid">
              <section className="network-profile-main">
                {showCreationShowcase ? (
                  <section className="member-card network-profile-section network-profile-showcase">
                    <div className="member-card-title">
                      <div>
                        <h2>Créations à la une</h2>
                        <p>
                          {profile.isCurrentMember
                            ? "Votre vitrine publique mettra d'abord en avant les œuvres que vous publiez."
                            : "La partie artistique visible en premier sur ce profil."}
                        </p>
                      </div>
                      {profile.isCurrentMember ? (
                        <Link className="member-secondary-button" href="/espace-membre/publier?type=CREATION">
                          <Plus aria-hidden="true" strokeWidth={1.8} />
                          Publier une création
                        </Link>
                      ) : null}
                    </div>
                    <ProfileCreationGallery
                      publications={creationPublications}
                      isCurrentMember={profile.isCurrentMember}
                      onPreview={(index) => setActiveCreationIndex(index)}
                    />
                  </section>
                ) : null}

                <section className="member-card network-profile-section">
                  <div className="member-card-title">
                    <div>
                      <h2>À propos</h2>
                      <p>Présentation du membre</p>
                    </div>
                  </div>
                  <p className="network-profile-bio">{profile.bio || "Ce membre n'a pas encore ajouté de biographie."}</p>
                  <div className="network-profile-facts">
                    <article>
                      <BriefcaseBusiness aria-hidden="true" strokeWidth={1.8} />
                      <span>Discipline</span>
                      <strong>{profile.discipline}</strong>
                    </article>
                    <article>
                      <MapPin aria-hidden="true" strokeWidth={1.8} />
                      <span>Localisation</span>
                      <strong>{location || "Non renseignée"}</strong>
                    </article>
                    <article>
                      <CalendarDays aria-hidden="true" strokeWidth={1.8} />
                      <span>Disponibilité</span>
                      <strong>{profile.availability || "À préciser"}</strong>
                    </article>
                  </div>
                </section>

                <section className="member-card network-profile-section">
                  <div className="member-card-title">
                    <div>
                      <h2>Compétences et langues</h2>
                      <p>Les informations utiles pour identifier une collaboration possible.</p>
                    </div>
                  </div>
                  <div className="network-profile-tag-grid">
                    <div>
                      <strong>Compétences</strong>
                      <div className="network-chip-row">
                        {profile.skills.length ? profile.skills.map((skill) => <span key={skill}>{skill}</span>) : <span>Non renseignées</span>}
                      </div>
                    </div>
                    <div>
                      <strong>Langues</strong>
                      <div className="network-chip-row">
                        {profile.languages.length ? profile.languages.map((language) => <span key={language}>{language}</span>) : <span>Non renseignées</span>}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="member-card network-profile-section">
                  <div className="member-card-title">
                    <div>
                      <h2>Projets et initiatives</h2>
                      <p>Les projets, collaborations et initiatives visibles dans son Creative ID.</p>
                    </div>
                  </div>
                  <ProfilePublicationGrid publications={projectPublications} emptyText="Aucun projet publié pour le moment." />
                </section>

                <section className="member-card network-profile-section">
                  <div className="member-card-title">
                    <div>
                      <h2>Publications récentes</h2>
                      <p>Activité visible dans le réseau CCA.</p>
                    </div>
                  </div>
                  <ProfilePublicationGrid publications={recentPublications} emptyText="Aucune publication visible pour le moment." compact />
                </section>
              </section>

              <aside className="network-profile-side">
                <section className="member-card network-profile-section">
                  <div className="member-card-title">
                    <h2>Creative ID</h2>
                  </div>
                  <div className="network-profile-number">
                    <FileText aria-hidden="true" strokeWidth={1.8} />
                    <strong>{profile.memberNumber}</strong>
                    <span>{visibilityLabel(profile.visibility)}</span>
                  </div>
                </section>

                <section className="member-card network-profile-section">
                  <div className="member-card-title">
                    <h2>Relations en commun</h2>
                  </div>
                  {profile.mutualConnectionCount ? (
                    <div className="network-profile-mutual-list">
                      {profile.mutualConnections.map((connection) => (
                        <article key={connection.userId}>
                          <span>
                            {connection.avatarUrl ? <img src={connection.avatarUrl} alt="" loading="lazy" decoding="async" /> : buildInitials(connection.publicName)}
                          </span>
                          <strong>{connection.publicName}</strong>
                        </article>
                      ))}
                      <small>{profile.mutualConnectionCount} relation{profile.mutualConnectionCount > 1 ? "s" : ""} en commun</small>
                    </div>
                  ) : (
                    <p className="network-profile-muted">Aucune relation en commun pour le moment.</p>
                  )}
                </section>

                <section className="member-card network-profile-section">
                  <div className="member-card-title">
                    <h2>Liens et documents</h2>
                  </div>
                  <div className="network-profile-link-list">
                    {hasLinks ? (
                      <>
                        <ProfileExternalLink label="Portfolio" url={profile.portfolioUrl} icon="link" />
                        <ProfileExternalLink label="Site web" url={profile.websiteUrl} icon="globe" />
                        <ProfileExternalLink label="CV" url={profile.cvUrl} icon="file" />
                        {data!.socialLinks.map((link) => (
                          <ProfileExternalLink key={link.id} label={link.network} url={link.url} icon="link" />
                        ))}
                      </>
                    ) : (
                      <p className="network-profile-muted">Aucun lien partagé pour le moment.</p>
                    )}
                  </div>
                </section>

                <section className="member-card network-profile-section">
                  <div className="member-card-title">
                    <h2>Portfolio</h2>
                  </div>
                  {data!.portfolioItems.length ? (
                    <div className="network-profile-portfolio-list">
                      {data!.portfolioItems.map((item) => (
                        <article key={item.id}>
                          <strong>{item.title}</strong>
                          <span>{[item.category, item.year].filter(Boolean).join(" · ")}</span>
                          {item.externalUrl ? <a href={item.externalUrl} target="_blank" rel="noreferrer">Ouvrir</a> : null}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="network-profile-muted">Aucun élément portfolio publié.</p>
                  )}
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
      {activeCreation && activeCreationMedia ? (
        <div className="gallery-lightbox network-creation-lightbox" role="dialog" aria-modal="true" aria-label={activeCreation.title}>
          <button className="gallery-lightbox-close" type="button" onClick={() => setActiveCreationIndex(null)} aria-label="Fermer l'aperçu">
            <X aria-hidden="true" strokeWidth={1.8} />
          </button>
          <button className="gallery-lightbox-nav gallery-lightbox-nav--prev" type="button" onClick={() => setActiveCreationIndex((current) => getPreviousIndex(current, creationPublications.length))} aria-label="Création précédente">
            <ChevronLeft aria-hidden="true" strokeWidth={1.8} />
          </button>
          <figure>
            {activeCreationMedia.type === "video" ? (
              <video src={activeCreationMedia.url} controls autoPlay playsInline />
            ) : (
              <img src={activeCreationMedia.url} alt={activeCreation.title} />
            )}
            <figcaption>
              <strong>{activeCreation.title}</strong>
              <p>{[activeCreation.category || "Création", activeCreation.excerpt].filter(Boolean).join(" · ")}</p>
            </figcaption>
          </figure>
          <button className="gallery-lightbox-nav gallery-lightbox-nav--next" type="button" onClick={() => setActiveCreationIndex((current) => getNextIndex(current, creationPublications.length))} aria-label="Création suivante">
            <ChevronRight aria-hidden="true" strokeWidth={1.8} />
          </button>
        </div>
      ) : null}
    </MemberShell>
  );
}

function NetworkProfileAvatar({ profile }: { profile: NetworkMember }) {
  return (
    <span className="network-profile-avatar">
      {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" loading="lazy" decoding="async" /> : buildInitials(profile.publicName)}
    </span>
  );
}

function ProfileCreationGallery({
  publications,
  isCurrentMember,
  onPreview,
}: {
  publications: NetworkMemberProfile["publications"];
  isCurrentMember: boolean;
  onPreview: (index: number) => void;
}) {
  if (!publications.length) {
    return (
      <div className="network-profile-showcase-empty">
        <div className="network-profile-empty-art" aria-hidden="true">
          <span><ImageIcon strokeWidth={1.8} /></span>
          <span />
          <span />
        </div>
        <div className="network-profile-empty-copy">
          <strong>{isCurrentMember ? "Votre galerie attend sa première création" : "Galerie en préparation"}</strong>
          <p>
            {isCurrentMember
              ? "Publiez une œuvre avec un visuel pour donner immédiatement de la matière à votre profil public."
              : "Ce créateur n'a pas encore mis d'œuvre en avant. Ses créations apparaîtront ici dès publication."}
          </p>
        </div>
        {isCurrentMember ? (
          <Link className="member-create-button" href="/espace-membre/publier?type=CREATION">
            <Plus aria-hidden="true" strokeWidth={1.8} />
            Publier une création
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="network-profile-creation-gallery">
      {publications.map((publication, index) => (
        <article key={publication.id}>
          <button
            className="network-profile-creation-card"
            type="button"
            disabled={!getPublicationMedia(publication)}
            onClick={() => onPreview(index)}
            aria-label={`Visualiser ${publication.title}`}
          >
            <PublicationMedia publication={publication} />
            <div>
              <small>{publication.category || "Création"}</small>
              <strong>{publication.title}</strong>
              {publication.excerpt ? <p>{publication.excerpt}</p> : null}
              <span>{publication.counts.reactions} réaction{publication.counts.reactions > 1 ? "s" : ""} · {publication.counts.comments} commentaire{publication.counts.comments > 1 ? "s" : ""}</span>
            </div>
          </button>
        </article>
      ))}
    </div>
  );
}

function ProfilePublicationGrid({
  publications,
  emptyText,
  compact = false,
}: {
  publications: NetworkMemberProfile["publications"];
  emptyText: string;
  compact?: boolean;
}) {
  if (!publications.length) {
    return <p className="network-profile-muted">{emptyText}</p>;
  }

  return (
    <div className={compact ? "network-profile-publications is-compact" : "network-profile-publications"}>
      {publications.map((publication) => (
        <article key={publication.id}>
          <PublicationMedia publication={publication} />
          <div>
            <small>{publication.typeLabel}{publication.category ? ` · ${publication.category}` : ""}</small>
            <strong>{publication.title}</strong>
            <p>{publication.excerpt}</p>
            <div>
              <span>{publication.counts.reactions} réaction{publication.counts.reactions > 1 ? "s" : ""}</span>
              <span>{publication.counts.comments} commentaire{publication.counts.comments > 1 ? "s" : ""}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function PublicationMedia({ publication }: { publication: NetworkMemberProfile["publications"][number] }) {
  const media = getPublicationMedia(publication);

  if (media?.type === "image") {
    return <img src={media.url} alt="" loading="lazy" decoding="async" />;
  }

  if (media?.type === "video") {
    return <video src={media.url} muted playsInline preload="metadata" />;
  }

  return <span><Sparkles aria-hidden="true" strokeWidth={1.8} /></span>;
}

function getPublicationMedia(publication: NetworkMemberProfile["publications"][number]) {
  const coverImageUrl = publication.coverImageUrl || publication.attachments.find((attachment) => attachment.type === "IMAGE")?.url;

  if (coverImageUrl) {
    return { type: "image" as const, url: coverImageUrl };
  }

  const videoUrl = publication.attachments.find((attachment) => attachment.type === "VIDEO")?.url;

  if (videoUrl) {
    return { type: "video" as const, url: videoUrl };
  }

  return null;
}

function getPreviousIndex(current: number | null, total: number) {
  if (!total) {
    return null;
  }

  return current === null || current <= 0 ? total - 1 : current - 1;
}

function getNextIndex(current: number | null, total: number) {
  if (!total) {
    return null;
  }

  return current === null || current >= total - 1 ? 0 : current + 1;
}

function ProfileExternalLink({ label, url, icon }: { label: string; url: string | null; icon: "file" | "globe" | "link" }) {
  const Icon = icon === "file" ? FileText : icon === "globe" ? Globe2 : Link2;

  if (!url) {
    return null;
  }

  return (
    <a href={url} target="_blank" rel="noreferrer">
      <Icon aria-hidden="true" strokeWidth={1.8} />
      <span>{label}</span>
      <ExternalLink aria-hidden="true" strokeWidth={1.8} />
    </a>
  );
}

function visibilityLabel(visibility: NetworkMember["visibility"]) {
  if (visibility === "PUBLIC") {
    return "Public";
  }

  if (visibility === "PRIVATE") {
    return "Privé";
  }

  return "Membres CCA";
}

function isFollowAccount(member: Pick<NetworkMember, "accountType">) {
  return member.accountType === "ORGANIZATION" || member.accountType === "PARTNER" || member.accountType === "ADMIN";
}

function networkProfileActionLabel(member: Pick<NetworkMember, "accountType" | "connectionStatus" | "connectionDirection">) {
  if (member.connectionStatus === "PENDING" && member.connectionDirection === "OUTGOING") {
    return "Invitation envoyée";
  }

  if (member.connectionStatus === "PENDING" && member.connectionDirection === "INCOMING") {
    return "Accepter";
  }

  return isFollowAccount(member) ? "Suivre" : "Se connecter";
}

function networkProfileConnectedLabel(member: Pick<NetworkMember, "accountType">) {
  return isFollowAccount(member) ? "Suivi" : "Connecté";
}

function networkProfileActionDisabled(member: Pick<NetworkMember, "connectionStatus" | "connectionDirection">) {
  return member.connectionStatus === "PENDING" && member.connectionDirection === "OUTGOING";
}

function networkProfileStatusMessage(member: NetworkMember, status: NetworkMember["connectionStatus"]) {
  if (isFollowAccount(member)) {
    return `Vous suivez maintenant ${member.publicName}.`;
  }

  if (status === "PENDING") {
    return `Invitation envoyée à ${member.publicName}.`;
  }

  return `${member.publicName} est maintenant dans votre réseau.`;
}
