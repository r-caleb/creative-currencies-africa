import {
  AtSign,
  Bell,
  Eye,
  Globe2,
  LockKeyhole,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { MemberShell } from "@/components/member-shell";

const accountFields = [
  { label: "Nom public", value: "Nathan LEKA", icon: UserRound },
  { label: "Adresse e-mail", value: "nathan@creativecurrencies.africa", icon: AtSign },
  { label: "Téléphone", value: "+243 000 000 000", icon: Phone },
  { label: "Ville", value: "Kinshasa, RDC", icon: MapPin },
];

const preferences = [
  { title: "Creative ID public", text: "Votre profil peut être consulté par les partenaires.", icon: Eye, enabled: true },
  { title: "Notifications opportunités", text: "Recevoir les appels recommandés selon votre discipline.", icon: Bell, enabled: true },
  { title: "Visibilité internationale", text: "Afficher votre profil dans les recherches hors RDC.", icon: Globe2, enabled: false },
];

export function SettingsPage() {
  return (
    <MemberShell activeItem="Paramètres">
      <div className="member-module-layout">
        <section className="member-module-hero">
          <div>
            <span className="member-kicker">Paramètres</span>
            <h1>Gardez le contrôle sur votre compte, votre visibilité et vos préférences.</h1>
            <p>
              Cette zone rassemble les informations personnelles, la sécurité, les préférences
              de notification et les réglages de visibilité du Creative ID.
            </p>
          </div>
          <div className="settings-security-card">
            <ShieldCheck aria-hidden="true" strokeWidth={1.8} />
            <strong>Compte protégé</strong>
            <span>Mot de passe actif · e-mail vérifié</span>
          </div>
        </section>

        <div className="member-module-grid">
          <section className="member-module-main">
            <section className="member-card">
              <div className="member-card-title">
                <div>
                  <h2>Informations du compte</h2>
                  <p>Ces données servent au profil membre, aux attestations et aux échanges officiels.</p>
                </div>
                <button className="member-secondary-button" type="button">Modifier</button>
              </div>
              <div className="settings-field-grid">
                {accountFields.map((field) => {
                  const Icon = field.icon;

                  return (
                    <article key={field.label}>
                      <Icon aria-hidden="true" strokeWidth={1.8} />
                      <span>{field.label}</span>
                      <strong>{field.value}</strong>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="member-card">
              <div className="member-card-title">
                <div>
                  <h2>Préférences</h2>
                  <p>Réglez ce qui doit être visible et ce que la plateforme peut vous recommander.</p>
                </div>
              </div>
              <div className="settings-preference-list">
                {preferences.map((preference) => {
                  const Icon = preference.icon;

                  return (
                    <article key={preference.title}>
                      <Icon aria-hidden="true" strokeWidth={1.8} />
                      <div>
                        <strong>{preference.title}</strong>
                        <span>{preference.text}</span>
                      </div>
                      <button className={preference.enabled ? "is-enabled" : undefined} type="button">
                        {preference.enabled ? "Activé" : "Désactivé"}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          </section>

          <aside className="member-module-side">
            <section className="member-card certificate-lock-card">
              <LockKeyhole aria-hidden="true" strokeWidth={1.8} />
              <strong>Sécurité</strong>
              <p>Le changement de mot de passe, la double vérification et les sessions actives seront reliés au backend.</p>
              <button className="member-secondary-button" type="button">Gérer la sécurité</button>
            </section>
          </aside>
        </div>
      </div>
    </MemberShell>
  );
}
