"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  FileBadge,
  FileText,
  Link as LinkIcon,
  Loader2,
  Lock,
  PlayCircle,
  Search,
  ShieldCheck,
  Star,
  UsersRound,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MemberShell } from "@/components/member-shell";
import { useVisibleItems } from "@/hooks/use-visible-items";
import { getApiErrorMessage, getMemberResources } from "@/lib/api";
import type { MemberResource, MemberResourcesResponse } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";

const resourceFilters = [
  "Tous",
  "Officielles CCA",
  "Formations",
  "Mes ressources",
  "PDF",
  "Guides",
  "Templates",
  "Vidéos",
  "Contrats",
];

const defaultResponse: MemberResourcesResponse = {
  accountType: "PUBLIC",
  canPublishResource: false,
  accessRules: [],
  library: [],
  trainingResources: [],
  myPublished: [],
};

export function ResourcesPage() {
  const { accessToken } = useAppSelector((state) => state.auth);
  const [data, setData] = useState<MemberResourcesResponse>(defaultResponse);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(resourceFilters[0]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    setIsLoading(true);
    getMemberResources(accessToken)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setData({
          accountType: response.accountType ?? "PUBLIC",
          canPublishResource: !!response.canPublishResource,
          accessRules: response.accessRules ?? [],
          library: response.library ?? [],
          trainingResources: response.trainingResources ?? [],
          myPublished: response.myPublished ?? [],
        });
        setStatus("");
      })
      .catch((error) => {
        if (isMounted) {
          setStatus(getApiErrorMessage(error, "Impossible de charger la bibliothèque pour le moment."));
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

  const library = useMemo(() => mergeResources(data.library, data.myPublished), [data.library, data.myPublished]);
  const visibleFilters = resourceFilters.filter((filter) => filter !== "Mes ressources" || data.canPublishResource || data.myPublished.length > 0);
  const filteredResources = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    return library.filter((resource) => {
      const normalizedType = normalizeSearch(`${resource.type} ${resource.category}`);
      const matchesFilter =
        activeFilter === "Tous" ||
        (activeFilter === "Officielles CCA" && resource.official) ||
        (activeFilter === "Formations" && !!resource.training) ||
        (activeFilter === "Mes ressources" && resource.canManage) ||
        (activeFilter === "PDF" && normalizedType.includes("pdf")) ||
        (activeFilter === "Guides" && normalizedType.includes("guide")) ||
        (activeFilter === "Templates" && (normalizedType.includes("template") || normalizedType.includes("modele"))) ||
        (activeFilter === "Vidéos" && normalizedType.includes("video")) ||
        (activeFilter === "Contrats" && normalizedType.includes("contrat"));
      const searchable = normalizeSearch([
        resource.title,
        resource.type,
        resource.category,
        resource.description,
        resource.accessLabel,
        resource.authorName,
        resource.meta,
      ].join(" "));

      return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [activeFilter, library, query]);
  const visibleResources = useVisibleItems(filteredResources, 12);

  const officialCount = library.filter((resource) => resource.official).length;
  const trainingCount = data.trainingResources.length;
  const recommendedCount = library.filter((resource) => resource.recommended).length;

  return (
    <MemberShell activeItem="Ressources">
      <div className="member-module-layout">
        <section className="member-module-hero">
          <div>
            <span className="member-kicker">Ressources</span>
            <h1>Trouvez les ressources utiles au bon moment.</h1>
            <p>
              Guides, modèles, PDF, replays et supports de formation apparaissent selon
              votre profil, vos inscriptions et les espaces auxquels vous avez accès.
            </p>
            <div className="member-hero-actions">
              <a className="member-create-button" href="#bibliotheque-ressources">
                Ouvrir la bibliothèque
                <ArrowRight aria-hidden="true" strokeWidth={1.8} />
              </a>
              {data.canPublishResource ? (
                <a className="member-secondary-button" href="/espace-membre/publier">
                  <FileText aria-hidden="true" strokeWidth={1.8} />
                  Publier une ressource
                </a>
              ) : (
                <a className="member-secondary-button" href="#droits-ressources">
                  <ShieldCheck aria-hidden="true" strokeWidth={1.8} />
                  Voir les accès
                </a>
              )}
            </div>
          </div>
          <div className="member-module-highlight-grid">
            <article>
              <BookOpen aria-hidden="true" strokeWidth={1.8} />
              <strong>{library.length}</strong>
              <span>Ressources</span>
            </article>
            <article>
              <UsersRound aria-hidden="true" strokeWidth={1.8} />
              <strong>{trainingCount}</strong>
              <span>Formations</span>
            </article>
            <article>
              <Star aria-hidden="true" strokeWidth={1.8} />
              <strong>{recommendedCount || officialCount}</strong>
              <span>À consulter</span>
            </article>
          </div>
        </section>

        <section className="member-card member-module-toolbar">
          <label className="member-module-search">
            <Search aria-hidden="true" strokeWidth={1.8} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un guide, un template, une vidéo..." />
          </label>
          <div className="member-module-filters" aria-label="Filtres ressources">
            {visibleFilters.map((filter) => (
              <button key={filter} className={filter === activeFilter ? "is-active" : undefined} type="button" onClick={() => setActiveFilter(filter)}>
                {filter}
              </button>
            ))}
          </div>
        </section>

        {status ? <p className="auth-form-error">{status}</p> : null}

        <div className="member-module-grid">
          <section className="member-module-main">
            <section id="bibliotheque-ressources" className="member-card">
              <div className="member-card-title">
                <div>
                  <h2>Bibliothèque</h2>
                  <p>Les ressources que votre compte peut consulter maintenant.</p>
                </div>
                <span className="resource-count">{filteredResources.length} résultat{filteredResources.length > 1 ? "s" : ""}</span>
              </div>
              {isLoading ? (
                <ResourceEmptyState title="Chargement des ressources" text="Nous vérifions vos accès et vos inscriptions aux formations." />
              ) : filteredResources.length ? (
                <div className="member-resource-list">
                  {visibleResources.visibleItems.map((item) => (
                    <ResourceRow key={item.id} item={item} />
                  ))}
                  {visibleResources.hasMore ? (
                    <div className="member-feed-load-more" ref={visibleResources.loadMoreRef}>
                      <Loader2 aria-hidden="true" strokeWidth={1.8} />
                      <span>Défilez pour afficher plus de ressources</span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <ResourceEmptyState
                  title="Aucune ressource trouvée"
                  text="Essayez une autre recherche ou revenez à toutes les ressources accessibles."
                  onReset={() => {
                    setQuery("");
                    setActiveFilter("Tous");
                  }}
                />
              )}
            </section>

            {data.canPublishResource ? (
              <section className="member-card">
                <div className="member-card-title">
                  <div>
                    <h2>Mes ressources publiées</h2>
                    <p>Brouillons et ressources déjà partagées depuis le bouton Publier.</p>
                  </div>
                  <a href="/espace-membre/publier">Créer</a>
                </div>
                <div className="member-collection-list">
                  {data.myPublished.length ? (
                    data.myPublished.map((resource) => (
                      <article key={resource.id}>
                        <strong>{resource.title}</strong>
                        <span>{statusLabel(resource.status)} · {resource.accessLabel}</span>
                        <p>{resource.description}</p>
                      </article>
                    ))
                  ) : (
                    <ResourceEmptyState title="Aucune ressource publiée" text="Publiez un guide, un modèle, un replay ou un lien utile quand il est prêt à être partagé." />
                  )}
                </div>
              </section>
            ) : null}
          </section>

          <aside className="member-module-side">
            <section className="member-card">
              <div className="member-card-title">
                <h2>Accès rapides</h2>
              </div>
              <div className="member-collection-list">
                <article>
                  <strong>Ressources officielles</strong>
                  <span>{officialCount} ressource{officialCount > 1 ? "s" : ""}</span>
                  <p>Supports validés ou publiés par CCA.</p>
                </article>
                <article>
                  <strong>Mes formations</strong>
                  <span>{trainingCount} ressource{trainingCount > 1 ? "s" : ""}</span>
                  <p>Documents visibles après inscription à une formation.</p>
                </article>
                <article>
                  <strong>Contributions membres</strong>
                  <span>{library.filter((resource) => !resource.official && resource.source === "publication").length} partagée{library.length > 1 ? "s" : ""}</span>
                  <p>Guides, retours d’expérience et liens utiles proposés par la communauté.</p>
                </article>
              </div>
            </section>

            <section id="droits-ressources" className="member-card">
              <div className="member-card-title">
                <h2>Droits & visibilité</h2>
              </div>
              <div className="resource-access-list">
                {data.accessRules.length ? (
                  data.accessRules.map((rule) => (
                    <article key={rule.level} className={rule.canCreate ? "can-create" : undefined}>
                      {rule.canCreate ? <ShieldCheck aria-hidden="true" strokeWidth={1.8} /> : <Lock aria-hidden="true" strokeWidth={1.8} />}
                      <div>
                        <strong>{rule.label}</strong>
                        <p>{rule.description}</p>
                        <span>{rule.canCreate ? "Vous pouvez créer avec cet accès." : "Consultation selon vos droits."}</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <ResourceEmptyState title="Accès indisponibles" text="Connectez-vous pour voir les droits liés à votre compte." />
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </MemberShell>
  );
}

function ResourceRow({ item }: { item: MemberResource }) {
  const Icon = resourceIcon(item);
  const href = item.href ?? item.attachments[0]?.url ?? "";

  return (
    <article>
      <span className={item.official ? "list-icon is-gold" : "list-icon"}><Icon aria-hidden="true" strokeWidth={1.8} /></span>
      <div>
        <strong>{item.title}</strong>
        <span>{item.type} · {item.accessLabel}</span>
        <small>{item.meta}</small>
        <p>{item.description}</p>
      </div>
      {href ? (
        <a className="member-secondary-button" href={href} target="_blank" rel="noreferrer">
          Consulter
          <ExternalLink aria-hidden="true" strokeWidth={1.8} />
        </a>
      ) : (
        <button className="member-secondary-button" type="button" disabled>
          Indisponible
        </button>
      )}
    </article>
  );
}

function ResourceEmptyState({ title, text, onReset }: { title: string; text: string; onReset?: () => void }) {
  return (
    <div className="member-empty-state">
      <BookOpen aria-hidden="true" strokeWidth={1.8} />
      <strong>{title}</strong>
      <p>{text}</p>
      {onReset ? <button className="member-secondary-button" type="button" onClick={onReset}>Réinitialiser</button> : null}
    </div>
  );
}

function mergeResources(library: MemberResource[], myPublished: MemberResource[]) {
  const seen = new Set<string>();

  return [...library, ...myPublished].filter((resource) => {
    if (seen.has(resource.id)) {
      return false;
    }

    seen.add(resource.id);
    return true;
  });
}

function resourceIcon(resource: MemberResource): LucideIcon {
  const normalized = normalizeSearch(`${resource.type} ${resource.category} ${resource.title}`);

  if (normalized.includes("video") || normalized.includes("replay")) {
    return PlayCircle;
  }

  if (normalized.includes("contrat") || normalized.includes("juridique")) {
    return BookOpen;
  }

  if (normalized.includes("template") || normalized.includes("modele")) {
    return FileBadge;
  }

  if (normalized.includes("lien")) {
    return LinkIcon;
  }

  if (normalized.includes("audio") || normalized.includes("podcast")) {
    return Video;
  }

  return FileText;
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: "Brouillon",
    PUBLISHED: "Publiée",
    ARCHIVED: "Archivée",
    FLAGGED: "À vérifier",
  };

  return labels[status] ?? "En cours";
}
