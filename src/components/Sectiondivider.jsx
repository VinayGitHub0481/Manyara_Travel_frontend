
// Same hex values as tailwind.config.js tokens - no new colours.
export const ATMOSPHERE = {
  white: "#FFFFFF", // background
  alt: "#FCF9FA", // surface-alt
  blush: "#FEF4F8", // surface-soft
  surface: "#FAF8F9", // surface
  haze: "#FBF6F8", // blush (Happy Moments)
  petal: "#FCEBF2", // primary.lighter
  ink: "#1F1B22", // navy-dark / ink-900 (footer)
};

export default function SectionDivider({
  variant = "line",
  color = ATMOSPHERE.blush,
  from = ATMOSPHERE.alt,
  to = ATMOSPHERE.ink,
  className = "",
}) {
  if (variant === "curve") {
    return (
      <div
        aria-hidden="true"
        className={`relative -mb-px leading-none ${className}`}
        style={{ backgroundColor: from }}
      >
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          className="block h-8 w-full sm:h-12 lg:h-16"
        >
          <path d="M0,80 C360,20 1080,20 1440,80 Z" fill={to} />
        </svg>
      </div>
    );
  }

  if (variant === "ticket") {
    return (
      <div
        aria-hidden="true"
        className={className}
        style={{ backgroundColor: color }}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-primary/40" />
          <span className="h-px flex-1 border-t border-dashed border-primary/30" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-primary/40" />
        </div>
      </div>
    );
  }

  // line (default)
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ backgroundColor: color }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <span className="h-px flex-1 bg-divider" />
        <span className="h-1.5 w-1.5 rotate-45 bg-accent-bright" />
        <span className="h-px flex-1 bg-divider" />
      </div>
    </div>
  );
}