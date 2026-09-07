"use client";

import { ReactNode, useEffect } from "react";
import { Provider } from "react-redux";
import { configureAuthTokenHandlers } from "@/lib/api";
import { store } from "./store";
import { clearAuth, hydrateAuth, setTokens } from "./slices/auth-slice";
import { hydratePendingVerification } from "./slices/registration-slice";

export function StoreProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    configureAuthTokenHandlers({
      getTokens: () => {
        const auth = store.getState().auth;
        const storage = getBrowserStorage();

        return {
          accessToken: auth.accessToken ?? storage?.getItem("cca.accessToken") ?? null,
          refreshToken: auth.refreshToken ?? storage?.getItem("cca.refreshToken") ?? null,
        };
      },
      onTokensRefreshed: (tokens) => {
        store.dispatch(setTokens(tokens));
      },
      onUnauthorized: () => {
        clearAuthStorage();
        store.dispatch(clearAuth());
      },
    });

    const storage = getBrowserStorage();
    const user = readJsonStorage(storage, "cca.user");
    const profile = readJsonStorage(storage, "cca.profile");
    const organizationProfile = readJsonStorage(storage, "cca.organizationProfile");
    const partnerProfile = readJsonStorage(storage, "cca.partnerProfile");
    const accessToken = storage?.getItem("cca.accessToken") ?? null;
    const refreshToken = storage?.getItem("cca.refreshToken") ?? null;
    const pendingEmail = storage?.getItem("cca.pendingVerificationEmail") ?? null;
    const pendingExpiresAt = storage?.getItem("cca.pendingVerificationExpiresAt") ?? null;

    store.dispatch(
      hydrateAuth({
        accessToken,
        refreshToken,
        user,
        profile,
        organizationProfile,
        partnerProfile,
      }),
    );

    store.dispatch(
      hydratePendingVerification(
        pendingEmail && pendingExpiresAt
          ? {
              email: pendingEmail,
              expiresAt: pendingExpiresAt,
            }
          : null,
      ),
    );
  }, []);

  return <Provider store={store}>{children}</Provider>;
}

function clearAuthStorage() {
  const storage = getBrowserStorage();
  storage?.removeItem("cca.accessToken");
  storage?.removeItem("cca.refreshToken");
  storage?.removeItem("cca.user");
  storage?.removeItem("cca.profile");
  storage?.removeItem("cca.organizationProfile");
  storage?.removeItem("cca.partnerProfile");
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

function readJsonStorage(storage: Storage | null, key: string) {
  const value = storage?.getItem(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    storage?.removeItem(key);
    return null;
  }
}
