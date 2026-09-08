"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Camera, Image as ImageIcon, Images, Search, Sparkles } from "lucide-react";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedAlbum = searchParams.get("album");
  const [albums, setAlbums] = useState<PublicGalleryAlbum[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [openedAlbumId, setOpenedAlbumId] = useState<string | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
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
        const requested = findRequestedAlbum(response, requestedAlbum);
        const firstAlbum = response[0] ?? null;
        const activeAlbum = requested ?? firstAlbum;
        setSelectedAlbumId(activeAlbum?.id ?? null);
        setOpenedAlbumId(requested?.id ?? null);
        setSelectedPhotoId(getDefaultPhotoId(activeAlbum));
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
  }, [requestedAlbum]);

  const totalPhotos = albums.reduce((total, album) => total + album.photos.length, 0);
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

  const selectedAlbum = albums.find((album) => album.id === selectedAlbumId) ?? filteredAlbums[0] ?? albums[0] ?? null;
  const openedAlbum = albums.find((album) => album.id === openedAlbumId) ?? null;
  const selectedPhoto = openedAlbum ? getSelectedPhoto(openedAlbum, selectedPhotoId) : null;

  function openAlbum(album: PublicGalleryAlbum, photoId?: string) {
    setSelectedAlbumId(album.id);
    setOpenedAlbumId(album.id);
    setSelectedPhotoId(photoId ?? getDefaultPhotoId(album));
    router.push(`${pathname}?album=${encodeURIComponent(album.slug)}#album-detail`, { scroll: false });
  }

  function closeAlbum() {
    setOpenedAlbumId(null);
    setSelectedPhotoId(getDefaultPhotoId(selectedAlbum));
    router.push(pathname, { scroll: false });
  }

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

        {openedAlbum ? (
          <section id="album-detail" className="member-card gallery-album-detail">
            <div className="gallery-album-detail-header">
              <button type="button" className="member-secondary-button" onClick={closeAlbum}>
                <ArrowLeft aria-hidden="true" strokeWidth={1.8} />
                Tous les albums
              </button>
              <div>
                <span className="member-kicker">{galleryCategoryLabels[openedAlbum.category]}</span>
                <h2>{openedAlbum.title}</h2>
                <p>{openedAlbum.description || "Album officiel publié par Creative Currencies Africa."}</p>
              </div>
              <span className="resource-count">{openedAlbum.photos.length} photo{openedAlbum.photos.length > 1 ? "s" : ""}</span>
            </div>

            <div className="gallery-album-viewer">
              <figure>
                {selectedPhoto?.imageUrl || openedAlbum.coverImageUrl ? (
                  <img
                    src={selectedPhoto?.imageUrl ?? openedAlbum.coverImageUrl ?? ""}
                    alt={selectedPhoto?.altText || selectedPhoto?.title || openedAlbum.title}
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <span><ImageIcon aria-hidden="true" strokeWidth={1.8} /></span>
                )}
                <figcaption>
                  <strong>{selectedPhoto?.title || openedAlbum.title}</strong>
                  <p>{selectedPhoto?.caption || selectedPhoto?.altText || openedAlbum.description || "Photo officielle CCA."}</p>
                </figcaption>
              </figure>

              <div className="gallery-album-thumbnails" aria-label={`Photos de ${openedAlbum.title}`}>
                {openedAlbum.photos.length ? (
                  openedAlbum.photos.map((photo) => (
                    <button
                      key={photo.id}
                      className={photo.id === selectedPhoto?.id ? "is-active" : undefined}
                      type="button"
                      onClick={() => setSelectedPhotoId(photo.id)}
                    >
                      <img src={photo.imageUrl} alt={photo.altText || photo.title || openedAlbum.title} loading="eager" decoding="async" />
                      <span>{photo.title || photo.caption || "Photo officielle"}</span>
                    </button>
                  ))
                ) : (
                  <GalleryEmptyState title="Photos à venir" text="La couverture est publiée, les photos détaillées pourront être ajoutées ensuite." />
                )}
              </div>
            </div>
          </section>
        ) : null}

        <div className="member-module-grid gallery-member-grid">
          <section id="albums-officiels" className="member-module-main">
            <section className="member-card">
              <div className="member-card-title">
                <div>
                  <h2>Albums officiels</h2>
                  <p>Les couvertures publiées par CCA et visibles par les membres.</p>
                </div>
                <span className="resource-count">{filteredAlbums.length} album{filteredAlbums.length > 1 ? "s" : ""}</span>
              </div>

              {isLoading ? (
                <GalleryEmptyState title="Chargement de la galerie" text="Nous récupérons les albums publiés par CCA." />
              ) : filteredAlbums.length ? (
                <div className="gallery-member-album-grid">
                  {filteredAlbums.map((album) => (
                    <button
                      key={album.id}
                      className={album.id === selectedAlbum?.id ? "gallery-member-album is-active" : "gallery-member-album"}
                      type="button"
                      onClick={() => openAlbum(album)}
                    >
                      {album.coverImageUrl ? (
                        <img src={album.coverImageUrl} alt={album.title} loading="eager" decoding="async" />
                      ) : (
                        <span><ImageIcon aria-hidden="true" strokeWidth={1.8} /></span>
                      )}
                      <div>
                        <small>{galleryCategoryLabels[album.category]}</small>
                        <strong>{album.title}</strong>
                        <p>{album.description || "Album officiel publié par Creative Currencies Africa."}</p>
                        <em>{album.photos.length} photo{album.photos.length > 1 ? "s" : ""} · Ouvrir</em>
                      </div>
                    </button>
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
          </section>

          <aside className="member-module-side">
            <section className="member-card gallery-member-preview">
              <div className="member-card-title">
                <div>
                  <h2>Aperçu album</h2>
                  <p>{selectedAlbum ? galleryCategoryLabels[selectedAlbum.category] : "Sélectionnez un album"}</p>
                </div>
              </div>

              {selectedAlbum ? (
                <>
                  {selectedAlbum.coverImageUrl ? <img src={selectedAlbum.coverImageUrl} alt={selectedAlbum.title} loading="eager" decoding="async" /> : null}
                  <strong>{selectedAlbum.title}</strong>
                  <p>{selectedAlbum.description || "Cet album rassemble les images officielles publiées par CCA."}</p>
                  <button type="button" className="member-secondary-button" onClick={() => openAlbum(selectedAlbum)}>
                    Ouvrir l'album
                  </button>
                  <div className="gallery-member-photo-strip">
                    {selectedAlbum.photos.length ? (
                      selectedAlbum.photos.map((photo) => (
                        <button key={photo.id} type="button" onClick={() => openAlbum(selectedAlbum, photo.id)}>
                          <img src={photo.imageUrl} alt={photo.altText || photo.title || selectedAlbum.title} loading="eager" decoding="async" />
                          <span>{photo.title || photo.caption || "Photo officielle"}</span>
                        </button>
                      ))
                    ) : (
                      <GalleryEmptyState title="Photos à venir" text="La couverture est publiée, les photos détaillées pourront être ajoutées ensuite." />
                    )}
                  </div>
                </>
              ) : (
                <GalleryEmptyState title="Aucun album" text="Les albums publiés par CCA apparaîtront ici." />
              )}
            </section>
          </aside>
        </div>
      </div>
    </MemberShell>
  );
}

function getDefaultPhotoId(album: PublicGalleryAlbum | null) {
  return album?.photos[0]?.id ?? null;
}

function getSelectedPhoto(album: PublicGalleryAlbum, photoId: string | null) {
  return album.photos.find((photo) => photo.id === photoId) ?? album.photos[0] ?? null;
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

function findRequestedAlbum(albums: PublicGalleryAlbum[], value: string | null) {
  if (!value) {
    return null;
  }

  return albums.find((album) => album.slug === value || album.id === value) ?? null;
}
