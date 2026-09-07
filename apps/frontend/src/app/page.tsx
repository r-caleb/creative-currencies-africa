import { CalendarDays, Gem, Globe2, GraduationCap, UsersRound } from "lucide-react";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaWhatsapp } from "react-icons/fa6";

const metrics = [
  { value: "25K+", label: "Créateurs", icon: UsersRound },
  { value: "120K+", label: "Œuvres", icon: Gem },
  { value: "350+", label: "Formations", icon: GraduationCap },
  { value: "1.2K+", label: "Événements", icon: CalendarDays },
  { value: "150+", label: "Pays", icon: Globe2 },
];

const partners = [
  { name: "Ministère de la Culture, Arts et Patrimoines", logo: "/assets/partners/transparent/min-culture.png", wide: true },
  { name: "Ministère de la Communication et Médias", logo: "/assets/partners/transparent/min-communication.png", wide: true },
  { name: "Ministère de l'Économie Numérique", logo: "/assets/partners/transparent/min-numerique.png", wide: true },
  { name: "Ministère des Postes, Télécommunications et Numérique", logo: "/assets/partners/transparent/min-postes.png", wide: true },
  { name: "Congo Resilience", logo: "/assets/partners/transparent/congo-resilience.png" },
  { name: "JBN Power", logo: "/assets/partners/transparent/jbn-power.png" },
  { name: "243 Kulture", logo: "/assets/partners/transparent/partner-243-kulture.png" },
  { name: "Creators", logo: "/assets/partners/transparent/partner-creators.png" },
  { name: "Losako Shop", logo: "/assets/partners/transparent/losako-shop.png" },
  { name: "ARSP", logo: "/assets/partners/transparent/logo-arsp.png" },
  { name: "Silikin Village", logo: "/assets/partners/transparent/silikinvillage.png" },
  { name: "Printing Station", logo: "/assets/partners/transparent/partner-printing-station.png" },
  { name: "Zaïroots", logo: "/assets/partners/transparent/partner-zairoots.png" },
];

const disciplines = [
  { title: "Mode", text: "Stylisme, textile, image, accessoires et marques créatives", image: "/assets/mode.jpg" },
  { title: "Photographie", text: "Portraits, campagnes, archives visuelles et reportages", image: "/assets/photography.png" },
  { title: "Cinéma & vidéo", text: "Films, documentaires, clips, montage et narration visuelle", image: "/assets/cinema.jpg" },
  { title: "Musique", text: "Création sonore, performance, production et scène", image: "/assets/musique.jpg" },
  { title: "Graphisme & design", text: "Identité visuelle, direction artistique, supports et expérience", image: "/assets/graphisme.jpg" },
  { title: "Architecture", text: "Espaces culturels, scénographies, lieux de création et patrimoine bâti", image: "/assets/partners/centre%20culturelle.jpg" },
  { title: "Arts visuels", text: "Peinture, illustration, installation, image et expérimentation", image: "/assets/art%20visuel.jpg" },
  { title: "Artisanat", text: "Savoir-faire, matières, objets, textile et patrimoine culturel", image: "/assets/artisanat.jpg" },
  { title: "Marketing & communication", text: "Relations publiques, stratégie, contenus, médias et visibilité", image: "/assets/marketing.jpg" },
  { title: "Innovation créative", text: "Nouveaux formats, entrepreneuriat, technologie et impact", image: "/assets/innovation.jpg" },
];

const creators = [
  { name: "Amina Diop", role: "Illustratrice", country: "Sénégal", image: "/assets/cca-hero-art.png" },
  { name: "Koffi Amani", role: "Photographe", country: "Côte d'Ivoire", image: "/assets/photographie.jpg" },
  { name: "Tendai Moyo", role: "Peintre", country: "Zimbabwe", image: "/assets/portrait-man-practicing-his-profession-celebrate-international-labour-day%20(1).jpg" },
  { name: "Bokani T.", role: "Musicien", country: "RDC", image: "/assets/musique.jpg" },
];

const galleryItems = [
  {
    title: "Formations & workshops",
    text: "Photos des ateliers, masterclass et sessions d'apprentissage",
    image: "/assets/cc-event-flyer.png",
  },
  {
    title: "Conférences & panels",
    text: "Temps forts des prises de parole, débats et rencontres professionnelles",
    image: "/assets/conference.png",
  },
  {
    title: "Backstage & coulisses",
    text: "Préparation, création, équipes et moments authentiques hors scène",
    image: "/assets/mode.png",
  },
  {
    title: "Déplacements & visites",
    text: "Parcours terrain, lieux créatifs, visites et échanges avec les communautés",
    image: "/assets/viste%20au%20ministere%20de%20la%20culture.jpg",
  },
  {
    title: "Activations & partenaires",
    text: "Actions publiques, partenaires, stands, collaborations et moments de visibilité",
    image: "/assets/activites.png",
  },
];

const steps = [
  {
    title: "Découvrez l'écosystème",
    text: "Explorez les disciplines, les créateurs, les événements et les opportunités portés par Creative Currencies.",
  },
  {
    title: "Rejoignez la communauté",
    text: "Créez votre compte membre, présentez votre profil et construisez progressivement votre Creative ID.",
  },
  {
    title: "Apprenez et participez",
    text: "Inscrivez-vous aux workshops, masterclass, panel talks et activités qui correspondent à votre parcours.",
  },
  {
    title: "Documentez vos progrès",
    text: "Retrouvez vos certificats, badges, ressources, projets, photos et attestations dans votre espace membre.",
  },
  {
    title: "Collaborez et évoluez",
    text: "Échangez avec d'autres créatifs, trouvez des partenaires et transformez votre talent en opportunités durables.",
  },
];

const roadmap = [
  {
    title: "Creative ID",
    text: "Présentez votre profil, votre discipline, vos compétences et votre portfolio dans un espace professionnel.",
  },
  {
    title: "Parcours & certifications",
    text: "Retrouvez vos workshops, événements, badges, certificats et attestations au même endroit.",
  },
  {
    title: "Ressources exclusives",
    text: "Accédez aux syllabus, guides, templates, vidéos, podcasts et documents utiles à votre évolution.",
  },
  {
    title: "Agenda & opportunités",
    text: "Suivez les masterclass, appels à projets, castings, résidences, concours et festivals.",
  },
  {
    title: "Forum & collaborations",
    text: "Échangez avec d'autres créatifs, posez vos questions, partagez vos projets et trouvez des partenaires.",
  },
];

const lazyImageProps = {
  loading: "lazy" as const,
  decoding: "async" as const,
};

export default function Home() {
  return (
    <main className="site-shell">
      <section className="hero" id="accueil" aria-labelledby="hero-title">
        <div className="hero-media" aria-hidden="true">
          <img src="/assets/cca-hero-art.png" alt="" />
        </div>
        <div className="hero-overlay" />

        <div className="hero-content">
          <h1 id="hero-title">
            La créativité africaine,
            <span> une valeur universelle.</span>
          </h1>
          <p className="hero-copy">
            Une plateforme immersive qui valorise les talents créatifs africains,
            raconte leurs projets et transforme la culture en rencontres, apprentissages
            et opportunités durables.
          </p>

          <div className="hero-actions">
            <a className="button button-gold" href="#createurs">
              Découvrir les créateurs
            </a>
            <a className="button button-purple" href="#communaute">
              Rejoindre la communauté
            </a>
          </div>

        </div>

        <div className="metrics" aria-label="Statistiques Creative Currencies Africa">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div key={metric.label} className="metric-item">
                <Icon className="metric-icon" aria-hidden="true" strokeWidth={1.7} />
                <div className="metric-copy">
                  <span className="metric-value">{metric.value}</span>
                  <span className="metric-label">{metric.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section about-section" id="a-propos" aria-labelledby="vision-title">
        <div className="about-inner">
          <div className="section-kicker">À propos</div>
          <div className="about-heading">
            <h2 id="vision-title">
              Faire de la créativité africaine un levier économique, culturel et durable.
            </h2>
            <p>
              Creative Currencies Africa est une plateforme éducative dédiée au développement
              des industries créatives africaines. Elle accompagne les talents, structure
              les parcours et transforme la créativité en opportunités concrètes.
            </p>
          </div>

          <div className="about-card-grid">
            <article>
              <span>01</span>
              <h3>Notre vision</h3>
              <p>
                Révéler le potentiel des créateurs africains, valoriser leur travail
                et renforcer le soft power du continent à travers des récits, des
                projets et des collaborations visibles.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Notre mission</h3>
              <p>
                Démontrer que la créativité n'est pas seulement une expression
                artistique, mais un levier de développement économique, d'innovation,
                d'entrepreneuriat et d'emploi.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Pourquoi cette plateforme existe</h3>
              <p>
                Donner aux créatifs les outils, l'encadrement, les réseaux et les
                opportunités nécessaires pour transformer leur talent en carrière
                durable.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section video-section" aria-labelledby="teaser-title">
        <div className="video-card">
          <div>
            <div className="section-kicker">Le teaser</div>
            <h2 id="teaser-title">Découvrez l'énergie Creative Currencies en images.</h2>
            <p>
              Le teaser rassemble les visages, les lieux, les formations et les moments
              qui portent l'ambition du projet: créer, connecter et faire grandir les
              talents créatifs africains.
            </p>
          </div>
          <figure className="video-player" aria-label="Teaser Creative Currencies Africa">
            <video controls preload="metadata" poster="/assets/cc-teaser-poster-0s.jpg">
              <source src="/assets/CC%20TEASER%20web%20720p.mp4" type="video/mp4" />
              Votre navigateur ne peut pas lire cette vidéo.
            </video>
          </figure>
        </div>
      </section>

      <section className="section teaser-section" id="evenement" aria-labelledby="event-title">
        <div className="event-layout">
          <div className="event-copy">
            <div className="section-kicker">Événement officiel</div>
            <h2 id="event-title">Journée de formation Creative Currencies 2026</h2>
            <p>
              Du 2 au 5 septembre 2026, Creative Currencies Africa réunit à Silikin
              Village des créateurs, experts et partenaires autour du stylisme, de la
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

            <div className="reservation-block">
              <p>Réservez votre place</p>
              <div className="social-actions" aria-label="Liens événement">
                <a
                  className="button button-gold social-button"
                  href="https://wa.me/243988192765"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="brand-icon brand-whatsapp" aria-hidden="true">
                    <FaWhatsapp />
                  </span>
                  WhatsApp
                </a>
                <a
                  className="button button-ghost social-button"
                  href="https://fb.me/e/49aSYmtsr"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="brand-icon brand-facebook" aria-hidden="true">
                    <FaFacebookF />
                  </span>
                  Facebook
                </a>
                <a className="button button-ghost social-button" href="#contact">
                  <span className="brand-icon brand-instagram" aria-hidden="true">
                    <FaInstagram />
                  </span>
                  Instagram
                </a>
                <a className="button button-ghost social-button" href="#contact">
                  <span className="brand-icon brand-tiktok" aria-hidden="true">
                    <FaTiktok />
                  </span>
                  TikTok
                </a>
              </div>
            </div>
          </div>

          <figure className="event-poster">
            <img src="/assets/cc-event-flyer.png" alt="Affiche Creative Currencies 2026" {...lazyImageProps} />
          </figure>
        </div>
      </section>

      <section className="section gallery-section" aria-labelledby="gallery-title">
        <div className="gallery-heading">
          <div className="section-kicker">Galerie</div>
          <h2 id="gallery-title">Revivez les moments forts de Creative Currencies.</h2>
          <p>
            Découvrez en images les formations, conférences, coulisses, visites de
            terrain, activations et rencontres qui font vivre la communauté Creative
            Currencies Africa.
          </p>
        </div>

        <div className="gallery-grid">
          {galleryItems.map((item) => (
            <article className="gallery-card" key={item.title}>
              <img src={item.image} alt="" {...lazyImageProps} />
              <div>
                <span>{item.title}</span>
                <h3>{item.text}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section industries-section" id="industries" aria-labelledby="industries-title">
        <div className="industry-content">
          <div className="section-kicker">Industries créatives en RDC</div>
          <div className="industry-heading">
            <h2 id="industries-title">Transformer la créativité congolaise en force économique.</h2>
            <p>
              La RDC possède une jeunesse inventive, une richesse culturelle rare et des
              talents déjà visibles au-delà de ses frontières. Creative Currencies Africa
              veut aider cet élan à devenir un secteur mieux structuré, capable de créer
              des emplois, des entreprises et de nouvelles opportunités.
            </p>
          </div>

          <div className="industry-copy-grid">
            <article>
              <span>01</span>
              <h3>Un marché mondial puissant</h3>
              <p>
                Les industries culturelles et créatives génèrent plus de 2 000 milliards
                USD de revenus annuels dans le monde et mobilisent des dizaines de
                millions d'emplois. Elles ne sont plus seulement artistiques: elles sont
                devenues un moteur économique.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Des métiers qui se connectent</h3>
              <p>
                Image, son, scène, objet, espace, récit, média ou stratégie: ces
                disciplines nourrissent des parcours professionnels concrets, des
                prestations, des studios, des marques, des formations et des collaborations.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Un potentiel à structurer</h3>
              <p>
                L'enjeu est de mieux connecter les talents, les entreprises, les
                institutions et les partenaires afin que la créativité congolaise gagne en
                visibilité, en financement et en rayonnement international.
              </p>
            </article>
          </div>
        </div>

        <div className="discipline-carousel" aria-labelledby="universe-title">
          <div className="center-heading">
            <h2 id="universe-title">Explorez l'univers de la créativité</h2>
          </div>

          <div className="discipline-track" aria-label="Disciplines créatives">
            {[...disciplines, ...disciplines].map((discipline, index) => (
              <article className="discipline-card" key={`${discipline.title}-${index}`}>
                <img src={discipline.image} alt="" {...lazyImageProps} />
                <div>
                  <h3>{discipline.title}</h3>
                  <p>{discipline.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section creators-section" id="createurs" aria-labelledby="creators-title">
        <div className="section-heading-row">
          <div>
            <div className="section-kicker">Créateurs</div>
            <h2 id="creators-title">Créateurs à découvrir</h2>
          </div>
          <a className="text-link" href="#communaute">
            Voir tous les créateurs
          </a>
        </div>

        <div className="creator-grid">
          {creators.map((creator) => (
            <article className="creator-card" key={creator.name}>
              <img src={creator.image} alt="" {...lazyImageProps} />
              <button type="button" aria-label={`Ajouter ${creator.name} aux favoris`}>
                ♡
              </button>
              <div>
                <h3>{creator.name}</h3>
                <span>{creator.role}</span>
                <small>{creator.country}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section how-section" id="apprendre" aria-labelledby="how-title">
        <div className="center-heading">
          <h2 id="how-title">Comment ça marche ?</h2>
        </div>
        <div className="step-grid">
          {steps.map((step, index) => (
            <article className="step-card" key={step.title}>
              <span>{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section community-preview" id="communaute" aria-labelledby="community-title">
        <div className="community-panel">
          <div>
            <div className="section-kicker">Communauté Creative Currencies</div>
            <h2 id="community-title">Un espace pour apprendre, se connecter et faire évoluer son parcours créatif.</h2>
            <p>
              La plateforme accompagne les créatifs au-delà des événements physiques:
              elle rassemble les profils, ressources, opportunités et échanges qui
              permettent de construire une carrière plus visible, structurée et durable.
            </p>
          </div>

          <div className="roadmap-grid">
            {roadmap.map((item) => (
              <div className="roadmap-item" key={item.title}>
                <span />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section partners-section" id="partenaires" aria-labelledby="partners-title">
        <div className="section-kicker">Partenaires</div>
        <h2 id="partners-title">Ils nous font confiance</h2>
        <p>
          Institutions, partenaires techniques, médias et acteurs créatifs soutiennent
          l'ambition de Creative Currencies Africa.
        </p>
        <div className="partner-wall">
          {partners.map((partner) => (
            <article
              className={`partner-logo-card${partner.wide ? " partner-logo-card--wide" : ""}`}
              key={partner.name}
            >
              <img src={partner.logo} alt={partner.name} {...lazyImageProps} />
            </article>
          ))}
        </div>
      </section>

      <section className="section contact-section" id="contact" aria-labelledby="contact-title">
        <div className="contact-header">
          <div className="section-kicker">Contact et newsletter</div>
          <h2 id="contact-title">Restons connectés à la communauté créative africaine.</h2>
          <p>
            Recevez les prochaines formations, opportunités et ressources de Creative
            Currencies Africa. Pour une collaboration, un partenariat ou une demande
            presse, contactez directement l'équipe.
          </p>
        </div>

        <div className="contact-layout">
          <form className="newsletter-card">
            <div>
              <h3>Newsletter</h3>
              <p>Actualités, appels à projets, masterclass et ressources exclusives.</p>
            </div>
            <label>
              <span className="sr-only">Adresse e-mail</span>
              <input type="email" name="email" placeholder="Votre adresse e-mail" />
            </label>
            <button className="button button-gold" type="submit">
              S'abonner
            </button>
          </form>

          <div className="contact-card">
            <div>
              <h3>Coordonnées</h3>
              <p>Pour les demandes professionnelles, partenariats, presse et collaborations.</p>
            </div>
            <dl>
              <div>
                <dt>Email</dt>
                <dd>contact@creativecurrencies.africa</dd>
              </div>
              <div>
                <dt>Téléphone</dt>
                <dd>+243 9 88 19 27 65</dd>
              </div>
              <div>
                <dt>Adresse</dt>
                <dd>Adresse officielle de l'entreprise à confirmer</dd>
              </div>
            </dl>
            <div className="contact-socials" aria-label="Réseaux sociaux">
              <a href="#contact" aria-label="WhatsApp">
                <FaWhatsapp aria-hidden="true" />
              </a>
              <a href="#contact" aria-label="Facebook">
                <FaFacebookF aria-hidden="true" />
              </a>
              <a href="#contact" aria-label="Instagram">
                <FaInstagram aria-hidden="true" />
              </a>
              <a href="#contact" aria-label="TikTok">
                <FaTiktok aria-hidden="true" />
              </a>
              <a href="#contact" aria-label="LinkedIn">
                <FaLinkedinIn aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <div className="map-card" aria-label="Carte de l'adresse de Creative Currencies Africa">
          <div>
            <span>Google Maps</span>
            <strong>Adresse officielle de Creative Currencies Africa</strong>
            <p>La carte sera connectée dès validation de l'adresse exacte de l'entreprise.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
