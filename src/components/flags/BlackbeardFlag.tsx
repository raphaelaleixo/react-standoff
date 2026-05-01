export function BlackbeardFlag({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Blackbeard flag">
      <g fill="currentColor">
        <circle cx="32" cy="18" r="7" />
        <rect x="30" y="24" width="4" height="22" />
        <rect x="22" y="28" width="20" height="3" />
        <rect x="28" y="46" width="3" height="10" />
        <rect x="33" y="46" width="3" height="10" />
        <polygon points="44,12 50,16 50,20 44,16" />
        <rect x="46" y="20" width="2" height="14" />
        <polygon points="46,34 50,40 44,40" />
      </g>
    </svg>
  );
}
