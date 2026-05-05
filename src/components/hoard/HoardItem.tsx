import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { DenominationIcon } from "../icons/DenominationIcon";
import type { Denomination } from "../../game/types";

const NAMES: Record<Denomination, string> = {
  5000: "SILVER PIECE",
  10000: "GOLD DOUBLOON",
  20000: "JEWELED PIECE",
};

const SUBLINES: Record<Denomination, string | undefined> = {
  5000: undefined,
  10000: undefined,
  20000: "cut emerald",
};

const ROMAN: Record<number, string> = {
  1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII",
};

interface HoardItemProps {
  value: Denomination;
  carry?: boolean;
  carryFromRound?: number;
}

export function HoardItem({ value, carry, carryFromRound }: HoardItemProps) {
  const subline = carry
    ? `from rd. ${carryFromRound ? ROMAN[carryFromRound]?.toLowerCase() ?? carryFromRound : "?"}`
    : SUBLINES[value];
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "24px 1fr auto",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.28rem 0.32rem",
        background: carry
          ? `repeating-linear-gradient(45deg, transparent 0 5px, rgba(237,224,196,0.08) 5px 10px)`
          : "rgba(237, 224, 196, 0.05)",
        border: `1px solid ${palette.ruleStrong}`,
      }}
    >
      <DenominationIcon value={value} aria-label={NAMES[value].toLowerCase()} />
      <Box>
        <Box sx={{ fontFamily: fonts.displayCaps, fontFeatureSettings: '"smcp"', fontSize: "0.6rem", letterSpacing: "0.16em" }}>
          {NAMES[value]}
        </Box>
        {subline && (
          <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.55rem", color: palette.paperDim }}>
            {subline}
          </Box>
        )}
      </Box>
      <Box sx={{ fontFamily: fonts.displayCaps, fontFeatureSettings: '"smcp"', fontSize: "0.7rem", letterSpacing: "0.04em" }}>
        ${value.toLocaleString()}
      </Box>
    </Box>
  );
}
