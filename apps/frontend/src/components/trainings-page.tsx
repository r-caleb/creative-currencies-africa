import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileBadge,
  FileText,
  MapPin,
  PlayCircle,
  UsersRound,
} from "lucide-react";
import { MemberShell } from "@/components/member-shell";

const modules = [
  { title: "Stylisme", status: "À venir", progress: "0%" },
  { title: "Photographie", status: "Inscrit", progress: "25%" },
  { title: "Relations publiques", status: "À venir", progress: "0%" },
  { title: "Business of Fashion", status: "Panel", progress: "Ouvert" },
];

const sessions = [
  { date: "02 sept.", title: "Ouverture & introduction aux industries créatives", time: "09:00 - 12:30" },
  { date: "03 sept.", title: "Ateliers pratiques : image, style et narration", time: "10:00 - 16:00" },
  { date: "04 sept.", title: "Panel Talk : The Business of Fashion", time: "14:00 - 17:00" },
  { date: "05 sept.", title: "Restitution, portfolio et orientation", time: "09:30 - 13:00" },
];

const resources = [
  { title: "Syllabus général", type: "PDF", icon: FileText },
  { title: "Template portfolio", type: "Guide", icon: FileBadge },
  { title: "Replay introduction", type: "Vidéo", icon: PlayCircle },
];

const recommended = [
  { title: "Portfolio professionnel", level: "Débutant", seats: "32 places" },
  { title: "Marketing digital pour artistes", level: "Intermédiaire", seats: "18 places" },
  { title: "Prix, devis et négociation", level: "Intermédiaire", seats: "24 places" },
];

export function TrainingsPage() {
  return (
    <MemberShell activeItem="Formations">
      <div className="training-layout">
        <section className="training-hero">
          <div className="training-hero-copy">
            <span className="member-kicker">Formations</span>
            <h1>Développez vos compétences et construisez un parcours certifiant.</h1>
            <p>
              Retrouvez vos workshops, ressources, sessions à venir et certificats associés.
              Chaque formation renforce votre Creative ID et votre visibilité professionnelle.
            </p>
            <div className="member-hero-actions">
              <a className="member-create-button" href="#programme-formation">
                Voir le programme
                <ArrowRight aria-hidden="true" strokeWidth={1.8} />
              </a>
              <a className="member-secondary-button" href="#catalogue-formations">Explorer les formations</a>
            </div>
          </div>
          <img src="/assets/cc-event-flyer.png" alt="" />
        </section>

        <div className="training-grid">
          <section className="training-main">
            <section id="programme-formation" className="member-card training-current-card">
              <div className="member-card-title">
                <div>
                  <h2>Formation officielle en cours</h2>
                  <p>Journée de formation Creative Currencies 2026.</p>
                </div>
                <span className="training-status">Inscription active</span>
              </div>
              <div className="training-current-body">
                <img src="/assets/cc-event-banner.png" alt="" />
                <div>
                  <h3>Stylisme, photographie, relations publiques + panel talk</h3>
                  <p>
                    Un programme intensif de quatre jours pour outiller les talents créatifs,
                    documenter leur parcours et les connecter aux opportunités du secteur.
                  </p>
                  <div className="training-meta-grid">
                    <span><CalendarDays aria-hidden="true" /> 2 - 5 septembre 2026</span>
                    <span><MapPin aria-hidden="true" /> Silikin Village, Kinshasa</span>
                    <span><UsersRound aria-hidden="true" /> Cohorte Creative Currencies</span>
                    <span><BadgeCheck aria-hidden="true" /> Certificat après validation</span>
                  </div>
                </div>
              </div>
            </section>

            <section id="catalogue-formations" className="member-card">
              <div className="member-card-title">
                <div>
                  <h2>Modules du parcours</h2>
                  <p>Une vue claire des blocs de formation suivis par le membre.</p>
                </div>
              </div>
              <div className="training-module-grid">
                {modules.map((module) => (
                  <article key={module.title}>
                    <div>
                      <strong>{module.title}</strong>
                      <span>{module.status}</span>
                    </div>
                    <small>{module.progress}</small>
                  </article>
                ))}
              </div>
            </section>

            <section className="member-card">
              <div className="member-card-title">
                <div>
                  <h2>Planning des sessions</h2>
                  <p>Les dates importantes liées à la formation et aux activités terrain.</p>
                </div>
              </div>
              <div className="training-session-list">
                {sessions.map((session) => (
                  <article key={session.title}>
                    <time>{session.date}</time>
                    <div>
                      <strong>{session.title}</strong>
                      <span><Clock3 aria-hidden="true" /> {session.time}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </section>

          <aside className="training-side">
            <section className="member-card training-progress-card">
              <span className="member-kicker">Progression</span>
              <strong>25%</strong>
              <p>Vous avez commencé le parcours. Les ressources et attestations seront débloquées progressivement.</p>
              <div className="creative-progress-track"><span /></div>
              <div className="training-check-list">
                <article className="is-done"><CheckCircle2 aria-hidden="true" /> Inscription confirmée</article>
                <article><CheckCircle2 aria-hidden="true" /> Présence aux ateliers</article>
                <article><CheckCircle2 aria-hidden="true" /> Projet ou portfolio final</article>
                <article><CheckCircle2 aria-hidden="true" /> Certificat validé</article>
              </div>
            </section>

            <section className="member-card">
              <div className="member-card-title">
                <h2>Ressources associées</h2>
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
                        <small>{item.type}</small>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="member-card">
              <div className="member-card-title">
                <h2>Recommandées</h2>
                <a href="#">Tout voir</a>
              </div>
              <div className="training-recommended-list">
                {recommended.map((item) => (
                  <article key={item.title}>
                    <BookOpen aria-hidden="true" strokeWidth={1.8} />
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.level} · {item.seats}</span>
                    </div>
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
