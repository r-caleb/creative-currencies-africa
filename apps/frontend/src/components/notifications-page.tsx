"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  BookOpen,
  CheckCheck,
  FileBadge,
  Lightbulb,
  Loader2,
  MessageCircle,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MemberShell } from "@/components/member-shell";
import { useVisibleItems } from "@/hooks/use-visible-items";
import {
  getApiErrorMessage,
  getNotifications,
  getNotificationSummary,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api";
import type { MemberNotification, MemberNotificationSummary, NotificationType } from "@/lib/api";
import { connectRealtimeSocket } from "@/lib/realtime";
import { normalizeProfileOption } from "@/lib/profile-options";
import { useAppSelector } from "@/store/hooks";

const notificationFilters = ["Toutes", "Non lues", "Messages", "Opportunités", "Formations", "Certificats"];

const iconByType: Record<NotificationType, LucideIcon> = {
  MESSAGE: MessageCircle,
  OPPORTUNITY: Lightbulb,
  TRAINING: BookOpen,
  SYSTEM: ShieldCheck,
  CERTIFICATE: BadgeCheck,
};

export function NotificationsPage() {
  const { accessToken } = useAppSelector((state) => state.auth);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Toutes");
  const [notifications, setNotifications] = useState<MemberNotification[]>([]);
  const [summary, setSummary] = useState<MemberNotificationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      getNotifications(accessToken, { limit: 80 }),
      getNotificationSummary(accessToken),
    ])
      .then(([items, smartSummary]) => {
        if (isMounted) {
          setNotifications(items);
          setSummary(smartSummary);
          setError("");
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getApiErrorMessage(requestError, "Impossible de charger vos notifications pour le moment."));
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

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const socket = connectRealtimeSocket(accessToken);

    socket.on("notification.created", (payload: { notification?: MemberNotification }) => {
      const notification = payload.notification;

      if (!notification) {
        return;
      }

      setNotifications((current) => {
        if (current.some((item) => item.id === notification.id)) {
          return current;
        }

        return [notification, ...current];
      });
    });

    socket.on("notification.updated", (payload: { notification?: MemberNotification }) => {
      const updatedNotification = payload.notification;

      if (!updatedNotification) {
        return;
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === updatedNotification.id ? updatedNotification : notification,
        ),
      );
    });

    socket.on("notification.readAll", () => {
      setNotifications((current) => current.map((notification) => ({
        ...notification,
        read: true,
        readAt: notification.readAt ?? new Date().toISOString(),
      })));
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken]);

  const filteredNotifications = useMemo(() => {
    const normalizedQuery = normalizeProfileOption(query);

    return notifications.filter((notification) => {
      const matchesFilter =
        activeFilter === "Toutes" ||
        (activeFilter === "Non lues" && !notification.read) ||
        (activeFilter === "Messages" && notification.type === "MESSAGE") ||
        (activeFilter === "Opportunités" && notification.type === "OPPORTUNITY") ||
        (activeFilter === "Formations" && notification.type === "TRAINING") ||
        (activeFilter === "Certificats" && notification.type === "CERTIFICATE");
      const searchable = normalizeProfileOption(`${notification.title} ${notification.message}`);

      return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [activeFilter, notifications, query]);

  const visibleNotifications = useVisibleItems(filteredNotifications, 12);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const markAllAsRead = async () => {
    if (!accessToken || isMarkingAll) {
      return;
    }

    setIsMarkingAll(true);

    try {
      await markAllNotificationsRead(accessToken);
      setNotifications((current) => current.map((notification) => ({
        ...notification,
        read: true,
        readAt: notification.readAt ?? new Date().toISOString(),
      })));
      setError("");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Impossible de marquer les notifications comme lues."));
    } finally {
      setIsMarkingAll(false);
    }
  };

  const markAsRead = async (notification: MemberNotification) => {
    if (!accessToken || notification.read) {
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, read: true, readAt: new Date().toISOString() } : item,
      ),
    );

    try {
      const updated = await markNotificationRead(accessToken, notification.id);
      setNotifications((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Impossible de mettre à jour cette notification."));
    }
  };

  return (
    <MemberShell activeItem="Notifications">
      <div className="social-layout notifications-layout">
        <section className="member-module-hero social-hero">
          <div>
            <span className="member-kicker">Notifications</span>
            <h1>Un centre d’alertes simple pour suivre l’essentiel.</h1>
            <p>
              Connexions, invitations de groupes, messages, commentaires, réactions et publications importantes
              sont regroupés ici.
            </p>
            <div className="member-hero-actions">
              <button className="member-create-button" type="button" onClick={markAllAsRead} disabled={isMarkingAll || unreadCount === 0}>
                {isMarkingAll ? <Loader2 aria-hidden="true" strokeWidth={1.8} /> : <CheckCheck aria-hidden="true" strokeWidth={1.8} />}
                Tout marquer lu
              </button>
            </div>
          </div>
          <div className="member-module-highlight-grid">
            <article><Bell aria-hidden="true" /><strong>{summary?.total ?? notifications.length}</strong><span>Alertes</span></article>
            <article><FileBadge aria-hidden="true" /><strong>{summary?.last7Days ?? 0}</strong><span>7 jours</span></article>
            <article><ShieldCheck aria-hidden="true" /><strong>{summary?.digestPreview.enabled ? "Résumé" : "Direct"}</strong><span>{summary?.digestPreview.enabled ? "Activé" : "Automatique"}</span></article>
          </div>
        </section>

        {summary ? (
          <section className="member-card notification-summary-card">
            <div>
              <strong>Historique intelligent</strong>
              <span>{summary.unread} non lue{summary.unread > 1 ? "s" : ""} · {summary.last30Days} alertes sur 30 jours</span>
            </div>
            <div className="notification-summary-types">
              {summary.byType.filter((item) => item.total > 0 || item.unread > 0).map((item) => {
                const Icon = iconByType[item.type];
                return (
                  <article key={item.type}>
                    <Icon aria-hidden="true" strokeWidth={1.8} />
                    <strong>{notificationTypeLabel(item.type)}</strong>
                    <span>{item.total} total · {item.unread} non lue{item.unread > 1 ? "s" : ""}</span>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="member-card social-toolbar">
          <label className="social-search">
            <Search aria-hidden="true" strokeWidth={1.8} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une notification..." />
          </label>
          <div className="social-filter-row" aria-label="Filtres notifications">
            {notificationFilters.map((filter) => (
              <button key={filter} className={filter === activeFilter ? "is-active" : undefined} type="button" onClick={() => setActiveFilter(filter)}>
                {filter}
              </button>
            ))}
          </div>
        </section>

        {error ? <p className="auth-form-error">{error}</p> : null}

        <section className="member-card">
          <div className="member-card-title">
            <div>
              <h2>Activité récente</h2>
              <p>{filteredNotifications.length} notification{filteredNotifications.length > 1 ? "s" : ""}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="member-feed-loading">
              <Loader2 aria-hidden="true" strokeWidth={1.8} />
              <span>Chargement des notifications...</span>
            </div>
          ) : (
            <div className="notification-list">
              {visibleNotifications.visibleItems.map((notification) => {
                const Icon = iconByType[notification.type];

                return (
                  <article key={notification.id} className={notification.read ? "notification-card" : "notification-card is-unread"}>
                    <span className="notification-icon">
                      <Icon aria-hidden="true" strokeWidth={1.8} />
                    </span>
                    <div>
                      <span>{formatNotificationTime(notification.createdAt)}</span>
                      <strong>{notification.title}</strong>
                      <p>{notification.message}</p>
                    </div>
                    <div className="notification-actions">
                      {notification.href ? (
                        <Link className="member-secondary-button" href={notification.href} onClick={() => markAsRead(notification)}>
                          Ouvrir
                        </Link>
                      ) : null}
                      {!notification.read ? (
                        <button type="button" onClick={() => markAsRead(notification)}>
                          Marquer lu
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}

              {!filteredNotifications.length ? (
                <div className="member-feed-empty">
                  <Bell aria-hidden="true" strokeWidth={1.8} />
                  <strong>Aucune notification</strong>
                  <p>Les invitations, messages et interactions importantes apparaîtront ici.</p>
                </div>
              ) : null}

              {visibleNotifications.hasMore ? (
                <div className="member-feed-load-more" ref={visibleNotifications.loadMoreRef}>
                  <Loader2 aria-hidden="true" strokeWidth={1.8} />
                  <span>Défilez pour afficher plus de notifications</span>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </MemberShell>
  );
}

function formatNotificationTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Maintenant";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function notificationTypeLabel(type: NotificationType) {
  const labels: Record<NotificationType, string> = {
    MESSAGE: "Messages",
    OPPORTUNITY: "Opportunités",
    TRAINING: "Formations",
    CERTIFICATE: "Certificats",
    SYSTEM: "CCA",
  };

  return labels[type];
}
