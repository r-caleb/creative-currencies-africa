"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Camera, Image as ImageIcon, Images, Search, Sparkles } from "lucide-react";
import { MemberShell } from "@/components/member-shell";
import { getApiErrorMessage, getPublicGalleryAlbums } from "@/lib/api";
import type { GalleryAlbumCategory, PublicGalleryAlbum } from "@/lib/api";

const galleryFilters = ["Tous", "Formations", "Événements", "Conférences", "Coulisses", "Visites", "Activations", "Partenaires"];

const galleryCategoryLabels: Record<GalleryAlbumCategory, string> = {
  FORMATION: "Formations & workshops",
  EVENT: "Événements",
  BACKSTAGE: "Coulisses",
  ACTIVATION: "Activations",
  PARTNER: "Partenaires",
  VISIT: "Visites",
  CONFERENCE: "Conférences",
};

export function GalleryPage() {
  const [albums, setAlbums] = useState<PublicGalleryAlbum[]>([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(galleryFilters[0]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    getPublicGalleryAlbums()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setAlbums(response);
        setStatus("");
      })
      .catch((error) => {
        if (isMounted) {
          setStatus(getApiErrorMessage(error, "Impossible de charger la galerie officielle pour le moment."));
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
  }, []);

  const totalPhotos = albums.reduce((total, album) => total + album.photoCount, 0);
  const featuredCount = albums.filter((album) => album.featuredOnLanding).length;
  const filteredAlbums = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    return albums.filter((album) => {
      const matchesFilter =
        activeFilter === "Tous" ||
        (activeFilter === "Formations" && album.category === "FORMATION") ||
        (activeFilter === "Événements" && album.category === "EVENT") ||
        (activeFilter === "Conférences" && album.category === "CONFERENCE") ||
        (activeFilter === "Coulisses" && album.category === "BACKSTAGE") ||
        (activeFilter === "Visites" && album.category === "VISIT") ||
        (activeFilter === "Activations" && album.category === "ACTIVATION") ||
        (activeFilter === "Partenaires" && album.category === "PARTNER");
      const searchable = normalizeSearch([
        album.title,
        album.description,
        galleryCategoryLabels[album.category],
        album.photos.map((photo) => `${photo.title ?? ""} ${photo.caption ?? ""} ${photo.altText ?? ""}`).join(" "),
      ].join(" "));

      return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [activeFilter, albums, query]);

  return (
    <MemberShell activeItem="Galerie">
      <div className="member-module-layout">
        <section className="member-module-hero gallery-member-hero">
          <div>
            <span className="member-kicker">Galerie CCA officielle</span>
            <h1>Retrouvez les albums qui documentent la vie de la communauté.</h1>
            <p>
              Formations, panels, coulisses, visites et activations publiées par CCA sont
              regroupés ici pour garder une trace claire des moments importants.
            </p>
            <div className="member-hero-actions">
              <a className="member-create-button" href="#albums-officiels">
                Voir les albums
                <ArrowRight aria-hidden="true" strokeWidth={1.8} />
              </a>
              <a className="member-secondary-button" href="/#galerie">
                <Images aria-hidden="true" strokeWidth={1.8} />
                Voir sur l'accueil
              </a>
            </div>
          </div>
          <div className="member-module-highlight-grid">
            <article>
              <Images aria-hidden="true" strokeWidth={1.8} />
              <strong>{albums.length}</strong>
              <span>Albums publiés</span>
            </article>
            <article>
              <Camera aria-hidden="true" strokeWidth={1.8} />
              <strong>{totalPhotos}</strong>
              <span>Photos</span>
            </article>
            <article>
              <Sparkles aria-hidden="true" strokeWidth={1.8} />
              <strong>{featuredCount}</strong>
              <span>Mis en avant</span>
            </article>
          </div>
        </section>

        <section className="member-card member-module-toolbar">
          <label className="member-module-search">
            <Search aria-hidden="true" strokeWidth={1.8} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un album, une activité, un lieu..." />
          </label>
          <div className="member-module-filters" aria-label="Filtres galerie">
            {galleryFilters.map((filter) => (
              <button key={filter} className={filter === activeFilter ? "is-active" : undefined} type="button" onClick={() => setActiveFilter(filter)}>
                {filter}
              </button>
            ))}
          </div>
        </section>

        {status ? <p className="auth-form-error">{status}</p> : null}

        <section id="albums-officiels" className="member-card">
          <div className="member-card-title">
            <div>
              <h2>Albums officiels</h2>
              <p>Chaque album s'ouvre dans une page dédiée avec une vraie mosaïque de photos.</p>
            </div>
            <span className="resource-count">{filteredAlbums.length} album{filteredAlbums.length > 1 ? "s" : ""}</span>
          </div>

          {isLoading ? (
            <GalleryEmptyState title="Chargement de la galerie" text="Nous récupérons les albums publiés par CCA." />
          ) : filteredAlbums.length ? (
            <div className="gallery-member-album-grid">
              {filteredAlbums.map((album) => (
                <Link key={album.id} className="gallery-member-album" href={`/espace-membre/galerie/${encodeURIComponent(album.slug)}`}>
                  {album.coverImageUrl ? (
                    <img src={album.coverImageUrl} alt={album.title} loading="eager" decoding="async" />
                  ) : (
                    <span><ImageIcon aria-hidden="true" strokeWidth={1.8} /></span>
                  )}
                  <div>
                    <small>{galleryCategoryLabels[album.category]}</small>
                    <strong>{album.title}</strong>
                    <p>{album.description || "Album officiel publié par Creative Currencies Africa."}</p>
                    <em>{album.photoCount} photo{album.photoCount > 1 ? "s" : ""} · Ouvrir l'album</em>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <GalleryEmptyState
              title="Aucun album trouvé"
              text="Essayez un autre filtre ou revenez à tous les albums publiés."
              onReset={() => {
                setQuery("");
                setActiveFilter("Tous");
              }}
            />
          )}
        </section>
      </div>
    </MemberShell>
  );
}

function GalleryEmptyState({ title, text, onReset }: { title: string; text: string; onReset?: () => void }) {
  return (
    <div className="certificate-empty-state">
      <Images aria-hidden="true" strokeWidth={1.8} />
      <strong>{title}</strong>
      <p>{text}</p>
      {onReset ? <button type="button" onClick={onReset}>Réinitialiser</button> : null}
    </div>
  );
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
