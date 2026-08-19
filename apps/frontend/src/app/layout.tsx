import type { Metadata } from "next";
import "./globals.css";
import { SiteChrome } from "@/components/site-chrome";
import { StoreProvider } from "@/store/provider";

export const metadata: Metadata = {
  title: "Creative Currencies Africa",
  description:
    "Plateforme éducative et communautaire dédiée aux industries créatives africaines.",
  icons: {
    icon: "/assets/cca-mask-gold-transparent.png",
    shortcut: "/assets/cca-mask-gold-transparent.png",
  },
  openGraph: {
    title: "Creative Currencies Africa",
    description:
      "Create. Connect. Empower. Une plateforme pour former, connecter et valoriser les talents créatifs africains.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <StoreProvider>
          <SiteChrome>{children}</SiteChrome>
        </StoreProvider>
      </body>
    </html>
  );
}
