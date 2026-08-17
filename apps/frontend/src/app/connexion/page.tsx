import Link from "next/link";
import {
  AuthInput,
  AuthPrimaryButton,
  AuthSecurityNote,
  AuthShell,
  AuthSocialButtons,
  LockKeyhole,
  Mail,
  PasswordEye,
} from "@/components/auth-ui";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Connexion"
      title="Accédez à votre espace Creative Currencies."
      description="Retrouvez votre profil, vos formations, vos ressources et les opportunités de la communauté."
    >
      <div className="auth-tabs" aria-label="Navigation auth">
        <span className="is-active">Connexion</span>
        <Link href="/inscription">Créer un compte</Link>
      </div>

      <form className="auth-form">
        <AuthInput label="Adresse e-mail" type="email" placeholder="Entrez votre adresse e-mail" icon={Mail} />
        <AuthInput
          label="Mot de passe"
          type="password"
          placeholder="Entrez votre mot de passe"
          icon={LockKeyhole}
          actionIcon={<PasswordEye />}
        />

        <div className="auth-form-row">
          <label className="auth-checkbox">
            <input type="checkbox" defaultChecked />
            <span>Se souvenir de moi</span>
          </label>
          <Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
        </div>

        <AuthPrimaryButton>Se connecter</AuthPrimaryButton>
      </form>

      <div className="auth-divider"><span>ou continuer avec</span></div>
      <AuthSocialButtons />
      <AuthSecurityNote />
    </AuthShell>
  );
}
