"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileBadge,
  FileText,
  Globe2,
  Image as ImageIcon,
  Languages,
  Link2,
  LockKeyhole,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { MemberShell } from "@/components/member-shell";
import { createPortfolioItem, deletePortfolioItem, getApiErrorMessage, getCreativeIdRecord, getMyPublications, updateMemberProfile, updatePortfolioItem } from "@/lib/api";
import type { AuthMeResponse, CreativeIdPortfolioItem, CreativeIdRecord, MemberProfile, PortfolioItemPayload, Publication } from "@/lib/api";
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

type PortfolioFormState = {
  title: string;
  category: string;
  year: string;
  mediaUrl: string;
  externalUrl: string;
  description: string;
  featured: boolean;
};

type CreativeCreationGalleryItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  media: ReturnType<typeof getCreativePublicationMedia>;
};

const emptyPortfolioForm: PortfolioFormState = {
  title: "",
  category: "",
  year: "",
  mediaUrl: "",
  externalUrl: "",
  description: "",
  featured: false,
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
  const [creationPublications, setCreationPublications] = useState<Publication[]>([]);
  const [isLoadingCreations, setIsLoadingCreations] = useState(false);
  const [creationsError, setCreationsError] = useState("");
  const [activeCreationIndex, setActiveCreationIndex] = useState<number | null>(null);
  const [record, setRecord] = useState<CreativeIdRecord | null>(null);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [portfolioForm, setPortfolioForm] = useState<PortfolioFormState>(emptyPortfolioForm);
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);
  const [portfolioBusy, setPortfolioBusy] = useState<string | null>(null);
  const [portfolioMessage, setPortfolioMessage] = useState("");
  const [portfolioError, setPortfolioError] = useState("");

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
  const isPublicCreativeId = visibility === "PUBLIC";
  const activePublicUrl = isPublicCreativeId ? publicUrl : "";
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
  const portfolioItems = record?.portfolioItems ?? [];
  const officialHistory = record?.history ?? [];
  const recordStats = record?.stats ?? null;
  const heroHighlights = [
    {
      label: "Portfolio",
      value: portfolioItems.length ? `${portfolioItems.length} projet${portfolioItems.length > 1 ? "s" : ""}` : "À enrichir",
    },
    {
      label: "Historique CCA",
      value: recordStats ? `${recordStats.trainings + recordStats.certificates + recordStats.opportunities + recordStats.events} trace${recordStats.trainings + recordStats.certificates + recordStats.opportunities + recordStats.events > 1 ? "s" : ""}` : "En cours",
    },
    {
      label: "CV",
      value: profile?.cvUrl ? "Disponible" : "À ajouter",
    },
  ];
  const creationGalleryItems = useMemo(() => creationPublications.map(buildCreativeCreationGalleryItem), [creationPublications]);
  const activeCreation = activeCreationIndex === null ? null : creationGalleryItems[activeCreationIndex] ?? null;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setOrigin(window.location.origin);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    let isActive = true;

    const timeoutId = window.setTimeout(() => {
      if (!activePublicUrl) {
        setQrDataUrl("");
        return;
      }

      QRCode.toDataURL(activePublicUrl, {
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
  }, [activePublicUrl]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;

    setIsLoadingCreations(true);
    getMyPublications(accessToken, { type: "CREATION", status: "PUBLISHED", limit: 12 })
      .then((publications) => {
        if (!isMounted) {
          return;
        }

        setCreationPublications(publications);
        setCreationsError("");
      })
      .catch((error) => {
        if (isMounted) {
          setCreationsError(getApiErrorMessage(error, "Impossible de charger vos créations pour le moment."));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCreations(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  useEffect(() => {
    if (activeCreationIndex === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveCreationIndex(null);
      }

      if (event.key === "ArrowLeft") {
        setActiveCreationIndex((current) => getPreviousIndex(current, creationGalleryItems.length));
      }

      if (event.key === "ArrowRight") {
        setActiveCreationIndex((current) => getNextIndex(current, creationGalleryItems.length));
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeCreationIndex, creationGalleryItems.length]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;
    setIsLoadingRecord(true);

    getCreativeIdRecord(accessToken)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setRecord(response);
        setRecordError("");
      })
      .catch((error) => {
        if (isMounted) {
          setRecordError(getApiErrorMessage(error, "Impossible de charger le dossier Creative ID pour le moment."));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingRecord(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  async function copyPublicLink() {
    if (!activePublicUrl) {
      setCopyMessage("Passez la visibilité en Public pour activer le lien.");
      return;
    }

    try {
      await navigator.clipboard.writeText(activePublicUrl);
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

  function resetPortfolioForm() {
    setPortfolioForm(emptyPortfolioForm);
    setEditingPortfolioId(null);
    setPortfolioMessage("");
    setPortfolioError("");
  }

  function editPortfolioItem(item: CreativeIdPortfolioItem) {
    setPortfolioForm({
      title: item.title,
      category: item.category,
      year: item.year ? String(item.year) : "",
      mediaUrl: item.mediaUrl ?? "",
      externalUrl: item.externalUrl ?? "",
      description: item.description ?? "",
      featured: item.featured,
    });
    setEditingPortfolioId(item.id);
    setPortfolioMessage("");
    setPortfolioError("");
  }

  async function submitPortfolioItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    const year = portfolioForm.year.trim() ? Number(portfolioForm.year) : undefined;
    const payload: PortfolioItemPayload = {
      title: portfolioForm.title.trim(),
      category: portfolioForm.category.trim(),
      description: portfolioForm.description.trim() || undefined,
      mediaUrl: portfolioForm.mediaUrl.trim() || undefined,
      externalUrl: portfolioForm.externalUrl.trim() || undefined,
      year: Number.isFinite(year) ? year : undefined,
      featured: portfolioForm.featured,
    };

    setPortfolioBusy(editingPortfolioId ?? "create");
    setPortfolioMessage("");
    setPortfolioError("");

    try {
      const savedItem = editingPortfolioId
        ? await updatePortfolioItem(accessToken, editingPortfolioId, payload)
        : await createPortfolioItem(accessToken, payload);

      setRecord((current) => {
        if (!current) {
          return current;
        }

        const nextItems = editingPortfolioId
          ? current.portfolioItems.map((item) => (item.id === savedItem.id ? savedItem : item))
          : [savedItem, ...current.portfolioItems];

        return {
          ...current,
          portfolioItems: nextItems.sort(comparePortfolioItems),
          stats: { ...current.stats, portfolioItems: nextItems.length },
        };
      });
      setPortfolioForm(emptyPortfolioForm);
      setEditingPortfolioId(null);
      setPortfolioMessage(editingPortfolioId ? "Projet portfolio mis à jour." : "Projet ajouté au portfolio.");
    } catch (error) {
      setPortfolioError(getApiErrorMessage(error, "Le projet portfolio n'a pas pu être enregistré."));
    } finally {
      setPortfolioBusy(null);
    }
  }

  async function removePortfolioItem(item: CreativeIdPortfolioItem) {
    if (!accessToken) {
      return;
    }

    setPortfolioBusy(item.id);
    setPortfolioMessage("");
    setPortfolioError("");

    try {
      await deletePortfolioItem(accessToken, item.id);
      setRecord((current) => {
        if (!current) {
          return current;
        }

        const nextItems = current.portfolioItems.filter((portfolioItem) => portfolioItem.id !== item.id);

        return {
          ...current,
          portfolioItems: nextItems,
          stats: { ...current.stats, portfolioItems: nextItems.length },
        };
      });
      if (editingPortfolioId === item.id) {
        setPortfolioForm(emptyPortfolioForm);
        setEditingPortfolioId(null);
      }
      setPortfolioMessage("Projet retiré du portfolio.");
    } catch (error) {
      setPortfolioError(getApiErrorMessage(error, "Le projet portfolio n'a pas pu être supprimé."));
    } finally {
      setPortfolioBusy(null);
    }
  }

  async function downloadCreativeIdCard() {
    if (!memberNumber || !qrDataUrl) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 720;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#080b12");
    gradient.addColorStop(0.6, "#12101f");
    gradient.addColorStop(1, "#2a123c");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = "rgba(239, 184, 74, 0.55)";
    context.lineWidth = 3;
    context.strokeRect(34, 34, canvas.width - 68, canvas.height - 68);

    context.fillStyle = "#efb84a";
    context.font = "700 34px Arial";
    context.fillText("CCA", 82, 110);
    context.font = "600 22px Arial";
    context.fillText("CREATIVE CURRENCIES AFRICA", 82, 145);

    context.fillStyle = "#ffffff";
    context.font = "700 58px Arial";
    wrapCanvasText(context, displayName, 82, 275, 670, 68);
    context.fillStyle = "#d5c8df";
    context.font = "500 28px Arial";
    wrapCanvasText(context, [accountLabel, profileTitle, location].filter(Boolean).join(" · "), 84, 385, 720, 38);

    context.fillStyle = "#efb84a";
    context.font = "700 34px Arial";
    context.fillText(memberNumber, 84, 520);
    context.fillStyle = "#d5c8df";
    context.font = "500 24px Arial";
    context.fillText(profileVerification, 84, 560);
    context.fillText("CREATE. CONNECT. EMPOWER.", 84, 620);

    const qrImage = new Image();
    qrImage.onload = () => {
      context.fillStyle = "#fffdf8";
      context.fillRect(870, 180, 230, 230);
      context.drawImage(qrImage, 886, 196, 198, 198);
      context.fillStyle = "#ffffff";
      context.font = "700 22px Arial";
      context.textAlign = "center";
      context.fillText("Scanner le Creative ID", 985, 450);
      context.textAlign = "left";
      const link = document.createElement("a");
      link.download = `${memberNumber.toLowerCase()}-creative-id.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    qrImage.src = qrDataUrl;
  }

  return (
    <MemberShell activeItem="Creative ID">
      <div className="creative-id-layout">
        <section className="creative-id-hero">
          <div className="creative-id-identity">
            <div className="creative-id-profile">
              <div className="creative-id-avatar">
                {avatarUrl ? <img src={avatarUrl} alt="" loading="lazy" decoding="async" /> : <span className="member-initials-avatar">{buildInitials(displayName)}</span>}
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
            <div className="creative-id-hero-highlights" aria-label="Résumé du Creative ID">
              {heroHighlights.map((highlight) => (
                <article key={highlight.label}>
                  <span>{highlight.label}</span>
                  <strong>{highlight.value}</strong>
                </article>
              ))}
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
              {qrDataUrl ? <img src={qrDataUrl} alt="" loading="lazy" decoding="async" /> : <FileBadge aria-hidden="true" strokeWidth={1.8} />}
            </div>
            <strong>{visibilityState.title}</strong>
            <p>{visibilityState.description}</p>
            <div className="creative-public-link">
              <Link2 aria-hidden="true" strokeWidth={1.8} />
              <span>
                {activePublicUrl ||
                  (publicUrl ? "Lien prêt, activez la visibilité Public pour le publier" : "Lien disponible après génération du numéro membre")}
              </span>
            </div>
            <div className="creative-id-actions">
              <button className="member-create-button" type="button" onClick={copyPublicLink} disabled={!activePublicUrl}>
                <Copy aria-hidden="true" strokeWidth={1.8} />
                Copier
              </button>
              <a className="member-secondary-button" href={activePublicUrl || "#"} aria-disabled={!activePublicUrl}>
                <ExternalLink aria-hidden="true" strokeWidth={1.8} />
                Ouvrir
              </a>
              <button className="member-secondary-button" type="button" onClick={downloadCreativeIdCard} disabled={!memberNumber || !qrDataUrl}>
                <FileBadge aria-hidden="true" strokeWidth={1.8} />
                Télécharger
              </button>
            </div>
            {copyMessage ? <small>{copyMessage}</small> : null}
          </div>
        </section>

        <div className="creative-id-grid">
          <section className="creative-id-main">
            <section className="member-card creative-id-section creative-id-showcase">
              <div className="member-card-title">
                <div>
                  <h2>Mes créations visibles</h2>
                  <p>Ce bloc montre ce qui ressortira en priorité sur votre profil public.</p>
                </div>
                <Link className="member-secondary-button" href="/espace-membre/publier?type=CREATION">
                  <Plus aria-hidden="true" strokeWidth={1.8} />
                  Publier une création
                </Link>
              </div>
              <CreativeCreationGrid
                items={creationGalleryItems}
                isLoading={isLoadingCreations}
                error={creationsError}
                onPreview={(index) => setActiveCreationIndex(index)}
              />
            </section>

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
                  <h2>Portfolio structuré</h2>
                  <p>Ajoutez les œuvres, projets ou références qui doivent convaincre un jury, partenaire ou recruteur.</p>
                </div>
                {editingPortfolioId ? <button className="member-secondary-button" type="button" onClick={resetPortfolioForm}>Annuler</button> : null}
              </div>

              <form className="creative-portfolio-form" onSubmit={submitPortfolioItem}>
                <label>
                  <span>Titre</span>
                  <input value={portfolioForm.title} onChange={(event) => setPortfolioForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex. Série photo backstage" required />
                </label>
                <label>
                  <span>Discipline</span>
                  <input value={portfolioForm.category} onChange={(event) => setPortfolioForm((current) => ({ ...current, category: event.target.value }))} placeholder="Photographie, mode, design..." required />
                </label>
                <label>
                  <span>Année</span>
                  <input type="number" min="1990" max="2100" value={portfolioForm.year} onChange={(event) => setPortfolioForm((current) => ({ ...current, year: event.target.value }))} placeholder="2026" />
                </label>
                <label>
                  <span>Média</span>
                  <input value={portfolioForm.mediaUrl} onChange={(event) => setPortfolioForm((current) => ({ ...current, mediaUrl: event.target.value }))} placeholder="Lien image ou vidéo" />
                </label>
                <label>
                  <span>Lien externe</span>
                  <input value={portfolioForm.externalUrl} onChange={(event) => setPortfolioForm((current) => ({ ...current, externalUrl: event.target.value }))} placeholder="Behance, Drive, YouTube..." />
                </label>
                <label className="creative-portfolio-featured">
                  <input type="checkbox" checked={portfolioForm.featured} onChange={(event) => setPortfolioForm((current) => ({ ...current, featured: event.target.checked }))} />
                  <span>Mettre en avant</span>
                </label>
                <label className="creative-portfolio-description">
                  <span>Description</span>
                  <textarea value={portfolioForm.description} onChange={(event) => setPortfolioForm((current) => ({ ...current, description: event.target.value }))} placeholder="Contexte, rôle joué, résultat ou intention du projet." />
                </label>
                <button className="member-create-button" type="submit" disabled={!!portfolioBusy}>
                  {portfolioBusy ? <Loader2 aria-hidden="true" strokeWidth={1.8} /> : <Plus aria-hidden="true" strokeWidth={1.8} />}
                  {editingPortfolioId ? "Mettre à jour" : "Ajouter au portfolio"}
                </button>
              </form>
              {portfolioMessage ? <p className="creative-inline-success">{portfolioMessage}</p> : null}
              {portfolioError ? <p className="creative-inline-error" role="alert">{portfolioError}</p> : null}

              <StructuredPortfolioList items={portfolioItems} busyKey={portfolioBusy} onEdit={editPortfolioItem} onDelete={(item) => void removePortfolioItem(item)} />

              <div className="creative-link-grid">
                <CreativeLinkCard title="Portfolio" value={profile?.portfolioUrl} icon={ExternalLink} actionLabel="Voir" />
                <CreativeLinkCard title="Site web" value={profile?.websiteUrl} icon={Globe2} actionLabel="Visiter" />
                <CreativeLinkCard title="CV" value={profile?.cvUrl} icon={FileText} actionLabel="Ouvrir" />
              </div>
            </section>

            <section className="member-card creative-id-section">
              <div className="member-card-title">
                <div>
                  <h2>Historique officiel</h2>
                  <p>Formations, certificats, événements et candidatures suivis par CCA.</p>
                </div>
                {recordStats ? <span className="creative-history-count">{recordStats.trainings + recordStats.certificates + recordStats.opportunities + recordStats.events} éléments</span> : null}
              </div>
              {recordError ? <p className="creative-inline-error" role="alert">{recordError}</p> : null}
              {isLoadingRecord ? (
                <div className="creative-creation-loading">
                  <Loader2 aria-hidden="true" strokeWidth={1.8} />
                  <span>Chargement de l’historique...</span>
                </div>
              ) : (
                <CreativeHistoryList items={officialHistory} />
              )}
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
      {activeCreation?.media ? (
        <div className="gallery-lightbox creative-creation-lightbox" role="dialog" aria-modal="true" aria-label={activeCreation.title}>
          <button className="gallery-lightbox-close" type="button" onClick={() => setActiveCreationIndex(null)} aria-label="Fermer l'aperçu">
            <X aria-hidden="true" strokeWidth={1.8} />
          </button>
          <button className="gallery-lightbox-nav gallery-lightbox-nav--prev" type="button" onClick={() => setActiveCreationIndex((current) => getPreviousIndex(current, creationGalleryItems.length))} aria-label="Création précédente">
            <ChevronLeft aria-hidden="true" strokeWidth={1.8} />
          </button>
          <figure>
            {activeCreation.media.type === "video" ? (
              <video src={activeCreation.media.url} controls autoPlay playsInline />
            ) : (
              <img src={activeCreation.media.url} alt={activeCreation.title} />
            )}
            <figcaption>
              <strong>{activeCreation.title}</strong>
              <p>{[activeCreation.category, activeCreation.description].filter(Boolean).join(" · ")}</p>
            </figcaption>
          </figure>
          <button className="gallery-lightbox-nav gallery-lightbox-nav--next" type="button" onClick={() => setActiveCreationIndex((current) => getNextIndex(current, creationGalleryItems.length))} aria-label="Création suivante">
            <ChevronRight aria-hidden="true" strokeWidth={1.8} />
          </button>
        </div>
      ) : null}
    </MemberShell>
  );
}

function StructuredPortfolioList({
  items,
  busyKey,
  onEdit,
  onDelete,
}: {
  items: CreativeIdPortfolioItem[];
  busyKey: string | null;
  onEdit: (item: CreativeIdPortfolioItem) => void;
  onDelete: (item: CreativeIdPortfolioItem) => void;
}) {
  if (!items.length) {
    return (
      <div className="creative-portfolio-empty">
        <ImageIcon aria-hidden="true" strokeWidth={1.8} />
        <div>
          <strong>Aucun projet structuré</strong>
          <p>Ajoutez quelques références fortes pour rendre votre Creative ID plus crédible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="creative-portfolio-list">
      {items.map((item) => (
        <article key={item.id}>
          <div className="creative-portfolio-media">
            {item.mediaUrl ? <img src={item.mediaUrl} alt="" loading="lazy" decoding="async" /> : <ImageIcon aria-hidden="true" strokeWidth={1.8} />}
          </div>
          <div>
            <span>{[item.category, item.year].filter(Boolean).join(" · ")}</span>
            <strong>{item.title}</strong>
            <p>{item.description || "Description à compléter."}</p>
            <div>
              {item.featured ? <small>Mis en avant</small> : null}
              {item.externalUrl ? <a href={item.externalUrl} target="_blank" rel="noreferrer">Voir le lien</a> : null}
            </div>
          </div>
          <div className="creative-portfolio-actions">
            <button type="button" onClick={() => onEdit(item)} disabled={busyKey === item.id}>
              <Pencil aria-hidden="true" strokeWidth={1.8} />
              Modifier
            </button>
            <button type="button" className="is-danger" onClick={() => onDelete(item)} disabled={busyKey === item.id}>
              <Trash2 aria-hidden="true" strokeWidth={1.8} />
              Supprimer
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function CreativeHistoryList({ items }: { items: CreativeIdRecord["history"] }) {
  if (!items.length) {
    return (
      <div className="creative-history-empty">
        <FileBadge aria-hidden="true" strokeWidth={1.8} />
        <div>
          <strong>Aucun historique officiel pour le moment</strong>
          <p>Les formations, certificats, participations et candidatures apparaîtront ici automatiquement.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="creative-history-list">
      {items.map((item) => (
        <Link key={`${item.kind}-${item.title}-${item.date}`} href={item.href}>
          <span>{item.label}</span>
          <strong>{item.title}</strong>
          <small>{item.statusLabel} · {formatCreativeDate(item.date)} · {item.meta}</small>
        </Link>
      ))}
    </div>
  );
}

function CreativeCreationGrid({
  items,
  isLoading,
  error,
  onPreview,
}: {
  items: CreativeCreationGalleryItem[];
  isLoading: boolean;
  error: string;
  onPreview: (index: number) => void;
}) {
  if (isLoading) {
    return (
      <div className="creative-creation-loading">
        <Loader2 aria-hidden="true" strokeWidth={1.8} />
        <span>Chargement de vos créations...</span>
      </div>
    );
  }

  if (error) {
    return <p className="auth-form-error" role="alert">{error}</p>;
  }

  if (!items.length) {
    return (
      <div className="creative-creation-empty">
        <ImageIcon aria-hidden="true" strokeWidth={1.8} />
        <div>
          <strong>Aucune création publiée pour le moment</strong>
          <p>Publiez une œuvre avec un visuel pour donner plus de force à votre profil public.</p>
        </div>
        <Link className="member-create-button" href="/espace-membre/publier?type=CREATION">
          <Plus aria-hidden="true" strokeWidth={1.8} />
          Ajouter une création
        </Link>
      </div>
    );
  }

  return (
    <div className="creative-creation-grid">
      {items.map((item, index) => (
        <article key={item.id}>
          <button className="creative-creation-preview" type="button" disabled={!item.media} onClick={() => onPreview(index)} aria-label={`Agrandir ${item.title}`}>
            <CreativeCreationMedia item={item} />
          </button>
          <div>
            <small>{item.category}</small>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function CreativeCreationMedia({ item }: { item: CreativeCreationGalleryItem }) {
  const media = item.media;

  if (media?.type === "image") {
    return <img src={media.url} alt="" loading="lazy" decoding="async" />;
  }

  if (media?.type === "video") {
    return <video src={media.url} muted playsInline preload="metadata" />;
  }

  return <span><ImageIcon aria-hidden="true" strokeWidth={1.8} /></span>;
}

function buildCreativeCreationGalleryItem(publication: Publication): CreativeCreationGalleryItem {
  return {
    id: publication.id,
    title: publication.title,
    category: publication.category || "Création",
    description: publication.content || publication.excerpt || "Création publiée dans la communauté CCA.",
    media: getCreativePublicationMedia(publication),
  };
}

function getCreativePublicationMedia(publication: Publication) {
  const coverImageUrl = publication.coverImageUrl || publication.attachments.find((attachment) => attachment.type === "IMAGE")?.url;

  if (coverImageUrl) {
    return { type: "image" as const, url: coverImageUrl };
  }

  const videoUrl = publication.attachments.find((attachment) => attachment.type === "VIDEO")?.url;

  if (videoUrl) {
    return { type: "video" as const, url: videoUrl };
  }

  return null;
}

function getPreviousIndex(current: number | null, total: number) {
  if (!total) {
    return null;
  }

  return current === null || current <= 0 ? total - 1 : current - 1;
}

function getNextIndex(current: number | null, total: number) {
  if (!total) {
    return null;
  }

  return current === null || current >= total - 1 ? 0 : current + 1;
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

function comparePortfolioItems(first: CreativeIdPortfolioItem, second: CreativeIdPortfolioItem) {
  if (Number(second.featured) !== Number(first.featured)) {
    return Number(second.featured) - Number(first.featured);
  }

  if (first.order !== second.order) {
    return first.order - second.order;
  }

  return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
}

function formatCreativeDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
      return;
    }

    line = testLine;
  });

  if (line) {
    context.fillText(line, x, currentY);
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
