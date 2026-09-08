"use client";

import { useEffect, useState } from "react";
import { getPublicLandingGalleryAlbums } from "@/lib/api";

export type LandingGalleryItem = {
  title: string;
  text: string;
  image: string;
  href?: string;
};

type LandingGalleryAlbumsProps = {
  fallbackItems: LandingGalleryItem[];
  imageProps: {
    loading: "eager" | "lazy";
    decoding: "async" | "auto" | "sync";
  };
};

export function LandingGalleryAlbums({ fallbackItems, imageProps }: LandingGalleryAlbumsProps) {
  const [items, setItems] = useState(fallbackItems);

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

  return (
    <div className="gallery-grid">
      {items.map((item) => (
        <a className="gallery-card" href={item.href ?? "/espace-membre/galerie"} key={`${item.title}-${item.image}`}>
          <img src={item.image} alt={item.title} {...imageProps} />
          <div>
            <span>{item.title}</span>
            <h3>{item.text}</h3>
          </div>
        </a>
      ))}
    </div>
  );
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
