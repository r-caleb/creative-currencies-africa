"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AuthBackLink,
  AuthInput,
  AuthSecurityNote,
  AuthShell,
  LockKeyhole,
  Mail,
  PasswordEye,
} from "@/components/auth-ui";
import { OTP_LENGTH, OtpCodeInput } from "@/components/otp-code-input";
import { forgotPassword, getApiErrorMessage, resetPassword, verifyPasswordResetCode } from "@/lib/api";
import { getPasswordValidationMessage } from "@/lib/password-validation";

type ResetStep = "code" | "password";

export function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") ?? "";
  const storage = getBrowserStorage();
  const [email, setEmail] = useState(() => emailFromUrl || storage?.getItem("cca.pendingPasswordResetEmail") || "");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<ResetStep>("code");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [storedExpiresAt, setStoredExpiresAt] = useState(() => storage?.getItem("cca.pendingPasswordResetExpiresAt") ?? "");
  const expiresAtMs = storedExpiresAt ? new Date(storedExpiresAt).getTime() : Number.NaN;
  const remainingMs = Number.isFinite(expiresAtMs) ? Math.max(0, expiresAtMs - now) : null;
  const isExpired = remainingMs === 0;
  const timerLabel = remainingMs === null ? "--:--" : formatDuration(remainingMs);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  async function submitResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isExpired) {
      setError("Ce code a expiré. Demandez un nouveau code pour continuer.");
      return;
    }

    if (step === "code") {
      setError("");
      setMessage("");
      setIsSubmitting(true);

      try {
        await verifyPasswordResetCode({ email, code });
        setStep("password");
      } catch (err) {
        setError(getApiErrorMessage(err, "Impossible de vérifier le code pour le moment."));
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    const passwordError = getPasswordValidationMessage(password, "Le nouveau mot de passe");
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await resetPassword({ email, code, password });
      const nextStorage = getBrowserStorage();
      nextStorage?.removeItem("cca.pendingPasswordResetEmail");
      nextStorage?.removeItem("cca.pendingPasswordResetExpiresAt");
      setMessage(response.message);
      window.setTimeout(() => router.push("/connexion"), 1200);
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de réinitialiser le mot de passe pour le moment."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendResetCode() {
    setError("");
    setMessage("");
    setIsResending(true);

    try {
      const response = await forgotPassword({ email });
      const nextStorage = getBrowserStorage();
      nextStorage?.setItem("cca.pendingPasswordResetEmail", email);
      nextStorage?.setItem("cca.pendingPasswordResetExpiresAt", response.resetExpiresAt);
      setStoredExpiresAt(response.resetExpiresAt);
      setNow(Date.now());
      setCode("");
      setPassword("");
      setConfirmPassword("");
      setStep("code");
      setMessage("Un nouveau code a été envoyé.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de renvoyer le code pour le moment."));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Réinitialisation"
      title="Réinitialisez votre mot de passe"
      description={step === "code" ? "Entrez le code reçu par e-mail pour continuer." : "Choisissez maintenant un nouveau mot de passe sécurisé."}
      aside="minimal"
      brandHref="/connexion"
    >
      <AuthBackLink href="/mot-de-passe-oublie" />

      <form className="auth-form" onSubmit={submitResetPassword}>
        {step === "code" ? (
          <>
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

            <OtpCodeInput
              value={code}
              disabled={isSubmitting}
              onChange={(value) => {
                setCode(value);
                setError("");
              }}
            />

            <div className={`otp-timer${isExpired ? " is-expired" : ""}`}>
              {isExpired ? "Code expiré" : "Code valable encore"}
              <strong>{timerLabel}</strong>
            </div>
          </>
        ) : (
          <>
            <div className="auth-verified-step">
              <Mail aria-hidden="true" strokeWidth={1.7} />
              <span>Code vérifié pour {email}</span>
            </div>

            <AuthInput
              label="Nouveau mot de passe"
              name="password"
              type="password"
              placeholder="Créez un nouveau mot de passe"
              icon={LockKeyhole}
              actionIcon={<PasswordEye />}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              required
            />
            <AuthInput
              label="Confirmer le mot de passe"
              name="confirmPassword"
              type="password"
              placeholder="Confirmez votre nouveau mot de passe"
              icon={LockKeyhole}
              actionIcon={<PasswordEye />}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setError("");
              }}
              required
            />
          </>
        )}

        {message ? <p className="auth-form-success">{message}</p> : null}
        {error ? <p className="auth-form-error" role="alert">{error}</p> : null}

        <button className="auth-primary-button" type="submit" disabled={isSubmitting || isExpired || (step === "code" && code.length !== OTP_LENGTH)}>
          {step === "code" ? (isSubmitting ? "Vérification..." : "Vérifier le code") : (isSubmitting ? "Mise à jour..." : "Réinitialiser le mot de passe")}
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <p className="auth-bottom-link">
        Code expiré ou introuvable ?{" "}
        <button type="button" onClick={resendResetCode} disabled={isResending || !email}>
          {isResending ? "Renvoi..." : "Demander un nouveau code"}
        </button>
      </p>

      <AuthSecurityNote />
    </AuthShell>
  );
}

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
