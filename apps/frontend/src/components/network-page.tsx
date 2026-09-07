"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Globe2,
  Languages,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  UserRound,
  UsersRound,
} from "lucide-react";
import { getApiErrorMessage, getNetworkMembers, getPublicationsPage, removeNetworkMember, saveNetworkMember } from "@/lib/api";
import type { MemberProfile, NetworkMember, Publication } from "@/lib/api";
import { buildInitials } from "@/lib/member-display";
import { normalizeProfileOption } from "@/lib/profile-options";
import { MemberShell } from "@/components/member-shell";
import { useAppSelector } from "@/store/hooks";

type NetworkFilters = {
  discipline: string;
  country: string;
  city: string;
  language: string;
  availability: string;
};

type ScoredNetworkMember = NetworkMember & {
  matchScore: number;
  matchReasons: string[];
};

const emptyFilters: NetworkFilters = {
  discipline: "",
  country: "",
  city: "",
  language: "",
  availability: "",
};

const defaultAvailabilityFilters = ["Disponible", "Selon projet", "Collaboration", "Formation", "À distance"];
const networkPublicationPageSize = 8;

export function NetworkPage() {
  const { accessToken, profile } = useAppSelector((state) => state.auth);
  const [members, setMembers] = useState<NetworkMember[]>([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<NetworkFilters>(emptyFilters);
  const [selectedId, setSelectedId] = useState("");
  const [networkPublications, setNetworkPublications] = useState<Publication[]>([]);
  const [publicationError, setPublicationError] = useState("");
  const [networkPublicationCursor, setNetworkPublicationCursor] = useState<string | null>(null);
  const [hasMoreNetworkPublications, setHasMoreNetworkPublications] = useState(false);
  const [isLoadingMoreNetworkPublications, setIsLoadingMoreNetworkPublications] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("");
  const [updatingMemberId, setUpdatingMemberId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const networkPublicationLoadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;

    getNetworkMembers(accessToken)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setMembers(response);
        setSelectedId((current) => current || response[0]?.id || "");
      })
      .catch((requestError) => {
        if (!isMounted) {
          return;
        }

        setError(getApiErrorMessage(requestError, "Impossible de charger l'annuaire pour le moment."));
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

  const loadNetworkPublications = useCallback(async (cursor: string | null = null, append = false) => {
    if (!accessToken) {
      return;
    }

    setIsLoadingMoreNetworkPublications(append);

    try {
      const page = await getPublicationsPage(accessToken, {
        destination: "network",
        status: "PUBLISHED",
        limit: networkPublicationPageSize,
        cursor: cursor ?? undefined,
      });

      setNetworkPublications((current) => {
        if (!append) {
          return page.items;
        }

        const seenIds = new Set(current.map((publication) => publication.id));
        return [...current, ...page.items.filter((publication) => !seenIds.has(publication.id))];
      });
      setNetworkPublicationCursor(page.nextCursor);
      setHasMoreNetworkPublications(page.hasMore);
      setPublicationError("");
    } catch (requestError) {
      setPublicationError(getApiErrorMessage(requestError, "Les publications du réseau ne sont pas disponibles pour le moment."));
    } finally {
      setIsLoadingMoreNetworkPublications(false);
    }
  }, [accessToken]);

  useEffect(() => {
    setNetworkPublications([]);
    setNetworkPublicationCursor(null);
    setHasMoreNetworkPublications(false);
    void loadNetworkPublications();
  }, [loadNetworkPublications]);

  useEffect(() => {
    const target = networkPublicationLoadRef.current;

    if (!target || !hasMoreNetworkPublications || !networkPublicationCursor || isLoadingMoreNetworkPublications) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadNetworkPublications(networkPublicationCursor, true);
        }
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMoreNetworkPublications, isLoadingMoreNetworkPublications, loadNetworkPublications, networkPublicationCursor]);

  const scoredMembers = useMemo(
    () => members.map((member) => ({ ...member, ...scoreNetworkMember(member, profile) })),
    [members, profile],
  );

  const directoryMembers = useMemo(
    () => scoredMembers.filter((member) => !member.isCurrentMember),
    [scoredMembers],
  );

  const filterOptions = useMemo(() => ({
    disciplines: uniqueSorted(directoryMembers.map((member) => member.discipline)),
    countries: uniqueSorted(directoryMembers.map((member) => member.country)),
    cities: uniqueSorted(directoryMembers.map((member) => member.city)),
    languages: uniqueSorted(directoryMembers.flatMap((member) => member.languages)),
    availabilities: uniqueSorted([
      ...defaultAvailabilityFilters,
      ...directoryMembers.map((member) => member.availability ?? ""),
    ]),
  }), [directoryMembers]);

  const filteredMembers = useMemo(() => {
    const normalizedQuery = normalizeProfileOption(query);

    return directoryMembers
      .filter((member) => {
        const searchable = normalizeProfileOption([
          member.publicName,
          member.profession,
          member.discipline,
          member.country,
          member.city,
          member.memberNumber,
          member.bio,
          member.availability,
          member.skills.join(" "),
          member.languages.join(" "),
        ].filter(Boolean).join(" "));

        const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
        const matchesDiscipline = !filters.discipline || normalizeProfileOption(member.discipline).includes(normalizeProfileOption(filters.discipline));
        const matchesCountry = !filters.country || normalizeProfileOption(member.country) === normalizeProfileOption(filters.country);
        const matchesCity = !filters.city || normalizeProfileOption(member.city) === normalizeProfileOption(filters.city);
        const matchesLanguage = !filters.language || member.languages.some((language) => normalizeProfileOption(language) === normalizeProfileOption(filters.language));
        const matchesAvailability = !filters.availability || normalizeProfileOption(member.availability ?? "").includes(normalizeProfileOption(filters.availability));

        return matchesQuery && matchesDiscipline && matchesCountry && matchesCity && matchesLanguage && matchesAvailability;
      })
      .sort((first, second) => {
        return second.matchScore - first.matchScore || second.profileCompletion - first.profileCompletion || first.publicName.localeCompare(second.publicName, "fr");
      });
  }, [directoryMembers, filters, query]);

  const selectedMember = filteredMembers.find((member) => member.id === selectedId) ?? filteredMembers[0] ?? null;
  const recommendedMembers = filteredMembers.filter((member) => member.matchScore >= 45).length;
  const connectedMembers = members.filter((member) => member.connected).length;
  const activeFilterCount = Object.values(filters).filter(Boolean).length + (query.trim() ? 1 : 0);

  const updateFilter = (key: keyof NetworkFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setQuery("");
    setFilters(emptyFilters);
  };

  const toggleNetworkConnection = async (member: NetworkMember) => {
    if (!accessToken || member.isCurrentMember || updatingMemberId) {
      return;
    }

    setUpdatingMemberId(member.userId);
    setConnectionStatus("");

    try {
      if (member.connected) {
        await removeNetworkMember(accessToken, member.userId);
        setMembers((current) => current.map((item) => (
          item.userId === member.userId
            ? { ...item, connected: false, connectedAt: null, connectionStatus: null, connectionDirection: null }
            : item
        )));
        setConnectionStatus(`${member.publicName} a été retiré de votre réseau.`);
      } else {
        const response = await saveNetworkMember(accessToken, member.userId);
        setMembers((current) => current.map((item) => (
          item.userId === member.userId
            ? {
                ...item,
                connected: response.connected,
                connectedAt: response.connectedAt,
                connectionKind: response.connectionKind,
                connectionStatus: response.connectionStatus,
                connectionDirection: "OUTGOING",
              }
            : item
        )));
        setConnectionStatus(networkStatusMessage(member, response.connectionStatus));
      }
    } catch (requestError) {
      setConnectionStatus(getApiErrorMessage(requestError, "Impossible de mettre à jour votre réseau pour le moment."));
    } finally {
      setUpdatingMemberId("");
    }
  };

  return (
    <MemberShell activeItem="Réseau">
      <div className="network-layout">
        <section className="member-module-hero network-hero">
          <div>
            <span className="member-kicker">Réseau</span>
            <h1>Trouvez les créateurs et profils utiles pour collaborer plus vite.</h1>
            <p>
              Recherchez par discipline, pays, ville, langues parlées et disponibilité pour identifier
              les bons profils au bon moment.
            </p>
            <div className="member-hero-actions">
              <a className="member-create-button" href="#annuaire-membres">
                Explorer l&apos;annuaire
                <ArrowRight aria-hidden="true" strokeWidth={1.8} />
              </a>
              <button className="member-secondary-button" type="button" onClick={resetFilters}>
                <SlidersHorizontal aria-hidden="true" strokeWidth={1.8} />
                Réinitialiser
              </button>
            </div>
          </div>

          <div className="member-module-highlight-grid">
            <article>
              <UsersRound aria-hidden="true" strokeWidth={1.8} />
              <strong>{directoryMembers.length}</strong>
              <span>Profils</span>
            </article>
            <article>
              <Sparkles aria-hidden="true" strokeWidth={1.8} />
              <strong>{recommendedMembers}</strong>
              <span>Suggestions</span>
            </article>
            <article>
              <Star aria-hidden="true" strokeWidth={1.8} />
              <strong>{connectedMembers}</strong>
              <span>Relations</span>
            </article>
          </div>
        </section>

        <section className="member-card network-toolbar" aria-label="Recherche annuaire">
          <label className="network-search">
            <Search aria-hidden="true" strokeWidth={1.8} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom, discipline, ville, langue, compétence..."
            />
          </label>

          <div className="network-filter-grid">
            <NetworkSelect label="Discipline" value={filters.discipline} options={filterOptions.disciplines} onChange={(value) => updateFilter("discipline", value)} />
            <NetworkSelect label="Pays" value={filters.country} options={filterOptions.countries} onChange={(value) => updateFilter("country", value)} />
            <NetworkSelect label="Ville" value={filters.city} options={filterOptions.cities} onChange={(value) => updateFilter("city", value)} />
            <NetworkSelect label="Langue" value={filters.language} options={filterOptions.languages} onChange={(value) => updateFilter("language", value)} />
            <NetworkSelect label="Disponibilité" value={filters.availability} options={filterOptions.availabilities} onChange={(value) => updateFilter("availability", value)} />
          </div>
        </section>

        <div className="network-grid">
          <section className="network-main" id="annuaire-membres">
            <section className="member-card">
              <div className="member-card-title">
                <div>
                  <h2>Annuaire membres</h2>
                  <p>
                    {filteredMembers.length} profil{filteredMembers.length > 1 ? "s" : ""} trouvé{filteredMembers.length > 1 ? "s" : ""}
                    {activeFilterCount ? ` · ${activeFilterCount} filtre${activeFilterCount > 1 ? "s" : ""} actif${activeFilterCount > 1 ? "s" : ""}` : ""}
                  </p>
                </div>
                {activeFilterCount ? <button type="button" onClick={resetFilters}>Effacer</button> : null}
              </div>

              {isLoading ? (
                <div className="network-loading-state">
                  <Loader2 aria-hidden="true" strokeWidth={1.8} />
                  <span>Chargement de l&apos;annuaire...</span>
                </div>
              ) : error ? (
                <NetworkEmptyState title="Annuaire indisponible" text={error} />
              ) : filteredMembers.length ? (
                <div className="network-member-list">
                  {filteredMembers.map((member) => (
                    <article
                      className={member.id === selectedMember?.id ? "network-member-card is-selected" : "network-member-card"}
                      key={member.id}
                    >
                      <button className="network-member-select" type="button" onClick={() => setSelectedId(member.id)}>
                        <span className="network-card-cover" aria-hidden="true" />
                        <NetworkAvatar member={member} />
                        <div className="network-member-copy">
                          <div>
                            <strong>
                              {member.publicName}
                              {member.profileVerified ? <BadgeCheck className="network-verified-icon" aria-label="Profil vérifié" strokeWidth={1.9} /> : null}
                            </strong>
                            {member.isCurrentMember ? <span>Votre profil</span> : null}
                            {member.connected ? <span>Dans mon réseau</span> : null}
                          </div>
                          <p>{[member.profession, member.discipline].filter(Boolean).join(" · ")}</p>
                          <NetworkMutualPreview member={member} />
                        </div>
                      </button>

                      <div className="network-card-actions">
                        {member.isCurrentMember ? (
                          <Link className="member-secondary-button network-card-main-action" href="/espace-membre/creative-id">
                            <UserRound aria-hidden="true" strokeWidth={1.8} />
                            Mon Creative ID
                          </Link>
                        ) : (
                          <>
                            <button
                              className={member.connected ? "member-secondary-button is-connected" : "member-create-button"}
                              type="button"
                              disabled={updatingMemberId === member.userId || networkActionDisabled(member)}
                              onClick={() => toggleNetworkConnection(member)}
                            >
                              <UsersRound aria-hidden="true" strokeWidth={1.8} />
                              {updatingMemberId === member.userId
                                ? "..."
                                : member.connected
                                  ? networkConnectedLabel(member)
                                  : networkActionLabel(member)}
                            </button>
                            <Link className="member-secondary-button" href={`/espace-membre/messages?memberId=${member.userId}`}>
                              <MessageCircle aria-hidden="true" strokeWidth={1.8} />
                              Message
                            </Link>
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <NetworkEmptyState title="Aucun profil trouvé" text="Essayez une autre discipline, une autre ville ou retirez quelques filtres." />
              )}
            </section>
          </section>

          <aside className="network-side">
            <section className="member-card network-detail-card">
              {selectedMember ? (
                <>
                  <div className="network-detail-header">
                    <NetworkAvatar member={selectedMember} large />
                    <div>
                      <span>{selectedMember.memberNumber}</span>
                      <h2>{selectedMember.publicName}</h2>
                      <p>{[selectedMember.profession, selectedMember.discipline].filter(Boolean).join(" · ")}</p>
                    </div>
                  </div>

                  <div className="network-status-row">
                    <span><ShieldCheck aria-hidden="true" /> {visibilityLabel(selectedMember.visibility)}</span>
                    {selectedMember.profileVerified ? <span><BadgeCheck aria-hidden="true" /> Profil vérifié</span> : null}
                  </div>

                  <p>{selectedMember.bio || "Ce membre n'a pas encore ajouté de biographie."}</p>

                  <div className="network-detail-section">
                    <strong>Correspondance</strong>
                    <div className="network-match-meter" aria-label={`Correspondance ${selectedMember.matchScore}%`}>
                      <span style={{ width: `${selectedMember.matchScore}%` }} />
                    </div>
                    <div className="network-chip-row">
                      {(selectedMember.matchReasons.length ? selectedMember.matchReasons : ["Profil à découvrir"]).map((reason) => (
                        <span key={reason}>{reason}</span>
                      ))}
                    </div>
                    <NetworkMutualPreview member={selectedMember} />
                  </div>

                  <div className="network-detail-section">
                    <strong>Compétences</strong>
                    <div className="network-chip-row">
                      {(selectedMember.skills.length ? selectedMember.skills : [selectedMember.discipline]).slice(0, 6).map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                    </div>
                  </div>

                  <div className="network-detail-section">
                    <strong>Langues et disponibilité</strong>
                    <div className="network-info-list">
                      <span><Languages aria-hidden="true" /> {selectedMember.languages.join(", ") || "Langues à compléter"}</span>
                      <span><Globe2 aria-hidden="true" /> {selectedMember.availability || "Disponibilité à préciser"}</span>
                    </div>
                  </div>

                  <div className="network-detail-actions">
                    <Link className="member-create-button" href={`/espace-membre/reseau/membre/${encodeURIComponent(selectedMember.memberNumber)}`}>
                      <UserRound aria-hidden="true" strokeWidth={1.8} />
                      Voir le profil
                    </Link>
                    <Link className="member-secondary-button" href={`/espace-membre/messages?memberId=${selectedMember.userId}`}>
                      <MessageCircle aria-hidden="true" strokeWidth={1.8} />
                      Message
                    </Link>
                    <button
                      className="member-secondary-button"
                      type="button"
                      disabled={selectedMember.isCurrentMember || updatingMemberId === selectedMember.userId || networkActionDisabled(selectedMember)}
                      onClick={() => toggleNetworkConnection(selectedMember)}
                    >
                      <UsersRound aria-hidden="true" strokeWidth={1.8} />
                      {updatingMemberId === selectedMember.userId
                        ? "Mise à jour..."
                        : selectedMember.connected
                          ? networkConnectedLabel(selectedMember)
                          : networkActionLabel(selectedMember)}
                    </button>
                  </div>
                  {connectionStatus ? <p className="network-action-status">{connectionStatus}</p> : null}
                </>
              ) : (
                <NetworkEmptyState title="Sélectionnez un profil" text="Les informations du membre apparaîtront ici." />
              )}
            </section>

            <section className="member-card network-insight-card">
              <div className="member-card-title">
                <h2>Vos meilleurs filtres</h2>
              </div>
              <div className="network-info-list">
                <button type="button" onClick={() => updateFilter("discipline", profile?.discipline ?? "")}>
                  <Sparkles aria-hidden="true" /> {profile?.discipline || "Votre discipline"}
                </button>
                <button type="button" onClick={() => updateFilter("country", profile?.country ?? "")}>
                  <MapPin aria-hidden="true" /> {profile?.country || "Votre pays"}
                </button>
                <button type="button" onClick={() => updateFilter("language", profile?.languages?.[0] ?? "")}>
                  <Languages aria-hidden="true" /> {profile?.languages?.[0] || "Votre langue principale"}
                </button>
              </div>
            </section>

            <section className="member-card">
              <div className="member-card-title">
                <div>
                  <h2>Publications du réseau</h2>
                  <p>Les projets, questions et collaborations publiés récemment.</p>
                  {publicationError ? <p className="auth-form-error">{publicationError}</p> : null}
                </div>
              </div>
              <div className="social-discussion-list">
                {networkPublications.length ? (
                  networkPublications.map((publication) => (
                    <article key={publication.id}>
                      <span className="list-icon is-gold"><MessageCircle aria-hidden="true" /></span>
                      <div>
                        <strong>{publication.title}</strong>
                        <span>{publication.typeLabel} · {publication.author.displayName}</span>
                        <small>{publication.counts.comments} commentaire{publication.counts.comments > 1 ? "s" : ""} · {publication.counts.reactions} réaction{publication.counts.reactions > 1 ? "s" : ""}</small>
                      </div>
                    </article>
                  ))
                ) : (
                  <article>
                    <span className="list-icon is-gold"><MessageCircle aria-hidden="true" /></span>
                    <div>
                      <strong>Aucune publication récente</strong>
                      <span>Les contenus créés depuis Publier apparaîtront ici.</span>
                    </div>
                  </article>
                )}
                {hasMoreNetworkPublications ? (
                  <div className="member-feed-load-more" ref={networkPublicationLoadRef}>
                    <Loader2 aria-hidden="true" strokeWidth={1.8} />
                    <span>{isLoadingMoreNetworkPublications ? "Chargement..." : "Défilez pour afficher plus"}</span>
                  </div>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </MemberShell>
  );
}

function NetworkSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="network-select">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Tous</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function NetworkAvatar({ member, large = false }: { member: NetworkMember; large?: boolean }) {
  return (
    <span className={large ? "network-avatar network-avatar--large" : "network-avatar"}>
      {member.avatarUrl ? <img src={member.avatarUrl} alt="" loading="lazy" decoding="async" /> : <span>{buildInitials(member.publicName)}</span>}
    </span>
  );
}

function NetworkMutualPreview({ member }: { member: NetworkMember }) {
  if (!member.mutualConnectionCount) {
    return null;
  }

  return (
    <div className="network-mutual-row">
      <span className="network-mutual-avatars" aria-hidden="true">
        {member.mutualConnections.slice(0, 2).map((connection) => (
          <span key={connection.userId}>
            {connection.avatarUrl ? <img src={connection.avatarUrl} alt="" loading="lazy" decoding="async" /> : buildInitials(connection.publicName)}
          </span>
        ))}
      </span>
      <small>{mutualConnectionText(member)}</small>
    </div>
  );
}

function NetworkEmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="member-empty-state">
      <UserRound aria-hidden="true" strokeWidth={1.8} />
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function uniqueSorted(values: string[]) {
  const seen = new Map<string, string>();

  values.forEach((value) => {
    const cleanValue = value?.trim();

    if (!cleanValue) {
      return;
    }

    const key = normalizeProfileOption(cleanValue);

    if (!seen.has(key)) {
      seen.set(key, cleanValue);
    }
  });

  return [...seen.values()].sort((first, second) => first.localeCompare(second, "fr"));
}

function scoreNetworkMember(member: NetworkMember, profile: MemberProfile | null): Pick<ScoredNetworkMember, "matchScore" | "matchReasons"> {
  if (member.isCurrentMember) {
    return {
      matchScore: 100,
      matchReasons: ["Votre profil"],
    };
  }

  let score = Math.min(6, Math.round(member.profileCompletion / 18));
  const reasons: string[] = [];

  if (profile?.discipline && normalizeProfileOption(profile.discipline) === normalizeProfileOption(member.discipline)) {
    score += 24;
    reasons.push("Même discipline");
  }

  const sharedSkills = member.skills.filter((skill) => profile?.skills?.some((profileSkill) => normalizeProfileOption(profileSkill) === normalizeProfileOption(skill)));

  if (sharedSkills.length) {
    score += Math.min(18, sharedSkills.length * 6);
    reasons.push(`${sharedSkills.length} compétence${sharedSkills.length > 1 ? "s" : ""} proche${sharedSkills.length > 1 ? "s" : ""}`);
  }

  if (profile?.country && normalizeProfileOption(profile.country) === normalizeProfileOption(member.country)) {
    score += 12;
    reasons.push("Même pays");
  }

  if (profile?.city && normalizeProfileOption(profile.city) === normalizeProfileOption(member.city)) {
    score += 12;
    reasons.push("Même ville");
  }

  const sharedLanguages = member.languages.filter((language) => profile?.languages?.some((profileLanguage) => normalizeProfileOption(profileLanguage) === normalizeProfileOption(language)));

  if (sharedLanguages.length) {
    score += Math.min(18, sharedLanguages.length * 8);
    reasons.push(`${sharedLanguages.length} langue${sharedLanguages.length > 1 ? "s" : ""} en commun`);
  }

  if (normalizeProfileOption(member.availability ?? "").includes("disponible")) {
    score += 8;
    reasons.push("Disponible");
  }

  if (member.profileVerified) {
    score += 4;
    reasons.push("Profil vérifié");
  }

  if (member.connected) {
    score += 10;
    reasons.push("Déjà dans votre réseau");
  }

  if (member.mutualConnectionCount) {
    score += Math.min(16, member.mutualConnectionCount * 5);
    reasons.push(`${member.mutualConnectionCount} relation${member.mutualConnectionCount > 1 ? "s" : ""} en commun`);
  }

  return {
    matchScore: Math.min(98, Math.max(24, score)),
    matchReasons: reasons.slice(0, 4),
  };
}

function mutualConnectionText(member: NetworkMember) {
  const count = member.mutualConnectionCount;
  const firstConnection = member.mutualConnections[0]?.publicName;

  if (!count) {
    return "";
  }

  if (count === 1) {
    return firstConnection ? `${firstConnection} est une relation en commun` : "1 relation en commun";
  }

  return firstConnection ? `${firstConnection} et ${count - 1} autre${count > 2 ? "s" : ""} relation${count > 2 ? "s" : ""} en commun` : `${count} relations en commun`;
}

function memberLocation(member: NetworkMember) {
  return [member.city, member.country].filter(Boolean).join(", ") || "Localisation à compléter";
}

function memberLanguages(member: NetworkMember) {
  return member.languages.slice(0, 3).join(", ") || "Langues à compléter";
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

function networkActionLabel(member: Pick<NetworkMember, "accountType" | "connectionStatus" | "connectionDirection">) {
  if (member.connectionStatus === "PENDING" && member.connectionDirection === "OUTGOING") {
    return "Invitation envoyée";
  }

  if (member.connectionStatus === "PENDING" && member.connectionDirection === "INCOMING") {
    return "Accepter";
  }

  return isFollowAccount(member) ? "Suivre" : "Se connecter";
}

function networkConnectedLabel(member: Pick<NetworkMember, "accountType">) {
  return isFollowAccount(member) ? "Suivi" : "Connecté";
}

function networkActionDisabled(member: Pick<NetworkMember, "connectionStatus" | "connectionDirection">) {
  return member.connectionStatus === "PENDING" && member.connectionDirection === "OUTGOING";
}

function networkStatusMessage(member: NetworkMember, status: "PENDING" | "ACCEPTED" | "DECLINED") {
  if (isFollowAccount(member)) {
    return `Vous suivez maintenant ${member.publicName}.`;
  }

  if (status === "PENDING") {
    return `Invitation envoyée à ${member.publicName}.`;
  }

  return `${member.publicName} est maintenant dans votre réseau.`;
}
