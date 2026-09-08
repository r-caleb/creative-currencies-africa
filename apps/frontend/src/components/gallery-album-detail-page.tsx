"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Image as ImageIcon, Images, Loader2, X } from "lucide-react";
import { MemberShell } from "@/components/member-shell";
import { ApiError, getApiErrorMessage, getPublicGalleryAlbum, getPublicGalleryAlbums } from "@/lib/api";
import type { GalleryAlbumCategory, PublicGalleryAlbum } from "@/lib/api";

type GalleryDisplayPhoto = {
  id: string;
  title: string | null;
  caption: string | null;
  imageUrl: string;
  altText: string | null;
  isCover?: boolean;
};

const galleryCategoryLabels: Record<GalleryAlbumCategory, string> = {
  FORMATION: "Formations & workshops",
  EVENT: "Événements",
  BACKSTAGE: "Coulisses",
  ACTIVATION: "Activations",
  PARTNER: "Partenaires",
  VISIT: "Visites",
  CONFERENCE: "Conférences",
};

export function GalleryAlbumDetailPage({ slug }: { slug: string }) {
  const [album, setAlbum] = useState<PublicGalleryAlbum | null>(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    loadGalleryAlbum(slug)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setAlbum(response);
        setStatus("");
      })
      .catch((error) => {
        if (isMounted) {
          setStatus(getApiErrorMessage(error, "Impossible de charger cet album pour le moment."));
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
  }, [slug]);

  const photos = useMemo(() => buildDisplayPhotos(album), [album]);
  const activePhoto = activePhotoIndex !== null ? photos[activePhotoIndex] : null;

  useEffect(() => {
    if (activePhotoIndex === null) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActivePhotoIndex(null);
      }

      if (event.key === "ArrowLeft") {
        setActivePhotoIndex((current) => getPreviousIndex(current, photos.length));
      }

      if (event.key === "ArrowRight") {
        setActivePhotoIndex((current) => getNextIndex(current, photos.length));
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePhotoIndex, photos.length]);

  return (
    <MemberShell activeItem="Galerie">
      <div className="member-module-layout gallery-detail-page">
        <Link className="member-secondary-button gallery-back-link" href="/espace-membre/galerie">
          <ArrowLeft aria-hidden="true" strokeWidth={1.8} />
          Tous les albums
        </Link>

        {isLoading ? (
          <section className="member-card gallery-detail-loading">
            <Loader2 aria-hidden="true" strokeWidth={1.8} />
            <strong>Chargement de l'album</strong>
            <p>Nous préparons la galerie photo.</p>
          </section>
        ) : status ? (
          <p className="auth-form-error">{status}</p>
        ) : album ? (
          <>
            <section className="member-module-hero gallery-detail-hero">
              <div>
                <span className="member-kicker">{galleryCategoryLabels[album.category]}</span>
                <h1>{album.title}</h1>
                <p>{album.description || "Album officiel publié par Creative Currencies Africa."}</p>
              </div>
              <div className="member-module-highlight-grid">
                <article>
                  <Images aria-hidden="true" strokeWidth={1.8} />
                  <strong>{photos.length}</strong>
                  <span>Images visibles</span>
                </article>
                <article>
                  <ImageIcon aria-hidden="true" strokeWidth={1.8} />
                  <strong>{album.coverImageUrl ? "Oui" : "Non"}</strong>
                  <span>Couverture</span>
                </article>
                <article>
                  <Images aria-hidden="true" strokeWidth={1.8} />
                  <strong>{album.featuredOnLanding ? "Accueil" : "Album"}</strong>
                  <span>Visibilité</span>
                </article>
              </div>
            </section>

            {photos.length ? (
              <section className="member-card gallery-mosaic-section">
                <div className="member-card-title">
                  <div>
                    <h2>Photos de l'album</h2>
                    <p>La couverture est affichée en premier. Cliquez sur une image pour l'agrandir.</p>
                  </div>
                  <span className="resource-count">{photos.length} image{photos.length > 1 ? "s" : ""}</span>
                </div>

                <div className="gallery-mosaic">
                  {photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      className={index === 0 ? "gallery-mosaic-item gallery-mosaic-item--cover" : "gallery-mosaic-item"}
                      type="button"
                      onClick={() => setActivePhotoIndex(index)}
                    >
                      <img src={photo.imageUrl} alt={photo.altText || photo.title || album.title} loading={index < 8 ? "eager" : "lazy"} decoding="async" />
                      <span>{photo.isCover ? "Couverture" : photo.title || photo.caption || `Photo ${index + 1}`}</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <GalleryDetailEmptyState title="Aucune photo publiée" text="L'album existe, mais aucune photo publiée n'est encore visible." />
            )}
          </>
        ) : (
          <GalleryDetailEmptyState title="Album introuvable" text="Cet album n'est pas publié ou n'existe plus." />
        )}
      </div>

      {activePhoto && album ? (
        <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={activePhoto.title || album.title}>
          <button className="gallery-lightbox-close" type="button" onClick={() => setActivePhotoIndex(null)} aria-label="Fermer l'aperçu">
            <X aria-hidden="true" strokeWidth={1.8} />
          </button>
          <button className="gallery-lightbox-nav gallery-lightbox-nav--prev" type="button" onClick={() => setActivePhotoIndex((current) => getPreviousIndex(current, photos.length))} aria-label="Photo précédente">
            <ChevronLeft aria-hidden="true" strokeWidth={1.8} />
          </button>
          <figure>
            <img src={activePhoto.imageUrl} alt={activePhoto.altText || activePhoto.title || album.title} />
            <figcaption>
              <strong>{activePhoto.title || (activePhoto.isCover ? "Couverture de l'album" : album.title)}</strong>
              <p>{activePhoto.caption || activePhoto.altText || album.description || "Photo officielle CCA."}</p>
            </figcaption>
          </figure>
          <button className="gallery-lightbox-nav gallery-lightbox-nav--next" type="button" onClick={() => setActivePhotoIndex((current) => getNextIndex(current, photos.length))} aria-label="Photo suivante">
            <ChevronRight aria-hidden="true" strokeWidth={1.8} />
          </button>
        </div>
      ) : null}
    </MemberShell>
  );
}

async function loadGalleryAlbum(slug: string) {
  try {
    return await getPublicGalleryAlbum(slug);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) {
      throw error;
    }

    const albums = await getPublicGalleryAlbums();
    const album = albums.find((item) => item.slug === slug);

    if (!album) {
      throw error;
    }

    return album;
  }
}

function GalleryDetailEmptyState({ title, text }: { title: string; text: string }) {
  return (
    <section className="member-card certificate-empty-state">
      <Images aria-hidden="true" strokeWidth={1.8} />
      <strong>{title}</strong>
      <p>{text}</p>
      <Link className="member-secondary-button" href="/espace-membre/galerie">Retour aux albums</Link>
    </section>
  );
}

function buildDisplayPhotos(album: PublicGalleryAlbum | null): GalleryDisplayPhoto[] {
  if (!album) {
    return [];
  }

  const photos = album.photos.map((photo) => ({ ...photo, isCover: false }));

  if (!album.coverImageUrl) {
    return photos;
  }

  const coverIndex = photos.findIndex((photo) => photo.imageUrl === album.coverImageUrl);

  if (coverIndex >= 0) {
    const [coverPhoto] = photos.splice(coverIndex, 1);
    return [{ ...coverPhoto, isCover: true }, ...photos];
  }

  return [
    {
      id: `${album.id}-cover`,
      title: album.title,
      caption: album.description,
      imageUrl: album.coverImageUrl,
      altText: album.title,
      isCover: true,
    },
    ...photos,
  ];
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
