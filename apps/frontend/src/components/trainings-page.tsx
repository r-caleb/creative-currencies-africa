"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Clock3,
  FileText,
  Loader2,
  MapPin,
  Search,
  UsersRound,
} from "lucide-react";
import { MemberShell } from "@/components/member-shell";
import { useVisibleItems } from "@/hooks/use-visible-items";
import { enrollInTraining, getApiErrorMessage, getMemberTrainings } from "@/lib/api";
import type { MemberTraining, MemberTrainingsResponse } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";

const filters = ["Toutes", "Disponibles", "Officielles CCA", "Mes inscriptions", "Mes publications", "Certifiantes", "En ligne", "Présentiel"];

export function TrainingsPage() {
  const { accessToken, profile, user } = useAppSelector((state) => state.auth);
  const [data, setData] = useState<MemberTrainingsResponse | null>(null);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Toutes");
  const [selectedId, setSelectedId] = useState("");
  const [enrollmentForm, setEnrollmentForm] = useState({ motivation: "", phone: "" });
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    setIsLoading(true);
    getMemberTrainings(accessToken)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        const safeResponse: MemberTrainingsResponse = {
          accountType: response.accountType ?? "MEMBER",
          canPublishTraining: !!response.canPublishTraining,
          catalog: response.catalog ?? [],
          myEnrollments: response.myEnrollments ?? [],
          myPublished: response.myPublished ?? [],
        };
        const requestedTrainingId = new URLSearchParams(window.location.search).get("formation");

        setData(safeResponse);
        setSelectedId((current) => {
          if (requestedTrainingId && safeResponse.catalog.some((training) => training.id === requestedTrainingId)) {
            return requestedTrainingId;
          }

          if (current && safeResponse.catalog.some((training) => training.id === current)) {
            return current;
          }

          return safeResponse.catalog[0]?.id || "";
        });
        setStatus("");

        if (requestedTrainingId) {
          scrollToTrainingDetail();
        }
      })
      .catch((error) => {
        if (isMounted) {
          setStatus(getApiErrorMessage(error, "Impossible de charger les formations pour le moment."));
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
  const filteredTrainings = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    return catalog.filter((training) => {
      const matchesFilter =
        activeFilter === "Toutes" ||
        (activeFilter === "Disponibles" && !training.enrollment) ||
        (activeFilter === "Officielles CCA" && training.official) ||
        (activeFilter === "Mes inscriptions" && !!training.enrollment) ||
        (activeFilter === "Mes publications" && training.canManage) ||
        (activeFilter === "Certifiantes" && training.certificate) ||
        training.mode === activeFilter;
      const haystack = normalizeSearch([
        training.title,
        training.category,
        training.level,
        training.mode,
        training.location,
        training.organizerName,
        training.description,
        training.modules.join(" "),
      ].join(" "));

      return matchesFilter && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [activeFilter, catalog, query]);
  const visibleTrainings = useVisibleItems(filteredTrainings, 10);

  const selectedTraining = filteredTrainings.find((training) => training.id === selectedId) ?? filteredTrainings[0] ?? catalog[0] ?? null;
  const enrolledCount = data?.myEnrollments.length ?? 0;
  const myPublishedCount = data?.myPublished.length ?? 0;
  const recommended = catalog.filter((training) => training.recommended && training.id !== selectedTraining?.id).slice(0, 3);
  const heroStats = [
    { label: "Disponibles", value: String(catalog.length) },
    { label: "Inscrites", value: String(enrolledCount) },
    { label: "CCA", value: String(catalog.filter((training) => training.official).length) },
  ];
  const visibleFilters = filters.filter((filter) => filter !== "Mes publications" || data?.canPublishTraining || myPublishedCount > 0);

  useEffect(() => {
    setEnrollmentForm({
      motivation: selectedTraining?.enrollment?.motivation ?? "",
      phone: selectedTraining?.enrollment?.phone ?? user?.phone ?? "",
    });
  }, [selectedTraining?.enrollment, selectedTraining?.id, user?.phone]);

  const selectTraining = (trainingId: string, shouldScroll = false) => {
    setSelectedId(trainingId);

    if (shouldScroll) {
      scrollToTrainingDetail();
    }
  };

  const handleTrainingAction = async (training: MemberTraining, action: "preview" | "confirm" = "preview") => {
    selectTraining(training.id, true);

    if (training.enrollment) {
      setStatus("Votre inscription est déjà active pour cette formation.");
      return;
    }

    if (training.canEnroll && training.source === "training") {
      if (action === "preview") {
        setStatus("Vérifiez les détails de la formation puis confirmez votre inscription.");
        return;
      }

      if (!accessToken) {
        setStatus("Connectez-vous pour vous inscrire à cette formation.");
        return;
      }

      setIsEnrolling(true);
      setStatus("");

      try {
        const response = await enrollInTraining(accessToken, training.id, {
          motivation: enrollmentForm.motivation.trim() || undefined,
          phone: enrollmentForm.phone.trim() || undefined,
        });
        setData(response.trainings);
        setSelectedId(training.id);
        setStatus("Inscription confirmée. La formation apparaît maintenant dans Mes inscriptions.");
      } catch (error) {
        setStatus(getApiErrorMessage(error, "Impossible de confirmer l'inscription pour le moment."));
      } finally {
        setIsEnrolling(false);
      }

      return;
    }

    if (training.linkUrl) {
      window.open(training.linkUrl, "_blank", "noopener,noreferrer");
      setStatus("Le lien de la formation a été ouvert dans un nouvel onglet.");
      return;
    }

    setStatus("Cette formation vient d'une publication. Consultez les détails pour suivre les modalités d'inscription.");
  };

  return (
    <MemberShell activeItem="Formations">
      <div className="training-layout">
        <section className="training-hero">
          <div className="training-hero-copy">
            <span className="member-kicker">Formations</span>
            <h1>Découvrez les formations CCA et préparez vos prochaines compétences.</h1>
            <p>
              L’espace Formations rassemble les programmes officiels CCA, les formations publiées par les structures
              créatives et vos inscriptions en cours.
            </p>
            <div className="member-hero-actions">
              <a className="member-create-button" href="#catalogue-formations">
                Explorer les formations
                <ArrowRight aria-hidden="true" strokeWidth={1.8} />
              </a>
              {data?.canPublishTraining ? (
                <a className="member-secondary-button" href="/espace-membre/publier">Publier une formation</a>
              ) : (
                <a className="member-secondary-button" href="#formation-detail">Voir les détails</a>
              )}
            </div>
          </div>
          <div className="training-hero-panel">
            <img src="/assets/cc-event-flyer.png" alt="" />
            <div>
              {heroStats.map((stat) => (
                <article key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="member-card opportunities-toolbar">
          <label className="opportunities-search">
            <Search aria-hidden="true" strokeWidth={1.8} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher une formation, une compétence, un lieu..."
            />
          </label>
          <div className="opportunities-filters" aria-label="Filtres formations">
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

        <div className="training-grid">
          <section className="training-main">
            <section id="catalogue-formations" className="member-card">
              <div className="member-card-title">
                <div>
                  <h2>Catalogue formations</h2>
                  <p>
                    Formations accessibles pour votre profil
                    {profile?.discipline ? ` en ${profile.discipline}` : user?.type ? ` ${accountTypeLabel(user.type).toLowerCase()}` : ""}.
                  </p>
                </div>
                <span className="opportunity-count">{filteredTrainings.length} formation{filteredTrainings.length > 1 ? "s" : ""}</span>
              </div>
              <div className="training-catalog-list">
                {isLoading ? (
                  <TrainingEmptyState title="Chargement des formations" text="Nous préparons le catalogue disponible pour votre profil." />
                ) : filteredTrainings.length ? (
                  visibleTrainings.visibleItems.map((training) => (
                    <article key={training.id} className={training.id === selectedTraining?.id ? "is-selected" : undefined}>
                      <div>
                        <span>
                          {training.official ? "Formation officielle CCA" : training.category} · {training.level}
                        </span>
                        <strong>{training.title}</strong>
                        <p>{training.description}</p>
                        <div className="opportunity-meta">
                          <span><CalendarDays aria-hidden="true" /> {training.dates}</span>
                          <span><MapPin aria-hidden="true" /> {training.location}</span>
                          <span><UsersRound aria-hidden="true" /> {training.seats ? `${training.seats} places` : `${training.enrolledCount} intéressé${training.enrolledCount > 1 ? "s" : ""}`}</span>
                          {training.certificate ? <span><BadgeCheck aria-hidden="true" /> Certificat après validation</span> : null}
                        </div>
                      </div>
                      <div className="training-catalog-action">
                        <small>{training.enrollment ? "Inscrit" : training.recommended ? "Recommandée" : training.mode}</small>
                        <button
                          className={training.enrollment || training.canEnroll ? "member-create-button" : "member-secondary-button"}
                          type="button"
                          disabled={isEnrolling}
                          onClick={() => void handleTrainingAction(training)}
                        >
                          {training.enrollment ? "Voir détails" : training.canEnroll ? "Préparer" : training.linkUrl ? "Ouvrir le lien" : "Voir détails"}
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <TrainingEmptyState title="Aucune formation trouvée" text="Essayez un autre mot-clé ou revenez à toutes les formations.">
                    <button className="member-secondary-button" type="button" onClick={() => {
                      setQuery("");
                      setActiveFilter("Toutes");
                    }}>
                      Réinitialiser
                    </button>
                  </TrainingEmptyState>
                )}
                {visibleTrainings.hasMore ? (
                  <div className="member-feed-load-more" ref={visibleTrainings.loadMoreRef}>
                    <Loader2 aria-hidden="true" strokeWidth={1.8} />
                    <span>Défilez pour afficher plus de formations</span>
                  </div>
                ) : null}
              </div>
            </section>

            <section id="mes-inscriptions" className="member-card">
              <div className="member-card-title">
                <div>
                  <h2>Mes inscriptions</h2>
                  <p>Suivez vos formations, votre progression et les certificats à préparer.</p>
                </div>
              </div>
              <div className="application-list">
                {data?.myEnrollments.length ? (
                  data.myEnrollments.map((training) => {
                    const enrollment = training.enrollment;
                    const progress = enrollment?.progress ?? 0;

                    return (
                      <article key={training.id} className="application-tracking-card">
                        <div>
                          <strong>{training.title}</strong>
                          <span>{enrollmentStatusLabel(enrollment?.status)} · {training.category}</span>
                          <small>
                            {enrollment?.enrolledAt
                              ? `Inscrit le ${formatTrackingDate(enrollment.enrolledAt)}`
                              : "Inscription en cours"}
                          </small>
                        </div>
                        <div className="application-progress" aria-label={`Progression ${progress}%`}>
                          <span style={{ width: `${progress}%` }} />
                        </div>
                        <div className="application-tracking-actions">
                          <small>{progress}%</small>
                          {enrollment?.adminNote ? <em>{enrollment.adminNote}</em> : null}
                          <button type="button" onClick={() => selectTraining(training.id, true)}>Ouvrir</button>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <article>
                    <div>
                      <strong>Aucune inscription active</strong>
                      <span>Choisissez une formation disponible pour commencer votre parcours.</span>
                    </div>
                    <div className="application-progress" aria-label="Progression 0%">
                      <span style={{ width: "0%" }} />
                    </div>
                    <small>0%</small>
                  </article>
                )}
              </div>
            </section>

            {selectedTraining ? (
              <>
                <section id="formation-detail" className="member-card training-current-card">
                  <div className="member-card-title">
                    <div>
                      <h2>{selectedTraining.official ? "Formation officielle CCA" : "Détail de la formation"}</h2>
                      <p>{selectedTraining.organizerName}.</p>
                    </div>
                    <span className="training-status">{selectedTraining.enrollment ? "Inscription active" : selectedTraining.canEnroll ? "Places ouvertes" : "Modalités à consulter"}</span>
                  </div>
                  <div className="training-current-body">
                    <img src={selectedTraining.coverImageUrl ?? "/assets/cc-event-banner.png"} alt="" />
                    <div>
                      <h3>{selectedTraining.title}</h3>
                      <p>{selectedTraining.description}</p>
                      <div className="training-meta-grid">
                        <span><CalendarDays aria-hidden="true" /> {selectedTraining.dates}</span>
                        <span><MapPin aria-hidden="true" /> {selectedTraining.location}</span>
                        <span><UsersRound aria-hidden="true" /> {selectedTraining.mode}</span>
                        <span><BadgeCheck aria-hidden="true" /> {selectedTraining.certificate ? "Certificat après validation" : "Attestation de participation"}</span>
                      </div>
                    </div>
                  </div>
                  {selectedTraining.source === "training" && selectedTraining.canEnroll ? (
                    <div className="training-enrollment-box">
                      <div>
                        <strong>{selectedTraining.enrollment ? "Votre inscription" : "Préparer l'inscription"}</strong>
                        <p>Ajoutez un contact et une courte motivation pour aider l'équipe CCA à mieux suivre les participants.</p>
                      </div>
                      <div className="opportunity-application-grid">
                        <label>
                          <span>Téléphone</span>
                          <input value={enrollmentForm.phone} onChange={(event) => setEnrollmentForm((current) => ({ ...current, phone: event.target.value }))} placeholder="+243..." />
                        </label>
                        <label>
                          <span>Motivation courte</span>
                          <input value={enrollmentForm.motivation} onChange={(event) => setEnrollmentForm((current) => ({ ...current, motivation: event.target.value }))} placeholder="Pourquoi cette formation vous intéresse ?" />
                        </label>
                      </div>
                      {!selectedTraining.enrollment ? (
                        <button className="member-create-button" type="button" disabled={isEnrolling} onClick={() => void handleTrainingAction(selectedTraining, "confirm")}>
                          {isEnrolling ? <Loader2 aria-hidden="true" strokeWidth={1.8} /> : null}
                          Confirmer l'inscription
                        </button>
                      ) : (
                        <span className="training-status">Inscription {selectedTraining.enrollment.status.toLowerCase()}</span>
                      )}
                    </div>
                  ) : null}
                </section>

                <section className="member-card">
                  <div className="member-card-title">
                    <div>
                      <h2>Programme proposé</h2>
                      <p>Les principaux blocs associés à la formation sélectionnée.</p>
                    </div>
                  </div>
                  <div className="training-module-grid">
                    {selectedTraining.modules.map((module, index) => (
                      <article key={`${selectedTraining.id}-${module}`}>
                        <div>
                          <strong>{module}</strong>
                          <span>{selectedTraining.enrollment ? "Inclus dans votre inscription" : "Présenté par l’organisateur"}</span>
                        </div>
                        <small>{String(index + 1).padStart(2, "0")}</small>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="member-card">
                  <div className="member-card-title">
                    <div>
                      <h2>Planning des sessions</h2>
                      <p>Les dates importantes liées à la formation.</p>
                    </div>
                  </div>
                  <div className="training-session-list">
                    {selectedTraining.sessions.length ? selectedTraining.sessions.map((session) => (
                      <article key={`${selectedTraining.id}-${session.title}`}>
                        <time>{session.date}</time>
                        <div>
                          <strong>{session.title}</strong>
                          <span><Clock3 aria-hidden="true" /> {session.time}</span>
                        </div>
                      </article>
                    )) : (
                      <TrainingEmptyState title="Planning à confirmer" text="L’organisateur n’a pas encore publié les horaires détaillés." />
                    )}
                  </div>
                </section>
              </>
            ) : null}
          </section>

          <aside className="training-side">
            <section className="member-card">
              <div className="member-card-title">
                <h2>Ressources de la formation</h2>
                <a href="/espace-membre/ressources">Bibliothèque</a>
              </div>
              <div className="compact-list">
                {selectedTraining?.resources.length ? (
                  selectedTraining.resources.map((item) => (
                    <article key={item.title}>
                      <span className="list-icon is-gold"><FileText aria-hidden="true" strokeWidth={1.8} /></span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.type}</small>
                      </div>
                    </article>
                  ))
                ) : (
                  <TrainingEmptyState
                    title="Aucune ressource disponible"
                    text="Les supports peuvent être ajoutés plus tard ou réservés aux personnes inscrites."
                  />
                )}
              </div>
            </section>

            {data?.canPublishTraining ? (
              <section className="member-card">
                <div className="member-card-title">
                  <h2>Mes formations publiées</h2>
                  <a href="/espace-membre/publier">Créer</a>
                </div>
                <div className="training-recommended-list">
                  {data.myPublished.length ? data.myPublished.slice(0, 4).map((item) => (
                    <button key={item.id} type="button" onClick={() => selectTraining(item.id, true)}>
                      <BookOpen aria-hidden="true" strokeWidth={1.8} />
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.status === "PUBLISHED" ? "Publiée" : "Brouillon"} · {item.category}</small>
                      </span>
                    </button>
                  )) : (
                    <TrainingEmptyState title="Aucune publication" text="Publiez une formation depuis le bouton Publier." />
                  )}
                </div>
              </section>
            ) : null}

            <section className="member-card">
              <div className="member-card-title">
                <h2>Recommandées</h2>
                <a href="#catalogue-formations">Tout voir</a>
              </div>
              <div className="training-recommended-list">
                {recommended.length ? recommended.map((item) => (
                  <button key={item.id} type="button" onClick={() => selectTraining(item.id, true)}>
                    <BookOpen aria-hidden="true" strokeWidth={1.8} />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.level} · {item.seats ? `${item.seats} places` : item.mode}</small>
                    </span>
                  </button>
                )) : (
                  <TrainingEmptyState title="Aucune recommandation" text="Les formations officielles CCA apparaîtront ici." />
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </MemberShell>
  );
}

function TrainingEmptyState({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <div className="member-empty-state">
      <BookOpen aria-hidden="true" strokeWidth={1.8} />
      <strong>{title}</strong>
      <p>{text}</p>
      {children}
    </div>
  );
}

function accountTypeLabel(type?: string) {
  const labels: Record<string, string> = {
    PUBLIC: "Public",
    LEARNER: "Apprenant",
    CREATOR: "Créateur",
    ORGANIZATION: "Organisation",
    PARTNER: "Partenaire",
    ADMIN: "Admin",
  };

  return type ? labels[type] ?? "Membre" : "Membre";
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function scrollToTrainingDetail() {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      document.getElementById("formation-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function enrollmentStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    ENROLLED: "Inscription confirmée",
    IN_PROGRESS: "Formation en cours",
    COMPLETED: "Terminée",
    CANCELLED: "Annulée",
  };

  return status ? labels[String(status)] ?? "Inscription active" : "Non inscrit";
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
