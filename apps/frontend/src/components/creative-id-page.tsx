"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileBadge,
  FileText,
  Globe2,
  Languages,
  Link2,
  LockKeyhole,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { MemberShell } from "@/components/member-shell";
import { getApiErrorMessage, updateMemberProfile } from "@/lib/api";
import type { AuthMeResponse, MemberProfile } from "@/lib/api";
import { accountTypeLabel, buildInitials, getMemberDisplayName, getMemberProfileTitle } from "@/lib/member-display";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCurrentMember } from "@/store/slices/auth-slice";

type CreativeVisibility = MemberProfile["visibility"];

const visibilityContent: Record<
  CreativeVisibility,
  {
    label: string;
    title: string;
    description: string;
    icon: LucideIcon;
  }
> = {
  PUBLIC: {
    label: "Public",
    title: "Lien public actif",
    description: "Votre Creative ID peut être consulté avec le lien ou le QR code.",
    icon: Globe2,
  },
  MEMBERS: {
    label: "Membres CCA",
    title: "Visible dans l’espace membre",
    description: "Le profil reste réservé aux membres connectés. Le lien public est prêt mais non publié.",
    icon: UsersRound,
  },
  PRIVATE: {
    label: "Privé",
    title: "Creative ID privé",
    description: "Le profil n’est pas publié. Vous pouvez le compléter avant de le rendre visible.",
    icon: LockKeyhole,
  },
};

export function CreativeIdPage() {
  const dispatch = useAppDispatch();
  const { accessToken, user, profile, organizationProfile, partnerProfile } = useAppSelector((state) => state.auth);
  const [origin, setOrigin] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [visibilityMessage, setVisibilityMessage] = useState("");
  const [visibilityError, setVisibilityError] = useState("");
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  const displayName = getMemberDisplayName({ user, profile, organizationProfile, partnerProfile });
  const profileTitle = getMemberProfileTitle({ user, profile, organizationProfile, partnerProfile });
  const avatarUrl = profile?.avatarUrl ?? organizationProfile?.logoUrl ?? partnerProfile?.logoUrl ?? null;
  const city = profile?.city ?? organizationProfile?.city ?? partnerProfile?.city ?? "À compléter";
  const country = profile?.country ?? organizationProfile?.country ?? partnerProfile?.country ?? "";
  const location = [city, country].filter((item) => item && item !== "À compléter").join(", ") || city;
  const memberNumber = profile?.memberNumber ?? "";
  const visibility = profile?.visibility ?? "MEMBERS";
  const visibilityState = visibilityContent[visibility];
  const VisibilityIcon = visibilityState.icon;
  const skills = profile?.skills?.length ? profile.skills : [];
  const languages = profile?.languages?.length ? profile.languages.join(", ") : "À compléter";
  const availability = profile?.availability ?? "À compléter";
  const bio = profile?.bio ?? organizationProfile?.description ?? partnerProfile?.description ?? "Ajoutez une biographie courte pour présenter votre parcours et vos activités.";
  const websiteUrl = profile?.portfolioUrl ?? profile?.websiteUrl ?? organizationProfile?.websiteUrl ?? partnerProfile?.websiteUrl;
  const profileVerification = profile?.verifiedAt ? "Profil validé par CCA" : user?.emailVerified ? "E-mail vérifié" : "En vérification";
  const accountLabel = accountTypeLabel(user?.type);
  const completion = profile?.profileCompletion ?? 0;
  const missingFields = useMemo(() => getMissingCreativeFields(profile), [profile]);
  const publicUrl = useMemo(
    () => (origin && memberNumber ? `${origin}/creative-id/${encodeURIComponent(memberNumber)}` : ""),
    [memberNumber, origin],
  );
  const profileFields = [
    { label: "Nom public", value: displayName },
    { label: "Discipline", value: profileTitle },
    { label: "Profession", value: profile?.profession ?? accountLabel },
    { label: "Disponibilité", value: availability },
  ];
  const heroStats = [
    { label: "Numéro membre", value: memberNumber || "En cours" },
    { label: "Complétude", value: `${completion}%` },
    { label: "Visibilité", value: visibilityState.label },
  ];

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setOrigin(window.location.origin);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    let isActive = true;

    const timeoutId = window.setTimeout(() => {
      if (!publicUrl) {
        setQrDataUrl("");
        return;
      }

      QRCode.toDataURL(publicUrl, {
        errorCorrectionLevel: "M",
        margin: 1,
        scale: 7,
        color: {
          dark: "#151923",
          light: "#fffdf8",
        },
      })
        .then((dataUrl) => {
          if (isActive) {
            setQrDataUrl(dataUrl);
          }
        })
        .catch(() => {
          if (isActive) {
            setQrDataUrl("");
          }
        });
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [publicUrl]);

  async function copyPublicLink() {
    if (!publicUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopyMessage("Lien copié.");
    } catch {
      setCopyMessage("Copie impossible depuis ce navigateur.");
    }
  }

  async function updateVisibility(nextVisibility: CreativeVisibility) {
    if (!accessToken || !profile || nextVisibility === visibility) {
      return;
    }

    setIsUpdatingVisibility(true);
    setVisibilityError("");
    setVisibilityMessage("");

    try {
      const response = await updateMemberProfile(accessToken, { visibility: nextVisibility });
      dispatch(setCurrentMember(response));
      persistCurrentMember(response);
      setVisibilityMessage(`Visibilité mise à jour : ${visibilityContent[nextVisibility].label}.`);
    } catch (error) {
      setVisibilityError(getApiErrorMessage(error, "Impossible de mettre à jour la visibilité pour le moment."));
    } finally {
      setIsUpdatingVisibility(false);
    }
  }

  return (
    <MemberShell activeItem="Creative ID">
      <div className="creative-id-layout">
        <section className="creative-id-hero">
          <div className="creative-id-identity">
            <div className="creative-id-profile">
              <div className="creative-id-avatar">
                {avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="member-initials-avatar">{buildInitials(displayName)}</span>}
                <span><BadgeCheck aria-hidden="true" strokeWidth={1.8} /></span>
              </div>
              <div>
                <span className="member-kicker">Creative ID</span>
                <h1>{displayName}</h1>
                <p>{[accountLabel, profileTitle, location].filter(Boolean).join(" · ")}</p>
                <div className="creative-id-badges">
                  <span>{profileVerification}</span>
                  <span>{visibilityState.label}</span>
                  <span>{location}</span>
                </div>
              </div>
            </div>
            <div className="creative-id-hero-stats">
              {heroStats.map((stat) => (
                <article key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </article>
              ))}
            </div>
          </div>

          <div className="creative-id-share-card">
            <div className="creative-qr" aria-label="QR code Creative ID">
              {qrDataUrl ? <img src={qrDataUrl} alt="" /> : <FileBadge aria-hidden="true" strokeWidth={1.8} />}
            </div>
            <strong>{visibilityState.title}</strong>
            <p>{visibilityState.description}</p>
            <div className="creative-public-link">
              <Link2 aria-hidden="true" strokeWidth={1.8} />
              <span>{publicUrl || "Lien disponible après génération du numéro membre"}</span>
            </div>
            <div className="creative-id-actions">
              <button className="member-create-button" type="button" onClick={copyPublicLink} disabled={!publicUrl}>
                <Copy aria-hidden="true" strokeWidth={1.8} />
                Copier
              </button>
              <a className="member-secondary-button" href={publicUrl || "#"} aria-disabled={!publicUrl}>
                <ExternalLink aria-hidden="true" strokeWidth={1.8} />
                Ouvrir
              </a>
            </div>
            {copyMessage ? <small>{copyMessage}</small> : null}
          </div>
        </section>

        <div className="creative-id-grid">
          <section className="creative-id-main">
            <section className="member-card creative-id-section">
              <div className="member-card-title">
                <div>
                  <h2>Profil professionnel</h2>
                  <p>La carte d’identité professionnelle construite depuis les informations du membre.</p>
                </div>
                <Link className="member-secondary-button" href="/espace-membre/parametres">
                  <Pencil aria-hidden="true" strokeWidth={1.8} />
                  Modifier
                </Link>
              </div>
              <div className="creative-field-grid">
                {profileFields.map((field) => (
                  <article key={field.label}>
                    <span>{field.label}</span>
                    <strong>{field.value}</strong>
                  </article>
                ))}
                <article>
                  <span>Ville</span>
                  <strong>{location}</strong>
                </article>
              </div>
              <div className="creative-bio">
                <strong>Biographie courte</strong>
                <p>{bio}</p>
              </div>
            </section>

            <section className="member-card creative-id-section">
              <div className="member-card-title">
                <div>
                  <h2>Portfolio & documents</h2>
                  <p>Les liens professionnels qui enrichissent votre Creative ID.</p>
                </div>
                <Link href="/espace-membre/parametres">Gérer</Link>
              </div>
              <div className="creative-link-grid">
                <CreativeLinkCard title="Portfolio" value={profile?.portfolioUrl} icon={ExternalLink} actionLabel="Voir" />
                <CreativeLinkCard title="Site web" value={profile?.websiteUrl} icon={Globe2} actionLabel="Visiter" />
                <CreativeLinkCard title="CV" value={profile?.cvUrl} icon={FileText} actionLabel="Ouvrir" />
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
                {skills.length ? skills.map((skill) => <span key={skill}>{skill}</span>) : <span>À compléter</span>}
              </div>
            </section>
          </section>

          <aside className="creative-id-side">
            <section className="member-card creative-visibility-card">
              <div className="member-card-title">
                <div>
                  <h2>Visibilité</h2>
                  <p>Contrôlez qui peut consulter votre Creative ID.</p>
                </div>
                <VisibilityIcon aria-hidden="true" strokeWidth={1.8} />
              </div>
              <div className="creative-visibility-options">
                {(["PRIVATE", "MEMBERS", "PUBLIC"] as CreativeVisibility[]).map((option) => {
                  const Icon = visibilityContent[option].icon;

                  return (
                    <button
                      key={option}
                      className={option === visibility ? "is-active" : undefined}
                      type="button"
                      disabled={isUpdatingVisibility || !profile}
                      onClick={() => updateVisibility(option)}
                    >
                      <Icon aria-hidden="true" strokeWidth={1.8} />
                      <span>{visibilityContent[option].label}</span>
                    </button>
                  );
                })}
              </div>
              {visibilityMessage ? <p className="auth-form-success">{visibilityMessage}</p> : null}
              {visibilityError ? <p className="auth-form-error" role="alert">{visibilityError}</p> : null}
            </section>

            <section className="member-card creative-completion-card">
              <div>
                <span className="member-kicker">Complétude</span>
                <strong>{completion}%</strong>
                <p>{missingFields.length ? "Encore quelques informations pour rendre ce profil prêt à être partagé." : "Votre Creative ID est prêt à être présenté."}</p>
              </div>
              <div className="creative-progress-track"><span style={{ width: `${completion}%` }} /></div>
              <div className="creative-missing-list">
                {(missingFields.length ? missingFields : ["Profil prêt à être partagé"]).map((field, index) => (
                  <article key={field} className={!missingFields.length ? "is-complete" : undefined}>
                    <CheckCircle2 aria-hidden="true" strokeWidth={1.8} />
                    <span>{!missingFields.length && index === 0 ? field : field}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="member-card creative-contact-card">
              <div className="member-card-title">
                <h2>Coordonnées</h2>
              </div>
              <a href={`mailto:${user?.email ?? ""}`}><Globe2 aria-hidden="true" /> {user?.email ?? "À compléter"}</a>
              {user?.phone ? <a href={`tel:${user.phone.replace(/\s+/g, "")}`}><Phone aria-hidden="true" /> {user.phone}</a> : null}
              <span><MapPin aria-hidden="true" /> {location}</span>
              {websiteUrl ? <a href={websiteUrl} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" /> Lien professionnel</a> : null}
            </section>

            <section className="member-card creative-id-section">
              <div className="creative-mini-grid">
                <article>
                  <Languages aria-hidden="true" strokeWidth={1.8} />
                  <strong>Langues</strong>
                  <span>{languages}</span>
                </article>
                <article>
                  <CalendarDays aria-hidden="true" strokeWidth={1.8} />
                  <strong>Disponibilité</strong>
                  <span>{availability}</span>
                </article>
                <article>
                  <BriefcaseBusiness aria-hidden="true" strokeWidth={1.8} />
                  <strong>Statut</strong>
                  <span>{profile?.profession ?? accountLabel}</span>
                </article>
                <article>
                  <ShieldCheck aria-hidden="true" strokeWidth={1.8} />
                  <strong>Vérification</strong>
                  <span>{profileVerification}</span>
                </article>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </MemberShell>
  );
}

function CreativeLinkCard({
  title,
  value,
  icon: Icon,
  actionLabel,
}: {
  title: string;
  value?: string | null;
  icon: LucideIcon;
  actionLabel: string;
}) {
  const displayValue = value ? readableLinkLabel(value) : "";

  return (
    <article>
      <Icon aria-hidden="true" strokeWidth={1.8} />
      <strong>{title}</strong>
      {value ? (
        <>
          <span>{displayValue}</span>
          <a href={value} target="_blank" rel="noreferrer">
            {actionLabel}
            <ExternalLink aria-hidden="true" strokeWidth={1.8} />
          </a>
        </>
      ) : (
        <span>À compléter</span>
      )}
    </article>
  );
}

function readableLinkLabel(value: string) {
  try {
    const url = new URL(value);
    const fileName = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? "");
    return fileName || url.hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function getMissingCreativeFields(profile: MemberProfile | null) {
  if (!profile) {
    return ["Créer ou récupérer le profil Creative ID"];
  }

  const checks = [
    { done: !!profile.publicName, label: "Ajouter un nom public" },
    { done: !!profile.profession, label: "Préciser votre profession" },
    { done: !!profile.bio, label: "Ajouter une biographie courte" },
    { done: profile.skills.length > 0, label: "Ajouter des compétences clés" },
    { done: profile.languages.length > 0, label: "Ajouter les langues parlées" },
    { done: !!(profile.portfolioUrl || profile.websiteUrl), label: "Ajouter un portfolio ou site web" },
    { done: !!(profile.avatarUrl || profile.cvUrl), label: "Ajouter une photo ou un CV" },
    { done: !!profile.availability, label: "Préciser votre disponibilité" },
  ];

  return checks.filter((item) => !item.done).map((item) => item.label);
}

function persistCurrentMember(response: AuthMeResponse) {
  const storage = getBrowserStorage();
  storage?.setItem("cca.user", JSON.stringify(response.user));
  storage?.setItem("cca.profile", JSON.stringify(response.profile));
  storage?.setItem("cca.organizationProfile", JSON.stringify(response.organizationProfile));
  storage?.setItem("cca.partnerProfile", JSON.stringify(response.partnerProfile));
}

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}
