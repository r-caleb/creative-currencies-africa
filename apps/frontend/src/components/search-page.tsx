"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Building2,
  ExternalLink,
  GraduationCap,
  Lightbulb,
  Loader2,
  Network,
  Search,
  Sparkles,
} from "lucide-react";
import { MemberShell } from "@/components/member-shell";
import { getApiErrorMessage, searchMemberGlobal } from "@/lib/api";
import type { GlobalSearchItem, GlobalSearchKind, GlobalSearchResponse } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";

const searchFilters: Array<{ label: string; value: "all" | GlobalSearchKind }> = [
  { label: "Tous", value: "all" },
  { label: "Créateurs", value: "creator" },
  { label: "Publications", value: "publication" },
  { label: "Formations", value: "training" },
  { label: "Opportunités", value: "opportunity" },
  { label: "Ressources", value: "resource" },
  { label: "Partenaires", value: "partner" },
];

const emptySearchResponse: GlobalSearchResponse = {
  query: "",
  total: 0,
  results: [],
  sections: {
    creators: [],
    publications: [],
    trainings: [],
    opportunities: [],
    resources: [],
    partners: [],
  },
};

export function SearchPage() {
  const { accessToken } = useAppSelector((state) => state.auth);
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [data, setData] = useState<GlobalSearchResponse>(emptySearchResponse);
  const [activeFilter, setActiveFilter] = useState<"all" | GlobalSearchKind>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const term = urlQuery.trim();

    if (!accessToken || term.length < 2) {
      setData(emptySearchResponse);
      setStatus(term ? "Saisissez au moins deux caractères pour lancer la recherche." : "");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    setIsLoading(true);
    setStatus("");

    searchMemberGlobal(accessToken, { q: term, limit: 8 })
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setData(response);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setData(emptySearchResponse);
        setStatus(getApiErrorMessage(error, "Recherche momentanément indisponible."));
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, urlQuery]);

  const filteredResults = useMemo(() => {
    if (activeFilter === "all") {
      return data.results;
    }

    return data.results.filter((result) => result.type === activeFilter);
  }, [activeFilter, data.results]);

  const sectionCounts = useMemo(() => ({
    all: data.results.length,
    creator: data.sections.creators.length,
    publication: data.sections.publications.length,
    training: data.sections.trainings.length,
    opportunity: data.sections.opportunities.length,
    resource: data.sections.resources.length,
    partner: data.sections.partners.length,
  }), [data]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();

    if (!term) {
      router.replace("/espace-membre/recherche");
      return;
    }

    router.replace(`/espace-membre/recherche?q=${encodeURIComponent(term)}`);
  }

  return (
    <MemberShell activeItem="">
      <div className="member-global-results-page">
        <section className="member-module-hero global-results-hero">
          <div>
            <span className="section-eyebrow">Recherche globale</span>
            <h1>Trouvez rapidement les contenus utiles à votre parcours.</h1>
            <p>
              Recherchez les créateurs, publications, formations, opportunités, ressources et partenaires disponibles dans l'espace membre.
            </p>
          </div>
          <div className="member-module-highlight-grid">
            <article>
              <Search aria-hidden="true" strokeWidth={1.8} />
              <strong>{isLoading ? "..." : sectionCounts.all}</strong>
              <span>résultats</span>
            </article>
            <article>
              <Network aria-hidden="true" strokeWidth={1.8} />
              <strong>{sectionCounts.creator}</strong>
              <span>créateurs</span>
            </article>
            <article>
              <Lightbulb aria-hidden="true" strokeWidth={1.8} />
              <strong>{sectionCounts.opportunity}</strong>
              <span>opportunités</span>
            </article>
          </div>
        </section>

        <section className="member-card global-results-toolbar">
          <form className="global-results-search" role="search" onSubmit={handleSubmit}>
            <Search aria-hidden="true" strokeWidth={1.8} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un créateur, une formation, une ressource..."
            />
            <button className="member-create-button" type="submit">Rechercher</button>
          </form>

          <div className="member-module-filters" aria-label="Filtres de recherche">
            {searchFilters.map((filter) => (
              <button
                key={filter.value}
                className={activeFilter === filter.value ? "is-active" : undefined}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
                <span>{sectionCounts[filter.value]}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="member-card">
          <div className="member-card-title">
            <div>
              <h2>Résultats</h2>
              <p>
                {urlQuery.trim().length >= 2
                  ? `${filteredResults.length} élément${filteredResults.length > 1 ? "s" : ""} pour "${urlQuery.trim()}".`
                  : "Lancez une recherche depuis le champ ci-dessus."}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="member-empty-state">
              <Loader2 aria-hidden="true" strokeWidth={1.8} />
              <strong>Recherche en cours</strong>
              <p>Nous parcourons les contenus accessibles à votre profil.</p>
            </div>
          ) : status ? (
            <div className="member-empty-state">
              <Search aria-hidden="true" strokeWidth={1.8} />
              <strong>Recherche indisponible</strong>
              <p>{status}</p>
            </div>
          ) : filteredResults.length ? (
            <div className="global-results-list">
              {filteredResults.map((result) => (
                <GlobalResultCard key={`${result.type}-${result.id}`} result={result} />
              ))}
            </div>
          ) : (
            <div className="member-empty-state">
              <Search aria-hidden="true" strokeWidth={1.8} />
              <strong>Aucun résultat trouvé</strong>
              <p>Essayez avec un nom, une discipline, une ville, un titre de formation ou une opportunité.</p>
            </div>
          )}
        </section>
      </div>
    </MemberShell>
  );
}

function GlobalResultCard({ result }: { result: GlobalSearchItem }) {
  const Icon = globalSearchIconFor(result.type);
  const content = (
    <>
      <span className="global-result-icon">
        {result.imageUrl ? <img src={result.imageUrl} alt="" /> : <Icon aria-hidden="true" strokeWidth={1.8} />}
      </span>
      <span className="global-result-copy">
        <small>{result.label}</small>
        <strong>{result.title}</strong>
        {result.description ? <em>{result.description}</em> : null}
        {result.meta ? <b>{result.meta}</b> : null}
      </span>
      {result.href.startsWith("http") ? <ExternalLink aria-hidden="true" strokeWidth={1.8} /> : null}
    </>
  );

  return result.href.startsWith("http") ? (
    <a className="global-result-card" href={result.href} target="_blank" rel="noreferrer">
      {content}
    </a>
  ) : (
    <Link className="global-result-card" href={result.href}>
      {content}
    </Link>
  );
}

function globalSearchIconFor(kind: GlobalSearchKind): LucideIcon {
  const icons: Record<GlobalSearchKind, LucideIcon> = {
    creator: Network,
    publication: Sparkles,
    training: GraduationCap,
    opportunity: Lightbulb,
    resource: BookOpen,
    partner: Building2,
  };

  return icons[kind];
}
