"use client";

import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";

const themeStorageKey = "cca-theme-v2";

const navItems = [
  { label: "Accueil", href: "#accueil" },
  { label: "À propos", href: "#a-propos" },
  { label: "Événements", href: "#evenement" },
  { label: "Industries", href: "#industries" },
  { label: "Créateurs", href: "#createurs" },
  { label: "Communauté", href: "#communaute" },
];

export function CcaHeader() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState(navItems[0].href);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTheme = params.get("theme");

    if (requestedTheme === "dark" || requestedTheme === "light") {
      setTheme(requestedTheme);
      return;
    }

    const stored = window.localStorage.getItem(themeStorageKey);
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  useEffect(() => {
    document.body.classList.toggle("is-mobile-menu-open", isMobileMenuOpen);

    return () => document.body.classList.remove("is-mobile-menu-open");
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const updateScrollState = () => {
      setIsScrolled(window.scrollY > 20);
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  useEffect(() => {
    const sectionIds = navItems.map((item) => item.href.replace("#", ""));

    const updateActiveSection = () => {
      const scrollPosition = window.scrollY + 150;
      let currentSection = navItems[0].href;

      for (const sectionId of sectionIds) {
        const section = document.getElementById(sectionId);

        if (section && section.offsetTop <= scrollPosition) {
          currentSection = `#${sectionId}`;
        }
      }

      setActiveSection(currentSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  return (
    <header
      className={`site-header${isScrolled ? " is-scrolled" : ""}${isMobileMenuOpen ? " has-mobile-menu" : ""}`}
      aria-label="Navigation principale"
    >
      <a
        className="brand-lockup"
        href="#accueil"
        aria-label="Creative Currencies Africa"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <img src="/assets/cca-logo-full-transparent.png" alt="Creative Currencies Africa" />
      </a>

      <nav className="desktop-nav" aria-label="Sections">
        {navItems.map((item) => (
          <a
            key={item.href}
            className={activeSection === item.href ? "is-active" : undefined}
            href={item.href}
            aria-current={activeSection === item.href ? "page" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="header-actions">
        <button
          className="theme-toggle header-glass-action"
          type="button"
          aria-label={`Activer le mode ${theme === "dark" ? "clair" : "sombre"}`}
          aria-pressed={theme === "light"}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun aria-hidden="true" strokeWidth={1.8} />
          ) : (
            <Moon aria-hidden="true" strokeWidth={1.8} />
          )}
        </button>
        <a className="button button-ghost login-preview header-glass-action" href="#">
          Se connecter
        </a>
        <a className="button button-gold header-join-action" href="#communaute">
          Nous rejoindre
        </a>
        <button
          className="mobile-menu-toggle"
          type="button"
          aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
        >
          {isMobileMenuOpen ? (
            <X aria-hidden="true" strokeWidth={2} />
          ) : (
            <Menu aria-hidden="true" strokeWidth={2} />
          )}
        </button>
      </div>

      <div
        className="mobile-menu-panel"
        id="mobile-navigation"
        aria-hidden={!isMobileMenuOpen}
      >
        <nav className="mobile-nav" aria-label="Navigation mobile">
          {navItems.map((item) => (
            <a
              key={item.href}
              className={activeSection === item.href ? "is-active" : undefined}
              href={item.href}
              aria-current={activeSection === item.href ? "page" : undefined}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="mobile-menu-actions">
          <button
            className="mobile-theme-control"
            type="button"
            aria-label={`Activer le mode ${theme === "dark" ? "clair" : "sombre"}`}
            aria-pressed={theme === "light"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun aria-hidden="true" strokeWidth={1.8} />
            ) : (
              <Moon aria-hidden="true" strokeWidth={1.8} />
            )}
            <span>{theme === "dark" ? "Mode clair" : "Mode sombre"}</span>
          </button>
          <a className="button button-ghost" href="#" onClick={() => setIsMobileMenuOpen(false)}>
            Se connecter
          </a>
          <a className="button button-gold" href="#communaute" onClick={() => setIsMobileMenuOpen(false)}>
            Nous rejoindre
          </a>
        </div>
      </div>
    </header>
  );
}
