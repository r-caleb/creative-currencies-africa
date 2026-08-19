"use client";

import { ReactNode, useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { hydrateAuth } from "./slices/auth-slice";
import { hydratePendingVerification } from "./slices/registration-slice";

export function StoreProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const user = readJsonStorage("cca.user");
    const accessToken = window.localStorage.getItem("cca.accessToken");
    const refreshToken = window.localStorage.getItem("cca.refreshToken");
    const pendingEmail = window.localStorage.getItem("cca.pendingVerificationEmail");
    const pendingExpiresAt = window.localStorage.getItem("cca.pendingVerificationExpiresAt");

    store.dispatch(
      hydrateAuth({
        accessToken,
        refreshToken,
        user,
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

function readJsonStorage(key: string) {
  const value = window.localStorage.getItem(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}
