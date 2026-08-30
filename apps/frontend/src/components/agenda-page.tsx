"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  GraduationCap,
  Lightbulb,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MemberShell } from "@/components/member-shell";
import { useVisibleItems } from "@/hooks/use-visible-items";
import { getApiErrorMessage, getMemberAgenda, registerAgendaEvent } from "@/lib/api";
import type { MemberAgendaItem, MemberAgendaResponse } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";

const agendaFilters = ["Tous", "Événements", "Formations", "Opportunités", "Deadlines", "Mes inscriptions", "Officielles CCA"];

const defaultAgenda: MemberAgendaResponse = {
  accountType: "PUBLIC",
  canPublishEvent: false,
  items: [],
  upcoming: [],
  deadlines: [],
  registered: [],
};

export function AgendaPage() {
  const { accessToken } = useAppSelector((state) => state.auth);
  const [agenda, setAgenda] = useState<MemberAgendaResponse>(defaultAgenda);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(agendaFilters[0]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState("");

  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    setIsLoading(true);
    getMemberAgenda(accessToken)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setAgenda({
          accountType: response.accountType ?? "PUBLIC",
          canPublishEvent: !!response.canPublishEvent,
          items: response.items ?? [],
          upcoming: response.upcoming ?? [],
          deadlines: response.deadlines ?? [],
          registered: response.registered ?? [],
        });
        setStatus("");
      })
      .catch((error) => {
        if (isMounted) {
          setStatus(getApiErrorMessage(error, "Impossible de charger l'agenda pour le moment."));
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

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    return agenda.items.filter((item) => {
      const isDeadline = item.kind === "OPPORTUNITY" || item.kind === "JOB";
      const isRegistered = Boolean(item.registrationStatus || item.enrollmentStatus || item.applicationStatus);
      const matchesFilter =
        activeFilter === "Tous" ||
        (activeFilter === "Événements" && item.kind === "EVENT") ||
        (activeFilter === "Formations" && item.kind === "TRAINING") ||
        (activeFilter === "Opportunités" && isDeadline) ||
        (activeFilter === "Deadlines" && isDeadline) ||
        (activeFilter === "Mes inscriptions" && isRegistered) ||
        (activeFilter === "Officielles CCA" && item.official);
      const haystack = normalizeSearch([
        item.title,
        item.description,
        item.kindLabel,
        item.location,
        item.organizerName,
      ].join(" "));

      return matchesFilter && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [activeFilter, agenda.items, query]);

  const visibleItems = useVisibleItems(filteredItems, 12);
  const nextItem = agenda.upcoming[0] ?? agenda.items[0] ?? null;
  const registerEvent = async (item: MemberAgendaItem) => {
    if (!accessToken || item.source !== "event" || !item.canRegister) {
      return;
    }

    setRegisteringId(item.id);
    setStatus("");

    try {
      const response = await registerAgendaEvent(accessToken, item.sourceId);
      setAgenda(response.agenda);
      setStatus("Inscription confirmée. L'événement apparaît maintenant dans Mes inscriptions.");
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Impossible de confirmer l'inscription pour le moment."));
    } finally {
      setRegisteringId("");
    }
  };

  return (
    <MemberShell activeItem="Agenda">
      <div className="member-module-layout">
        <section className="member-module-hero">
          <div>
            <span className="member-kicker">Agenda</span>
            <h1>Le calendrier central des dates qui comptent.</h1>
            <p>
              Événements, formations, sessions, appels à projets et deadlines publiés avec une date
              remontent ici automatiquement selon vos droits d’accès.
            </p>
            <div className="member-hero-actions">
              <a className="member-create-button" href="#agenda-calendrier">
                Voir le calendrier
                <ArrowRight aria-hidden="true" strokeWidth={1.8} />
              </a>
              {agenda.canPublishEvent ? (
                <a className="member-secondary-button" href="/espace-membre/publier">Publier un événement</a>
              ) : (
                <a className="member-secondary-button" href="/espace-membre/opportunites">Voir les deadlines</a>
              )}
            </div>
          </div>
          <div className="agenda-month-card">
            <span>Prochain rendez-vous</span>
            <strong>{nextItem ? dateParts(nextItem.startsAt).day : "--"}</strong>
            <p>{nextItem ? `${dateParts(nextItem.startsAt).month} · ${nextItem.title}` : "Aucune date à venir"}</p>
          </div>
        </section>

        <section className="member-card member-module-toolbar">
          <label className="member-module-search">
            <Search aria-hidden="true" strokeWidth={1.8} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une date, une formation, une opportunité..." />
          </label>
          <div className="member-module-filters" aria-label="Filtres agenda">
            {agendaFilters.map((filter) => (
              <button key={filter} className={filter === activeFilter ? "is-active" : undefined} type="button" onClick={() => setActiveFilter(filter)}>
                {filter}
              </button>
            ))}
          </div>
        </section>

        {status ? <p className={status.startsWith("Impossible") ? "auth-form-error" : "auth-form-success"}>{status}</p> : null}

        <div className="member-module-grid">
          <section className="member-module-main">
            <section id="agenda-calendrier" className="member-card">
              <div className="member-card-title">
                <div>
                  <h2>Prochains rendez-vous</h2>
                  <p>Tout ce qui a une date connue et qui est visible pour votre compte.</p>
                </div>
                <span className="resource-count">{filteredItems.length} date{filteredItems.length > 1 ? "s" : ""}</span>
              </div>
              {isLoading ? (
                <AgendaEmptyState title="Chargement de l'agenda" text="Nous rassemblons les événements, formations et deadlines accessibles." />
              ) : filteredItems.length ? (
                <div className="agenda-timeline">
                  {visibleItems.visibleItems.map((item) => (
                    <AgendaRow key={item.id} item={item} isRegistering={registeringId === item.id} onRegister={registerEvent} />
                  ))}
                  {visibleItems.hasMore ? (
                    <div className="member-feed-load-more" ref={visibleItems.loadMoreRef}>
                      <Loader2 aria-hidden="true" strokeWidth={1.8} />
                      <span>Défilez pour afficher plus de dates</span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <AgendaEmptyState
                  title="Aucune date trouvée"
                  text="Les publications sans date ne peuvent pas remonter dans l'agenda. Essayez un autre filtre ou revenez à tous les éléments."
                  onReset={() => {
                    setQuery("");
                    setActiveFilter("Tous");
                  }}
                />
              )}
            </section>
          </section>

          <aside className="member-module-side">
            <section className="member-card">
              <div className="member-card-title">
                <h2>Vue rapide</h2>
              </div>
              <div className="member-collection-list">
                <article>
                  <strong>{agenda.items.length} dates à venir</strong>
                  <span>Agenda global</span>
                  <p>Événements, formations et publications datées.</p>
                </article>
                <article>
                  <strong>{agenda.deadlines.length} deadlines</strong>
                  <span>Opportunités</span>
                  <p>Appels, missions et offres avec une date limite connue.</p>
                </article>
                <article>
                  <strong>{agenda.registered.length} suivies</strong>
                  <span>Mes inscriptions</span>
                  <p>Événements, formations ou dossiers déjà engagés.</p>
                </article>
              </div>
            </section>

            <section className="member-card">
              <div className="member-card-title">
                <h2>Échéances</h2>
              </div>
              <div className="deadline-list">
                {agenda.deadlines.length ? agenda.deadlines.map((item) => (
                  <article key={item.id}>
                    <CalendarDays aria-hidden="true" strokeWidth={1.8} />
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.dateLabel} · {item.location}</span>
                    </div>
                  </article>
                )) : (
                  <AgendaEmptyState title="Aucune deadline" text="Les opportunités publiées sans date limite restent visibles dans Opportunités, mais pas ici." />
                )}
              </div>
            </section>

            <section className="member-card agenda-source-card" aria-label="Fonctionnement de l'agenda">
              <article className="agenda-source-note">
                <span className="agenda-source-icon">
                  <CalendarDays aria-hidden="true" strokeWidth={1.8} />
                </span>
                <div>
                  <strong>Agenda automatique</strong>
                  <p>Les formations, opportunités et événements avec une date apparaissent ici automatiquement.</p>
                </div>
              </article>
            </section>
          </aside>
        </div>
      </div>
    </MemberShell>
  );
}

function AgendaRow({ item, isRegistering, onRegister }: { item: MemberAgendaItem; isRegistering: boolean; onRegister: (item: MemberAgendaItem) => void }) {
  const Icon = agendaIcon(item);
  const parts = dateParts(item.startsAt);

  return (
    <article>
      <time>
        <strong>{parts.day}</strong>
        <span>{parts.month}</span>
      </time>
      <span className={item.official ? "list-icon is-gold" : "list-icon is-purple"}><Icon aria-hidden="true" strokeWidth={1.8} /></span>
      <div>
        <span>{item.official ? "Officielle CCA" : item.kindLabel}</span>
        <strong>{item.title}</strong>
        <p>{item.description}</p>
        <small><Clock3 aria-hidden="true" /> {item.timeLabel}</small>
        <small><MapPin aria-hidden="true" /> {item.location}</small>
        <div className="agenda-row-actions">
          {item.canRegister ? (
            <button className="member-create-button" type="button" disabled={isRegistering} onClick={() => onRegister(item)}>
              <CheckCircle2 aria-hidden="true" strokeWidth={1.8} />
              {isRegistering ? "Inscription..." : item.actionLabel}
            </button>
          ) : (
            <a className="member-secondary-button" href={item.routeHref}>{item.actionLabel}</a>
          )}
          {item.href ? (
            <a className="member-secondary-button" href={item.href} target="_blank" rel="noreferrer">
              Lien externe
              <ExternalLink aria-hidden="true" strokeWidth={1.8} />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function AgendaEmptyState({ title, text, onReset }: { title: string; text: string; onReset?: () => void }) {
  return (
    <div className="member-empty-state">
      <CalendarDays aria-hidden="true" strokeWidth={1.8} />
      <strong>{title}</strong>
      <p>{text}</p>
      {onReset ? <button className="member-secondary-button" type="button" onClick={onReset}>Réinitialiser</button> : null}
    </div>
  );
}

function agendaIcon(item: MemberAgendaItem): LucideIcon {
  if (item.kind === "TRAINING") {
    return GraduationCap;
  }

  if (item.kind === "JOB") {
    return BriefcaseBusiness;
  }

  if (item.kind === "OPPORTUNITY") {
    return Lightbulb;
  }

  return UsersRound;
}

function dateParts(value: string) {
  const date = new Date(value);

  return {
    day: new Intl.DateTimeFormat("fr-FR", { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(date).replace(".", "").toUpperCase(),
  };
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
