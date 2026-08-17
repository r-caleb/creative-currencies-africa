import Link from "next/link";
import { AuthBackLink, AuthInput, AuthPrimaryButton, AuthSecurityNote, AuthShell, Mail } from "@/components/auth-ui";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Mot de passe oublié"
      title="Recevez un code de vérification."
      description="Entrez votre adresse e-mail et nous vous enverrons un code pour réinitialiser votre accès."
      aside="secure"
    >
      <AuthBackLink href="/connexion" />

      <form className="auth-form">
        <AuthInput label="Adresse e-mail" type="email" placeholder="Entrez votre adresse e-mail" icon={Mail} />
        <Link className="auth-primary-button" href="/verification-otp">
          Envoyer le code
          <span aria-hidden="true">→</span>
        </Link>
      </form>

      <div className="auth-return-card">
        Vous vous souvenez de votre mot de passe ?
        <Link href="/connexion">Retourner au login</Link>
      </div>

      <AuthSecurityNote />
    </AuthShell>
  );
}
