"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthBackLink, AuthInput, AuthSecurityNote, AuthShell, Mail } from "@/components/auth-ui";
import { forgotPassword, getApiErrorMessage } from "@/lib/api";

export function ForgotPasswordClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await forgotPassword({ email });
      const storage = getBrowserStorage();
      storage?.setItem("cca.pendingPasswordResetEmail", email);
      storage?.setItem("cca.pendingPasswordResetExpiresAt", response.resetExpiresAt);
      router.push(`/reinitialisation-mot-de-passe?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible d'envoyer le code pour le moment."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Mot de passe oublié"
      title="Recevez un code de vérification."
      description="Entrez votre adresse e-mail et nous vous enverrons un code pour réinitialiser votre accès."
      aside="secure"
      brandHref="/connexion"
    >
      <AuthBackLink href="/connexion" />

      <form className="auth-form" onSubmit={submitForgotPassword}>
        <AuthInput
          label="Adresse e-mail"
          name="email"
          type="text"
          inputMode="email"
          placeholder="nom@creativecurrencies.africa"
          icon={Mail}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError("");
          }}
          required
        />

        {error ? <p className="auth-form-error" role="alert">{error}</p> : null}

        <button className="auth-primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Envoi..." : "Envoyer le code"}
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <div className="auth-return-card">
        Vous vous souvenez de votre mot de passe ?
        <Link href="/connexion">Retourner au login</Link>
      </div>

      <AuthSecurityNote />
    </AuthShell>
  );
}

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}
