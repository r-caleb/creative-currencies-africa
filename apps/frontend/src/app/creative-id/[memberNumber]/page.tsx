import { notFound } from "next/navigation";
import { BadgeCheck, ExternalLink, FileBadge, Globe2, Languages, MapPin, ShieldCheck, Sparkles } from "lucide-react";
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
  skills: string[];
  languages: string[];
  availability: string | null;
  profileCompletion: number;
  emailVerified: boolean;
  profileVerified: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

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

  return (
    <main className="public-creative-id-page">
      <section className="public-creative-id-card">
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

        {creativeId.portfolioUrl || creativeId.websiteUrl ? (
          <div className="public-creative-id-actions">
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
        ) : null}
      </section>
    </main>
  );
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
