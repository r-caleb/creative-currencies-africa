"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileBadge,
  FileText,
  GraduationCap,
  Home,
  Lightbulb,
  LogOut,
  MessageCircle,
  Moon,
  Network,
  Palette,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  UsersRound,
} from "lucide-react";

type DashboardTheme = "dark" | "light";

const dashboardThemeKey = "cca-dashboard-theme-v1";

const sidebarItems: Array<{ label: string; icon: LucideIcon; active?: boolean; badge?: string }> = [
  { label: "Accueil", icon: Home, active: true },
  { label: "Creative ID", icon: FileBadge },
  { label: "Réseau", icon: Network },
  { label: "Messages", icon: MessageCircle, badge: "3" },
  { label: "Groupes", icon: UsersRound },
  { label: "Opportunités", icon: Lightbulb },
  { label: "Ressources", icon: BookOpen },
  { label: "Agenda", icon: CalendarDays },
  { label: "Certificats", icon: ShieldCheck },
  { label: "Paramètres", icon: Settings },
];

const profileTasks = [
  { label: "Ajouter votre portfolio", state: "Prioritaire", done: false },
  { label: "Préciser vos disponibilités", state: "À compléter", done: false },
  { label: "Renseigner vos langues parlées", state: "À compléter", done: false },
  { label: "Creative ID généré", state: "Actif", done: true },
];

const opportunities = [
  { title: "Appel à projets - Africa Design Fund", type: "Financement", date: "15 juin 2026", icon: Lightbulb },
  { title: "Résidence artistique - Kinshasa", type: "Résidence", date: "30 juin 2026", icon: Palette },
  { title: "Mission créative - identité visuelle", type: "Collaboration", date: "Ouvert cette semaine", icon: Target },
];

const resources = [
  { title: "Syllabus - Business of Fashion", meta: "PDF · Formation", icon: FileText },
  { title: "Template portfolio créatif", meta: "Guide · Creative ID", icon: FileBadge },
  { title: "Contrat de collaboration simple", meta: "Modèle · Opportunités", icon: BookOpen },
];

const agenda = [
  { day: "02", month: "Sept.", title: "Journée de formation", meta: "Stylisme · Photographie · Relations publiques" },
  { day: "04", month: "Sept.", title: "Panel Talk", meta: "The Business of Fashion" },
];

const journey = [
  { label: "Profil", text: "Votre Creative ID est créé et visible dans l’annuaire.", icon: FileBadge, active: true },
  { label: "Formation", text: "Suivez vos workshops, ressources et attestations.", icon: GraduationCap, active: true },
  { label: "Opportunités", text: "Recevez les appels pertinents selon votre discipline.", icon: Lightbulb },
  { label: "Collaboration", text: "Entrez en relation avec des créatifs et partenaires.", icon: UsersRound },
];

const stats = [
  { label: "Profil Creative ID", value: "62%", trend: "8 champs restants" },
  { label: "Certificats", value: "4", trend: "2 validés" },
  { label: "Opportunités", value: "12", trend: "3 nouvelles" },
  { label: "Contacts créatifs", value: "248", trend: "réseau actif" },
];

export function MemberDashboard() {
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
              <a key={item.label} className={item.active ? "is-active" : undefined} href="#">
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
            <input placeholder="Rechercher des créateurs, publications, opportunités..." />
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

        <div className="member-dashboard-grid">
          <section className="member-primary-column" aria-label="Tableau de bord membre">
            <section className="member-hero-card">
              <div className="member-hero-copy">
                <span className="member-kicker">Espace créateur</span>
                <h1>Bonjour Nathan, votre parcours créatif avance.</h1>
                <p>
                  Votre espace rassemble votre Creative ID, vos formations, vos ressources,
                  vos certificats et les opportunités adaptées à votre profil.
                </p>
                <div className="member-hero-actions">
                  <button className="member-create-button" type="button">
                    Compléter mon profil
                    <ArrowRight aria-hidden="true" strokeWidth={1.8} />
                  </button>
                  <button className="member-secondary-button" type="button">Voir mon Creative ID</button>
                </div>
              </div>
              <div className="member-identity-card">
                <div className="creative-id-cover">
                  <img src="/assets/cca-hero-art.png" alt="" />
                </div>
                <strong>Nathan LEKA</strong>
                <span>Créateur · Direction artistique</span>
                <div>
                  <small>Creative ID</small>
                  <b>CCA-2026-0142</b>
                </div>
              </div>
            </section>

            <section className="member-stats-grid" aria-label="Résumé du compte">
              {stats.map((stat) => (
                <article key={stat.label} className="member-card stat-card">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.trend}</small>
                </article>
              ))}
            </section>

            <section className="member-card member-progress-card">
              <div className="member-card-title">
                <div>
                  <h2>À faire maintenant</h2>
                  <p>Les éléments prioritaires pour rendre votre profil exploitable.</p>
                </div>
              </div>
              <div className="member-task-list">
                {profileTasks.map((task) => (
                  <article key={task.label} className={task.done ? "is-done" : undefined}>
                    <CheckCircle2 aria-hidden="true" strokeWidth={1.8} />
                    <div>
                      <strong>{task.label}</strong>
                      <span>{task.state}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="member-card member-journey-card">
              <div className="member-card-title">
                <div>
                  <h2>Votre parcours sur la plateforme</h2>
                  <p>Une progression simple : être identifié, se former, accéder aux opportunités et collaborer.</p>
                </div>
              </div>
              <div className="member-journey">
                {journey.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article key={item.label} className={item.active ? "is-active" : undefined}>
                      <span><Icon aria-hidden="true" strokeWidth={1.8} /></span>
                      <strong>{item.label}</strong>
                      <p>{item.text}</p>
                    </article>
                  );
                })}
              </div>
            </section>
          </section>

          <aside className="member-support-column" aria-label="Actions et informations importantes">
            <section className="member-card">
              <div className="member-card-title">
                <h2>Opportunités pour vous</h2>
                <a href="#">Voir tout</a>
              </div>
              <div className="compact-list">
                {opportunities.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article key={item.title}>
                      <span className="list-icon"><Icon aria-hidden="true" strokeWidth={1.8} /></span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.type} · {item.date}</small>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="member-card">
              <div className="member-card-title">
                <h2>Agenda Creative Currencies</h2>
                <a href="#">Voir l’agenda</a>
              </div>
              <div className="member-agenda-list">
                {agenda.map((item) => (
                  <article key={item.title}>
                    <time>
                      <strong>{item.day}</strong>
                      <span>{item.month}</span>
                    </time>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.meta}</small>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="member-card">
              <div className="member-card-title">
                <h2>Ressources récentes</h2>
                <a href="#">Bibliothèque</a>
              </div>
              <div className="compact-list">
                {resources.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article key={item.title}>
                      <span className="list-icon is-gold"><Icon aria-hidden="true" strokeWidth={1.8} /></span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.meta}</small>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="member-card member-notification-card">
              <div className="list-icon is-soft">
                <Bell aria-hidden="true" strokeWidth={1.8} />
              </div>
              <div>
                <h2>Notifications</h2>
                <p>Messages, commentaires, rappels d’événements et nouvelles opportunités seront centralisés ici.</p>
              </div>
              <button type="button">Ouvrir le centre</button>
            </section>
          </aside>
        </div>
      </section>

      <button className="member-logout" type="button">
        <LogOut aria-hidden="true" strokeWidth={1.8} />
        Sortie démo
      </button>
    </main>
  );
}
