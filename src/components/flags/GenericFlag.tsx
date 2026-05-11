export function GenericFlag({ size = 64 }: { size?: number | string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Pirate flag">
      <g fill="currentColor">
        <circle cx="32" cy="22" r="11" />
        <rect x="26" y="29" width="3" height="6" />
        <rect x="35" y="29" width="3" height="6" />
        <circle cx="27" cy="20" r="2.2" fill="#e8d8b0" />
        <circle cx="37" cy="20" r="2.2" fill="#e8d8b0" />
        <rect x="14" y="42" width="36" height="3" transform="rotate(25 32 43)" />
        <rect x="14" y="42" width="36" height="3" transform="rotate(-25 32 43)" />
      </g>
    </svg>
  );
}
