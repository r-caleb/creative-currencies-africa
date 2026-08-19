"use client";

import { ClipboardEvent, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthBackLink, AuthInput, AuthSecurityNote, AuthShell, Mail } from "@/components/auth-ui";
import { resendVerification, verifyEmail } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/slices/auth-slice";
import { clearPendingVerification, setPendingVerification } from "@/store/slices/registration-slice";

const OTP_LENGTH = 6;
const emptyOtpDigits = () => Array.from({ length: OTP_LENGTH }, () => "");

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
  const [codeDigits, setCodeDigits] = useState<string[]>(emptyOtpDigits);
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
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const code = useMemo(() => codeDigits.join(""), [codeDigits]);
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

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const focusDigit = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, OTP_LENGTH - 1));
    inputRefs.current[nextIndex]?.focus();
    inputRefs.current[nextIndex]?.select();
  };

  const insertDigits = (index: number, digits: string[]) => {
    if (digits.length === 0) {
      return;
    }

    setCodeDigits((current) => {
      const next = [...current];
      digits.forEach((digit, offset) => {
        if (index + offset < OTP_LENGTH) {
          next[index + offset] = digit;
        }
      });
      return next;
    });
    setError("");

    window.setTimeout(() => focusDigit(index + digits.length), 0);
  };

  const clearDigit = (index: number) => {
    setCodeDigits((current) => {
      const next = [...current];
      next[index] = "";
      return next;
    });
    setError("");
  };

  const handleDigitKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      insertDigits(index, [event.key]);
      return;
    }

    if (event.key.length === 1) {
      event.preventDefault();
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();

      if (codeDigits[index]) {
        clearDigit(index);
        return;
      }

      if (index > 0) {
        clearDigit(index - 1);
        window.setTimeout(() => focusDigit(index - 1), 0);
      }

      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusDigit(index - 1);
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusDigit(index + 1);
    }
  };

  const handleDigitPaste = (event: ClipboardEvent<HTMLInputElement>, index: number) => {
    const pastedDigits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH - index)
      .split("");

    if (pastedDigits.length === 0) {
      return;
    }

    event.preventDefault();
    insertDigits(index, pastedDigits);
  };

  const handleDigitInput = (event: FormEvent<HTMLInputElement>, index: number) => {
    const nextDigits = event.currentTarget.value.replace(/\D/g, "").slice(0, OTP_LENGTH - index).split("");

    if (nextDigits.length > 1) {
      insertDigits(index, nextDigits);
    }
  };

  const handleDigitBeforeInput = (event: FormEvent<HTMLInputElement>, index: number) => {
    const inputEvent = event.nativeEvent as InputEvent;
    const nextDigits = (inputEvent.data ?? "").replace(/\D/g, "").slice(0, OTP_LENGTH - index).split("");

    if (nextDigits.length > 0) {
      event.preventDefault();
      insertDigits(index, nextDigits);
    }
  };

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
      setError(err instanceof Error ? err.message : "Code invalide. Veuillez réessayer.");
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
      setCodeDigits(emptyOtpDigits());
      window.localStorage.setItem("cca.pendingVerificationEmail", email);
      window.localStorage.setItem("cca.pendingVerificationExpiresAt", response.verificationExpiresAt);
      setMessage("Un nouveau code a été généré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de renvoyer le code pour le moment.");
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
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nom@creativecurrencies.africa"
          required
        />

        <div className="otp-group" aria-label="Code de vérification">
          {codeDigits.map((value, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              aria-label={`Chiffre ${index + 1}`}
              autoComplete="off"
              autoFocus={index === 0}
              inputMode="numeric"
              pattern="[0-9]*"
              value={value}
              maxLength={1}
              onFocus={(event) => event.target.select()}
              onBeforeInput={(event) => handleDigitBeforeInput(event, index)}
              onChange={(event) => {
                const nextDigits = event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH - index).split("");
                if (nextDigits.length > 0) {
                  insertDigits(index, nextDigits);
                } else {
                  clearDigit(index);
                }
              }}
              onInput={(event) => handleDigitInput(event, index)}
              onKeyDown={(event) => handleDigitKeyDown(event, index)}
              onPaste={(event) => handleDigitPaste(event, index)}
            />
          ))}
        </div>

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
