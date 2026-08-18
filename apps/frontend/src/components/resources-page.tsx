import {
  ArrowRight,
  BookOpen,
  Download,
  FileBadge,
  FileText,
  PlayCircle,
  Search,
  Star,
  Video,
} from "lucide-react";
import { MemberShell } from "@/components/member-shell";

const resourceFilters = ["Tous", "Syllabus", "Guides", "Templates", "Vidéos", "Contrats"];

const featuredResources = [
  {
    title: "Syllabus - Business of Fashion",
    type: "PDF formation",
    meta: "Module officiel · Septembre 2026",
    icon: FileText,
  },
  {
    title: "Template portfolio créatif",
    type: "Guide pratique",
    meta: "Creative ID · Mise en valeur du profil",
    icon: FileBadge,
  },
  {
    title: "Contrat de collaboration simple",
    type: "Modèle",
    meta: "Missions · Partenariats · Freelance",
    icon: BookOpen,
  },
  {
    title: "Replay introduction aux industries créatives",
    type: "Vidéo",
    meta: "Formation · Ressource pédagogique",
    icon: PlayCircle,
  },
];

const collections = [
  { title: "Préparer son Creative ID", count: "8 ressources", text: "Bio, portfolio, profil public et documents professionnels." },
  { title: "Monétiser sa créativité", count: "6 ressources", text: "Prix, devis, négociation, contrats et posture professionnelle." },
  { title: "Répondre aux appels à projets", count: "5 ressources", text: "Note d’intention, budget, dossier artistique et calendrier." },
];

export function ResourcesPage() {
  return (
    <MemberShell activeItem="Ressources">
      <div className="member-module-layout">
        <section className="member-module-hero">
          <div>
            <span className="member-kicker">Ressources</span>
            <h1>Une bibliothèque utile pour structurer votre parcours créatif.</h1>
            <p>
              Retrouvez les syllabus, guides, templates, contrats, vidéos et documents partagés
              après les formations, masterclass et activités Creative Currencies Africa.
            </p>
            <div className="member-hero-actions">
              <button className="member-create-button" type="button">
                Ouvrir la bibliothèque
                <ArrowRight aria-hidden="true" strokeWidth={1.8} />
              </button>
              <button className="member-secondary-button" type="button">
                <Download aria-hidden="true" strokeWidth={1.8} />
                Mes téléchargements
              </button>
            </div>
          </div>
          <div className="member-module-highlight-grid">
            <article>
              <BookOpen aria-hidden="true" strokeWidth={1.8} />
              <strong>24</strong>
              <span>ressources</span>
            </article>
            <article>
              <Video aria-hidden="true" strokeWidth={1.8} />
              <strong>6</strong>
              <span>vidéos</span>
            </article>
            <article>
              <Star aria-hidden="true" strokeWidth={1.8} />
              <strong>9</strong>
              <span>recommandées</span>
            </article>
          </div>
        </section>

        <section className="member-card member-module-toolbar">
          <label className="member-module-search">
            <Search aria-hidden="true" strokeWidth={1.8} />
            <input placeholder="Rechercher un guide, un template, une vidéo..." />
          </label>
          <div className="member-module-filters" aria-label="Filtres ressources">
            {resourceFilters.map((filter, index) => (
              <button key={filter} className={index === 0 ? "is-active" : undefined} type="button">
                {filter}
              </button>
            ))}
          </div>
        </section>

        <div className="member-module-grid">
          <section className="member-module-main">
            <section className="member-card">
              <div className="member-card-title">
                <div>
                  <h2>Ressources récentes</h2>
                  <p>Les derniers contenus utiles ajoutés à votre espace membre.</p>
                </div>
                <a href="#">Tout voir</a>
              </div>
              <div className="member-resource-list">
                {featuredResources.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article key={item.title}>
                      <span className="list-icon is-gold"><Icon aria-hidden="true" strokeWidth={1.8} /></span>
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.type}</span>
                        <small>{item.meta}</small>
                      </div>
                      <button className="member-secondary-button" type="button">Consulter</button>
                    </article>
                  );
                })}
              </div>
            </section>
          </section>

          <aside className="member-module-side">
            <section className="member-card">
              <div className="member-card-title">
                <h2>Collections</h2>
              </div>
              <div className="member-collection-list">
                {collections.map((collection) => (
                  <article key={collection.title}>
                    <strong>{collection.title}</strong>
                    <span>{collection.count}</span>
                    <p>{collection.text}</p>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </MemberShell>
  );
}
