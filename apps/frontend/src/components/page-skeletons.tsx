type AuthPageSkeletonProps = {
  rows?: number;
  aside?: "portrait" | "minimal";
};

export function AuthPageSkeleton({ rows = 5, aside = "minimal" }: AuthPageSkeletonProps) {
  return (
    <main className={`auth-page auth-page--${aside} auth-page-skeleton`} aria-busy="true">
      <section className="auth-panel">
        <div className="auth-brand-row">
          <div className="skeleton-logo" />
        </div>

        <div className="auth-heading auth-heading-skeleton">
          <SkeletonLine width="34%" />
          <SkeletonLine width="68%" height={42} />
          <SkeletonLine width="82%" />
          <SkeletonLine width="58%" />
        </div>

        <div className="auth-form">
          {Array.from({ length: rows }).map((_, index) => (
            <div className="auth-field-skeleton" key={index}>
              <SkeletonLine width={index % 2 === 0 ? "28%" : "36%"} height={12} />
              <SkeletonLine height={52} />
            </div>
          ))}
          <SkeletonLine className="skeleton-button" height={52} />
        </div>
      </section>

      {aside === "portrait" ? (
        <aside className="auth-art auth-art-skeleton" aria-hidden="true">
          <div />
        </aside>
      ) : null}
    </main>
  );
}

export function MemberPageSkeleton({ theme = "system" }: { theme?: "dark" | "light" | "system" } = {}) {
  return (
    <main
      className="member-shell member-shell--skeleton"
      data-dashboard-theme={theme === "system" ? undefined : theme}
      aria-busy="true"
    >
      <aside className="member-sidebar member-sidebar-skeleton">
        <div className="member-brand">
          <div className="skeleton-logo skeleton-logo--wide" />
        </div>

        <nav className="member-nav">
          {Array.from({ length: 9 }).map((_, index) => (
            <div className="member-nav-skeleton-item" key={index}>
              <SkeletonLine width={24} height={24} />
              <SkeletonLine width={index % 3 === 0 ? "48%" : "62%"} />
            </div>
          ))}
        </nav>

        <div className="member-premium-card member-premium-card--skeleton">
          <SkeletonLine width={28} height={28} />
          <SkeletonLine width="84%" height={18} />
          <SkeletonLine width="92%" />
          <SkeletonLine width="74%" />
          <SkeletonLine className="skeleton-button" height={40} />
        </div>
      </aside>

      <section className="member-main">
        <header className="member-topbar member-topbar-skeleton">
          <div>
            <SkeletonLine width={160} height={16} />
            <SkeletonLine width={220} height={12} />
          </div>
          <SkeletonLine height={46} />
          <div className="member-actions">
            <SkeletonLine width={96} height={40} />
            <SkeletonLine width={40} height={40} />
            <SkeletonLine width={40} height={40} />
            <SkeletonLine width={142} height={44} />
          </div>
        </header>

        <section className="member-dashboard-grid">
          <div className="member-primary-column">
            <div className="member-hero-card member-card-skeleton">
              <div>
                <SkeletonLine width="24%" height={12} />
                <SkeletonLine width="72%" height={44} />
                <SkeletonLine width="94%" />
                <SkeletonLine width="62%" />
                <div className="skeleton-row">
                  <SkeletonLine width={130} height={40} />
                  <SkeletonLine width={118} height={40} />
                </div>
              </div>
              <SkeletonLine className="skeleton-visual" />
            </div>

            <div className="skeleton-card-grid">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>

            <SkeletonCard tall />
          </div>

          <div className="member-support-column">
            <SkeletonCard tall />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </section>
      </section>
    </main>
  );
}

function SkeletonCard({ tall = false }: { tall?: boolean }) {
  return (
    <div className={`member-card-skeleton ${tall ? "member-card-skeleton--tall" : ""}`}>
      <SkeletonLine width="46%" height={16} />
      <SkeletonLine width="88%" />
      <SkeletonLine width="72%" />
      {tall ? <SkeletonLine width="94%" height={78} /> : null}
    </div>
  );
}

function SkeletonLine({
  width = "100%",
  height = 14,
  className = "",
}: {
  width?: number | string;
  height?: number;
  className?: string;
}) {
  return <span className={`skeleton-line ${className}`} style={{ width, height }} />;
}
