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

interface HoardItemProps {
  value: Denomination;
}

export function HoardItem({ value }: HoardItemProps) {
  return (
    <Box
      sx={{
        position: "relative",
        padding: "1.1rem 0.6rem",
        clipPath:
          "polygon(6px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
        backgroundColor: palette.ruleStrong,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: "1px",
          clipPath:
            "polygon(6px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
          backgroundColor: palette.inkUp,
        }}
      ></Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          gap: "0.5rem",
          zIndex: 1,
        }}
      >
        <DenominationIcon
          value={value}
          size={22}
          aria-label={NAMES[value].toLowerCase()}
        />
        <Box
          sx={{
            fontFamily: fonts.blackletter,
            fontWeight: 700,
            fontSize: "1.4rem",
            letterSpacing: "0.02em",
            color:
              value === 20000 ? palette.jewelPurple :
              value === 10000 ? palette.yellow :
              palette.paper,
            textBox: "trim-both ex alphabetic",
            lineHeight: 1,
          }}
        >
          ${value.toLocaleString()}
        </Box>
      </Box>
    </Box>
  );
}
