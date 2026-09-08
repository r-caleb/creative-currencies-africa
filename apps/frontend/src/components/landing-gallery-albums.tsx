"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { getPublicLandingGalleryAlbums } from "@/lib/api";

export type LandingGalleryItem = {
  title: string;
  text: string;
  image: string;
  href?: string;
  photos?: LandingGalleryPhoto[];
};

type LandingGalleryAlbumsProps = {
  fallbackItems: LandingGalleryItem[];
  imageProps: {
    loading: "eager" | "lazy";
    decoding: "async" | "auto" | "sync";
  };
};

type LandingGalleryPhoto = {
  id: string;
  title: string | null;
  caption: string | null;
  imageUrl: string;
  altText: string | null;
};

export function LandingGalleryAlbums({ fallbackItems, imageProps }: LandingGalleryAlbumsProps) {
  const [items, setItems] = useState(fallbackItems);
  const [activeAlbumIndex, setActiveAlbumIndex] = useState<number | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const activeAlbum = activeAlbumIndex !== null ? items[activeAlbumIndex] : null;
  const activePhotos = useMemo(() => buildLandingPhotos(activeAlbum), [activeAlbum]);
  const activePhoto = activePhotos[activePhotoIndex] ?? activePhotos[0] ?? null;

  useEffect(() => {
    let cancelled = false;

    getPublicLandingGalleryAlbums()
      .then((albums) => {
        const publishedAlbums = albums
          .map((album) => {
            const image = album.coverImageUrl ?? album.photos[0]?.imageUrl ?? "";

            return {
              title: album.title,
              text: album.description?.trim() || galleryCategoryLabels[album.category] || "Album officiel Creative Currencies Africa",
              image,
              href: `/espace-membre/galerie/${encodeURIComponent(album.slug)}`,
              photos: buildAlbumPhotos(album),
            };
          })
          .filter((album) => album.image);

        if (!cancelled && publishedAlbums.length > 0) {
          setItems(publishedAlbums);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeAlbumIndex === null) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePreview();
      }

      if (event.key === "ArrowLeft") {
        setActivePhotoIndex((current) => getPreviousIndex(current, activePhotos.length));
      }

      if (event.key === "ArrowRight") {
        setActivePhotoIndex((current) => getNextIndex(current, activePhotos.length));
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeAlbumIndex, activePhotos.length]);

  function openPreview(index: number) {
    setActiveAlbumIndex(index);
    setActivePhotoIndex(0);
  }

  function closePreview() {
    setActiveAlbumIndex(null);
    setActivePhotoIndex(0);
  }

  return (
    <>
      <div className="gallery-grid">
        {items.map((item, index) => (
          <button className="gallery-card" type="button" onClick={() => openPreview(index)} key={`${item.title}-${item.image}`}>
            <img src={item.image} alt={item.title} {...imageProps} />
            <div>
              <span>{item.title}</span>
              <h3>{item.text}</h3>
            </div>
          </button>
        ))}
      </div>

      {activeAlbum && activePhoto ? (
        <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={activeAlbum.title}>
          <button className="gallery-lightbox-close" type="button" onClick={closePreview} aria-label="Fermer l'aperçu">
            <X aria-hidden="true" strokeWidth={1.8} />
          </button>
          <button className="gallery-lightbox-nav gallery-lightbox-nav--prev" type="button" onClick={() => setActivePhotoIndex((current) => getPreviousIndex(current, activePhotos.length))} aria-label="Photo précédente">
            <ChevronLeft aria-hidden="true" strokeWidth={1.8} />
          </button>
          <figure>
            <img src={activePhoto.imageUrl} alt={activePhoto.altText || activePhoto.title || activeAlbum.title} />
            <figcaption>
              <strong>{activePhoto.title || activeAlbum.title}</strong>
              <p>{activePhoto.caption || activeAlbum.text}</p>
              {activeAlbum.href ? (
                <a className="gallery-lightbox-link" href={activeAlbum.href}>
                  <ExternalLink aria-hidden="true" strokeWidth={1.8} />
                  Ouvrir l'album complet
                </a>
              ) : null}
            </figcaption>
          </figure>
          <button className="gallery-lightbox-nav gallery-lightbox-nav--next" type="button" onClick={() => setActivePhotoIndex((current) => getNextIndex(current, activePhotos.length))} aria-label="Photo suivante">
            <ChevronRight aria-hidden="true" strokeWidth={1.8} />
          </button>
        </div>
      ) : null}
    </>
  );
}

function buildAlbumPhotos(album: Awaited<ReturnType<typeof getPublicLandingGalleryAlbums>>[number]): LandingGalleryPhoto[] {
  const photos = album.photos.map((photo) => ({
    id: photo.id,
    title: photo.title,
    caption: photo.caption,
    imageUrl: photo.imageUrl,
    altText: photo.altText,
  }));

  if (!album.coverImageUrl) {
    return photos;
  }

  const coverIndex = photos.findIndex((photo) => photo.imageUrl === album.coverImageUrl);

  if (coverIndex >= 0) {
    const [coverPhoto] = photos.splice(coverIndex, 1);
    return [coverPhoto, ...photos];
  }

  return [
    {
      id: `${album.id}-cover`,
      title: album.title,
      caption: album.description,
      imageUrl: album.coverImageUrl,
      altText: album.title,
    },
    ...photos,
  ];
}

function buildLandingPhotos(album: LandingGalleryItem | null) {
  if (!album) {
    return [];
  }

  if (album.photos?.length) {
    return album.photos;
  }

  return [
    {
      id: `${album.title}-${album.image}`,
      title: album.title,
      caption: album.text,
      imageUrl: album.image,
      altText: album.title,
    },
  ];
}

function getPreviousIndex(current: number, total: number) {
  if (!total) {
    return 0;
  }

  return current <= 0 ? total - 1 : current - 1;
}

function getNextIndex(current: number, total: number) {
  if (!total) {
    return 0;
  }

  return current >= total - 1 ? 0 : current + 1;
}

const galleryCategoryLabels = {
  FORMATION: "Formations & workshops",
  EVENT: "Événements officiels",
  BACKSTAGE: "Backstage & coulisses",
  ACTIVATION: "Activations & partenaires",
  PARTNER: "Partenaires",
  VISIT: "Déplacements & visites",
  CONFERENCE: "Conférences & panels",
};
