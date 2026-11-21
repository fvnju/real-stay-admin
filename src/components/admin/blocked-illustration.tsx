/** A closed lock over a card, for the blocked state. Colors follow the theme. */
export function BlockedIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 120"
      width={160}
      height={120}
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <rect x="20" y="28" width="120" height="76" rx="16" className="fill-default" />
      <rect x="36" y="46" width="56" height="8" rx="4" className="fill-default-hover" />
      <rect x="36" y="62" width="88" height="8" rx="4" className="fill-default-hover" />
      <rect x="36" y="78" width="40" height="8" rx="4" className="fill-default-hover" />
      <g transform="translate(96 8)">
        <path
          d="M14 30v-8a14 14 0 0 1 28 0v8"
          className="stroke-muted"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <rect x="4" y="28" width="48" height="40" rx="12" className="fill-surface stroke-separator" strokeWidth="2" />
        <circle cx="28" cy="44" r="5" className="fill-muted" />
        <rect x="26" y="46" width="4" height="12" rx="2" className="fill-muted" />
      </g>
    </svg>
  );
}
