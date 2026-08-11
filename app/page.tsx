"use client";

import { useEffect, useState } from "react";

const navItems = [
  "Accueil",
  "Vision",
  "Evenement",
  "Industries",
  "Galerie",
  "Partenaires",
  "Contact",
];

const metrics = [
  { value: "4", label: "jours de formation" },
  { value: "3", label: "disciplines pratiques" },
  { value: "1", label: "panel international" },
  { value: "2026", label: "edition Kinshasa" },
];

const pillars = [
  {
    title: "Former",
    text: "Des workshops, masterclass et contenus pedagogiques pour transformer le talent en competence durable.",
  },
  {
    title: "Connecter",
    text: "Un reseau de createurs, mentors, partenaires et institutions autour des industries creatives africaines.",
  },
  {
    title: "Valoriser",
    text: "Une vitrine premium pour raconter les projets, les parcours, les savoir-faire et les opportunites.",
  },
];

const disciplines = [
  "Mode",
  "Photographie",
  "Design",
  "Audiovisuel",
  "Musique",
  "Artisanat",
  "Communication",
  "Entrepreneuriat",
];

const gallery = [
  {
    title: "Creative Currencies 2026",
    label: "Campagne officielle",
    image: "/assets/cc-event-banner.png",
  },
  {
    title: "Journey de formation",
    label: "Stylisme, photographie, relation public",
    image: "/assets/cc-event-flyer.png",
  },
  {
    title: "Creative ID",
    label: "Identite membre et portfolio",
    image: "/assets/cca-logo-gold.jpg",
  },
  {
    title: "Patrimoine et soft power",
    label: "Create. Connect. Empower.",
    image: "/assets/cca-mask-gold.jpg",
  },
];

const partners = [
  "Ministere de la Culture",
  "Ministere de la Communication",
  "Ministere de l'Economie Numerique",
  "243 Kulture",
  "Congo Resilience",
  "Creators",
  "Silikin Village",
  "ARSP",
  "JBN Power",
  "Zairoots",
];

const roadmap = [
  "Espace membre Creative ID",
  "Bibliotheque de ressources",
  "Agenda des activites",
  "Forum communautaire",
  "Certificats et badges",
  "Administration editoriale",
];

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem("cca-theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      return;
    }

    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    setTheme(prefersLight ? "light" : "dark");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("cca-theme", theme);
  }, [theme]);

  return (
    <main className="site-shell">
      <header className="site-header" aria-label="Navigation principale">
        <a className="brand-lockup" href="#accueil" aria-label="Creative Currencies Africa">
          <img src="/assets/cca-logo-gold.jpg" alt="" />
          <span>
            <strong>CCA</strong>
            <small>Creative Currencies Africa</small>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="Sections">
          {navItems.map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}>
              {item}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <button
            className="theme-toggle"
            type="button"
            aria-label={`Activer le mode ${theme === "dark" ? "clair" : "sombre"}`}
            aria-pressed={theme === "light"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <span>{theme === "dark" ? "Clair" : "Sombre"}</span>
          </button>
          <a className="button button-ghost" href="#contact">
            Contact
          </a>
          <a className="button button-gold" href="#evenement">
            Reserver
          </a>
        </div>
      </header>

      <section className="hero" id="accueil" aria-labelledby="hero-title">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-overlay" />

        <div className="hero-content">
          <p className="eyebrow">Kinshasa - Septembre 2026</p>
          <h1 id="hero-title">
            La creativite africaine,
            <span> une valeur economique.</span>
          </h1>
          <p className="hero-copy">
            Creative Currencies Africa est une plateforme educative et communautaire
            qui accompagne les createurs africains, valorise leurs talents et transforme
            leur creativite en opportunites durables.
          </p>

          <div className="hero-actions">
            <a className="button button-gold" href="#vision">
              Decouvrir
            </a>
            <a className="button button-purple" href="#communaute">
              Rejoindre la communaute
            </a>
          </div>

          <dl className="metrics">
            {metrics.map((metric) => (
              <div key={metric.label}>
                <dt>{metric.value}</dt>
                <dd>{metric.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section about-section" id="vision" aria-labelledby="vision-title">
        <div className="section-kicker">Vision et mission</div>
        <div className="split">
          <div>
            <h2 id="vision-title">Creer, connecter, autonomiser les talents creatifs.</h2>
          </div>
          <div className="section-copy">
            <p>
              Creative Currencies Africa defend une conviction simple: la culture est
              une economie, la creativite est une ressource, et le talent merite des
              outils professionnels pour grandir.
            </p>
            <p>
              La premiere edition part de la mode, puis ouvre naturellement vers la
              photographie, le design, l'audiovisuel, l'artisanat, la communication et
              l'entrepreneuriat culturel.
            </p>
          </div>
        </div>

        <div className="pillar-grid">
          {pillars.map((pillar, index) => (
            <article className="pillar-card" key={pillar.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section teaser-section" id="evenement" aria-labelledby="event-title">
        <div className="event-layout">
          <div className="event-copy">
            <div className="section-kicker">Evenement officiel</div>
            <h2 id="event-title">Journee de formation Creative Currencies 2026</h2>
            <p>
              Du 2 au 5 septembre 2026, Creative Currencies Africa reunit a Silikin
              Village des createurs, experts et partenaires autour du stylisme, de la
              photographie, de la relation public et du panel talk The Business of Fashion.
            </p>

            <div className="event-details">
              <div>
                <strong>Dates</strong>
                <span>2 - 5 septembre 2026</span>
              </div>
              <div>
                <strong>Lieu</strong>
                <span>Silikin Village, Kinshasa</span>
              </div>
              <div>
                <strong>Format</strong>
                <span>Workshops, panel talk, networking</span>
              </div>
            </div>

            <div className="social-actions" aria-label="Liens evenement">
              <a className="button button-gold" href="https://wa.me/243988192765" target="_blank">
                WhatsApp
              </a>
              <a className="button button-ghost" href="https://fb.me/e/49aSYmtsr" target="_blank">
                Facebook Event
              </a>
              <a className="button button-ghost" href="#contact">
                Instagram
              </a>
              <a className="button button-ghost" href="#contact">
                TikTok
              </a>
            </div>
          </div>

          <figure className="event-poster">
            <img src="/assets/cc-event-flyer.png" alt="Affiche Creative Currencies 2026" />
          </figure>
        </div>
      </section>

      <section className="section video-section" aria-labelledby="teaser-title">
        <div className="video-card">
          <div>
            <div className="section-kicker">Teaser officiel</div>
            <h2 id="teaser-title">Une scene video prete pour le film de lancement.</h2>
            <p>
              Cette zone accueillera le teaser officiel avec une lecture optimisee sur
              ordinateur, tablette et mobile.
            </p>
          </div>
          <div className="video-placeholder" aria-label="Emplacement du teaser video">
            <span>Play</span>
          </div>
        </div>
      </section>

      <section className="section industries-section" id="industries" aria-labelledby="industries-title">
        <div className="section-kicker">Industries creatives en RDC</div>
        <div className="split">
          <h2 id="industries-title">Un secteur culturel, economique et social a structurer.</h2>
          <div className="section-copy">
            <p>
              Les industries culturelles et creatives generent des revenus mondiaux
              majeurs et des millions d'emplois. En RDC, la jeunesse, la richesse
              culturelle et l'energie artistique forment un potentiel encore largement
              sous-exploite.
            </p>
            <p>
              La plateforme doit donc raconter plus qu'un evenement: elle doit devenir
              une reference pour apprendre, collaborer, documenter les talents et
              ouvrir des opportunites professionnelles.
            </p>
          </div>
        </div>

        <div className="discipline-grid">
          {disciplines.map((discipline) => (
            <article className="discipline-card" key={discipline}>
              <span aria-hidden="true">{discipline.slice(0, 2)}</span>
              <h3>{discipline}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="section gallery-section" id="galerie" aria-labelledby="gallery-title">
        <div className="section-heading-row">
          <div>
            <div className="section-kicker">Galerie</div>
            <h2 id="gallery-title">Une bibliotheque visuelle vivante.</h2>
          </div>
          <p>
            Workshops, conferences, backstage, rencontres, activations et partenaires
            pourront etre ajoutes par l'equipe au fil du programme.
          </p>
        </div>

        <div className="gallery-grid">
          {gallery.map((item) => (
            <article className="gallery-card" key={item.title}>
              <img src={item.image} alt="" />
              <div>
                <span>{item.label}</span>
                <h3>{item.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section community-preview" id="communaute" aria-labelledby="community-title">
        <div className="community-panel">
          <div>
            <div className="section-kicker">Plateforme communautaire</div>
            <h2 id="community-title">La Phase 1 prepare deja l'espace membre.</h2>
            <p>
              L'accueil public pose les fondations de la future plateforme: profils
              Creative ID, ressources, opportunites, forum, certificats et administration.
            </p>
          </div>

          <div className="roadmap-grid">
            {roadmap.map((item) => (
              <div className="roadmap-item" key={item}>
                <span />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section partners-section" id="partenaires" aria-labelledby="partners-title">
        <div className="section-kicker">Partenaires</div>
        <h2 id="partners-title">Un ecosysteme public, prive et creatif.</h2>
        <div className="partner-wall">
          {partners.map((partner) => (
            <span key={partner}>{partner}</span>
          ))}
        </div>
      </section>

      <section className="section contact-section" id="contact" aria-labelledby="contact-title">
        <div className="contact-copy">
          <div className="section-kicker">Contact</div>
          <h2 id="contact-title">Restons connectes avec les createurs africains.</h2>
          <p>
            Reservations, partenariats, presse, inscriptions et demandes d'information
            peuvent etre centralises ici pendant la Phase 1.
          </p>
          <div className="contact-lines">
            <a href="mailto:contact@creativecurrencies.africa">contact@creativecurrencies.africa</a>
            <a href="https://wa.me/243988192765" target="_blank">
              WhatsApp: +243 9 88 19 27 65
            </a>
            <span>Silikin Village, Kinshasa, RDC</span>
          </div>
        </div>

        <form className="contact-form">
          <label>
            Nom complet
            <input type="text" name="name" placeholder="Votre nom" />
          </label>
          <label>
            Adresse e-mail
            <input type="email" name="email" placeholder="votre@email.com" />
          </label>
          <label>
            Message
            <textarea name="message" placeholder="Votre demande" rows={5} />
          </label>
          <button className="button button-gold" type="submit">
            Envoyer le message
          </button>
        </form>
      </section>

      <footer className="site-footer">
        <div className="footer-brand">
          <img src="/assets/cca-logo-gold.jpg" alt="" />
          <p>
            Creative Currencies Africa propulse les talents creatifs africains par
            l'education, la communaute et les opportunites.
          </p>
        </div>
        <div className="footer-links">
          <a href="#vision">Vision</a>
          <a href="#evenement">Evenement</a>
          <a href="#communaute">Communaute</a>
          <a href="#contact">Contact</a>
        </div>
        <p className="footer-note">© 2026 Creative Currencies Africa.</p>
      </footer>
    </main>
  );
}
