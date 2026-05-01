import { palette } from "../../theme/colors";

// One coin token, three visual variants by denomination.
// 5_000  → silver piece (small, cool grey)
// 10_000 → gold doubloon (medium, warm gold)
// 20_000 → jeweled treasure (largest, gold + red gem)
export function Coin({ value, size = 28 }: { value: number; size?: number }) {
  if (value >= 20000) return <JeweledCoin size={size} />;
  if (value >= 10000) return <GoldCoin size={size} />;
  return <SilverCoin size={size} />;
}

function SilverCoin({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} role="img" aria-label="silver piece">
      <circle cx="16" cy="16" r="13" fill="#c5c8cc" stroke={palette.ink} strokeWidth="1.5" />
      <circle cx="16" cy="16" r="9" fill="none" stroke={palette.ink} strokeWidth="0.8" opacity="0.5" />
      <text x="16" y="20" textAnchor="middle" fontFamily="Pirata One, serif" fontSize="11" fill={palette.ink}>5</text>
    </svg>
  );
}

function GoldCoin({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} role="img" aria-label="gold doubloon">
      <circle cx="16" cy="16" r="14" fill={palette.gold} stroke={palette.ink} strokeWidth="1.5" />
      <circle cx="16" cy="16" r="10" fill="none" stroke={palette.ink} strokeWidth="0.8" opacity="0.6" />
      <text x="16" y="20" textAnchor="middle" fontFamily="Pirata One, serif" fontSize="11" fill={palette.ink}>10</text>
    </svg>
  );
}

function JeweledCoin({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} role="img" aria-label="jeweled treasure">
      <circle cx="16" cy="16" r="15" fill={palette.gold} stroke={palette.ink} strokeWidth="1.5" />
      <circle cx="16" cy="16" r="11" fill="none" stroke={palette.ink} strokeWidth="0.8" opacity="0.6" />
      <polygon points="16,8 20,14 16,20 12,14" fill={palette.signal} stroke={palette.ink} strokeWidth="0.8" />
      <text x="16" y="29" textAnchor="middle" fontFamily="Pirata One, serif" fontSize="9" fill={palette.ink}>20</text>
    </svg>
  );
}
