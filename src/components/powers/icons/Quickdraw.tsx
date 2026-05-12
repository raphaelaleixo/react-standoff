// Lightning bolt — the centred sigil for Quartermaster's Reload
// (Specialist). Borrows the QUICKDRAW glyph from PowderCard so the
// "you reload your Quickdraw" mechanic reads visually in one mark.
// Uses `currentColor` so the host context controls the fill.
export function Quickdraw({ size = 64 }: { size?: number | string }) {
  return (
    <svg
      viewBox="0 0 20 28"
      width={size}
      height={typeof size === "number" ? size * 1.4 : size}
      role="img"
      aria-label="Quickdraw bolt"
    >
      <path d="M 13 0 L 3 14 L 9 14 L 7 28 L 17 14 L 11 14 Z" fill="currentColor" />
    </svg>
  );
}
