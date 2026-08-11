import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creative Currencies Africa",
  description:
    "Plateforme educative et communautaire dediee aux industries creatives africaines.",
  icons: {
    icon: "/assets/cca-mask-gold.jpg",
    shortcut: "/assets/cca-mask-gold.jpg",
  },
  openGraph: {
    title: "Creative Currencies Africa",
    description:
      "Create. Connect. Empower. Une plateforme pour former, connecter et valoriser les talents creatifs africains.",
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
      <body>{children}</body>
    </html>
  );
}
