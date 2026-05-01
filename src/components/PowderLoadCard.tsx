import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { BulletCard } from "../game/types";
import { palette } from "../theme/colors";

export function PowderLoadCard({ load, count, selected, onSelect }: {
  load: BulletCard;
  count: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Box
      role="button"
      onClick={onSelect}
      sx={{
        cursor: "pointer",
        p: 1.5,
        bgcolor: palette.parchment,
        border: `2px solid ${selected ? palette.signal : palette.ink}`,
        borderRadius: 1,
        boxShadow: selected ? `0 0 0 2px ${palette.signal} inset` : "none",
        opacity: count === 0 ? 0.35 : 1,
        pointerEvents: count === 0 ? "none" : "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        minWidth: 96,
        transition: "border-color 0.15s ease",
      }}
    >
      <LoadIllustration load={load} />
      <Typography variant="h6" sx={{ color: palette.ink, fontFamily: "Pirata One, serif" }}>
        {t(`load.${load}`)}
      </Typography>
      <Typography variant="caption" sx={{ color: palette.inkSoft, textAlign: "center" }}>
        {t(`load.description.${load}`)}
      </Typography>
      <Typography variant="caption" sx={{ color: palette.ink, fontWeight: 700 }}>
        ×{count}
      </Typography>
    </Box>
  );
}

function LoadIllustration({ load }: { load: BulletCard }) {
  if (load === "clic") {
    return (
      <svg viewBox="0 0 48 48" width={48} height={48} aria-hidden>
        <g fill="none" stroke={palette.ink} strokeWidth="2">
          <rect x="14" y="20" width="20" height="12" rx="2" fill={palette.parchmentDark} />
          <rect x="22" y="14" width="4" height="8" />
          <line x1="14" y1="32" x2="34" y2="32" />
        </g>
      </svg>
    );
  }
  if (load === "bang") {
    return (
      <svg viewBox="0 0 48 48" width={48} height={48} aria-hidden>
        <g fill={palette.ink}>
          <rect x="12" y="20" width="24" height="10" rx="2" fill={palette.parchmentDark} stroke={palette.ink} strokeWidth="2" />
          <circle cx="24" cy="25" r="3" fill={palette.signal} />
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" width={48} height={48} aria-hidden>
      <g>
        <rect x="6" y="20" width="36" height="10" rx="2" fill={palette.parchmentDark} stroke={palette.ink} strokeWidth="2" />
        <circle cx="14" cy="25" r="3" fill={palette.signal} />
        <circle cx="24" cy="25" r="3" fill={palette.signal} />
        <circle cx="34" cy="25" r="3" fill={palette.signal} />
      </g>
    </svg>
  );
}
