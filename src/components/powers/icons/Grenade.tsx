// Grenade — the centred sigil for Pocket Inferno (Insane). Single-path
// woodcut feel: round body, ridged fuse, simple pin loop. Uses
// `currentColor` so the host context controls the fill.
export function Grenade({ size = 64 }: { size?: number | string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-label="Grenade"
    >
      <g fill="currentColor">
        {/* Body */}
        <circle cx="12" cy="15" r="6" />
        {/* Neck + cap */}
        <rect x="10" y="6.5" width="4" height="3" />
        <rect x="9" y="5" width="6" height="2" />
        {/* Pin ring */}
        <circle cx="6" cy="5" r="1.5" fill="none" stroke="currentColor" strokeWidth="0.9" />
        {/* Pin shaft */}
        <line x1="7.4" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="0.9" />
        {/* Fuse arc */}
        <path
          d="M 13 5.2 Q 17 1 19 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
        {/* Fuse spark */}
        <circle cx="19" cy="4" r="1" />
      </g>
    </svg>
  );
}
