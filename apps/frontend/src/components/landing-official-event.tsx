"use client";

import { useEffect, useMemo, useState } from "react";
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa6";
import { getPublicLandingEvent, type AdminEventType, type PublicLandingEvent } from "@/lib/api";

export type LandingOfficialEventData = {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  location: string;
  types: AdminEventType[];
  coverImageUrl: string;
  whatsappUrl: string;
  facebookEventUrl: string;
};

type LandingOfficialEventProps = {
  fallbackEvent: LandingOfficialEventData;
  imageProps: {
    loading: "eager" | "lazy";
    decoding: "async" | "auto" | "sync";
  };
};

const eventTypeLabels: Record<AdminEventType, string> = {
  WORKSHOP: "Workshop",
  MASTERCLASS: "Masterclass",
  CONFERENCE: "Conférence",
  PANEL: "Panel",
  NETWORKING: "Networking",
  ACTIVATION: "Activation",
  VISIT: "Visite",
  FESTIVAL: "Festival",
};

export function LandingOfficialEvent({ fallbackEvent, imageProps }: LandingOfficialEventProps) {
  const [event, setEvent] = useState<LandingOfficialEventData>(fallbackEvent);

  useEffect(() => {
    let cancelled = false;

    getPublicLandingEvent()
      .then((publicEvent) => {
        if (!cancelled && publicEvent) {
          setEvent(normalizePublicEvent(publicEvent, fallbackEvent));
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [fallbackEvent]);

  const typeLabel = useMemo(() => formatEventTypes(event.types), [event.types]);

  return (
    <section className="section teaser-section" id="evenement" aria-labelledby="event-title">
      <div className="event-layout">
        <div className="event-copy">
          <div className="section-kicker">Événement officiel</div>
          <h2 id="event-title">{event.title}</h2>
          <p>{event.description}</p>

          <div className="event-details">
            <div>
              <strong>Dates</strong>
              <span>{formatDateRange(event.startsAt, event.endsAt)}</span>
            </div>
            <div>
              <strong>Lieu</strong>
              <span>{event.location}</span>
            </div>
            <div>
              <strong>Format</strong>
              <span>{typeLabel}</span>
            </div>
          </div>

          <div className="reservation-block">
            <p>Réservez votre place</p>
            <div className="social-actions" aria-label="Liens événement">
              <a
                className="button button-gold social-button"
                href={event.whatsappUrl}
                {...externalLinkProps(event.whatsappUrl)}
              >
                <span className="brand-icon brand-whatsapp" aria-hidden="true">
                  <FaWhatsapp />
                </span>
                WhatsApp
              </a>
              <a
                className="button button-ghost social-button"
                href={event.facebookEventUrl}
                {...externalLinkProps(event.facebookEventUrl)}
              >
                <span className="brand-icon brand-facebook" aria-hidden="true">
                  <FaFacebookF />
                </span>
                Facebook
              </a>
              <a className="button button-ghost social-button" href="#contact">
                <span className="brand-icon brand-instagram" aria-hidden="true">
                  <FaInstagram />
                </span>
                Instagram
              </a>
              <a className="button button-ghost social-button" href="#contact">
                <span className="brand-icon brand-tiktok" aria-hidden="true">
                  <FaTiktok />
                </span>
                TikTok
              </a>
            </div>
          </div>
        </div>

        <figure className="event-poster">
          <img src={event.coverImageUrl} alt={`Affiche ${event.title}`} {...imageProps} />
        </figure>
      </div>
    </section>
  );
}

function normalizePublicEvent(publicEvent: PublicLandingEvent, fallbackEvent: LandingOfficialEventData): LandingOfficialEventData {
  return {
    title: publicEvent.title || fallbackEvent.title,
    description: publicEvent.description || fallbackEvent.description,
    startsAt: publicEvent.startsAt || fallbackEvent.startsAt,
    endsAt: publicEvent.endsAt || fallbackEvent.endsAt,
    location: publicEvent.location || fallbackEvent.location,
    types: publicEvent.types.length ? publicEvent.types : fallbackEvent.types,
    coverImageUrl: publicEvent.coverImageUrl || fallbackEvent.coverImageUrl,
    whatsappUrl: publicEvent.whatsappUrl || "#contact",
    facebookEventUrl: publicEvent.facebookEventUrl || "#contact",
  };
}

function formatEventTypes(types: AdminEventType[]) {
  const labels = Array.from(new Set(types)).map((type) => eventTypeLabels[type]).filter(Boolean);

  return labels.length ? labels.join(", ") : "Événement CCA";
}

function formatDateRange(startsAt: string, endsAt: string) {
  const start = parseDate(startsAt);
  const end = parseDate(endsAt);

  if (!start || !end) {
    return "Date à confirmer";
  }

  const formatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  if (sameDay(start, end)) {
    return formatter.format(start);
  }

  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    const monthYear = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(start);
    return `${start.getDate()} - ${end.getDate()} ${monthYear}`;
  }

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function parseDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function sameDay(first: Date, second: Date) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function externalLinkProps(href: string) {
  return href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {};
}
