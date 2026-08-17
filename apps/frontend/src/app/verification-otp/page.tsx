import Link from "next/link";
import { AuthBackLink, AuthSecurityNote, AuthShell } from "@/components/auth-ui";

export default function VerifyOtpPage() {
  return (
    <AuthShell
      eyebrow="Vérification OTP"
      title="Vérifiez votre adresse e-mail"
      description="Nous avons envoyé un code de vérification à votre adresse e-mail."
      aside="secure"
    >
      <AuthBackLink href="/mot-de-passe-oublie" />

      <div className="otp-group" aria-label="Code de vérification">
        {["2", "7", "4", "9", "1", "3"].map((value, index) => (
          <input key={`${value}-${index}`} aria-label={`Chiffre ${index + 1}`} defaultValue={value} maxLength={1} />
        ))}
      </div>

      <div className="otp-timer">
        Le code expirera dans
        <strong>02 : 48</strong>
      </div>

      <Link className="auth-primary-button" href="/reinitialisation-mot-de-passe">
        Valider le code
        <span aria-hidden="true">→</span>
      </Link>

      <p className="auth-bottom-link">
        Vous n'avez pas reçu le code ? <Link href="/verification-otp">Renvoyer le code</Link>
      </p>

      <AuthSecurityNote />
    </AuthShell>
  );
}
