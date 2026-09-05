"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Lightbulb,
  Loader2,
  MapPin,
  Palette,
  Search,
  Trophy,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MemberShell } from "@/components/member-shell";
import { useVisibleItems } from "@/hooks/use-visible-items";
import { applyToOpportunity, getApiErrorMessage, getMemberOpportunities } from "@/lib/api";
import type { MemberOpportunitiesResponse, MemberOpportunity, MemberProfile } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";

const filters = [
  "Toutes",
  "Appels",
  "Missions",
  "Emplois",
  "Résidences",
  "Financements",
  "Collaborations",
  "Formations",
  "Officielles CCA",
  "Mes candidatures",
  "Mes publications",
];

type OpportunityApplicationForm = {
  motivation: string;
  discipline: string;
  city: string;
  phone: string;
  portfolioUrl: string;
  cvUrl: string;
  fileUrl: string;
  linksText: string;
  socialLinksText: string;
};

export function OpportunitiesPage() {
  const { accessToken, profile, user } = useAppSelector((state) => state.auth);
  const [data, setData] = useState<MemberOpportunitiesResponse | null>(null);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Toutes");
  const [selectedId, setSelectedId] = useState("");
  const [applicationForm, setApplicationForm] = useState<OpportunityApplicationForm>({
    motivation: "",
    discipline: "",
    city: "",
    phone: "",
    portfolioUrl: "",
    cvUrl: "",
    fileUrl: "",
    linksText: "",
    socialLinksText: "",
  });
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    setIsLoading(true);
    getMemberOpportunities(accessToken)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        const safeResponse: MemberOpportunitiesResponse = {
          accountType: response.accountType ?? "MEMBER",
          canPublishOpportunity: !!response.canPublishOpportunity,
          catalog: response.catalog ?? [],
          myApplications: response.myApplications ?? [],
          myPublished: response.myPublished ?? [],
        };

        setData(safeResponse);
        setSelectedId((current) => current || safeResponse.catalog[0]?.id || "");
        setStatus("");
      })
      .catch((error) => {
        if (isMounted) {
          setStatus(getApiErrorMessage(error, "Impossible de charger les opportunités pour le moment."));
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

  const catalog = data?.catalog ?? [];
  const filteredOpportunities = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    return catalog.filter((opportunity) => {
      const normalizedCategory = normalizeSearch(opportunity.category);
      const matchesFilter =
        activeFilter === "Toutes" ||
        (activeFilter === "Appels" && (normalizedCategory.includes("appel") || normalizedCategory.includes("concours"))) ||
        (activeFilter === "Missions" && normalizedCategory.includes("mission")) ||
        (activeFilter === "Emplois" && normalizedCategory.includes("emploi")) ||
        (activeFilter === "Résidences" && normalizedCategory.includes("residence")) ||
        (activeFilter === "Financements" && normalizedCategory.includes("financement")) ||
        (activeFilter === "Collaborations" && normalizedCategory.includes("collaboration")) ||
        (activeFilter === "Formations" && normalizedCategory.includes("formation")) ||
        (activeFilter === "Officielles CCA" && opportunity.official) ||
        (activeFilter === "Mes candidatures" && !!opportunity.application) ||
        (activeFilter === "Mes publications" && opportunity.canManage);
      const haystack = normalizeSearch([
        opportunity.title,
        opportunity.category,
        opportunity.location,
        opportunity.mode,
        opportunity.description,
        opportunity.organizer,
        opportunity.reward,
        opportunity.disciplines.join(" "),
      ].join(" "));

      return matchesFilter && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [activeFilter, catalog, query]);
  const visibleOpportunities = useVisibleItems(filteredOpportunities, 10);

  const selectedOpportunity = filteredOpportunities.find((opportunity) => opportunity.id === selectedId) ?? filteredOpportunities[0] ?? catalog[0] ?? null;
  const submittedCount = catalog.filter((opportunity) => opportunity.application?.status === "SUBMITTED").length;
  const draftCount = catalog.filter((opportunity) => opportunity.application?.status === "DRAFT").length;
  const recommendedCount = catalog.filter((opportunity) => opportunity.fit >= 80).length;
  const preparationSteps = useMemo(() => buildPreparationSteps(profile, applicationForm.motivation), [applicationForm.motivation, profile]);
  const readiness = calculateApplicationReadiness(profile, applicationForm.motivation);
  const readyStepCount = preparationSteps.filter((step) => step.done).length;
  const visibleFilters = filters.filter((filter) => filter !== "Mes publications" || data?.canPublishOpportunity || (data?.myPublished.length ?? 0) > 0);
  const highlights = [
    { label: "Ouvertes", value: String(catalog.length), icon: Trophy },
    { label: "Pour vous", value: String(recommendedCount), icon: BadgeCheck },
    { label: "Dossiers", value: String(submittedCount + draftCount), icon: FileText },
  ];

  useEffect(() => {
    setApplicationForm({
      motivation: selectedOpportunity?.application?.motivation ?? "",
      discipline: selectedOpportunity?.application?.discipline ?? profile?.discipline ?? profile?.otherDiscipline ?? "",
      city: selectedOpportunity?.application?.city ?? profile?.city ?? "",
      phone: selectedOpportunity?.application?.phone ?? user?.phone ?? "",
      portfolioUrl: selectedOpportunity?.application?.portfolioUrl ?? profile?.portfolioUrl ?? profile?.websiteUrl ?? "",
      cvUrl: selectedOpportunity?.application?.cvUrl ?? profile?.cvUrl ?? "",
      fileUrl: selectedOpportunity?.application?.fileUrl ?? "",
      linksText: (selectedOpportunity?.application?.links ?? []).join("\n"),
      socialLinksText: (selectedOpportunity?.application?.socialLinks ?? []).join("\n"),
    });
  }, [profile, selectedOpportunity?.application, selectedOpportunity?.id, user?.phone]);

  const applicationPayload = () => ({
    motivation: applicationForm.motivation.trim() || undefined,
    discipline: applicationForm.discipline.trim() || undefined,
    city: applicationForm.city.trim() || undefined,
    phone: applicationForm.phone.trim() || undefined,
    portfolioUrl: applicationForm.portfolioUrl.trim() || undefined,
    cvUrl: applicationForm.cvUrl.trim() || undefined,
    fileUrl: applicationForm.fileUrl.trim() || undefined,
    links: splitTextareaList(applicationForm.linksText),
    socialLinks: splitTextareaList(applicationForm.socialLinksText),
  });

  const saveApplication = async (opportunity: MemberOpportunity) => {
    setSelectedId(opportunity.id);

    if (!opportunity.canApply || opportunity.source !== "opportunity") {
      if (opportunity.linkUrl) {
        window.open(opportunity.linkUrl, "_blank", "noopener,noreferrer");
        setStatus("Le lien de candidature a été ouvert dans un nouvel onglet.");
      } else {
        setStatus("Cette opportunité est une annonce. Consultez les modalités indiquées par l'auteur.");
      }

      return;
    }

    if (!accessToken) {
      setStatus("Connectez-vous pour préparer une candidature.");
      return;
    }

    setIsApplying(true);
    setStatus("");

    try {
      const response = await applyToOpportunity(accessToken, opportunity.id, {
        status: "DRAFT",
        ...applicationPayload(),
      });
      setData(response.opportunities);
      setSelectedId(opportunity.id);
      setStatus("Dossier ouvert. Vous pouvez le compléter avant de l'envoyer.");
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Impossible d'ouvrir le dossier pour le moment."));
    } finally {
      setIsApplying(false);
    }
  };

  const submitApplication = async (opportunity: MemberOpportunity) => {
    setSelectedId(opportunity.id);

    if (!opportunity.canApply || opportunity.source !== "opportunity") {
      await saveApplication(opportunity);
      return;
    }

    if (!accessToken) {
      setStatus("Connectez-vous pour soumettre une candidature.");
      return;
    }

    setIsApplying(true);
    setStatus("");

    try {
      const response = await applyToOpportunity(accessToken, opportunity.id, {
        status: "SUBMITTED",
        ...applicationPayload(),
      });
      setData(response.opportunities);
      setSelectedId(opportunity.id);
      setStatus("Candidature envoyée. Elle apparaît maintenant dans Mes candidatures.");
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Impossible d'envoyer la candidature pour le moment."));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <MemberShell activeItem="Opportunités">
      <div className="opportunities-layout">
        <section className="opportunities-hero">
          <div>
            <span className="member-kicker">Opportunités</span>
            <h1>Trouvez les appels qui font avancer votre parcours créatif.</h1>
            <p>
              Missions, appels à projets, résidences, financements et offres sont centralisés
              selon votre profil, votre discipline et votre niveau de préparation.
            </p>
            <div className="member-hero-actions">
              <a className="member-create-button" href="#opportunites-recommandees">
                Explorer les opportunités
                <ArrowRight aria-hidden="true" strokeWidth={1.8} />
              </a>
              {data?.canPublishOpportunity ? (
                <a className="member-secondary-button" href="/espace-membre/publier">Publier une opportunité</a>
              ) : (
                <a className="member-secondary-button" href="#mes-candidatures">Voir mes dossiers</a>
              )}
            </div>
          </div>

          <div className="opportunities-highlight-grid">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.label}>
                  <Icon aria-hidden="true" strokeWidth={1.8} />
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              );
            })}
          </div>
        </section>

        <section className="member-card opportunities-toolbar">
          <label className="opportunities-search">
            <Search aria-hidden="true" strokeWidth={1.8} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher une opportunité, une ville, une discipline..."
            />
          </label>
          <div className="opportunities-filters" aria-label="Filtres opportunités">
            {visibleFilters.map((filter) => (
              <button
                key={filter}
                className={filter === activeFilter ? "is-active" : undefined}
                type="button"
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </section>

        {status ? <p className={status.startsWith("Impossible") ? "auth-form-error" : "auth-form-success"}>{status}</p> : null}

        <div className="opportunities-grid">
          <section className="opportunities-main">
            <section id="opportunites-recommandees" className="member-card">
              <div className="member-card-title">
                <div>
                  <h2>Opportunités disponibles</h2>
                  <p>
                    Les appels ouverts pour les membres CCA
                    {profile?.discipline ? `, avec une priorité pour ${profile.discipline}` : ""}.
                  </p>
                </div>
                <span className="opportunity-count">{filteredOpportunities.length} résultat{filteredOpportunities.length > 1 ? "s" : ""}</span>
              </div>

              {isLoading ? (
                <EmptyOpportunityState title="Chargement des opportunités" text="Nous préparons les opportunités accessibles à votre profil." />
              ) : filteredOpportunities.length ? (
                <div className="opportunity-card-list">
                  {visibleOpportunities.visibleItems.map((item) => {
                    const Icon = opportunityIcon(item);

                    return (
                      <article key={item.id} className={item.id === selectedOpportunity?.id ? "is-selected" : undefined}>
                        <span className="opportunity-icon"><Icon aria-hidden="true" strokeWidth={1.8} /></span>
                        <div className="opportunity-copy">
                          <div>
                            <span>{item.official ? "Officielle CCA" : item.category}</span>
                            <strong>{item.title}</strong>
                          </div>
                          <p>{item.description}</p>
                          <div className="opportunity-meta">
                            <span><CalendarDays aria-hidden="true" /> Date limite : {item.deadlineLabel}</span>
                            <span><MapPin aria-hidden="true" /> {item.location}</span>
                            <span><BadgeCheck aria-hidden="true" /> Compatibilité {item.fit}%</span>
                          </div>
                        </div>
                        <button className="member-secondary-button" type="button" disabled={isApplying} onClick={() => void saveApplication(item)}>
                          {item.application ? statusLabel(item.application.status) : item.canApply ? "Postuler" : "Modalités"}
                        </button>
                      </article>
                    );
                  })}
                  {visibleOpportunities.hasMore ? (
                    <div className="member-feed-load-more" ref={visibleOpportunities.loadMoreRef}>
                      <Loader2 aria-hidden="true" strokeWidth={1.8} />
                      <span>Défilez pour afficher plus d'opportunités</span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <EmptyOpportunityState
                  title="Aucune opportunité trouvée"
                  text="Essayez une autre catégorie, une autre ville ou revenez à toutes les opportunités."
                  onReset={() => {
                    setQuery("");
                    setActiveFilter("Toutes");
                  }}
                />
              )}
            </section>

            <section id="mes-candidatures" className="member-card">
              <div className="member-card-title">
                <div>
                  <h2>Mes candidatures</h2>
                  <p>Suivez les dossiers que vous avez préparés ou envoyés.</p>
                </div>
              </div>
              <div className="application-list">
                {data?.myApplications.length ? (
                  data.myApplications.map((opportunity) => {
                    const progress = applicationProgress(opportunity.application?.status);
                    const application = opportunity.application;

                    return (
                      <article key={opportunity.id} className="application-tracking-card">
                        <div>
                          <strong>{opportunity.title}</strong>
                          <span>{statusLabel(application?.status)} · {opportunity.category}</span>
                          <small>
                            {application?.submittedAt
                              ? `Envoyée le ${formatTrackingDate(application.submittedAt)}`
                              : application?.createdAt
                                ? `Ouverte le ${formatTrackingDate(application.createdAt)}`
                                : "Dossier en préparation"}
                          </small>
                        </div>
                        <div className="application-progress" aria-label={`Progression ${progress}%`}>
                          <span style={{ width: `${progress}%` }} />
                        </div>
                        <div className="application-tracking-actions">
                          <small>{progress}%</small>
                          {application?.adminNote ? <em>{application.adminNote}</em> : null}
                          <button type="button" onClick={() => setSelectedId(opportunity.id)}>Ouvrir</button>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <article>
                    <div>
                      <strong>Aucune candidature ouverte</strong>
                      <span>Préparez un dossier depuis une opportunité disponible.</span>
                    </div>
                    <div className="application-progress" aria-label="Progression 0%">
                      <span style={{ width: "0%" }} />
                    </div>
                    <small>0%</small>
                  </article>
                )}
              </div>
            </section>
          </section>

          <aside className="opportunities-side">
            {selectedOpportunity ? (
              <section className="member-card opportunity-detail-card">
                <span className="member-kicker">Détail</span>
                <strong>{selectedOpportunity.title}</strong>
                <p>{selectedOpportunity.description}</p>
                <div className="opportunity-detail-meta">
                  <span><BriefcaseBusiness aria-hidden="true" /> {selectedOpportunity.organizer}</span>
                  <span><MapPin aria-hidden="true" /> {selectedOpportunity.location} · {selectedOpportunity.mode}</span>
                  <span><Trophy aria-hidden="true" /> {selectedOpportunity.reward}</span>
                </div>
                <div className="creative-skill-list">
                  {selectedOpportunity.disciplines.length ? selectedOpportunity.disciplines.map((discipline) => <span key={discipline}>{discipline}</span>) : <span>Toutes disciplines</span>}
                </div>
                <div className="training-check-list">
                  {selectedOpportunity.requirements.map((requirement) => (
                    <article key={requirement}>
                      <CheckCircle2 aria-hidden="true" /> {requirement}
                    </article>
                  ))}
                </div>
                {selectedOpportunity.source === "opportunity" && selectedOpportunity.canApply ? (
                  <div className="opportunity-application-form">
                    <label className="opportunity-motivation-field">
                      <span>Message de motivation</span>
                      <textarea
                        value={applicationForm.motivation}
                        onChange={(event) => setApplicationForm((current) => ({ ...current, motivation: event.target.value }))}
                        placeholder="Expliquez en quelques lignes pourquoi cette opportunité vous intéresse."
                        rows={4}
                      />
                    </label>
                    <div className="opportunity-application-grid">
                      <label>
                        <span>Discipline</span>
                        <input value={applicationForm.discipline} onChange={(event) => setApplicationForm((current) => ({ ...current, discipline: event.target.value }))} placeholder="Design, mode, musique..." />
                      </label>
                      <label>
                        <span>Ville</span>
                        <input value={applicationForm.city} onChange={(event) => setApplicationForm((current) => ({ ...current, city: event.target.value }))} placeholder="Kinshasa" />
                      </label>
                      <label>
                        <span>Téléphone</span>
                        <input value={applicationForm.phone} onChange={(event) => setApplicationForm((current) => ({ ...current, phone: event.target.value }))} placeholder="+243..." />
                      </label>
                      <label>
                        <span>Portfolio</span>
                        <input value={applicationForm.portfolioUrl} onChange={(event) => setApplicationForm((current) => ({ ...current, portfolioUrl: event.target.value }))} placeholder="https://..." />
                      </label>
                      <label>
                        <span>CV</span>
                        <input value={applicationForm.cvUrl} onChange={(event) => setApplicationForm((current) => ({ ...current, cvUrl: event.target.value }))} placeholder="/uploads/cv.pdf" />
                      </label>
                      <label>
                        <span>Fichier dossier</span>
                        <input value={applicationForm.fileUrl} onChange={(event) => setApplicationForm((current) => ({ ...current, fileUrl: event.target.value }))} placeholder="/uploads/dossier.pdf" />
                      </label>
                    </div>
                    <label className="opportunity-motivation-field">
                      <span>Liens utiles</span>
                      <textarea
                        value={applicationForm.linksText}
                        onChange={(event) => setApplicationForm((current) => ({ ...current, linksText: event.target.value }))}
                        placeholder={"Un lien par ligne : Behance, Drive, vidéo, article..."}
                        rows={3}
                      />
                    </label>
                    <label className="opportunity-motivation-field">
                      <span>Réseaux sociaux</span>
                      <textarea
                        value={applicationForm.socialLinksText}
                        onChange={(event) => setApplicationForm((current) => ({ ...current, socialLinksText: event.target.value }))}
                        placeholder={"Un réseau par ligne : Instagram, LinkedIn, TikTok..."}
                        rows={3}
                      />
                    </label>
                  </div>
                ) : null}
                <div className="member-hero-actions">
                  <button className="member-secondary-button" type="button" disabled={isApplying} onClick={() => void saveApplication(selectedOpportunity)}>
                    {selectedOpportunity.application ? "Enregistrer le dossier" : selectedOpportunity.canApply ? "Préparer le dossier" : "Voir modalités"}
                  </button>
                  <button className="member-create-button" type="button" disabled={isApplying} onClick={() => void submitApplication(selectedOpportunity)}>
                    {selectedOpportunity.application?.status === "SUBMITTED" ? "Candidature envoyée" : selectedOpportunity.canApply ? "Soumettre" : "Ouvrir"}
                  </button>
                </div>
              </section>
            ) : (
              <section className="member-card opportunity-detail-card">
                <EmptyOpportunityState title="Aucune opportunité sélectionnée" text="Choisissez une opportunité pour voir les détails." />
              </section>
            )}

            <section className="member-card opportunity-readiness-card">
              <span className="member-kicker">Dossier de candidature</span>
              <div className="opportunity-readiness-summary">
                <div>
                  <strong>{readiness}%</strong>
                  <span>de préparation</span>
                </div>
                <small>{readyStepCount} sur {preparationSteps.length} éléments prêts</small>
              </div>
              <p>Complétez ces éléments une fois, puis réutilisez-les pour répondre plus vite aux appels, missions et résidences.</p>
              <div className="creative-progress-track"><span style={{ width: `${readiness}%` }} /></div>
              <div className="opportunity-preparation-list">
                {preparationSteps.map((step) => (
                  <article key={step.label} className={step.done ? "is-done" : undefined}>
                    <CheckCircle2 aria-hidden="true" />
                    <div>
                      <strong>{step.label}</strong>
                      <p>{step.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {data?.canPublishOpportunity ? (
              <section className="member-card">
                <div className="member-card-title">
                  <h2>Mes opportunités publiées</h2>
                  <a href="/espace-membre/publier">Créer</a>
                </div>
                <div className="training-recommended-list">
                  {data.myPublished.length ? data.myPublished.slice(0, 4).map((item) => (
                    <button key={item.id} type="button" onClick={() => setSelectedId(item.id)}>
                      <Lightbulb aria-hidden="true" strokeWidth={1.8} />
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.status === "PUBLISHED" ? "Publiée" : "Brouillon"} · {item.category}</small>
                      </span>
                    </button>
                  )) : (
                    <EmptyOpportunityState title="Aucune publication" text="Publiez une mission, un appel ou une collaboration depuis Publier." />
                  )}
                </div>
              </section>
            ) : null}

            <section className="member-card">
              <div className="member-card-title">
                <h2>À venir</h2>
                <a href="/espace-membre/agenda">Agenda</a>
              </div>
              <div className="training-session-list">
                <article>
                  <time>24 mai</time>
                  <div>
                    <strong>Atelier candidature</strong>
                    <span><Clock3 aria-hidden="true" /> 16:00 - 17:30</span>
                  </div>
                </article>
                <article>
                  <time>31 mai</time>
                  <div>
                    <strong>Session portfolio review</strong>
                    <span><UsersRound aria-hidden="true" /> En groupe</span>
                  </div>
                </article>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </MemberShell>
  );
}

function EmptyOpportunityState({ title, text, onReset }: { title: string; text: string; onReset?: () => void }) {
  return (
    <div className="member-empty-state">
      <Lightbulb aria-hidden="true" strokeWidth={1.8} />
      <strong>{title}</strong>
      <p>{text}</p>
      {onReset ? <button className="member-secondary-button" type="button" onClick={onReset}>Réinitialiser</button> : null}
    </div>
  );
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function splitTextareaList(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function calculateApplicationReadiness(profile: MemberProfile | null | undefined, motivation: string) {
  const profileCompletion = Math.min(100, Math.max(0, profile?.profileCompletion ?? 0));
  const profileScore = Math.round(profileCompletion * 0.35);
  const portfolioScore = profile?.portfolioUrl || profile?.websiteUrl ? 20 : 0;
  const cvScore = profile?.cvUrl ? 25 : 0;
  const motivationScore = motivation.trim() ? 20 : 0;

  return Math.min(100, profileScore + portfolioScore + cvScore + motivationScore);
}

function buildPreparationSteps(profile: MemberProfile | null | undefined, motivation: string) {
  const completion = profile?.profileCompletion ?? 0;
  const hasPortfolio = Boolean(profile?.portfolioUrl || profile?.websiteUrl);
  const hasCv = Boolean(profile?.cvUrl);
  const hasMotivation = Boolean(motivation.trim());

  return [
    {
      label: "Creative ID renseigné",
      done: completion >= 70,
      description: completion >= 70 ? `Profil complété à ${completion}%.` : `Profil complété à ${completion}%, ajoutez encore les informations clés.`,
    },
    {
      label: "Portfolio ou références",
      done: hasPortfolio,
      description: hasPortfolio ? "Un lien de portfolio ou de site est disponible." : "Ajoutez un lien vers vos travaux, références ou site web.",
    },
    {
      label: "CV ajouté",
      done: hasCv,
      description: hasCv ? "Votre CV PDF est déjà rattaché au profil." : "Ajoutez un CV PDF si l'appel demande un dossier formel.",
    },
    {
      label: "Message de motivation",
      done: hasMotivation,
      description: hasMotivation ? "Le message sera joint à cette candidature." : "Rédigez un court message adapté à l'opportunité sélectionnée.",
    },
  ];
}

function statusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    DRAFT: "Dossier ouvert",
    SUBMITTED: "Envoyée",
    UNDER_REVIEW: "En étude",
    SELECTED: "Présélectionnée",
    ACCEPTED: "Acceptée",
    REJECTED: "Non retenue",
    WITHDRAWN: "Retirée",
  };

  return status ? labels[String(status)] ?? "En cours" : "Non démarrée";
}

function applicationProgress(status?: string) {
  if (status === "SELECTED" || status === "ACCEPTED" || status === "REJECTED" || status === "WITHDRAWN") {
    return 100;
  }

  if (status === "SUBMITTED" || status === "UNDER_REVIEW") {
    return 80;
  }

  if (status === "DRAFT") {
    return 45;
  }

  return 0;
}

function formatTrackingDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "date à confirmer";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function opportunityIcon(opportunity: MemberOpportunity): LucideIcon {
  const category = normalizeSearch(opportunity.category);

  if (category.includes("mission") || category.includes("emploi")) {
    return BriefcaseBusiness;
  }

  if (category.includes("residence") || category.includes("concours")) {
    return Trophy;
  }

  if (category.includes("formation")) {
    return FileText;
  }

  if (category.includes("creation") || category.includes("appel")) {
    return Palette;
  }

  return Lightbulb;
}
