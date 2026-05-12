import { palette } from "../../theme/colors";
import type { Denomination } from "../../game/types";

interface DenominationIconProps {
  value: Denomination;
  size?: number | string;
  "aria-label"?: string;
}

export function DenominationIcon({ value, size = 22, "aria-label": ariaLabel }: DenominationIconProps) {
  if (value === 5000) {
    return (
      <svg width={size} height={size} viewBox="4 4 20 20" aria-label={ariaLabel}>
        <circle cx="14" cy="14" r="9" fill={palette.silverGray} stroke={palette.paper} strokeWidth="2" />
      </svg>
    );
  }
  if (value === 10000) {
    return (
      <svg width={size} height={size} viewBox="3 3 22 22" aria-label={ariaLabel}>
        <circle cx="14" cy="14" r="10" fill={palette.gold} stroke={palette.paper} strokeWidth="2" />
        <circle cx="14" cy="14" r="6" fill="none" stroke={palette.paper} strokeWidth="1" />
      </svg>
    );
  }
  // 20000 — jeweled piece (cut diamond)
  return (
    <svg width={size} height={size} viewBox="4 4 20 20" aria-label={ariaLabel}>
      <path
        d="M9 6 L19 6 L24 11 L14 22 L4 11 Z"
        fill={palette.jewelPurple}
        stroke={palette.paper}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M9 6 L14 11 L19 6 M4 11 L24 11 M14 11 L14 22"
        stroke={palette.paper}
        strokeWidth="0.8"
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  );
}
