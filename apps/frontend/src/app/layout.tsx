import type { Metadata } from "next";
import "./globals.css";
import { SiteChrome } from "@/components/site-chrome";
import { StoreProvider } from "@/store/provider";

const themeInitScript = `
(function () {
  try {
    var systemTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    var siteTheme = window.localStorage.getItem("cca-theme-v3");
    var dashboardTheme = window.localStorage.getItem("cca-dashboard-theme-v1");

    document.documentElement.dataset.theme = siteTheme === "dark" || siteTheme === "light" ? siteTheme : systemTheme;
    document.documentElement.dataset.dashboardTheme = dashboardTheme === "dark" || dashboardTheme === "light" ? dashboardTheme : systemTheme;
  } catch (_) {
  }
})();
`;

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
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <StoreProvider>
          <SiteChrome>{children}</SiteChrome>
        </StoreProvider>
      </body>
    </html>
  );
}
