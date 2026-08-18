"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  FileBadge,
  GraduationCap,
  Home,
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

type DashboardTheme = "dark" | "light";

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

const dashboardThemeKey = "cca-dashboard-theme-v1";

const sidebarItems: SidebarItem[] = [
  { label: "Accueil", href: "/espace-membre", icon: Home },
  { label: "Creative ID", href: "/espace-membre/creative-id", icon: FileBadge },
  { label: "Formations", href: "/espace-membre/formations", icon: GraduationCap },
  { label: "Réseau", href: "#", icon: Network },
  { label: "Messages", href: "#", icon: MessageCircle, badge: "3" },
  { label: "Groupes", href: "#", icon: UsersRound },
  { label: "Opportunités", href: "/espace-membre/opportunites", icon: Lightbulb },
  { label: "Ressources", href: "/espace-membre/ressources", icon: BookOpen },
  { label: "Agenda", href: "/espace-membre/agenda", icon: CalendarDays },
  { label: "Certificats", href: "/espace-membre/certificats", icon: ShieldCheck },
  { label: "Paramètres", href: "/espace-membre/parametres", icon: Settings },
];

export function MemberShell({
  activeItem,
  children,
}: {
  activeItem: string;
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<DashboardTheme>("dark");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(dashboardThemeKey);

    if (storedTheme === "dark" || storedTheme === "light") {
      setTheme(storedTheme);
      return;
    }

    setTheme(window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(dashboardThemeKey, nextTheme);
  };

  return (
    <main className="member-shell" data-dashboard-theme={theme}>
      <aside className="member-sidebar" aria-label="Navigation espace membre">
        <a className="member-brand" href="/#accueil" aria-label="Creative Currencies Africa">
          <img src="/assets/cca-logo-full-transparent-web.png" alt="Creative Currencies Africa" />
        </a>

        <nav className="member-nav">
          {sidebarItems.map((item) => {
            const Icon = item.icon;

            return (
              <a key={item.label} className={item.label === activeItem ? "is-active" : undefined} href={item.href}>
                <Icon aria-hidden="true" strokeWidth={1.8} />
                <span>{item.label}</span>
                {item.badge ? <strong>{item.badge}</strong> : null}
              </a>
            );
          })}
        </nav>

        <div className="member-premium-card">
          <Sparkles aria-hidden="true" strokeWidth={1.7} />
          <strong>Complétez votre Creative ID</strong>
          <span>Un profil précis permet d’être recommandé pour les formations, missions et collaborations.</span>
          <button type="button">Continuer</button>
        </div>
      </aside>

      <section className="member-main">
        <header className="member-topbar">
          <div>
            <strong>Community Platform</strong>
            <span>Connecter · Collaborer · Créer · Impacter</span>
          </div>

          <label className="member-search">
            <Search aria-hidden="true" strokeWidth={1.8} />
            <input placeholder="Rechercher des créateurs, ressources, opportunités..." />
          </label>

          <div className="member-actions">
            <button className="member-create-button" type="button">
              <Plus aria-hidden="true" strokeWidth={1.8} />
              Publier
            </button>
            <button
              className="member-icon-button"
              type="button"
              aria-label={`Activer le mode ${theme === "dark" ? "clair" : "sombre"}`}
              aria-pressed={theme === "light"}
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun aria-hidden="true" strokeWidth={1.8} /> : <Moon aria-hidden="true" strokeWidth={1.8} />}
            </button>
            <button className="member-icon-button" type="button" aria-label="Notifications">
              <Bell aria-hidden="true" strokeWidth={1.8} />
              <span />
            </button>
            <button className="member-profile-chip" type="button">
              <img src="/assets/cca-hero-art.png" alt="" />
              <span>
                Nathan LEKA
                <small>@nathleka</small>
              </span>
              <ChevronDown aria-hidden="true" strokeWidth={1.8} />
            </button>
          </div>
        </header>

        {children}
      </section>

      <button className="member-logout" type="button">
        <LogOut aria-hidden="true" strokeWidth={1.8} />
        Sortie démo
      </button>
    </main>
  );
}
