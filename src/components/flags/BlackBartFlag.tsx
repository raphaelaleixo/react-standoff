export function BlackBartFlag({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Black Bart flag">
      <g fill="currentColor">
        <circle cx="32" cy="14" r="6" />
        <rect x="29" y="20" width="6" height="14" />
        <rect x="22" y="22" width="20" height="3" />
        <rect x="28" y="34" width="3" height="10" />
        <rect x="33" y="34" width="3" height="10" />
        <circle cx="20" cy="50" r="6" />
        <circle cx="44" cy="50" r="6" />
        <circle cx="18" cy="49" r="1.4" fill="#e8d8b0" />
        <circle cx="22" cy="49" r="1.4" fill="#e8d8b0" />
        <circle cx="42" cy="49" r="1.4" fill="#e8d8b0" />
        <circle cx="46" cy="49" r="1.4" fill="#e8d8b0" />
      </g>
    </svg>
  );
}
