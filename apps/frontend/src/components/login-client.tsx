"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthInput, AuthSecurityNote, AuthShell, AuthSocialButtons, LockKeyhole, Mail, PasswordEye } from "@/components/auth-ui";
import { getApiErrorMessage, loginMember } from "@/lib/api";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/auth-slice";

export function LoginClient() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTo = normalizeRedirect(searchParams.get("redirect"));

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await loginMember({
        email,
        password,
        deviceId: rememberMe ? getDeviceId() : undefined,
      });

      dispatch(setCredentials(response));
      const storage = getBrowserStorage();
      storage?.setItem("cca.accessToken", response.accessToken);
      storage?.setItem("cca.refreshToken", response.refreshToken);
      storage?.setItem("cca.user", JSON.stringify(response.user));
      router.push(redirectTo);
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de vous connecter pour le moment."));
    } finally {
      setIsSubmitting(false);
    }
  }

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

      <form className="auth-form" onSubmit={submitLogin}>
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
        <AuthInput
          label="Mot de passe"
          name="password"
          type="password"
          placeholder="Entrez votre mot de passe"
          icon={LockKeyhole}
          actionIcon={<PasswordEye />}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError("");
          }}
          required
        />

        <div className="auth-form-row">
          <label className="auth-checkbox">
            <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
            <span>Se souvenir de moi</span>
          </label>
          <Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
        </div>

        {error ? <p className="auth-form-error" role="alert">{error}</p> : null}

        <button className="auth-primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Connexion..." : "Se connecter"}
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <div className="auth-divider"><span>ou continuer avec</span></div>
      <AuthSocialButtons />
      <AuthSecurityNote />
    </AuthShell>
  );
}

function normalizeRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/espace-membre";
  }

  return value;
}

function getDeviceId() {
  const storage = getBrowserStorage();
  const storageKey = "cca.deviceId";
  const stored = storage?.getItem(storageKey);

  if (stored) {
    return stored;
  }

  const value = window.crypto?.randomUUID?.() ?? `web-${Date.now()}`;
  storage?.setItem(storageKey, value);

  return value;
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
