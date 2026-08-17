"use client";

import { useState } from "react";
import type { ChangeEvent, ComponentType, ReactNode } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  Globe2,
  Languages,
  Link2,
  LockKeyhole,
  MapPin,
  Palette,
  Phone,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  AuthBackLink,
  AuthInput,
  AuthSocialButtons,
  Mail,
  PasswordEye,
} from "@/components/auth-ui";

type RegistrationWizardProps = {
  account: {
    slug: string;
    title: string;
  };
};

const disciplines = [
  "Mode & stylisme",
  "Photographie",
  "Musique",
  "Cinéma & vidéo",
  "Art visuel",
  "Design",
  "Architecture",
  "Littérature",
  "Artisanat",
  "Communication & médias",
  "Autre",
];

const profileConfigs = {
  createur: {
    professionLabel: "Profession ou métier créatif",
    professionPlaceholder: "Styliste, photographe, réalisateur...",
    disciplineLabel: "Discipline principale",
    statusLabel: "Niveau actuel",
    statusOptions: ["Débutant", "Intermédiaire", "Professionnel", "Entrepreneur"],
    availabilityLabel: "Disponibilité",
    availabilityOptions: ["Disponible maintenant", "Disponible selon projet", "Indisponible temporairement"],
    bioLabel: "Biographie courte optionnelle",
    bioPlaceholder: "Présentez votre parcours, votre univers ou ce que vous souhaitez développer.",
    skillsLabel: "Compétences clés",
    skillsPlaceholder: "Stylisme, montage, direction artistique...",
  },
  apprenant: {
    professionLabel: "Statut ou occupation",
    professionPlaceholder: "Étudiant, jeune diplômé, passionné...",
    disciplineLabel: "Domaine d'apprentissage principal",
    statusLabel: "Niveau d'apprentissage",
    statusOptions: ["Débutant", "Intermédiaire", "Avancé", "En reconversion"],
    availabilityLabel: "Disponibilité pour les formations",
    availabilityOptions: ["En semaine", "Week-end", "Soirée", "Selon le programme"],
    bioLabel: "Objectif d'apprentissage optionnel",
    bioPlaceholder: "Expliquez ce que vous souhaitez apprendre ou développer avec Creative Currencies Africa.",
    skillsLabel: "Compétences à développer",
    skillsPlaceholder: "Photographie, stylisme, prise de parole, montage...",
  },
  organisation: {
    professionLabel: "Type de structure",
    professionPlaceholder: "École, studio, collectif, média, agence...",
    disciplineLabel: "Domaine principal",
    statusLabel: "Taille de la structure",
    statusOptions: ["1 à 5 membres", "6 à 20 membres", "21 à 50 membres", "Plus de 50 membres"],
    availabilityLabel: "Ouverture aux collaborations",
    availabilityOptions: ["Ouverte aux partenariats", "Ouverte aux formations", "Sur invitation", "À définir"],
    bioLabel: "Présentation courte optionnelle",
    bioPlaceholder: "Présentez votre structure, sa mission et ses activités principales.",
    skillsLabel: "Services ou activités",
    skillsPlaceholder: "Formation, production, accompagnement, diffusion...",
  },
  partenaire: {
    professionLabel: "Type de partenaire",
    professionPlaceholder: "Sponsor, entreprise, média, institution...",
    disciplineLabel: "Domaine d'intérêt principal",
    statusLabel: "Type d'engagement",
    statusOptions: ["Sponsoring", "Mécénat", "Partenariat média", "Partenariat technique", "À définir"],
    availabilityLabel: "Disponibilité pour projets",
    availabilityOptions: ["Disponible maintenant", "Selon opportunité", "Sur rendez-vous", "À définir"],
    bioLabel: "Motivation du partenariat optionnelle",
    bioPlaceholder: "Expliquez brièvement pourquoi vous souhaitez rejoindre ou soutenir l'écosystème.",
    skillsLabel: "Domaines d'apport",
    skillsPlaceholder: "Financement, visibilité, équipement, formation, réseau...",
  },
};

const presenceConfigs = {
  createur: {
    portfolioLabel: "Portfolio optionnel",
    portfolioPlaceholder: "Lien Behance, Drive, book PDF...",
    websiteLabel: "Site internet optionnel",
    websitePlaceholder: "https://...",
    instagramLabel: "Instagram optionnel",
    instagramPlaceholder: "@creative...",
    linkedinLabel: "LinkedIn optionnel",
    linkedinPlaceholder: "Lien de profil",
    fileTitle: "CV ou portfolio PDF",
    fileHint: "Optionnel à l'inscription, recommandé dans l'espace membre.",
  },
  apprenant: {
    portfolioLabel: "Travaux ou projets optionnels",
    portfolioPlaceholder: "Lien vers quelques essais, images ou documents...",
    websiteLabel: "Site ou page personnelle optionnel",
    websitePlaceholder: "https://...",
    instagramLabel: "Instagram optionnel",
    instagramPlaceholder: "@votrecompte",
    linkedinLabel: "LinkedIn optionnel",
    linkedinPlaceholder: "Lien de profil",
    fileTitle: "CV ou document de parcours",
    fileHint: "Optionnel maintenant, utile plus tard pour les formations et opportunités.",
  },
  organisation: {
    portfolioLabel: "Dossier de présentation optionnel",
    portfolioPlaceholder: "Lien Drive, brochure, deck ou page de présentation...",
    websiteLabel: "Site de la structure optionnel",
    websitePlaceholder: "https://...",
    instagramLabel: "Instagram de la structure optionnel",
    instagramPlaceholder: "@organisation",
    linkedinLabel: "LinkedIn ou page professionnelle",
    linkedinPlaceholder: "Lien de page",
    fileTitle: "Document de présentation",
    fileHint: "Optionnel à l'inscription, recommandé pour faciliter la validation.",
  },
  partenaire: {
    portfolioLabel: "Lien de présentation optionnel",
    portfolioPlaceholder: "Deck, site, brochure ou dossier partenaire...",
    websiteLabel: "Site officiel optionnel",
    websitePlaceholder: "https://...",
    instagramLabel: "Réseau social optionnel",
    instagramPlaceholder: "@organisation",
    linkedinLabel: "LinkedIn ou contact professionnel",
    linkedinPlaceholder: "Lien de page",
    fileTitle: "Dossier partenaire",
    fileHint: "Optionnel maintenant, utile pour qualifier le type de collaboration.",
  },
};

const steps = [
  {
    title: "Informations personnelles",
    description: "Les informations nécessaires pour créer votre compte membre.",
  },
  {
    title: "Profil Creative ID",
    description: "Les éléments qui décrivent votre activité et votre univers créatif.",
  },
  {
    title: "Présence & confirmation",
    description: "Les liens publics restent optionnels et pourront être complétés plus tard.",
  },
];

function WizardSelect({
  label,
  children,
  icon: Icon = Sparkles,
  value,
  onChange,
}: {
  label: string;
  children: ReactNode;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean; strokeWidth?: number }>;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <span className="auth-input-wrap">
        <Icon className="auth-input-icon" aria-hidden={true} strokeWidth={1.7} />
        <select defaultValue={value === undefined ? "" : undefined} value={value} onChange={onChange}>
          {children}
        </select>
      </span>
    </label>
  );
}

function WizardTextarea({
  label,
  placeholder,
  icon: Icon = Sparkles,
}: {
  label: string;
  placeholder: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean; strokeWidth?: number }>;
}) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <span className="auth-input-wrap auth-input-wrap--textarea">
        <Icon className="auth-input-icon" aria-hidden={true} strokeWidth={1.7} />
        <textarea placeholder={placeholder} rows={4} />
      </span>
    </label>
  );
}

export function RegistrationWizard({ account }: RegistrationWizardProps) {
  const [step, setStep] = useState(0);
  const [selectedDiscipline, setSelectedDiscipline] = useState("");
  const profileConfig = profileConfigs[account.slug as keyof typeof profileConfigs] ?? profileConfigs.createur;
  const presenceConfig = presenceConfigs[account.slug as keyof typeof presenceConfigs] ?? presenceConfigs.createur;

  const goNext = () => setStep((current) => Math.min(current + 1, steps.length - 1));
  const goBack = () => setStep((current) => Math.max(current - 1, 0));

  return (
    <>
      <AuthBackLink href="/inscription" />

      <div className="auth-progress" aria-label="Progression de l'inscription">
        {steps.map((item, index) => (
          <span
            key={item.title}
            className={index === step ? "is-current" : index < step ? "is-complete" : undefined}
            aria-current={index === step ? "step" : undefined}
          >
            {index + 1}
          </span>
        ))}
      </div>

      <div className="auth-step-heading">
        <strong>{steps[step].title}</strong>
        <p>{steps[step].description}</p>
      </div>

      <form className="auth-form registration-form">
        {step === 0 ? (
          <>
            <div className="auth-avatar-upload">
              <div>
                <UserRound aria-hidden="true" strokeWidth={1.6} />
              </div>
              <span>Ajouter une photo <small>optionnel</small></span>
            </div>

            <div className="auth-field-grid">
              <AuthInput label="Prénom" placeholder="Votre prénom" icon={UserRound} />
              <AuthInput label="Nom" placeholder="Votre nom" icon={UserRound} />
            </div>

            <AuthInput label="Adresse e-mail" type="email" placeholder="nom@creativecurrencies.africa" icon={Mail} />

            <div className="auth-field-grid">
              <AuthInput
                label="Mot de passe"
                type="password"
                placeholder="Créez un mot de passe"
                icon={LockKeyhole}
                actionIcon={<PasswordEye />}
              />
              <AuthInput
                label="Téléphone"
                placeholder="+243 ..."
                icon={Phone}
              />
            </div>

            <div className="auth-field-grid">
              <AuthInput label="Date de naissance" type="text" placeholder="JJ / MM / AAAA" icon={CalendarDays} />
              <WizardSelect label="Genre optionnel" icon={UserRound}>
                <option value="">Sélectionner</option>
                <option>Féminin</option>
                <option>Masculin</option>
                <option>Préfère ne pas répondre</option>
              </WizardSelect>
            </div>

            <div className="auth-field-grid">
              <AuthInput label="Pays" placeholder="République Démocratique du Congo" icon={Globe2} />
              <AuthInput label="Ville" placeholder="Kinshasa" icon={MapPin} />
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div className="auth-field-grid">
              <AuthInput
                label={profileConfig.professionLabel}
                placeholder={profileConfig.professionPlaceholder}
                icon={BriefcaseBusiness}
              />
              <WizardSelect
                label={profileConfig.disciplineLabel}
                icon={Palette}
                value={selectedDiscipline}
                onChange={(event) => setSelectedDiscipline(event.target.value)}
              >
                <option value="">Choisir une discipline</option>
                {disciplines.map((discipline) => (
                  <option key={discipline} value={discipline}>{discipline}</option>
                ))}
              </WizardSelect>
            </div>

            {selectedDiscipline === "Autre" ? (
              <AuthInput
                label="Précisez votre discipline"
                placeholder="Exemple : scénographie, danse, création sonore..."
                icon={Palette}
              />
            ) : null}

            <div className="auth-field-grid">
              <WizardSelect label={profileConfig.statusLabel} icon={Sparkles}>
                <option value="">Sélectionner</option>
                {profileConfig.statusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </WizardSelect>
              <WizardSelect label={profileConfig.availabilityLabel} icon={CalendarDays}>
                <option value="">Sélectionner</option>
                {profileConfig.availabilityOptions.map((availability) => (
                  <option key={availability}>{availability}</option>
                ))}
              </WizardSelect>
            </div>

            <WizardTextarea
              label={profileConfig.bioLabel}
              placeholder={profileConfig.bioPlaceholder}
              icon={FileText}
            />

            <div className="auth-field-grid">
              <AuthInput label={profileConfig.skillsLabel} placeholder={profileConfig.skillsPlaceholder} icon={Sparkles} />
              <AuthInput label="Langues parlées" placeholder="Français, lingala, anglais..." icon={Languages} />
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div className="auth-field-grid">
              <AuthInput
                label={presenceConfig.portfolioLabel}
                placeholder={presenceConfig.portfolioPlaceholder}
                icon={Link2}
              />
              <AuthInput
                label={presenceConfig.websiteLabel}
                placeholder={presenceConfig.websitePlaceholder}
                icon={Globe2}
              />
            </div>

            <div className="auth-field-grid">
              <AuthInput
                label={presenceConfig.instagramLabel}
                placeholder={presenceConfig.instagramPlaceholder}
                icon={Link2}
              />
              <AuthInput
                label={presenceConfig.linkedinLabel}
                placeholder={presenceConfig.linkedinPlaceholder}
                icon={Link2}
              />
            </div>

            <div className="auth-file-pill">
              <FileText aria-hidden="true" strokeWidth={1.7} />
              <div>
                <strong>{presenceConfig.fileTitle}</strong>
                <span>{presenceConfig.fileHint}</span>
              </div>
            </div>

            <div className="auth-wizard-note">
              <strong>{account.title}</strong>
              <span>
                Le QR code personnel et le numéro de membre seront générés automatiquement après validation du compte.
              </span>
            </div>

            <label className="auth-checkbox auth-terms">
              <input type="checkbox" />
              <span>J'accepte les conditions d'utilisation et la politique de confidentialité.</span>
            </label>
          </>
        ) : null}

        <div className="auth-step-actions">
          {step > 0 ? (
            <button className="auth-step-back" type="button" onClick={goBack}>
              Retour
            </button>
          ) : (
            <span />
          )}
          {step < steps.length - 1 ? (
            <button className="auth-primary-button" type="button" onClick={goNext}>
              Continuer
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button className="auth-primary-button" type="button">
              Créer mon compte
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      </form>

      {step === 0 ? (
        <>
          <div className="auth-divider"><span>ou s'inscrire avec</span></div>
          <AuthSocialButtons />
        </>
      ) : null}

      <p className="auth-bottom-link">
        Déjà un compte ? <Link href="/connexion">Se connecter</Link>
      </p>
    </>
  );
}
