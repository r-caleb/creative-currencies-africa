"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ComponentType, FormEvent, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  FileText,
  Globe2,
  ImagePlus,
  Languages,
  Link2,
  LockKeyhole,
  MapPin,
  Palette,
  Plus,
  Search,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import {
  AuthBackLink,
  AuthFieldLabel,
  AuthInput,
  AuthSocialButtons,
  Mail,
  PasswordEye,
} from "@/components/auth-ui";
import { registerMember } from "@/lib/api";
import { useAppDispatch } from "@/store/hooks";
import { setPendingVerification, setRegistrationAccountType } from "@/store/slices/registration-slice";

type RegistrationWizardProps = {
  account: {
    slug: string;
    title: string;
  };
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  phoneCountryCode: CountryCode;
  countryCode: CountryCode | "OTHER";
  birthDate: string;
  gender: string;
  country: string;
  city: string;
  profession: string;
  discipline: string;
  otherDiscipline: string;
  status: string;
  availability: string;
  bio: string;
  skills: string;
  languages: string[];
  portfolioUrl: string;
  websiteUrl: string;
  instagram: string;
  linkedin: string;
  termsAccepted: boolean;
  avatarFile: File | null;
};

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  phoneCountryCode: "CD",
  countryCode: "CD",
  birthDate: "",
  gender: "",
  country: "Congo RDC",
  city: "Kinshasa",
  profession: "",
  discipline: "",
  otherDiscipline: "",
  status: "",
  availability: "",
  bio: "",
  skills: "",
  languages: [],
  portfolioUrl: "",
  websiteUrl: "",
  instagram: "",
  linkedin: "",
  termsAccepted: false,
  avatarFile: null,
};

const accountTypeBySlug: Record<string, string> = {
  createur: "CREATOR",
  apprenant: "LEARNER",
  organisation: "ORGANIZATION",
  partenaire: "PARTNER",
};

const genderByLabel: Record<string, string> = {
  Féminin: "FEMALE",
  Masculin: "MALE",
  "Préfère ne pas répondre": "PREFER_NOT_TO_SAY",
};

const disciplines = [
  "Mode, couture & stylisme",
  "Beauté, coiffure & esthétique",
  "Artisanat",
  "Arts visuels",
  "Photographie",
  "Cinéma & audiovisuel",
  "Musique",
  "Arts de la scène",
  "Danse",
  "Écriture & littérature",
  "Design & graphisme",
  "Architecture & scénographie",
  "Patrimoine & culture",
  "Arts numériques",
  "Communication & médias",
  "Autre",
];

const languageOptions = [
  "Français",
  "Lingala",
  "Swahili",
  "Kikongo",
  "Tshiluba",
  "Anglais",
  "Portugais",
  "Arabe",
  "Espagnol",
  "Italien",
  "Allemand",
  "Néerlandais",
  "Yoruba",
  "Hausa",
  "Wolof",
  "Bambara",
  "Amharique",
  "Kinyarwanda",
  "Kirundi",
  "Luganda",
  "Malagasy",
  "Somali",
  "Afrikaans",
  "Zulu",
  "Xhosa",
  "Mandarin",
  "Hindi",
  "Turc",
  "Russe",
  "Autre",
];

const regionDisplayNames = new Intl.DisplayNames(["fr"], { type: "region" });

type CountryOption = {
  code: CountryCode | "OTHER";
  name: string;
  flag: string;
  dialCode?: string;
};

const countries: CountryOption[] = [
  ...getCountries()
    .map((code) => ({
      code,
      name: formatCountryName(code),
      flag: countryFlag(code),
      dialCode: `+${getCountryCallingCode(code)}`,
    }))
    .sort((first, second) => first.name.localeCompare(second.name, "fr", { sensitivity: "base" })),
  {
    code: "OTHER",
    name: "Autre",
    flag: "🌐",
  },
];

function formatCountryName(code: CountryCode) {
  if (code === "CD") {
    return "Congo RDC";
  }

  if (code === "CG") {
    return "Congo";
  }

  return regionDisplayNames.of(code) ?? code;
}

function countryFlag(code: CountryCode) {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

const profileConfigs = {
  createur: {
    professionLabel: "Profession ou métier créatif",
    professionPlaceholder: "Styliste, photographe, réalisateur...",
    disciplineLabel: "Discipline principale",
    statusLabel: "Niveau actuel",
    statusOptions: ["Débutant", "Intermédiaire", "Professionnel", "Entrepreneur"],
    availabilityLabel: "Disponibilité",
    availabilityOptions: ["Disponible maintenant", "Disponible selon projet", "Indisponible temporairement"],
    bioLabel: "Biographie courte",
    bioPlaceholder: "Présentez votre parcours, votre univers ou ce que vous souhaitez développer.",
    skillsLabel: "Compétences clés",
    skillsPlaceholder: "Coupe, tresses, mixage, retouche photo, peinture murale...",
  },
  apprenant: {
    professionLabel: "Statut ou occupation",
    professionPlaceholder: "Étudiant, jeune diplômé, passionné...",
    disciplineLabel: "Domaine d'apprentissage principal",
    statusLabel: "Niveau d'apprentissage",
    statusOptions: ["Débutant", "Intermédiaire", "Avancé", "En reconversion"],
    availabilityLabel: "Disponibilité pour les formations",
    availabilityOptions: ["En semaine", "Week-end", "Soirée", "Selon le programme"],
    bioLabel: "Objectif d'apprentissage",
    bioPlaceholder: "Expliquez ce que vous souhaitez apprendre ou développer avec Creative Currencies Africa.",
    skillsLabel: "Compétences à développer",
    skillsPlaceholder: "Cadrage, couture, dessin, prise de parole, montage vidéo...",
  },
  organisation: {
    professionLabel: "Type de structure",
    professionPlaceholder: "École, studio, collectif, média, agence...",
    disciplineLabel: "Domaine principal",
    statusLabel: "Taille de la structure",
    statusOptions: ["1 à 5 membres", "6 à 20 membres", "21 à 50 membres", "Plus de 50 membres"],
    availabilityLabel: "Ouverture aux collaborations",
    availabilityOptions: ["Ouverte aux partenariats", "Ouverte aux formations", "Sur invitation", "À définir"],
    bioLabel: "Présentation courte",
    bioPlaceholder: "Présentez votre structure, sa mission et ses activités principales.",
    skillsLabel: "Services ou activités",
    skillsPlaceholder: "Ateliers, production, casting, location studio, diffusion...",
  },
  partenaire: {
    professionLabel: "Type de partenaire",
    professionPlaceholder: "Sponsor, entreprise, média, institution...",
    disciplineLabel: "Domaine d'intérêt principal",
    statusLabel: "Type d'engagement",
    statusOptions: ["Sponsoring", "Mécénat", "Partenariat média", "Partenariat technique", "À définir"],
    availabilityLabel: "Disponibilité pour projets",
    availabilityOptions: ["Disponible maintenant", "Selon opportunité", "Sur rendez-vous", "À définir"],
    bioLabel: "Motivation du partenariat",
    bioPlaceholder: "Expliquez brièvement pourquoi vous souhaitez rejoindre ou soutenir l'écosystème.",
    skillsLabel: "Domaines d'apport",
    skillsPlaceholder: "Financement, mentorat, équipement, lieux, visibilité média...",
  },
};

const presenceConfigs = {
  createur: {
    portfolioLabel: "Portfolio",
    portfolioPlaceholder: "Lien Behance, Drive, book PDF...",
    websiteLabel: "Site internet",
    websitePlaceholder: "https://...",
    instagramLabel: "Instagram",
    instagramPlaceholder: "@creative...",
    linkedinLabel: "LinkedIn",
    linkedinPlaceholder: "Lien de profil",
  },
  apprenant: {
    portfolioLabel: "Travaux ou projets",
    portfolioPlaceholder: "Lien vers quelques essais, images ou documents...",
    websiteLabel: "Site ou page personnelle",
    websitePlaceholder: "https://...",
    instagramLabel: "Instagram",
    instagramPlaceholder: "@votrecompte",
    linkedinLabel: "LinkedIn",
    linkedinPlaceholder: "Lien de profil",
  },
  organisation: {
    portfolioLabel: "Dossier de présentation",
    portfolioPlaceholder: "Lien Drive, brochure, deck ou page de présentation...",
    websiteLabel: "Site de la structure",
    websitePlaceholder: "https://...",
    instagramLabel: "Instagram de la structure",
    instagramPlaceholder: "@organisation",
    linkedinLabel: "LinkedIn ou page professionnelle",
    linkedinPlaceholder: "Lien de page",
  },
  partenaire: {
    portfolioLabel: "Lien de présentation",
    portfolioPlaceholder: "Deck, site, brochure ou dossier partenaire...",
    websiteLabel: "Site officiel",
    websitePlaceholder: "https://...",
    instagramLabel: "Réseau social",
    instagramPlaceholder: "@organisation",
    linkedinLabel: "LinkedIn ou contact professionnel",
    linkedinPlaceholder: "Lien de page",
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
    description: "Ajoutez vos liens publics ou complétez-les plus tard.",
  },
];

function WizardSelect({
  label,
  children,
  icon: Icon = Sparkles,
  value,
  name,
  required,
  onChange,
}: {
  label: string;
  children: ReactNode;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean; strokeWidth?: number }>;
  value?: string;
  name?: string;
  required?: boolean;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <label className="auth-field">
      <AuthFieldLabel label={label} required={required} />
      <span className="auth-input-wrap">
        <Icon className="auth-input-icon" aria-hidden={true} strokeWidth={1.7} />
        <select
          name={name}
          required={required}
          defaultValue={value === undefined ? "" : undefined}
          value={value}
          onChange={onChange}
        >
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
  name,
  value,
  onChange,
  required,
}: {
  label: string;
  placeholder: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean; strokeWidth?: number }>;
  name?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
}) {
  return (
    <label className="auth-field">
      <AuthFieldLabel label={label} required={required} />
      <span className="auth-input-wrap auth-input-wrap--textarea">
        <Icon className="auth-input-icon" aria-hidden={true} strokeWidth={1.7} />
        <textarea name={name} placeholder={placeholder} rows={4} value={value} onChange={onChange} required={required} />
      </span>
    </label>
  );
}

function CountryPickerModal({
  open,
  mode,
  selectedCode,
  onClose,
  onSelect,
}: {
  open: boolean;
  mode: "country" | "phone";
  selectedCode?: CountryCode | "OTHER";
  onClose: () => void;
  onSelect: (country: CountryOption) => void;
}) {
  const [query, setQuery] = useState("");

  if (!open) {
    return null;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filteredCountries = countries.filter((country) => {
    if (mode === "phone" && country.code === "OTHER") {
      return false;
    }

    return `${country.name} ${country.dialCode ?? ""}`.toLowerCase().includes(normalizedQuery);
  });

  return (
    <div className="country-picker-backdrop" role="presentation" onClick={onClose}>
      <section
        className="country-picker-modal"
        aria-modal="true"
        aria-labelledby="country-picker-title"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="country-picker-handle" />
        <div className="country-picker-header">
          <h2 id="country-picker-title">Sélectionnez un pays</h2>
          <button type="button" aria-label="Fermer" onClick={onClose}>
            <X aria-hidden="true" strokeWidth={1.8} />
          </button>
        </div>

        <label className="country-picker-search">
          <Search aria-hidden="true" strokeWidth={1.8} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un pays"
            autoFocus
          />
        </label>

        <div className="country-picker-list">
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country) => (
              <button
                type="button"
                className={country.code === selectedCode ? "is-selected" : undefined}
                key={country.code}
                onClick={() => {
                  onSelect(country);
                  onClose();
                }}
              >
                <span className="country-picker-flag">{country.flag}</span>
                <span>{country.name}</span>
                {mode === "phone" && country.dialCode ? <strong>{country.dialCode}</strong> : null}
              </button>
            ))
          ) : (
            <p className="country-picker-empty">Aucun pays trouvé</p>
          )}
        </div>
      </section>
    </div>
  );
}

function CountryInput({
  value,
  countryCode,
  onSelect,
}: {
  value: string;
  countryCode: CountryCode | "OTHER";
  onSelect: (country: CountryOption) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <label className="auth-field">
      <AuthFieldLabel label="Pays" required />
      <button className="country-select-button" type="button" onClick={() => setIsOpen(true)}>
        <Globe2 className="auth-input-icon" aria-hidden="true" strokeWidth={1.7} />
        <span>{value}</span>
        <ChevronDown aria-hidden="true" strokeWidth={1.8} />
      </button>
      <CountryPickerModal
        open={isOpen}
        mode="country"
        selectedCode={countryCode}
        onClose={() => setIsOpen(false)}
        onSelect={onSelect}
      />
    </label>
  );
}

function PhoneInput({
  phone,
  countryCode,
  onCountrySelect,
  onPhoneChange,
}: {
  phone: string;
  countryCode: CountryCode;
  onCountrySelect: (country: CountryOption) => void;
  onPhoneChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedCountry = countries.find((country) => country.code === countryCode) ?? countries.find((country) => country.code === "CD");

  return (
    <label className="auth-field">
      <AuthFieldLabel label="Téléphone" />
      <span className="phone-field">
        <button className="phone-code-button" type="button" onClick={() => setIsOpen(true)}>
          <span className="country-picker-flag">{selectedCountry?.flag}</span>
          <strong>{selectedCountry?.dialCode}</strong>
          <ChevronDown aria-hidden="true" strokeWidth={1.8} />
        </button>
        <input
          name="phone"
          inputMode="tel"
          placeholder="Numéro de téléphone"
          value={phone}
          onChange={onPhoneChange}
        />
      </span>
      <CountryPickerModal
        open={isOpen}
        mode="phone"
        selectedCode={countryCode}
        onClose={() => setIsOpen(false)}
        onSelect={onCountrySelect}
      />
    </label>
  );
}

function LanguageMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (languages: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedKeys = new Set(value.map(normalizeOption));
  const optionKeys = new Set(languageOptions.map(normalizeOption));
  const normalizedQuery = normalizeOption(query);
  const filteredLanguages = languageOptions.filter((language) => {
    return !selectedKeys.has(normalizeOption(language)) && normalizeOption(language).includes(normalizedQuery);
  });
  const trimmedQuery = query.trim();
  const canAddCustom =
    trimmedQuery.length > 0 &&
    !selectedKeys.has(normalizeOption(trimmedQuery)) &&
    !optionKeys.has(normalizeOption(trimmedQuery));

  const addLanguage = (language: string) => {
    const nextLanguage = formatCustomLanguage(language);

    if (!nextLanguage || selectedKeys.has(normalizeOption(nextLanguage))) {
      return;
    }

    onChange([...value, nextLanguage]);
    setQuery("");
  };

  const removeLanguage = (language: string) => {
    onChange(value.filter((item) => normalizeOption(item) !== normalizeOption(language)));
  };

  return (
    <div className="auth-field">
      <AuthFieldLabel label="Langues parlées" />
      <div className="language-multiselect">
        <div
          className="language-multiselect-display"
          onClick={() => setIsOpen(true)}
        >
          <Languages className="auth-input-icon" aria-hidden={true} strokeWidth={1.7} />
          <div className="language-tags">
            {value.length > 0 ? (
              value.map((language) => (
                <span className="language-tag" key={language}>
                  {language}
                  <button
                    type="button"
                    aria-label={`Retirer ${language}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeLanguage(language);
                    }}
                  >
                    <X aria-hidden="true" strokeWidth={1.8} />
                  </button>
                </span>
              ))
            ) : (
              <span className="language-placeholder">Français, lingala, swahili...</span>
            )}
          </div>
          <button
            className="language-open-button"
            type="button"
            aria-label="Choisir les langues"
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen(true);
            }}
          >
            <ChevronDown aria-hidden="true" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="country-picker-backdrop" role="presentation" onClick={() => setIsOpen(false)}>
          <section
            className="country-picker-modal language-picker-modal"
            aria-modal="true"
            aria-labelledby="language-picker-title"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="country-picker-handle" />
            <div className="country-picker-header">
              <h2 id="language-picker-title">Sélectionnez les langues</h2>
              <button type="button" aria-label="Fermer" onClick={() => setIsOpen(false)}>
                <X aria-hidden="true" strokeWidth={1.8} />
              </button>
            </div>

            <label className="country-picker-search">
              <Search aria-hidden="true" strokeWidth={1.8} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher une langue"
                autoFocus
              />
            </label>

            <div className="language-picker-selected" aria-label="Langues sélectionnées">
              {value.length > 0 ? (
                value.map((language) => (
                  <span className="language-tag" key={language}>
                    {language}
                    <button type="button" aria-label={`Retirer ${language}`} onClick={() => removeLanguage(language)}>
                      <X aria-hidden="true" strokeWidth={1.8} />
                    </button>
                  </span>
                ))
              ) : (
                <span>Aucune langue sélectionnée</span>
              )}
            </div>

            <div className="country-picker-list language-picker-list">
              {canAddCustom ? (
                <button className="language-picker-add" type="button" onClick={() => addLanguage(trimmedQuery)}>
                  <Plus aria-hidden="true" strokeWidth={1.8} />
                  <span>Ajouter : {formatCustomLanguage(trimmedQuery)}</span>
                </button>
              ) : null}

              {filteredLanguages.length > 0 ? (
                filteredLanguages.map((language) => (
                  <button type="button" key={language} onClick={() => addLanguage(language)}>
                    <Languages aria-hidden="true" strokeWidth={1.7} />
                    <span>{language}</span>
                  </button>
                ))
              ) : !canAddCustom ? (
                <p className="country-picker-empty">Aucune langue trouvée</p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export function RegistrationWizard({ account }: RegistrationWizardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const avatarPreviewUrlRef = useRef("");
  const profileConfig = profileConfigs[account.slug as keyof typeof profileConfigs] ?? profileConfigs.createur;
  const presenceConfig = presenceConfigs[account.slug as keyof typeof presenceConfigs] ?? presenceConfigs.createur;
  const isOrganizationProfile = account.slug === "organisation" || account.slug === "partenaire";
  const avatarUploadLabel = isOrganizationProfile ? "Ajouter un logo" : "Ajouter une photo";
  const AvatarUploadIcon = isOrganizationProfile ? BriefcaseBusiness : ImagePlus;

  const goNext = () => setStep((current) => Math.min(current + 1, steps.length - 1));
  const goBack = () => setStep((current) => Math.max(current - 1, 0));
  const phoneCountry = countries.find((country) => country.code === form.phoneCountryCode);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrlRef.current) {
        URL.revokeObjectURL(avatarPreviewUrlRef.current);
      }
    };
  }, []);

  const updateField =
    (field: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = event.target instanceof HTMLInputElement && event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

      setForm((current) => ({
        ...current,
        [field]: value,
      }));
      setError("");
    };
  const updateCountry = (country: CountryOption) => {
    setForm((current) => ({
      ...current,
      country: country.name,
      countryCode: country.code,
    }));
    setError("");
  };
  const updatePhoneCountry = (country: CountryOption) => {
    if (country.code === "OTHER") {
      return;
    }

    const phoneCountryCode = country.code;

    setForm((current) => ({
      ...current,
      phoneCountryCode,
    }));
    setError("");
  };
  const updateAvatarFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    const previewUrl = file ? URL.createObjectURL(file) : "";

    if (avatarPreviewUrlRef.current) {
      URL.revokeObjectURL(avatarPreviewUrlRef.current);
    }

    avatarPreviewUrlRef.current = previewUrl;

    setForm((current) => ({
      ...current,
      avatarFile: file,
    }));
    setAvatarPreviewUrl(previewUrl);
    setError("");
  };

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step < steps.length - 1) {
      goNext();
      return;
    }

    if (!form.termsAccepted) {
      setError("Veuillez accepter les conditions avant de créer votre compte.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const payload: Record<string, unknown> = {
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone ? `${phoneCountry?.dialCode ?? ""} ${form.phone}`.trim() : undefined,
      type: accountTypeBySlug[account.slug] ?? "LEARNER",
      country: form.country,
      city: form.city,
      profession: form.profession || undefined,
      birthDate: form.birthDate || undefined,
      gender: genderByLabel[form.gender] ?? undefined,
      discipline: form.discipline,
      otherDiscipline: form.otherDiscipline || undefined,
      bio: form.bio || undefined,
      portfolioUrl: form.portfolioUrl || undefined,
      websiteUrl: form.websiteUrl || undefined,
      skills: splitList(form.skills),
      languages: form.languages,
      availability: form.availability || undefined,
    };

    if (account.slug === "organisation") {
      payload.organizationName = form.profession;
      payload.organizationSector = form.discipline;
      payload.organizationDescription = form.bio || undefined;
    }

    if (account.slug === "partenaire") {
      payload.partnerName = form.lastName;
      payload.partnerType = form.profession;
      payload.partnerDescription = form.bio || undefined;
    }

    try {
      const response = await registerMember(payload);
      dispatch(setRegistrationAccountType(account.slug));
      dispatch(setPendingVerification({ email: response.user.email, expiresAt: response.verificationExpiresAt }));
      window.localStorage.setItem("cca.pendingVerificationEmail", response.user.email);
      window.localStorage.setItem("cca.pendingVerificationExpiresAt", response.verificationExpiresAt);
      router.push(`/verification-otp?email=${encodeURIComponent(response.user.email)}&flow=registration`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer le compte pour le moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

      <form className="auth-form registration-form" onSubmit={submitRegistration}>
        {step === 0 ? (
          <>
            <label className={`auth-avatar-upload${avatarPreviewUrl ? " has-preview" : ""}${isOrganizationProfile ? " is-logo" : ""}`}>
              <input type="file" accept="image/*" onChange={updateAvatarFile} />
              <span
                className="auth-avatar-preview"
                style={avatarPreviewUrl ? { backgroundImage: `url(${avatarPreviewUrl})` } : undefined}
              >
                {!avatarPreviewUrl ? (
                  <AvatarUploadIcon aria-hidden="true" strokeWidth={1.6} />
                ) : null}
              </span>
              <span>{avatarUploadLabel}</span>
              {form.avatarFile ? <small>{form.avatarFile.name}</small> : null}
            </label>

            <div className="auth-field-grid">
              <AuthInput
                label="Prénom"
                name="firstName"
                placeholder="Votre prénom"
                icon={UserRound}
                value={form.firstName}
                onChange={updateField("firstName")}
                required
              />
              <AuthInput
                label="Nom"
                name="lastName"
                placeholder="Votre nom"
                icon={UserRound}
                value={form.lastName}
                onChange={updateField("lastName")}
                required
              />
            </div>

            <AuthInput
              label="Adresse e-mail"
              name="email"
              type="email"
              placeholder="nom@creativecurrencies.africa"
              icon={Mail}
              value={form.email}
              onChange={updateField("email")}
              required
            />

            <AuthInput
              label="Mot de passe"
              name="password"
              type="password"
              placeholder="Créez un mot de passe"
              icon={LockKeyhole}
              actionIcon={<PasswordEye />}
              value={form.password}
              onChange={updateField("password")}
              required
              minLength={8}
            />

            <PhoneInput
              phone={form.phone}
              countryCode={form.phoneCountryCode}
              onCountrySelect={updatePhoneCountry}
              onPhoneChange={updateField("phone")}
            />

            <div className="auth-field-grid auth-field-grid--date-gender">
              <AuthInput
                label="Date de naissance"
                name="birthDate"
                type="date"
                placeholder="JJ / MM / AAAA"
                icon={CalendarDays}
                value={form.birthDate}
                onChange={updateField("birthDate")}
              />
              <WizardSelect label="Genre" icon={UserRound} value={form.gender} onChange={updateField("gender")}>
                <option value="">Sélectionner</option>
                <option value="Féminin">Féminin</option>
                <option value="Masculin">Masculin</option>
                <option value="Préfère ne pas répondre">Préfère ne pas répondre</option>
              </WizardSelect>
            </div>

            <div className="auth-field-grid">
              <CountryInput value={form.country} countryCode={form.countryCode} onSelect={updateCountry} />
              <AuthInput
                label="Ville"
                name="city"
                placeholder="Kinshasa"
                icon={MapPin}
                value={form.city}
                onChange={updateField("city")}
                required
              />
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div className="auth-field-grid">
              <AuthInput
                label={profileConfig.professionLabel}
                name="profession"
                placeholder={profileConfig.professionPlaceholder}
                icon={BriefcaseBusiness}
                value={form.profession}
                onChange={updateField("profession")}
                required={account.slug === "organisation" || account.slug === "partenaire"}
              />
              <WizardSelect
                label={profileConfig.disciplineLabel}
                icon={Palette}
                value={form.discipline}
                onChange={updateField("discipline")}
                required
              >
                <option value="">Choisir une discipline</option>
                {disciplines.map((discipline) => (
                  <option key={discipline} value={discipline}>{discipline}</option>
                ))}
              </WizardSelect>
            </div>

            {form.discipline === "Autre" ? (
              <AuthInput
                label="Précisez votre discipline"
                name="otherDiscipline"
                placeholder="Exemple : scénographie, danse, création sonore..."
                icon={Palette}
                value={form.otherDiscipline}
                onChange={updateField("otherDiscipline")}
                required
              />
            ) : null}

            <div className="auth-field-grid">
              <WizardSelect label={profileConfig.statusLabel} icon={Sparkles} value={form.status} onChange={updateField("status")}>
                <option value="">Sélectionner</option>
                {profileConfig.statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </WizardSelect>
              <WizardSelect
                label={profileConfig.availabilityLabel}
                icon={CalendarDays}
                value={form.availability}
                onChange={updateField("availability")}
              >
                <option value="">Sélectionner</option>
                {profileConfig.availabilityOptions.map((availability) => (
                  <option key={availability} value={availability}>{availability}</option>
                ))}
              </WizardSelect>
            </div>

            <WizardTextarea
              label={profileConfig.bioLabel}
              placeholder={profileConfig.bioPlaceholder}
              icon={FileText}
              name="bio"
              value={form.bio}
              onChange={updateField("bio")}
            />

            <div className="auth-field-grid">
              <AuthInput
                label={profileConfig.skillsLabel}
                name="skills"
                placeholder={profileConfig.skillsPlaceholder}
                icon={Sparkles}
                value={form.skills}
                onChange={updateField("skills")}
              />
              <LanguageMultiSelect
                value={form.languages}
                onChange={(languages) => {
                  setForm((current) => ({ ...current, languages }));
                  setError("");
                }}
              />
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div className="auth-field-grid">
              <AuthInput
                label={presenceConfig.portfolioLabel}
                name="portfolioUrl"
                placeholder={presenceConfig.portfolioPlaceholder}
                icon={Link2}
                value={form.portfolioUrl}
                onChange={updateField("portfolioUrl")}
              />
              <AuthInput
                label={presenceConfig.websiteLabel}
                name="websiteUrl"
                placeholder={presenceConfig.websitePlaceholder}
                icon={Globe2}
                value={form.websiteUrl}
                onChange={updateField("websiteUrl")}
              />
            </div>

            <div className="auth-field-grid">
              <AuthInput
                label={presenceConfig.instagramLabel}
                name="instagram"
                placeholder={presenceConfig.instagramPlaceholder}
                icon={Link2}
                value={form.instagram}
                onChange={updateField("instagram")}
              />
              <AuthInput
                label={presenceConfig.linkedinLabel}
                name="linkedin"
                placeholder={presenceConfig.linkedinPlaceholder}
                icon={Link2}
                value={form.linkedin}
                onChange={updateField("linkedin")}
              />
            </div>

            <label className="auth-checkbox auth-terms">
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={updateField("termsAccepted")}
                required
              />
              <span>
                J&apos;accepte les conditions d&apos;utilisation et la politique de confidentialité.
                <span className="auth-required-star" aria-label="obligatoire">*</span>
              </span>
            </label>
          </>
        ) : null}

        {error ? <p className="auth-form-error" role="alert">{error}</p> : null}

        <div className="auth-step-actions">
          {step > 0 ? (
            <button className="auth-step-back" type="button" onClick={goBack}>
              Retour
            </button>
          ) : (
            <span />
          )}
          {step < steps.length - 1 ? (
            <button className="auth-primary-button" type="submit">
              Continuer
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button className="auth-primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Création..." : "Créer mon compte"}
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      </form>

      {step === 0 ? (
        <>
          <div className="auth-divider"><span>ou s&apos;inscrire avec</span></div>
          <AuthSocialButtons />
        </>
      ) : null}

      <p className="auth-bottom-link">
        Déjà un compte ? <Link href="/connexion">Se connecter</Link>
      </p>
    </>
  );
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeOption(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatCustomLanguage(value: string) {
  const normalizedValue = value.trim().replace(/\s+/g, " ");

  if (!normalizedValue) {
    return "";
  }

  return `${normalizedValue[0].toLocaleUpperCase("fr")}${normalizedValue.slice(1)}`;
}
