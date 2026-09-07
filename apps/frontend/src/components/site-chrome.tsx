"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CcaFooter } from "@/components/cca-footer";
import { CcaHeader } from "@/components/cca-header";

const authPathPrefixes = [
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/verification-otp",
  "/reinitialisation-mot-de-passe",
  "/espace-membre",
  "/dashboard",
];

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = authPathPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isAuthPage) {
    return children;
  }

  return (
    <>
      <CcaHeader />
      {children}
      <CcaFooter />
    </>
  );
}
