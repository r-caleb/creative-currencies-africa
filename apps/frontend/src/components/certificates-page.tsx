import {
  ArrowRight,
  BadgeCheck,
  Download,
  FileBadge,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { MemberShell } from "@/components/member-shell";

const certificates = [
  {
    title: "Business of Fashion",
    status: "En cours",
    meta: "Formation officielle · Septembre 2026",
    progress: "25%",
  },
  {
    title: "Portfolio professionnel",
    status: "Validé",
    meta: "Workshop Creative ID",
    progress: "100%",
  },
  {
    title: "Introduction aux industries créatives",
    status: "Validé",
    meta: "Parcours découverte",
    progress: "100%",
  },
];

const badges = [
  { title: "Profil vérifié", text: "Identité membre confirmée", icon: ShieldCheck },
  { title: "Créateur émergent", text: "Creative ID publié", icon: BadgeCheck },
  { title: "Formation active", text: "Parcours en cours", icon: GraduationCap },
];

export function CertificatesPage() {
  return (
    <MemberShell activeItem="Certificats">
      <div className="member-module-layout">
        <section className="member-module-hero">
          <div>
            <span className="member-kicker">Certificats</span>
            <h1>Centralisez vos badges, attestations et certificats de parcours.</h1>
            <p>
              Chaque formation ou activité validée peut enrichir votre Creative ID et servir
              de preuve professionnelle auprès des partenaires, écoles, recruteurs et organisateurs.
            </p>
            <div className="member-hero-actions">
              <button className="member-create-button" type="button">
                Voir mes attestations
                <ArrowRight aria-hidden="true" strokeWidth={1.8} />
              </button>
              <button className="member-secondary-button" type="button">
                <Download aria-hidden="true" strokeWidth={1.8} />
                Exporter
              </button>
            </div>
          </div>
          <div className="certificate-proof-card">
            <FileBadge aria-hidden="true" strokeWidth={1.6} />
            <strong>CCA-2026-0142</strong>
            <span>3 certificats · 2 badges visibles</span>
          </div>
        </section>

        <div className="member-module-grid">
          <section className="member-module-main">
            <section className="member-card">
              <div className="member-card-title">
                <div>
                  <h2>Mes certificats</h2>
                  <p>Suivez les validations obtenues et les attestations encore en préparation.</p>
                </div>
              </div>
              <div className="certificate-list">
                {certificates.map((item) => (
                  <article key={item.title}>
                    <span className="list-icon is-gold"><FileBadge aria-hidden="true" strokeWidth={1.8} /></span>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.meta}</span>
                    </div>
                    <small>{item.status}</small>
                    <div className="application-progress" aria-label={`Progression ${item.progress}`}>
                      <span style={{ width: item.progress }} />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </section>

          <aside className="member-module-side">
            <section className="member-card">
              <div className="member-card-title">
                <h2>Badges visibles</h2>
              </div>
              <div className="badge-list">
                {badges.map((badge) => {
                  const Icon = badge.icon;

                  return (
                    <article key={badge.title}>
                      <Icon aria-hidden="true" strokeWidth={1.8} />
                      <div>
                        <strong>{badge.title}</strong>
                        <span>{badge.text}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="member-card certificate-lock-card">
              <LockKeyhole aria-hidden="true" strokeWidth={1.8} />
              <strong>Validation administrateur</strong>
              <p>Les certificats officiels seront publiés après vérification de la présence et des livrables.</p>
            </section>
          </aside>
        </div>
      </div>
    </MemberShell>
  );
}
