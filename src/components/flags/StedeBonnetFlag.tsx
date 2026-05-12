export function StedeBonnetFlag({ size = 64 }: { size?: number | string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Stede Bonnet flag">
      <g fill="currentColor">
        <circle cx="32" cy="20" r="10" />
        <rect x="29" y="28" width="6" height="6" />
        <circle cx="27" cy="19" r="2" fill="#e8d8b0" />
        <circle cx="37" cy="19" r="2" fill="#e8d8b0" />
        <rect x="14" y="40" width="36" height="3" />
        <circle cx="14" cy="41.5" r="3.5" />
        <circle cx="50" cy="41.5" r="3.5" />
        <path d="M28 50 L32 56 L36 50 A4 4 0 0 0 32 48 A4 4 0 0 0 28 50 Z" />
      </g>
    </svg>
  );
}
