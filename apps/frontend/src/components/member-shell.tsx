"use client";

import { FormEvent, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  FileBadge,
  GraduationCap,
  Home,
  Images,
  Lightbulb,
  LogOut,
  MessageCircle,
  Moon,
  Network,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  UsersRound,
} from "lucide-react";
import {
  getCurrentMember,
  getUnreadMessageCount,
  getUnreadNotificationCount,
  logoutSession,
} from "@/lib/api";
import type { AuthMeResponse } from "@/lib/api";
import { connectRealtimeSocket } from "@/lib/realtime";
import { buildInitials, getMemberDisplayName, getMemberProfileTitle } from "@/lib/member-display";
import { MemberPageSkeleton } from "@/components/page-skeletons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuth, hydrateAuth, setCurrentMember } from "@/store/slices/auth-slice";

type DashboardTheme = "dark" | "light";

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

const dashboardThemeKey = "cca-dashboard-theme-v1";
const currentMemberSyncedAtPrefix = "cca.currentMemberSyncedAt";
const currentMemberSyncTtlMs = 5 * 60 * 1000;

function isDashboardTheme(value: string | undefined | null): value is DashboardTheme {
  return value === "dark" || value === "light";
}

const sidebarItems: SidebarItem[] = [
  { label: "Accueil", href: "/espace-membre", icon: Home },
  { label: "Creative ID", href: "/espace-membre/creative-id", icon: FileBadge },
  { label: "Formations", href: "/espace-membre/formations", icon: GraduationCap },
  { label: "Réseau", href: "/espace-membre/reseau", icon: Network },
  { label: "Messages", href: "/espace-membre/messages", icon: MessageCircle },
  { label: "Groupes", href: "/espace-membre/groupes", icon: UsersRound },
  { label: "Opportunités", href: "/espace-membre/opportunites", icon: Lightbulb },
  { label: "Ressources", href: "/espace-membre/ressources", icon: BookOpen },
  { label: "Galerie", href: "/espace-membre/galerie", icon: Images },
  { label: "Agenda", href: "/espace-membre/agenda", icon: CalendarDays },
  { label: "Certificats", href: "/espace-membre/certificats", icon: ShieldCheck },
  { label: "Admin", href: "/espace-membre/admin", icon: ShieldCheck },
  { label: "Paramètres", href: "/espace-membre/parametres", icon: Settings },
];

export function MemberShell({
  activeItem,
  children,
}: {
  activeItem: string;
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<DashboardTheme>("light");
  const [isClientReady, setIsClientReady] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPath = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
  const dispatch = useAppDispatch();
  const { accessToken, refreshToken, user, profile, organizationProfile, partnerProfile, status } = useAppSelector((state) => state.auth);
  const profileTitle = getMemberProfileTitle({ user, profile, organizationProfile, partnerProfile });
  const displayName = getMemberDisplayName({ user, profile, organizationProfile, partnerProfile });
  const displayHandle = user?.email ? `@${user.email.split("@")[0]}` : "@creative";
  const initials = buildInitials(displayName);
  const headerAvatarUrl = profile?.avatarUrl ?? organizationProfile?.logoUrl ?? partnerProfile?.logoUrl ?? null;
  const shouldShowCreativeIdPrompt = !!profile && profile.profileCompletion < 100;
  const visibleSidebarItems = sidebarItems.filter((item) => {
    if (item.label === "Certificats") {
      return canViewCertificates(user?.type);
    }

    if (item.label === "Admin") {
      return user?.type === "ADMIN";
    }

    return true;
  });

  useEffect(() => {
    const storage = getBrowserStorage();
    const applyDashboardTheme = (nextTheme: DashboardTheme) => {
      setTheme(nextTheme);
      document.documentElement.dataset.dashboardTheme = nextTheme;
    };
    const storedTheme = storage?.getItem(dashboardThemeKey);

    if (isDashboardTheme(storedTheme)) {
      applyDashboardTheme(storedTheme);
      setIsClientReady(true);
      return;
    }

    const systemThemeQuery = window.matchMedia("(prefers-color-scheme: light)");
    const updateThemeFromSystem = (event?: MediaQueryListEvent) => {
      const currentStored = storage?.getItem(dashboardThemeKey);

      if (isDashboardTheme(currentStored)) {
        return;
      }

      applyDashboardTheme((event?.matches ?? systemThemeQuery.matches) ? "light" : "dark");
    };
    const initializedTheme = document.documentElement.dataset.dashboardTheme;

    if (isDashboardTheme(initializedTheme)) {
      setTheme(initializedTheme);
    } else {
      updateThemeFromSystem();
    }

    setIsClientReady(true);
    systemThemeQuery.addEventListener("change", updateThemeFromSystem);

    return () => systemThemeQuery.removeEventListener("change", updateThemeFromSystem);
  }, []);

  useEffect(() => {
    if (status !== "loading" || getBrowserStorage()) {
      return;
    }

    dispatch(hydrateAuth({}));
  }, [dispatch, status]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!accessToken && !refreshToken) {
      router.replace(`/connexion?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (
      user &&
      hasExpectedCurrentMemberDetails({ user, profile, organizationProfile, partnerProfile }) &&
      isCurrentMemberSyncFresh(user.id)
    ) {
      return;
    }

    let isMounted = true;

    async function syncCurrentMember() {
      const response = await getCurrentMember(accessToken);

      if (!isMounted) {
        return;
      }

      persistCurrentMember(response);
      markCurrentMemberSynced(response.user.id);
      dispatch(setCurrentMember(response));
    }

    syncCurrentMember().catch(() => {
      if (!isMounted) {
        return;
      }

      clearStoredAuth();
      dispatch(clearAuth());
      router.replace(`/connexion?redirect=${encodeURIComponent(currentPath)}`);
    });

    return () => {
      isMounted = false;
    };
  }, [accessToken, currentPath, dispatch, refreshToken, router, status, user, profile, organizationProfile, partnerProfile]);

  useEffect(() => {
    if (!accessToken || !user) {
      setNotificationUnreadCount(0);
      setMessageUnreadCount(0);
      return;
    }

    let isMounted = true;
    const socket = connectRealtimeSocket(accessToken);

    getUnreadNotificationCount(accessToken)
      .then((response) => {
        if (isMounted) {
          setNotificationUnreadCount(response.unreadCount);
        }
      })
      .catch(() => undefined);
    getUnreadMessageCount(accessToken)
      .then((response) => {
        if (isMounted) {
          setMessageUnreadCount(response.unreadCount);
        }
      })
      .catch(() => undefined);

    socket.on("notification.created", (payload: { unreadCount?: number }) => {
      if (typeof payload?.unreadCount === "number") {
        setNotificationUnreadCount(payload.unreadCount);
      } else {
        setNotificationUnreadCount((current) => current + 1);
      }
    });
    socket.on("notification.unreadCount", (payload: { unreadCount?: number }) => {
      if (typeof payload?.unreadCount === "number") {
        setNotificationUnreadCount(payload.unreadCount);
      }
    });
    socket.on("notification.readAll", () => setNotificationUnreadCount(0));
    socket.on("messages.unreadCount", (payload: { unreadCount?: number }) => {
      if (typeof payload?.unreadCount === "number") {
        setMessageUnreadCount(payload.unreadCount);
      }
    });
    socket.on("direct.message.created", () => {
      getUnreadMessageCount(accessToken)
        .then((response) => {
          if (isMounted) {
            setMessageUnreadCount(response.unreadCount);
          }
        })
        .catch(() => undefined);
    });
    socket.on("group.message.created", () => {
      getUnreadMessageCount(accessToken)
        .then((response) => {
          if (isMounted) {
            setMessageUnreadCount(response.unreadCount);
          }
        })
        .catch(() => undefined);
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, [accessToken, user]);

  useEffect(() => {
    if (pathname === "/espace-membre/recherche") {
      setGlobalSearchQuery(searchParams.get("q") ?? "");
    }
  }, [pathname, searchParams]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.dashboardTheme = nextTheme;
    getBrowserStorage()?.setItem(dashboardThemeKey, nextTheme);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      if (refreshToken) {
        await logoutSession(refreshToken);
      }
    } catch {
      // La session locale doit quand même être fermée si l'API logout échoue.
    } finally {
      clearStoredAuth();
      dispatch(clearAuth());
      router.replace("/connexion");
    }
  };

  const handleGlobalSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = globalSearchQuery.trim();

    if (!term) {
      router.push("/espace-membre/recherche");
      return;
    }

    router.push(`/espace-membre/recherche?q=${encodeURIComponent(term)}`);
  };

  if (!isClientReady) {
    return <MemberPageSkeleton />;
  }

  if (status === "loading" || !accessToken || !user) {
    return <MemberPageSkeleton theme={theme} />;
  }

  return (
    <main className="member-shell" data-dashboard-theme={theme}>
      <aside className="member-sidebar" aria-label="Navigation espace membre">
        <Link className="member-brand" href="/espace-membre" aria-label="Accueil espace membre Creative Currencies Africa">
          <img src="/assets/cca-logo-full-transparent-web.png" alt="Creative Currencies Africa" decoding="async" />
        </Link>

        <nav className="member-nav">
          {visibleSidebarItems.map((item) => {
            const Icon = item.icon;
            const badge = item.label === "Messages" ? formatBadgeCount(messageUnreadCount) : item.badge;

            return (
              <Link key={item.label} className={item.label === activeItem ? "is-active" : undefined} href={item.href}>
                <Icon aria-hidden="true" strokeWidth={1.8} />
                <span>{item.label}</span>
                {badge ? <strong>{badge}</strong> : null}
              </Link>
            );
          })}
        </nav>

        {shouldShowCreativeIdPrompt ? (
          <div className="member-premium-card">
            <Sparkles aria-hidden="true" strokeWidth={1.7} />
            <strong>Complétez votre Creative ID</strong>
            <span>Un profil précis permet d’être recommandé pour les formations, missions et collaborations.</span>
            <Link className="member-premium-action" href="/espace-membre/creative-id">
              Continuer
            </Link>
          </div>
        ) : null}
      </aside>

      <section className="member-main">
        <header className="member-topbar">
          <div>
            <strong>Community Platform</strong>
            <span>Connecter · Collaborer · Créer · Impacter</span>
          </div>

          <form
            className="member-search member-global-search"
            role="search"
            aria-label="Recherche globale"
            onSubmit={handleGlobalSearchSubmit}
          >
            <button className="member-search-button" type="submit" aria-label="Lancer la recherche">
              <Search aria-hidden="true" strokeWidth={1.8} />
            </button>
            <input
              value={globalSearchQuery}
              onChange={(event) => setGlobalSearchQuery(event.target.value)}
              placeholder="Rechercher des créateurs, ressources, opportunités..."
            />
          </form>

          <div className="member-actions">
            <Link className="member-create-button" href="/espace-membre/publier">
              <Plus aria-hidden="true" strokeWidth={1.8} />
              Publier
            </Link>
            <button
              className="member-icon-button"
              type="button"
              aria-label={`Activer le mode ${theme === "dark" ? "clair" : "sombre"}`}
              aria-pressed={theme === "light"}
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun aria-hidden="true" strokeWidth={1.8} /> : <Moon aria-hidden="true" strokeWidth={1.8} />}
            </button>
            <Link className="member-icon-button" href="/espace-membre/notifications" aria-label="Notifications">
              <Bell aria-hidden="true" strokeWidth={1.8} />
              {notificationUnreadCount > 0 ? <span>{notificationUnreadCount > 9 ? "9+" : notificationUnreadCount}</span> : null}
            </Link>
            <div className="member-profile-menu">
              <button
                className="member-profile-chip"
                type="button"
                aria-expanded={isProfileMenuOpen}
                onClick={() => setIsProfileMenuOpen((current) => !current)}
              >
                {headerAvatarUrl ? (
                  <img className="member-profile-avatar" src={headerAvatarUrl} alt="" loading="lazy" decoding="async" />
                ) : (
                  <span className="member-profile-avatar">{initials}</span>
                )}
                <span>
                  {displayName}
                  <small>{displayHandle}</small>
                </span>
                <ChevronDown aria-hidden="true" strokeWidth={1.8} />
              </button>
              {isProfileMenuOpen ? (
                <div className="member-profile-dropdown">
                  <div>
                    <strong>{displayName}</strong>
                    <span>{profileTitle}</span>
                  </div>
                  <Link href="/espace-membre/parametres" onClick={() => setIsProfileMenuOpen(false)}>
                    <Settings aria-hidden="true" strokeWidth={1.8} />
                    Paramètres du compte
                  </Link>
                  <button type="button" onClick={handleLogout} disabled={isLoggingOut}>
                    <LogOut aria-hidden="true" strokeWidth={1.8} />
                    {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {children}
      </section>
    </main>
  );
}

function persistCurrentMember(response: AuthMeResponse) {
  const storage = getBrowserStorage();
  storage?.setItem("cca.user", JSON.stringify(response.user));
  storage?.setItem("cca.profile", JSON.stringify(response.profile));
  storage?.setItem("cca.organizationProfile", JSON.stringify(response.organizationProfile));
  storage?.setItem("cca.partnerProfile", JSON.stringify(response.partnerProfile));
}

function markCurrentMemberSynced(userId: string) {
  getBrowserStorage()?.setItem(`${currentMemberSyncedAtPrefix}.${userId}`, String(Date.now()));
}

function isCurrentMemberSyncFresh(userId: string) {
  const syncedAt = Number(getBrowserStorage()?.getItem(`${currentMemberSyncedAtPrefix}.${userId}`));

  return Number.isFinite(syncedAt) && Date.now() - syncedAt < currentMemberSyncTtlMs;
}

function hasExpectedCurrentMemberDetails({
  user,
  profile,
  organizationProfile,
  partnerProfile,
}: Pick<AuthMeResponse, "user" | "profile" | "organizationProfile" | "partnerProfile">) {
  if (user.type === "CREATOR" || user.type === "LEARNER") {
    return !!profile;
  }

  if (user.type === "ORGANIZATION") {
    return !!organizationProfile;
  }

  if (user.type === "PARTNER") {
    return !!partnerProfile;
  }

  return true;
}

function formatBadgeCount(count: number) {
  if (count <= 0) {
    return "";
  }

  return count > 9 ? "9+" : String(count);
}

function canViewCertificates(accountType?: string | null) {
  return accountType === "CREATOR" || accountType === "LEARNER";
}

function clearStoredAuth() {
  const storage = getBrowserStorage();
  storage?.removeItem("cca.accessToken");
  storage?.removeItem("cca.refreshToken");
  storage?.removeItem("cca.user");
  storage?.removeItem("cca.profile");
  storage?.removeItem("cca.organizationProfile");
  storage?.removeItem("cca.partnerProfile");
}

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}
