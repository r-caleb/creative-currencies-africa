import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok } from "react-icons/fa6";

export function CcaFooter() {
  return (
    <footer className="footer-band">
      <div className="site-footer">
        <div className="footer-brand">
          <img src="/assets/cca-logo-full-transparent.png" alt="Creative Currencies Africa" />
          <p>
            La plateforme qui valorise, connecte et propulse les créateurs africains
            à l'échelle mondiale.
          </p>
          <div className="footer-socials" aria-label="Réseaux sociaux">
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
        <div className="footer-links footer-column">
          <strong>Plateforme</strong>
          <a href="#a-propos">À propos</a>
          <a href="#evenement">Événements</a>
          <a href="#industries">Industries créatives</a>
          <a href="#createurs">Créateurs</a>
          <a href="#communaute">Communauté</a>
        </div>
        <div className="footer-links footer-column">
          <strong>Découvrir</strong>
          <a href="#apprendre">Comment ça marche ?</a>
          <a href="#industries">Disciplines créatives</a>
          <a href="#partenaires">Partenaires</a>
          <a href="#contact">Newsletter</a>
        </div>
        <div className="footer-links footer-column">
          <strong>Contact</strong>
          <a href="#a-propos">Notre mission</a>
          <a href="#contact">Contact</a>
          <a href="#contact">Coordonnées</a>
          <a href="#contact">Réseaux sociaux</a>
        </div>
        <div className="footer-links footer-column">
          <strong>Légal</strong>
          <a href="#">Mentions légales</a>
          <a href="#">Politique de confidentialité</a>
          <a href="#">Conditions d'utilisation</a>
          <a href="#">Politique de cookies</a>
        </div>
        <p className="footer-note">© 2026 Creative Currencies Africa.</p>
        <img className="footer-art" src="/assets/cca-footer-ornament-transparent.png" alt="" />
      </div>
    </footer>
  );
}
