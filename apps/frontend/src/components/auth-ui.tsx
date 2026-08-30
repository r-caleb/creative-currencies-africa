import type { ComponentType, InputHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  Palette,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { FaApple, FaFacebookF, FaGoogle } from "react-icons/fa6";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  aside?: "portrait" | "secure" | "minimal";
  brandHref?: string;
};

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean; strokeWidth?: number }>;
  actionIcon?: ReactNode;
};

export const accountTypes = [
  {
    slug: "public",
    title: "Public",
    text: "Membres qui souhaitent découvrir la plateforme, suivre l'actualité et interagir librement.",
    icon: UserRound,
    points: ["Inscription simple", "Accès au réseau", "Opportunités à suivre"],
  },
  {
    slug: "createur",
    title: "Créateur",
    text: "Artistes, designers, photographes, stylistes, musiciens et talents créatifs.",
    icon: Palette,
    points: ["Portfolio professionnel", "Badges & certificats", "Réseau & opportunités"],
  },
  {
    slug: "apprenant",
    title: "Apprenant",
    text: "Étudiants et passionnés qui souhaitent apprendre, pratiquer et progresser.",
    icon: GraduationCap,
    points: ["Formations certifiantes", "Ressources utiles", "Suivi du parcours"],
  },
  {
    slug: "organisation",
    title: "Organisation",
    text: "Écoles, studios, médias, collectifs, institutions, structures créatives et partenaires.",
    icon: Building2,
    points: ["Gestion des équipes", "Partenariats", "Rapports d'activité"],
  },
];

export function AuthShell({ eyebrow, title, description, children, aside = "portrait", brandHref = "/#accueil" }: AuthShellProps) {
  return (
    <main className={`auth-page auth-page--${aside}`}>
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-brand-row">
          <Link href={brandHref} aria-label="Retour à Creative Currencies Africa">
            <img src="/assets/cca-logo-full-transparent-web.png" alt="Creative Currencies Africa" />
          </Link>
        </div>

        <div className="auth-heading">
          <p>{eyebrow}</p>
          <h1 id="auth-title">{title}</h1>
          <span>{description}</span>
        </div>

        {children}
      </section>

      <aside className="auth-art" aria-hidden="true">
        <img src="/assets/cca-hero-art.png" alt="" />
        <div className="auth-art-overlay" />
        <div className="auth-art-copy">
          <span>CREATE. CONNECT. EMPOWER.</span>
          <strong>Quand la créativité devient une force économique.</strong>
        </div>
      </aside>
    </main>
  );
}

export function AuthBackLink({ href = "/connexion" }: { href?: string }) {
  return (
    <Link className="auth-back-link" href={href}>
      <ArrowLeft aria-hidden="true" strokeWidth={1.8} />
      Retour
    </Link>
  );
}

export function AuthFieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className="auth-field-label">
      {label}
      {required ? (
        <span className="auth-required-star" aria-label="obligatoire">
          *
        </span>
      ) : null}
    </span>
  );
}

export function AuthInput({ label, icon: Icon = Mail, actionIcon, ...props }: AuthInputProps) {
  return (
    <label className="auth-field">
      <AuthFieldLabel label={label} required={props.required} />
      <span className="auth-input-wrap">
        <Icon className="auth-input-icon" aria-hidden={true} strokeWidth={1.7} />
        <input {...props} />
        {actionIcon ? <span className="auth-input-action">{actionIcon}</span> : null}
      </span>
    </label>
  );
}

export function PasswordEye() {
  return <EyeOff aria-hidden="true" strokeWidth={1.8} />;
}

export function AuthPrimaryButton({ children }: { children: ReactNode }) {
  return (
    <button className="auth-primary-button" type="button">
      {children}
      <ArrowRight aria-hidden="true" strokeWidth={1.9} />
    </button>
  );
}

export function AuthSocialButtons() {
  return (
    <div className="auth-social-grid" aria-label="Connexion sociale">
      <button type="button">
        <FaGoogle aria-hidden="true" />
        Google
      </button>
      <button type="button">
        <FaApple aria-hidden="true" />
        Apple
      </button>
      <button type="button">
        <FaFacebookF aria-hidden="true" />
        Facebook
      </button>
    </div>
  );
}

export function AuthSecurityNote() {
  return (
    <div className="auth-security-note">
      <ShieldCheck aria-hidden="true" strokeWidth={1.7} />
      <span>Vos données sont sécurisées et ne seront jamais partagées.</span>
    </div>
  );
}

export function AccountTypeCard({ account }: { account: (typeof accountTypes)[number] }) {
  const Icon = account.icon;

  return (
    <article className="account-type-card">
      <div className="account-type-visual">
        <Icon aria-hidden="true" strokeWidth={1.5} />
      </div>
      <h2>{account.title}</h2>
      <p>{account.text}</p>
      <ul>
        {account.points.map((point) => (
          <li key={point}>
            <Check aria-hidden="true" strokeWidth={1.8} />
            {point}
          </li>
        ))}
      </ul>
      <Link className="auth-secondary-button" href={`/inscription/${account.slug}`}>
        Choisir
      </Link>
    </article>
  );
}

export function PasswordChecklist() {
  return (
    <ul className="password-checklist">
      {["Au moins 8 caractères", "Une majuscule et une minuscule", "Un chiffre", "Un caractère spécial"].map((item) => (
        <li key={item}>
          <BadgeCheck aria-hidden="true" strokeWidth={1.8} />
          {item}
        </li>
      ))}
    </ul>
  );
}

export { LockKeyhole, Mail };
