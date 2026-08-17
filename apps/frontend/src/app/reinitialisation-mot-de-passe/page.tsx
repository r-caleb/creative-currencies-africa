import {
  AuthBackLink,
  AuthInput,
  AuthPrimaryButton,
  AuthShell,
  LockKeyhole,
  PasswordChecklist,
  PasswordEye,
} from "@/components/auth-ui";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Réinitialisation"
      title="Réinitialisez votre mot de passe"
      description="Choisissez un nouveau mot de passe sécurisé pour protéger votre compte."
      aside="minimal"
    >
      <AuthBackLink href="/verification-otp" />

      <form className="auth-form">
        <AuthInput
          label="Nouveau mot de passe"
          type="password"
          placeholder="Entrez votre nouveau mot de passe"
          icon={LockKeyhole}
          actionIcon={<PasswordEye />}
        />
        <PasswordChecklist />
        <AuthInput
          label="Confirmer le mot de passe"
          type="password"
          placeholder="Confirmez votre mot de passe"
          icon={LockKeyhole}
          actionIcon={<PasswordEye />}
        />
        <AuthPrimaryButton>Réinitialiser le mot de passe</AuthPrimaryButton>
      </form>
    </AuthShell>
  );
}
