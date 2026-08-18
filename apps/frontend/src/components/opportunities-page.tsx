import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Lightbulb,
  MapPin,
  Palette,
  Search,
  Trophy,
  UsersRound,
} from "lucide-react";
import { MemberShell } from "@/components/member-shell";

const filters = ["Toutes", "Concours", "Résidences", "Missions", "Financements", "Formations"];

const priorityOpportunities = [
  {
    title: "Africa Design Fund",
    category: "Financement",
    deadline: "15 juin 2026",
    location: "Afrique francophone",
    fit: "92%",
    description:
      "Appel à projets pour créateurs visuels, designers et collectifs capables de documenter une démarche professionnelle.",
    icon: Lightbulb,
  },
  {
    title: "Résidence artistique - Kinshasa",
    category: "Résidence",
    deadline: "30 mai 2026",
    location: "Kinshasa",
    fit: "86%",
    description:
      "Programme d’accompagnement autour de l’image, de la scénographie et des projets culturels à fort impact local.",
    icon: Palette,
  },
  {
    title: "Designer freelance - Campagne culturelle",
    category: "Mission",
    deadline: "Cette semaine",
    location: "Hybride",
    fit: "78%",
    description:
      "Mission courte pour un profil capable de produire une identité visuelle, des supports sociaux et une direction graphique.",
    icon: BriefcaseBusiness,
  },
];

const applications = [
  { title: "Business of Fashion Pitch", status: "Dossier à compléter", progress: "45%" },
  { title: "Portfolio Review CCA", status: "Préselection", progress: "70%" },
  { title: "Résidence photo documentaire", status: "Brouillon", progress: "20%" },
];

const preparationSteps = [
  "Compléter le Creative ID",
  "Ajouter trois projets au portfolio",
  "Joindre une biographie professionnelle",
  "Préparer une note d’intention",
];

const highlights = [
  { label: "Ouvertes", value: "12", icon: Trophy },
  { label: "Recommandées", value: "8", icon: BadgeCheck },
  { label: "Candidatures", value: "3", icon: FileText },
];

export function OpportunitiesPage() {
  return (
    <MemberShell activeItem="Opportunités">
      <div className="opportunities-layout">
        <section className="opportunities-hero">
          <div>
            <span className="member-kicker">Opportunités</span>
            <h1>Trouvez les appels qui font avancer votre parcours créatif.</h1>
            <p>
              Concours, résidences, missions, financements et appels à projets sont centralisés
              selon votre profil, votre discipline et votre niveau de préparation.
            </p>
            <div className="member-hero-actions">
              <button className="member-create-button" type="button">
                Préparer une candidature
                <ArrowRight aria-hidden="true" strokeWidth={1.8} />
              </button>
              <button className="member-secondary-button" type="button">Voir mes dossiers</button>
            </div>
          </div>

          <div className="opportunities-highlight-grid">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.label}>
                  <Icon aria-hidden="true" strokeWidth={1.8} />
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              );
            })}
          </div>
        </section>

        <section className="member-card opportunities-toolbar">
          <label className="opportunities-search">
            <Search aria-hidden="true" strokeWidth={1.8} />
            <input placeholder="Rechercher une opportunité, une ville, une discipline..." />
          </label>
          <div className="opportunities-filters" aria-label="Filtres opportunités">
            {filters.map((filter, index) => (
              <button key={filter} className={index === 0 ? "is-active" : undefined} type="button">
                {filter}
              </button>
            ))}
          </div>
        </section>

        <div className="opportunities-grid">
          <section className="opportunities-main">
            <section className="member-card">
              <div className="member-card-title">
                <div>
                  <h2>Recommandées pour vous</h2>
                  <p>Une sélection prioritaire basée sur votre discipline, vos compétences et votre Creative ID.</p>
                </div>
                <a href="#">Tout voir</a>
              </div>
              <div className="opportunity-card-list">
                {priorityOpportunities.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article key={item.title}>
                      <span className="opportunity-icon"><Icon aria-hidden="true" strokeWidth={1.8} /></span>
                      <div className="opportunity-copy">
                        <div>
                          <span>{item.category}</span>
                          <strong>{item.title}</strong>
                        </div>
                        <p>{item.description}</p>
                        <div className="opportunity-meta">
                          <span><CalendarDays aria-hidden="true" /> Date limite : {item.deadline}</span>
                          <span><MapPin aria-hidden="true" /> {item.location}</span>
                          <span><BadgeCheck aria-hidden="true" /> Compatibilité {item.fit}</span>
                        </div>
                      </div>
                      <button className="member-secondary-button" type="button">Consulter</button>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="member-card">
              <div className="member-card-title">
                <div>
                  <h2>Mes candidatures</h2>
                  <p>Suivez vos dossiers avant soumission, pendant l’étude et après sélection.</p>
                </div>
              </div>
              <div className="application-list">
                {applications.map((item) => (
                  <article key={item.title}>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.status}</span>
                    </div>
                    <div className="application-progress" aria-label={`Progression ${item.progress}`}>
                      <span style={{ width: item.progress }} />
                    </div>
                    <small>{item.progress}</small>
                  </article>
                ))}
              </div>
            </section>
          </section>

          <aside className="opportunities-side">
            <section className="member-card opportunity-readiness-card">
              <span className="member-kicker">Préparation</span>
              <strong>Votre dossier doit être clair avant de postuler.</strong>
              <p>
                L’objectif est d’éviter les candidatures faibles : le membre doit pouvoir présenter
                son identité, ses références, son portfolio et son intention.
              </p>
              <div className="training-check-list">
                {preparationSteps.map((step, index) => (
                  <article key={step} className={index < 2 ? "is-done" : undefined}>
                    <CheckCircle2 aria-hidden="true" /> {step}
                  </article>
                ))}
              </div>
            </section>

            <section className="member-card">
              <div className="member-card-title">
                <h2>À venir</h2>
                <a href="#">Agenda</a>
              </div>
              <div className="training-session-list">
                <article>
                  <time>24 mai</time>
                  <div>
                    <strong>Masterclass candidature</strong>
                    <span><Clock3 aria-hidden="true" /> 16:00 - 17:30</span>
                  </div>
                </article>
                <article>
                  <time>31 mai</time>
                  <div>
                    <strong>Session portfolio review</strong>
                    <span><UsersRound aria-hidden="true" /> En groupe</span>
                  </div>
                </article>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </MemberShell>
  );
}
