"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthBackLink, AuthInput, AuthSecurityNote, AuthShell, Mail } from "@/components/auth-ui";
import { OTP_LENGTH, OtpCodeInput } from "@/components/otp-code-input";
import { getApiErrorMessage, resendVerification, verifyEmail } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/slices/auth-slice";
import { clearPendingVerification, setPendingVerification } from "@/store/slices/registration-slice";

export function VerificationOtpClient() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const pendingVerification = useAppSelector((state) => state.registration.pendingVerification);
  const emailFromUrl = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(() => {
    if (emailFromUrl) {
      return emailFromUrl;
    }

    if (pendingVerification?.email) {
      return pendingVerification.email;
    }

    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem("cca.pendingVerificationEmail") ?? "";
  });
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [storedExpiresAt] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem("cca.pendingVerificationExpiresAt") ?? "";
  });
  const isRegistrationFlow = searchParams.get("flow") === "registration";

  const expiresAt = pendingVerification?.expiresAt ?? storedExpiresAt;
  const expiresAtMs = expiresAt ? new Date(expiresAt).getTime() : Number.NaN;
  const remainingMs = Number.isFinite(expiresAtMs) ? Math.max(0, expiresAtMs - now) : null;
  const isExpired = remainingMs === 0;
  const timerLabel = remainingMs === null ? "--:--" : formatDuration(remainingMs);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  async function submitOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isExpired) {
      setError("Ce code a expiré. Demandez un nouveau code pour continuer.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await verifyEmail({ email, code });
      dispatch(setCredentials(response));
      dispatch(clearPendingVerification());
      window.localStorage.setItem("cca.accessToken", response.accessToken);
      window.localStorage.setItem("cca.refreshToken", response.refreshToken);
      window.localStorage.setItem("cca.user", JSON.stringify(response.user));
      window.localStorage.removeItem("cca.pendingVerificationEmail");
      window.localStorage.removeItem("cca.pendingVerificationExpiresAt");
      router.push("/espace-membre");
    } catch (err) {
      setError(getApiErrorMessage(err, "Le code saisi est incorrect."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendCode() {
    setError("");
    setMessage("");
    setIsResending(true);

    try {
      const response = await resendVerification({ email });
      dispatch(setPendingVerification({ email, expiresAt: response.verificationExpiresAt }));
      setNow(Date.now());
      setCode("");
      window.localStorage.setItem("cca.pendingVerificationEmail", email);
      window.localStorage.setItem("cca.pendingVerificationExpiresAt", response.verificationExpiresAt);
      setMessage("Un nouveau code a été généré.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de renvoyer le code pour le moment."));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Vérification OTP"
      title="Vérifiez votre adresse e-mail"
      description={
        isRegistrationFlow
          ? "Entrez le code reçu pour activer votre compte Creative Currencies Africa."
          : "Entrez le code reçu par e-mail pour continuer."
      }
      aside="secure"
    >
      <AuthBackLink href={isRegistrationFlow ? "/inscription" : "/mot-de-passe-oublie"} />

      <form className="auth-form" onSubmit={submitOtp}>
        <AuthInput
          label="Adresse e-mail"
          icon={Mail}
          type="text"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nom@creativecurrencies.africa"
          required
        />

        <OtpCodeInput value={code} onChange={(value) => {
          setCode(value);
          setError("");
        }} />

        <div className={`otp-timer${isExpired ? " is-expired" : ""}`}>
          {isExpired ? "Code expiré" : "Code valable encore"}
          <strong>{timerLabel}</strong>
        </div>

        {message ? <p className="auth-form-success">{message}</p> : null}
        {error ? <p className="auth-form-error" role="alert">{error}</p> : null}

        <button className="auth-primary-button" type="submit" disabled={isSubmitting || isExpired || code.length !== OTP_LENGTH}>
          {isSubmitting ? "Validation..." : "Valider le code"}
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <p className="auth-bottom-link">
        Vous n&apos;avez pas reçu le code ?{" "}
        <button type="button" onClick={resendCode} disabled={isResending || !email}>
          {isResending ? "Renvoi..." : "Renvoyer le code"}
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
