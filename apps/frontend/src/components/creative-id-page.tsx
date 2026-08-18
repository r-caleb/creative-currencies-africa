import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Download,
  ExternalLink,
  FileBadge,
  Globe2,
  Languages,
  MapPin,
  Pencil,
  Phone,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { MemberShell } from "@/components/member-shell";

const profileFields = [
  { label: "Nom public", value: "Nathan LEKA" },
  { label: "Discipline principale", value: "Direction artistique" },
  { label: "Ville", value: "Kinshasa, RDC" },
  { label: "Disponibilité", value: "Missions, workshops, collaborations" },
];

const skills = [
  "Direction artistique",
  "Identité visuelle",
  "Branding culturel",
  "Photographie éditoriale",
  "Scénographie",
  "Coordination créative",
];

const portfolioItems = [
  { title: "Identité visuelle", type: "Projet", image: "/assets/graphisme.jpg" },
  { title: "Série éditoriale", type: "Photographie", image: "/assets/photographie.jpg" },
  { title: "Direction mode", type: "Stylisme", image: "/assets/mode.jpg" },
];

const certificates = [
  { title: "Business of Fashion", meta: "Formation · Septembre 2026" },
  { title: "Portfolio professionnel", meta: "Workshop · Creative ID" },
];

const missingFields = [
  "Ajouter trois travaux au portfolio",
  "Joindre un CV ou dossier artistique",
  "Préciser vos tarifs indicatifs",
  "Ajouter un contact professionnel",
];

export function CreativeIdPage() {
  return (
    <MemberShell activeItem="Creative ID">
      <div className="creative-id-layout">
        <section className="creative-id-hero">
          <div className="creative-id-profile">
            <div className="creative-id-avatar">
              <img src="/assets/cca-hero-art.png" alt="" />
              <span><BadgeCheck aria-hidden="true" strokeWidth={1.8} /></span>
            </div>
            <div>
              <span className="member-kicker">Creative ID</span>
              <h1>Nathan LEKA</h1>
              <p>Créateur · Direction artistique · Kinshasa</p>
              <div className="creative-id-badges">
                <span>CCA-2026-0142</span>
                <span>Profil actif</span>
                <span>Créateur émergent</span>
              </div>
            </div>
          </div>

          <div className="creative-id-share-card">
            <div className="creative-qr" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <strong>Carte partageable</strong>
            <p>QR code, numéro membre et lien public pour présenter votre parcours.</p>
            <div className="creative-id-actions">
              <button className="member-create-button" type="button">
                <Share2 aria-hidden="true" strokeWidth={1.8} />
                Partager
              </button>
              <button className="member-secondary-button" type="button">
                <Download aria-hidden="true" strokeWidth={1.8} />
                Exporter
              </button>
            </div>
          </div>
        </section>

        <div className="creative-id-grid">
          <section className="creative-id-main">
            <section className="member-card creative-id-section">
              <div className="member-card-title">
                <div>
                  <h2>Profil professionnel</h2>
                  <p>Les informations visibles par les organisateurs, partenaires et autres créatifs.</p>
                </div>
                <button className="member-secondary-button" type="button">
                  <Pencil aria-hidden="true" strokeWidth={1.8} />
                  Modifier
                </button>
              </div>
              <div className="creative-field-grid">
                {profileFields.map((field) => (
                  <article key={field.label}>
                    <span>{field.label}</span>
                    <strong>{field.value}</strong>
                  </article>
                ))}
              </div>
              <div className="creative-bio">
                <strong>Biographie courte</strong>
                <p>
                  Directeur artistique basé à Kinshasa, Nathan développe des identités visuelles
                  et expériences créatives qui relient culture, image et stratégie de marque.
                </p>
              </div>
            </section>

            <section className="member-card creative-id-section">
              <div className="member-card-title">
                <div>
                  <h2>Portfolio</h2>
                  <p>Une sélection de travaux pour rendre le profil crédible et exploitable.</p>
                </div>
                <a href="#">Ajouter un projet</a>
              </div>
              <div className="creative-portfolio-grid">
                {portfolioItems.map((item) => (
                  <article key={item.title}>
                    <img src={item.image} alt="" />
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.type}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="member-card creative-id-section">
              <div className="member-card-title">
                <div>
                  <h2>Compétences & domaines</h2>
                  <p>Ces mots-clés permettront de recommander les bonnes formations et opportunités.</p>
                </div>
              </div>
              <div className="creative-skill-list">
                {skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </section>
          </section>

          <aside className="creative-id-side">
            <section className="member-card creative-completion-card">
              <div>
                <span className="member-kicker">Complétude</span>
                <strong>62%</strong>
                <p>Encore quelques informations pour rendre ce profil prêt à être partagé.</p>
              </div>
              <div className="creative-progress-track"><span /></div>
              <div className="creative-missing-list">
                {missingFields.map((field) => (
                  <article key={field}>
                    <CheckCircle2 aria-hidden="true" strokeWidth={1.8} />
                    <span>{field}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="member-card creative-contact-card">
              <div className="member-card-title">
                <h2>Coordonnées</h2>
              </div>
              <a href="mailto:nathan@creativecurrencies.africa"><Globe2 aria-hidden="true" /> nathan@creativecurrencies.africa</a>
              <a href="tel:+243000000000"><Phone aria-hidden="true" /> +243 000 000 000</a>
              <span><MapPin aria-hidden="true" /> Kinshasa, République démocratique du Congo</span>
              <a href="#"><ExternalLink aria-hidden="true" /> Portfolio externe</a>
            </section>

            <section className="member-card creative-id-section">
              <div className="member-card-title">
                <h2>Certificats</h2>
                <a href="#">Voir tout</a>
              </div>
              <div className="compact-list">
                {certificates.map((item) => (
                  <article key={item.title}>
                    <span className="list-icon is-gold"><FileBadge aria-hidden="true" strokeWidth={1.8} /></span>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.meta}</small>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="member-card creative-id-section">
              <div className="creative-mini-grid">
                <article>
                  <Languages aria-hidden="true" strokeWidth={1.8} />
                  <strong>Langues</strong>
                  <span>Français, Lingala, Anglais</span>
                </article>
                <article>
                  <CalendarDays aria-hidden="true" strokeWidth={1.8} />
                  <strong>Disponibilité</strong>
                  <span>Disponible sur projet</span>
                </article>
                <article>
                  <BriefcaseBusiness aria-hidden="true" strokeWidth={1.8} />
                  <strong>Statut</strong>
                  <span>Freelance / Collaborations</span>
                </article>
                <article>
                  <ShieldCheck aria-hidden="true" strokeWidth={1.8} />
                  <strong>Vérification</strong>
                  <span>Documents à compléter</span>
                </article>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </MemberShell>
  );
}
