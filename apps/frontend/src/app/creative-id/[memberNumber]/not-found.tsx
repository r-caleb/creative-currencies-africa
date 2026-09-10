import Link from "next/link";
import { EyeOff, LogIn, ShieldCheck } from "lucide-react";

export default function PublicCreativeIdNotFound() {
  return (
    <main className="public-creative-id-page public-creative-id-page--empty">
      <div className="public-creative-id-brand">
        <img src="/assets/cca-logo-full-transparent-web.png" alt="Creative Currencies Africa" />
        <span>Fiche membre vérifiable</span>
      </div>

      <section className="public-creative-id-card public-creative-id-empty-card">
        <div className="public-creative-id-proof">
          <EyeOff aria-hidden="true" strokeWidth={1.8} />
          <strong>Creative ID non disponible</strong>
          <p>
            Cette fiche n’est pas publiée, le compte n’est pas actif, ou le numéro Creative ID ne correspond à aucun
            membre public.
          </p>
        </div>

        <div className="public-creative-id-section">
          <h1>Le lien public n’est pas actif</h1>
          <p>
            Pour partager une fiche Creative ID, le membre doit passer sa visibilité en mode public depuis son espace
            membre. Les profils privés restent protégés et ne s’affichent pas aux visiteurs non connectés.
          </p>
        </div>

        <div className="public-creative-id-actions">
          <Link className="is-primary" href="/connexion">
            <LogIn aria-hidden="true" strokeWidth={1.8} />
            Se connecter
          </Link>
          <Link href="/">
            <ShieldCheck aria-hidden="true" strokeWidth={1.8} />
            Retour à l’accueil
          </Link>
        </div>
      </section>
    </main>
  );
}
