export function EdwardLowFlag({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Edward Low flag">
      <g fill="currentColor">
        <circle cx="32" cy="14" r="6" />
        <rect x="30" y="20" width="4" height="20" />
        <rect x="20" y="24" width="24" height="2.5" />
        <rect x="22" y="32" width="20" height="2.5" />
        <rect x="28" y="40" width="3" height="14" />
        <rect x="33" y="40" width="3" height="14" />
        <rect x="20" y="50" width="6" height="2.5" />
        <rect x="38" y="50" width="6" height="2.5" />
      </g>
    </svg>
  );
}
