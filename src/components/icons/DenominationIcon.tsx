import { palette } from "../../theme/colors";
import type { Denomination } from "../../game/types";

interface DenominationIconProps {
  value: Denomination;
  size?: number;
  "aria-label"?: string;
}

export function DenominationIcon({ value, size = 22, "aria-label": ariaLabel }: DenominationIconProps) {
  if (value === 5000) {
    return (
      <svg width={size} height={size} viewBox="0 0 28 28" aria-label={ariaLabel}>
        <circle cx="14" cy="14" r="9" fill={palette.silverGray} stroke={palette.paper} strokeWidth="2" />
      </svg>
    );
  }
  if (value === 10000) {
    return (
      <svg width={size} height={size} viewBox="0 0 28 28" aria-label={ariaLabel}>
        <circle cx="14" cy="14" r="10" fill={palette.gold} stroke={palette.paper} strokeWidth="2" />
        <circle cx="14" cy="14" r="6" fill="none" stroke={palette.paper} strokeWidth="1" />
      </svg>
    );
  }
  // 20000 — jeweled piece
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-label={ariaLabel}>
      <circle cx="14" cy="14" r="11" fill={palette.yellow} stroke={palette.paper} strokeWidth="2" />
      <path
        d="M14 8a3 3 0 100 6 3 3 0 100 6 3 3 0 110-6 3 3 0 110-6z"
        fill={palette.jewelPurple}
      />
    </svg>
  );
}
