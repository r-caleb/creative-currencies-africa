"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  ExternalLink,
  FileText,
  Globe2,
  Languages,
  Link2,
  Loader2,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
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
  const highlightedPublications = useMemo(
    () => data?.publications.filter((publication) => publication.routingDestinations.includes("creative-id") || publication.type === "CREATION" || publication.type === "PROJECT").slice(0, 6) ?? [],
    [data?.publications],
  );
  const recentPublications = data?.publications.slice(0, 8) ?? [];

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
                      <h2>Créations et projets</h2>
                      <p>Les contenus que ce membre met en avant dans son Creative ID.</p>
                    </div>
                  </div>
                  <ProfilePublicationGrid publications={highlightedPublications} emptyText="Aucune création ou projet publié pour le moment." />
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
                            {connection.avatarUrl ? <img src={connection.avatarUrl} alt="" /> : buildInitials(connection.publicName)}
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
    </MemberShell>
  );
}

function NetworkProfileAvatar({ profile }: { profile: NetworkMember }) {
  return (
    <span className="network-profile-avatar">
      {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : buildInitials(profile.publicName)}
    </span>
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
          {publication.coverImageUrl ? <img src={publication.coverImageUrl} alt="" /> : <span><Sparkles aria-hidden="true" strokeWidth={1.8} /></span>}
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
