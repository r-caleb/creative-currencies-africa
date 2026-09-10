import { BadgeCheck, FileBadge, ShieldCheck, XCircle } from "lucide-react";
import { API_URL } from "@/lib/api-url";

export const dynamic = "force-dynamic";

type CertificateVerification = {
  valid: boolean;
  title: string;
  number: string;
  status: "PENDING" | "ISSUED" | "REVOKED";
  issuedAt: string | null;
  expiresAt: string | null;
  holderName: string;
  memberNumber: string | null;
  trainingTitle: string | null;
};

export default async function CertificateVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ number?: string }>;
}) {
  const { number = "" } = await searchParams;
  const certificate = number ? await verifyCertificate(number) : null;

  return (
    <main className="public-creative-id-page">
      <section className="public-creative-id-card certificate-verification-card">
        <div className="certificate-verification-icon">
          {certificate?.valid ? <BadgeCheck aria-hidden="true" strokeWidth={1.8} /> : <XCircle aria-hidden="true" strokeWidth={1.8} />}
        </div>

        <span className="member-kicker">Vérification certificat CCA</span>
        <h1>{certificate?.valid ? "Certificat valide" : "Certificat non validé"}</h1>
        <p>
          {certificate
            ? certificate.valid
              ? "Ce certificat a bien été délivré par Creative Currencies Africa."
              : "Ce certificat existe, mais il n'est pas marqué comme délivré."
            : "Indiquez un numéro de certificat valide pour vérifier son statut."}
        </p>

        {certificate ? (
          <div className="certificate-verification-details">
            <article>
              <FileBadge aria-hidden="true" strokeWidth={1.8} />
              <div>
                <strong>{certificate.title}</strong>
                <span>{certificate.number}</span>
              </div>
            </article>
            <article>
              <ShieldCheck aria-hidden="true" strokeWidth={1.8} />
              <div>
                <strong>{certificate.holderName}</strong>
                <span>{certificate.memberNumber ?? "Numéro membre indisponible"}</span>
              </div>
            </article>
            <article>
              <FileBadge aria-hidden="true" strokeWidth={1.8} />
              <div>
                <strong>{certificate.trainingTitle ?? "Certification CCA"}</strong>
                <span>{certificate.issuedAt ? `Délivré le ${formatDate(certificate.issuedAt)}` : "Validation en cours"}</span>
              </div>
            </article>
          </div>
        ) : null}
      </section>
    </main>
  );
}

async function verifyCertificate(number: string) {
  try {
    const response = await fetch(`${API_URL}/member/certificates/verify/${encodeURIComponent(number)}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as CertificateVerification;
  } catch {
    return null;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
