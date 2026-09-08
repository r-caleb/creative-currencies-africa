"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

const networkHref = "/espace-membre/reseau";
const loginHref = `/connexion?redirect=${encodeURIComponent(networkHref)}`;

type LandingNetworkLinkProps = {
  className?: string;
  children: ReactNode;
};

export function LandingNetworkLink({ className, children }: LandingNetworkLinkProps) {
  const [href, setHref] = useState(loginHref);

  useEffect(() => {
    const storage = getBrowserStorage();
    const hasSession = Boolean(storage?.getItem("cca.accessToken") || storage?.getItem("cca.refreshToken"));

    setHref(hasSession ? networkHref : loginHref);
  }, []);

  return (
    <a className={className} href={href}>
      {children}
    </a>
  );
}

function getBrowserStorage() {
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}
