"use client";

import { useEffect, useState } from "react";
import { getPublicPartners } from "@/lib/api";

export type LandingPartner = {
  name: string;
  logo: string;
  wide?: boolean;
  website?: string | null;
};

type LandingPartnersProps = {
  fallbackPartners: LandingPartner[];
};

export function LandingPartners({ fallbackPartners }: LandingPartnersProps) {
  const [visiblePartners, setVisiblePartners] = useState(fallbackPartners);

  useEffect(() => {
    let cancelled = false;

    getPublicPartners()
      .then((partners) => {
        const publishedPartners = partners
          .filter((partner) => partner.logoUrl?.trim())
          .sort((first, second) => first.order - second.order || first.name.localeCompare(second.name))
          .map((partner) => ({
            name: partner.name,
            logo: partner.logoUrl as string,
            website: partner.website,
            wide: partner.name.length > 34,
          }));

        if (!cancelled && publishedPartners.length > 0) {
          setVisiblePartners(publishedPartners);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="partner-wall">
      {visiblePartners.map((partner) => {
        const content = (
          <article className={`partner-logo-card${partner.wide ? " partner-logo-card--wide" : ""}`}>
            <img src={partner.logo} alt={partner.name} loading="lazy" decoding="async" />
          </article>
        );

        if (!partner.website) {
          return <div key={`${partner.name}-${partner.logo}`}>{content}</div>;
        }

        return (
          <a key={`${partner.name}-${partner.logo}`} className="partner-logo-link" href={partner.website} target="_blank" rel="noreferrer">
            {content}
          </a>
        );
      })}
    </div>
  );
}
