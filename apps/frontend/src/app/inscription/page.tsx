import Link from "next/link";
import { AccountTypeCard, accountTypes } from "@/components/auth-ui";

export default function RegisterPage() {
  return (
    <main className="auth-choice-page">
      <div className="auth-choice-brand">
        <Link href="/connexion" aria-label="Retour à la connexion Creative Currencies Africa">
          <img src="/assets/cca-logo-full-transparent-web.png" alt="Creative Currencies Africa" />
        </Link>
      </div>

      <section className="auth-choice-shell" aria-labelledby="account-type-title">
        <div className="auth-heading auth-heading--center">
          <p>Inscription</p>
          <h1 id="account-type-title">Choisissez votre type de compte</h1>
          <span>Sélectionnez le profil qui correspond le mieux à vos objectifs.</span>
        </div>

        <div className="account-type-grid">
          {accountTypes.map((account) => (
            <AccountTypeCard key={account.title} account={account} />
          ))}
        </div>

        <p className="auth-bottom-link">
          Déjà un compte ? <Link href="/connexion">Se connecter</Link>
        </p>
      </section>
    </main>
  );
}
