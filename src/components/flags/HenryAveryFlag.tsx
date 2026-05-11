export function HenryAveryFlag({ size = 64 }: { size?: number | string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Henry Avery flag">
      <g fill="currentColor">
        <circle cx="30" cy="30" r="14" />
        <rect x="14" y="20" width="32" height="5" />
        <polygon points="46,22 54,22 50,29" />
        <circle cx="30" cy="30" r="3" fill="#e8d8b0" />
        <rect x="20" y="46" width="22" height="2.5" transform="rotate(20 31 47)" />
        <rect x="20" y="46" width="22" height="2.5" transform="rotate(-20 31 47)" />
      </g>
    </svg>
  );
}
