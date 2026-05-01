// Calico Jack — skull above crossed sabres. Inked, single-color SVG; the
// surrounding container can recolor via `currentColor`.
export function CalicoJackFlag({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Calico Jack flag">
      <g fill="currentColor">
        <circle cx="32" cy="22" r="11" />
        <rect x="26" y="29" width="3" height="6" />
        <rect x="35" y="29" width="3" height="6" />
        <circle cx="22" cy="20" r="2.2" fill="#e8d8b0" />
        <circle cx="42" cy="20" r="2.2" fill="#e8d8b0" />
        <rect x="29" y="24" width="6" height="2" fill="#e8d8b0" />
        <rect x="20" y="42" width="24" height="2.5" transform="rotate(20 32 43)" />
        <rect x="20" y="42" width="24" height="2.5" transform="rotate(-20 32 43)" />
        <polygon points="44,38 50,40 47,46" />
        <polygon points="20,38 14,40 17,46" />
      </g>
    </svg>
  );
}
