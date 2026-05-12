// Four wound X's in a 2×2 grid — the centred sigil for Ironhide
// (Unbreakable). Mirrors the WoundPips X glyph from PlayerMarks but
// stamped four times to read "four wounds, still standing". Uses
// `currentColor` so the host context controls the stroke.
export function FourWounds({ size = 64 }: { size?: number | string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-label="Four wound marks"
    >
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none">
        {/* Top-left X */}
        <line x1="2" y1="2" x2="10" y2="10" />
        <line x1="10" y1="2" x2="2" y2="10" />
        {/* Top-right X */}
        <line x1="14" y1="2" x2="22" y2="10" />
        <line x1="22" y1="2" x2="14" y2="10" />
        {/* Bottom-left X */}
        <line x1="2" y1="14" x2="10" y2="22" />
        <line x1="10" y1="14" x2="2" y2="22" />
        {/* Bottom-right X */}
        <line x1="14" y1="14" x2="22" y2="22" />
        <line x1="22" y1="14" x2="14" y2="22" />
      </g>
    </svg>
  );
}
