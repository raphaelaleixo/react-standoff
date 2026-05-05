import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { HoardItem } from "./HoardItem";
import type { Denomination } from "../../game/types";

interface HoardListEntry {
  value: Denomination;
  carryFromRound?: number;
}

interface HoardListProps {
  loot: HoardListEntry[];
}

export function HoardList({ loot }: HoardListProps) {
  const total = loot.reduce((s, n) => s + n.value, 0);
  const carryCount = loot.filter(n => n.carryFromRound != null).length;
  const subline =
    `${loot.length} NOTES` + (carryCount > 0 ? ` · ${carryCount} CARRY-OVER` : "");

  return (
    <Box sx={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          textAlign: "center",
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "0.86rem",
          letterSpacing: "0.4em",
          color: palette.paperDim,
          padding: "0 0 0.25rem",
          borderBottom: `1px solid ${palette.ruleStrong}`,
          marginBottom: "0.45rem",
        }}
      >
        ON THE TABLE
        <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.92rem", letterSpacing: "0.05em", color: palette.paper, marginTop: "0.1rem" }}>
          the captain's hoard
        </Box>
      </Box>
      <Box
        sx={{
          textAlign: "center",
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "1.59rem",
          letterSpacing: "0.04em",
          lineHeight: 1,
          color: palette.gold,
        }}
      >
        ${total.toLocaleString()}
        <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.84rem", letterSpacing: "0.18em", color: palette.paperDim, marginTop: "0.12rem" }}>
          {subline}
        </Box>
      </Box>
      <Box sx={{ borderTop: `1px solid ${palette.ruleStrong}`, margin: "0.35rem 0 0.3rem" }} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, overflow: "hidden" }}>
        {loot.map((n, i) => (
          <HoardItem
            key={i}
            value={n.value}
            carry={n.carryFromRound != null}
            carryFromRound={n.carryFromRound}
          />
        ))}
      </Box>
    </Box>
  );
}
