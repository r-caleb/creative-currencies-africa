import {
  ArrowRight,
  CalendarDays,
  Clock3,
  GraduationCap,
  Lightbulb,
  MapPin,
  UsersRound,
} from "lucide-react";
import { MemberShell } from "@/components/member-shell";

const agendaItems = [
  {
    day: "02",
    month: "SEP",
    title: "Ouverture de la journée de formation",
    type: "Formation",
    place: "Silikin Village, Kinshasa",
    time: "09:00",
    icon: GraduationCap,
  },
  {
    day: "15",
    month: "JUN",
    title: "Date limite - Africa Design Fund",
    type: "Appel à projets",
    place: "En ligne",
    time: "23:59",
    icon: Lightbulb,
  },
  {
    day: "24",
    month: "MAI",
    title: "Masterclass candidature",
    type: "Accompagnement",
    place: "Espace membre",
    time: "16:00",
    icon: UsersRound,
  },
];

const deadlines = [
  { title: "Compléter le dossier Business of Fashion Pitch", date: "28 mai 2026" },
  { title: "Déposer trois projets dans le portfolio", date: "31 mai 2026" },
  { title: "Confirmer la participation à la formation officielle", date: "10 juin 2026" },
];

export function AgendaPage() {
  return (
    <MemberShell activeItem="Agenda">
      <div className="member-module-layout">
        <section className="member-module-hero">
          <div>
            <span className="member-kicker">Agenda</span>
            <h1>Suivez les formations, activités, échéances et appels importants.</h1>
            <p>
              L’agenda aide chaque membre à ne pas manquer les sessions, masterclass,
              concours, résidences et dates limites liées à son parcours.
            </p>
            <div className="member-hero-actions">
              <button className="member-create-button" type="button">
                Voir le calendrier
                <ArrowRight aria-hidden="true" strokeWidth={1.8} />
              </button>
              <button className="member-secondary-button" type="button">Exporter mon agenda</button>
            </div>
          </div>
          <div className="agenda-month-card">
            <span>Septembre 2026</span>
            <strong>2-5</strong>
            <p>Formation officielle Creative Currencies Africa</p>
          </div>
        </section>

        <div className="member-module-grid">
          <section className="member-module-main">
            <section className="member-card">
              <div className="member-card-title">
                <div>
                  <h2>Prochains rendez-vous</h2>
                  <p>Une vue chronologique des activités importantes pour le membre.</p>
                </div>
              </div>
              <div className="agenda-timeline">
                {agendaItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article key={item.title}>
                      <time>
                        <strong>{item.day}</strong>
                        <span>{item.month}</span>
                      </time>
                      <span className="list-icon is-purple"><Icon aria-hidden="true" strokeWidth={1.8} /></span>
                      <div>
                        <span>{item.type}</span>
                        <strong>{item.title}</strong>
                        <small><Clock3 aria-hidden="true" /> {item.time}</small>
                        <small><MapPin aria-hidden="true" /> {item.place}</small>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </section>

          <aside className="member-module-side">
            <section className="member-card">
              <div className="member-card-title">
                <h2>Échéances</h2>
              </div>
              <div className="deadline-list">
                {deadlines.map((item) => (
                  <article key={item.title}>
                    <CalendarDays aria-hidden="true" strokeWidth={1.8} />
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.date}</span>
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
