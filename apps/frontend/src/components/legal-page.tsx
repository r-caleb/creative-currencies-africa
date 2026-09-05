import Link from "next/link";

type LegalSection = {
  id?: string;
  title: string;
  paragraphs?: string[];
  items?: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
};

export function LegalPage({
  eyebrow,
  title,
  description,
  updatedAt,
  sections,
}: LegalPageProps) {
  return (
    <main className="site-shell legal-page">
      <section className="legal-hero" aria-labelledby="legal-title">
        <p className="section-kicker">{eyebrow}</p>
        <h1 id="legal-title">{title}</h1>
        <p>{description}</p>
        <div className="legal-meta">
          <span>Dernière mise à jour provisoire : {updatedAt}</span>
          <Link href="/#accueil">Retour à l'accueil</Link>
        </div>
      </section>

      <section className="legal-content" aria-label={title}>
        <aside className="legal-note">
          <strong>Note importante</strong>
          <p>
            Ce document sert de base de travail pour Creative Currencies Africa.
            Les informations juridiques, coordonnées officielles et formulations finales
            devront être validées avant publication définitive.
          </p>
        </aside>

        <div className="legal-sections">
          {sections.map((section) => (
            <article className="legal-section" id={section.id} key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.items ? (
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
