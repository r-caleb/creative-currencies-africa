import { notFound } from "next/navigation";
import {
  BadgeCheck,
  ExternalLink,
  FileBadge,
  Globe2,
  Languages,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { accountTypeLabel, buildInitials } from "@/lib/member-display";

export const dynamic = "force-dynamic";

type PublicCreativeId = {
  memberNumber: string;
  publicName: string;
  accountType: string;
  city: string;
  country: string;
  profession: string | null;
  discipline: string;
  bio: string | null;
  portfolioUrl: string | null;
  websiteUrl: string | null;
  avatarUrl: string | null;
  socialLinks?: {
    id: string;
    network: string;
    url: string;
  }[];
  skills: string[];
  languages: string[];
  availability: string | null;
  profileCompletion: number;
  emailVerified: boolean;
  profileVerified: boolean;
  portfolioItems: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    mediaUrl: string | null;
    externalUrl: string | null;
    year: number | null;
    featured: boolean;
  }[];
  certificates: {
    title: string;
    number: string;
    issuedAt: string | null;
  }[];
  officialHistory: {
    kind: string;
    label: string;
    title: string;
    date: string;
  }[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const CCA_CONTACT_EMAIL = process.env.NEXT_PUBLIC_CCA_CONTACT_EMAIL ?? "contact@creativecurrencies.africa";

export default async function PublicCreativeIdPage({ params }: { params: Promise<{ memberNumber: string }> }) {
  const { memberNumber } = await params;
  const creativeId = await getPublicCreativeId(memberNumber);

  if (!creativeId) {
    notFound();
  }

  const location = [creativeId.city, creativeId.country].filter(Boolean).join(", ");
  const status = creativeId.profileVerified ? "Profil vérifié CCA" : creativeId.emailVerified ? "E-mail vérifié" : "En vérification";
  const skills = creativeId.skills.length ? creativeId.skills : ["Profil en cours d’enrichissement"];
  const languages = creativeId.languages.length ? creativeId.languages.join(", ") : "À compléter";
  const socialLinks = creativeId.socialLinks ?? [];
  const contactSubject = encodeURIComponent(`Collaboration Creative ID ${creativeId.memberNumber}`);
  const contactBody = encodeURIComponent(
    `Bonjour Creative Currencies Africa,\n\nJe souhaite entrer en contact avec ${creativeId.publicName} (${creativeId.memberNumber}) pour une opportunité de collaboration.\n\nMerci.`,
  );

  return (
    <main className="public-creative-id-page">
      <div className="public-creative-id-brand">
        <img src="/assets/cca-logo-full-transparent-web.png" alt="Creative Currencies Africa" />
        <span>Fiche membre vérifiable</span>
      </div>
      <section className="public-creative-id-card">
        <div className="public-creative-id-hero">
          <div className="public-creative-id-header">
            <div className="public-creative-id-avatar">
              {creativeId.avatarUrl ? <img src={creativeId.avatarUrl} alt="" /> : <span>{buildInitials(creativeId.publicName)}</span>}
              <BadgeCheck aria-hidden="true" strokeWidth={1.8} />
            </div>
            <div>
              <span className="member-kicker">Creative ID public</span>
              <h1>{creativeId.publicName}</h1>
              <p>{[accountTypeLabel(creativeId.accountType), creativeId.profession, creativeId.discipline].filter(Boolean).join(" · ")}</p>
            </div>
          </div>

          <aside className="public-creative-id-proof">
            <ShieldCheck aria-hidden="true" strokeWidth={1.8} />
            <strong>{status}</strong>
            <p>Identité Creative ID consultable publiquement avec le numéro membre CCA.</p>
            <span>{creativeId.memberNumber}</span>
          </aside>
        </div>

        <div className="public-creative-id-actions">
          <a className="is-primary" href={`mailto:${CCA_CONTACT_EMAIL}?subject=${contactSubject}&body=${contactBody}`}>
            <Mail aria-hidden="true" strokeWidth={1.8} />
            Proposer une collaboration
          </a>
          {creativeId.portfolioUrl ? (
            <a href={creativeId.portfolioUrl} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden="true" strokeWidth={1.8} />
              Portfolio
            </a>
          ) : null}
          {creativeId.websiteUrl ? (
            <a href={creativeId.websiteUrl} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden="true" strokeWidth={1.8} />
              Site web
            </a>
          ) : null}
        </div>

        {socialLinks.length ? (
          <div className="public-creative-id-socials" aria-label="Réseaux sociaux publics">
            {socialLinks.map((link) => (
              <a key={link.id} href={link.url} target="_blank" rel="noreferrer">
                <Globe2 aria-hidden="true" strokeWidth={1.8} />
                {formatSocialNetwork(link.network)}
              </a>
            ))}
          </div>
        ) : null}

        <div className="public-creative-id-badges">
          <span><FileBadge aria-hidden="true" strokeWidth={1.8} /> {creativeId.memberNumber}</span>
          <span><ShieldCheck aria-hidden="true" strokeWidth={1.8} /> {status}</span>
          <span><MapPin aria-hidden="true" strokeWidth={1.8} /> {location}</span>
        </div>

        <div className="public-creative-id-section">
          <h2>Présentation</h2>
          <p>{creativeId.bio ?? "Ce membre CCA enrichit actuellement sa présentation professionnelle."}</p>
        </div>

        <div className="public-creative-id-grid">
          <article>
            <Sparkles aria-hidden="true" strokeWidth={1.8} />
            <strong>Compétences</strong>
            <div className="public-creative-id-tags">
              {skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </article>
          <article>
            <Languages aria-hidden="true" strokeWidth={1.8} />
            <strong>Langues</strong>
            <p>{languages}</p>
          </article>
          <article>
            <Globe2 aria-hidden="true" strokeWidth={1.8} />
            <strong>Disponibilité</strong>
            <p>{creativeId.availability ?? "À compléter"}</p>
          </article>
        </div>

        {creativeId.portfolioItems.length ? (
          <div className="public-creative-id-section">
            <h2>Portfolio</h2>
            <div className="public-creative-id-portfolio">
              {creativeId.portfolioItems.map((item) => (
                <article key={item.id}>
                  <div>
                    {item.mediaUrl ? <img src={item.mediaUrl} alt="" /> : <Sparkles aria-hidden="true" strokeWidth={1.8} />}
                  </div>
                  <span>{[item.category, item.year].filter(Boolean).join(" · ")}</span>
                  <strong>{item.title}</strong>
                  <p>{item.description ?? "Projet présenté dans le portfolio Creative ID."}</p>
                  {item.externalUrl ? <a href={item.externalUrl} target="_blank" rel="noreferrer">Voir la référence</a> : null}
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {creativeId.certificates.length || creativeId.officialHistory.length ? (
          <div className="public-creative-id-section">
            <h2>Parcours vérifiable</h2>
            <div className="public-creative-id-history">
              {creativeId.certificates.map((certificate) => (
                <article key={certificate.number}>
                  <span>Certificat</span>
                  <strong>{certificate.title}</strong>
                  <p>{certificate.number}{certificate.issuedAt ? ` · délivré le ${formatPublicDate(certificate.issuedAt)}` : ""}</p>
                </article>
              ))}
              {creativeId.officialHistory.filter((item) => item.label !== "Certificat").map((item) => (
                <article key={`${item.kind}-${item.title}-${item.date}`}>
                  <span>{item.label}</span>
                  <strong>{item.title}</strong>
                  <p>{formatPublicDate(item.date)}</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function formatSocialNetwork(network: string) {
  return network
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatPublicDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

async function getPublicCreativeId(memberNumber: string) {
  try {
    const response = await fetch(`${API_URL}/member/creative-id/${encodeURIComponent(memberNumber)}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as PublicCreativeId;
  } catch {
    return null;
  }
}
