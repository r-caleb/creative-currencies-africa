"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Download,
  ExternalLink,
  FileBadge,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { MemberShell } from "@/components/member-shell";
import { getApiErrorMessage, getMemberCertificates } from "@/lib/api";
import type { MemberCertificate, MemberCertificateBadge, MemberCertificatesResponse } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";

const defaultCertificates: MemberCertificatesResponse = {
  accountType: "PUBLIC",
  canViewCertificates: false,
  memberNumber: null,
  holderName: "",
  certificates: [],
  badges: [],
  stats: {
    issued: 0,
    pending: 0,
    revoked: 0,
    visibleBadges: 0,
  },
};

export function CertificatesPage() {
  const { accessToken, user, profile } = useAppSelector((state) => state.auth);
  const [data, setData] = useState<MemberCertificatesResponse>(defaultCertificates);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    setIsLoading(true);
    getMemberCertificates(accessToken)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setData({
          accountType: response.accountType ?? "PUBLIC",
          canViewCertificates: !!response.canViewCertificates,
          memberNumber: response.memberNumber ?? null,
          holderName: response.holderName ?? "",
          certificates: response.certificates ?? [],
          badges: response.badges ?? [],
          stats: response.stats ?? defaultCertificates.stats,
        });
        setStatus("");
      })
      .catch((error) => {
        if (isMounted) {
          setStatus(getApiErrorMessage(error, "Impossible de charger vos certificats pour le moment."));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  const issuedCertificates = useMemo(
    () => data.certificates.filter((certificate) => certificate.status === "ISSUED"),
    [data.certificates],
  );
  const pendingCertificates = useMemo(
    () => data.certificates.filter((certificate) => certificate.status === "PENDING"),
    [data.certificates],
  );
  const revokedCertificates = useMemo(
    () => data.certificates.filter((certificate) => certificate.status === "REVOKED"),
    [data.certificates],
  );
  const memberNumber = data.memberNumber ?? profile?.memberNumber ?? "En cours";
  const holderName = data.holderName || user?.fullName || "Membre CCA";

  return (
    <MemberShell activeItem="Certificats">
      <div className="member-module-layout">
        <section className="member-module-hero certificate-hero">
          <div>
            <span className="member-kicker">Certificats CCA</span>
            <h1>Retrouvez vos certificats officiels délivrés par Creative Currencies Africa.</h1>
            <p>
              Les certificats apparaissent ici après validation administrative d'une formation, d'un atelier ou d'un
              parcours certifiant CCA.
            </p>
            <div className="member-hero-actions">
              <a className="member-create-button" href="#mes-certificats">
                Voir mes certificats
                <ArrowRight aria-hidden="true" strokeWidth={1.8} />
              </a>
              {issuedCertificates[0]?.fileUrl ? (
                <a className="member-secondary-button" href={issuedCertificates[0].fileUrl} target="_blank" rel="noreferrer">
                  <Download aria-hidden="true" strokeWidth={1.8} />
                  Télécharger le dernier
                </a>
              ) : null}
            </div>
          </div>
          <div className="certificate-proof-card">
            <FileBadge aria-hidden="true" strokeWidth={1.6} />
            <strong>{memberNumber}</strong>
            <span>
              {data.stats.issued} délivré{data.stats.issued > 1 ? "s" : ""} · {data.stats.pending} en préparation
            </span>
          </div>
        </section>

        {!data.canViewCertificates ? (
          <section className="member-card certificate-access-card">
            <LockKeyhole aria-hidden="true" strokeWidth={1.8} />
            <div>
              <h2>Certificats réservés aux apprenants et créateurs</h2>
              <p>
                Les organisations, écoles et partenaires géreront plus tard les certifications depuis un espace de
                gestion dédié.
              </p>
            </div>
          </section>
        ) : (
          <div className="member-module-grid">
            <section className="member-module-main">
              <section id="mes-certificats" className="member-card">
                <div className="member-card-title">
                  <div>
                    <h2>Mes certificats</h2>
                    <p>Certificats officiels CCA rattachés à votre compte membre.</p>
                  </div>
                  <span className="resource-count">{data.certificates.length} élément{data.certificates.length > 1 ? "s" : ""}</span>
                </div>

                {status ? <p className="member-form-error">{status}</p> : null}

                {isLoading ? (
                  <CertificateEmptyState title="Chargement des certificats" text="Nous vérifions les validations liées à votre compte." />
                ) : data.certificates.length ? (
                  <div className="certificate-list">
                    {data.certificates.map((certificate) => (
                      <CertificateRow key={certificate.id} certificate={certificate} />
                    ))}
                  </div>
                ) : (
                  <CertificateEmptyState
                    title="Aucun certificat pour le moment"
                    text="Inscrivez-vous à une formation certifiante CCA. Après validation, votre certificat apparaîtra automatiquement ici."
                    actionHref="/espace-membre/formations"
                    actionLabel="Voir les formations"
                  />
                )}
              </section>
            </section>

            <aside className="member-module-side">
              <section className="member-card certificate-summary-card">
                <div className="member-card-title">
                  <h2>Résumé</h2>
                </div>
                <div className="certificate-summary-grid">
                  <article>
                    <strong>{data.stats.issued}</strong>
                    <span>Délivrés</span>
                  </article>
                  <article>
                    <strong>{data.stats.pending}</strong>
                    <span>En préparation</span>
                  </article>
                  <article>
                    <strong>{data.stats.visibleBadges}</strong>
                    <span>Badges visibles</span>
                  </article>
                </div>
              </section>

              <section className="member-card">
                <div className="member-card-title">
                  <h2>Badges visibles</h2>
                </div>
                {data.badges.length ? (
                  <div className="badge-list">
                    {data.badges.map((badge) => (
                      <BadgeRow key={badge.title} badge={badge} />
                    ))}
                  </div>
                ) : (
                  <CertificateEmptyState
                    title="Aucun badge visible"
                    text="Les badges apparaissent après vérification du compte, du Creative ID ou d'un certificat."
                  />
                )}
              </section>

              <section className="member-card certificate-lock-card">
                <ShieldCheck aria-hidden="true" strokeWidth={1.8} />
                <strong>Validation CCA</strong>
                <p>Un certificat officiel est ajouté uniquement après contrôle de la participation et des critères de validation.</p>
              </section>
            </aside>
          </div>
        )}

        {revokedCertificates.length ? (
          <section className="member-card certificate-revoked-card">
            <AlertCircle aria-hidden="true" strokeWidth={1.8} />
            <div>
              <h2>Certificats révoqués</h2>
              <p>{revokedCertificates.length} certificat{revokedCertificates.length > 1 ? "s" : ""} ne sont plus valides.</p>
            </div>
          </section>
        ) : null}

        {pendingCertificates.length > 0 && !isLoading ? (
          <section className="member-card certificate-pending-card">
            <GraduationCap aria-hidden="true" strokeWidth={1.8} />
            <div>
              <h2>En préparation</h2>
              <p>
                {pendingCertificates.length} certificat{pendingCertificates.length > 1 ? "s sont" : " est"} en attente de validation
                administrative.
              </p>
            </div>
          </section>
        ) : null}
      </div>
    </MemberShell>
  );
}

function CertificateRow({ certificate }: { certificate: MemberCertificate }) {
  return (
    <article>
      <span className="list-icon is-gold">
        <FileBadge aria-hidden="true" strokeWidth={1.8} />
      </span>
      <div>
        <strong>{certificate.title}</strong>
        <span>{certificate.training?.title ?? "Certificat officiel CCA"}</span>
        <small>
          {certificate.number} · {certificate.issuedAt ? `Délivré le ${formatDate(certificate.issuedAt)}` : "Validation en cours"}
        </small>
      </div>
      <span className={`certificate-status is-${certificate.status.toLowerCase()}`}>{certificate.statusLabel}</span>
      <div className="certificate-actions">
        {certificate.fileUrl ? (
          <a href={certificate.fileUrl} target="_blank" rel="noreferrer" aria-label={`Télécharger ${certificate.title}`}>
            <Download aria-hidden="true" strokeWidth={1.8} />
          </a>
        ) : null}
        <a href={certificate.verificationUrl} target="_blank" rel="noreferrer" aria-label={`Vérifier ${certificate.title}`}>
          <ExternalLink aria-hidden="true" strokeWidth={1.8} />
        </a>
      </div>
    </article>
  );
}

function BadgeRow({ badge }: { badge: MemberCertificateBadge }) {
  return (
    <article>
      <BadgeCheck aria-hidden="true" strokeWidth={1.8} />
      <div>
        <strong>{badge.title}</strong>
        <span>{badge.text}</span>
      </div>
    </article>
  );
}

function CertificateEmptyState({ title, text, actionHref, actionLabel }: { title: string; text: string; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="certificate-empty-state">
      <span>
        <FileBadge aria-hidden="true" strokeWidth={1.6} />
      </span>
      <strong>{title}</strong>
      <p>{text}</p>
      {actionHref && actionLabel ? (
        <a className="member-secondary-button" href={actionHref}>
          {actionLabel}
          <ArrowRight aria-hidden="true" strokeWidth={1.8} />
        </a>
      ) : null}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
