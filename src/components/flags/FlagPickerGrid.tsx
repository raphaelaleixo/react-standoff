import { Box } from "@mui/material";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor } from ".";
import { FLAG_IDS, FLAG_LABELS } from "../../game/playerFlags";

interface FlagPickerGridProps {
  /** Set of flag ids already claimed by other players. Disabled in the grid. */
  taken: Set<string>;
  /** The currently picked flag id, or null if none chosen yet. */
  value: string | null;
  onChange: (id: string) => void;
}

// 3-column grid of flag tiles for the player join screen. Tile shows the
// historical pirate flag SVG tinted in the flag colour, with the flag name
// in displayCaps small caps beneath. This is the one place in the app where
// the original pirate flags appear (not the per-colour jolly rogers) — the
// player is choosing which historical pirate to fly under, and the distinct
// flag designs are how they tell the options apart.
//
// Tile states:
// - Available: paper-bordered ink-up tile, lifted on hover, flag-color tint
// - Selected: ink-bg + paper inset border + blood drop-shadow + lifted
// - Taken: dashed paperFaint border, no shadow, "TAKEN" badge, no tap response
export function FlagPickerGrid({ taken, value, onChange }: FlagPickerGridProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "0.55rem",
        padding: "0.4rem 0.85rem",
      }}
    >
      {FLAG_IDS.map((id, i) => {
        const isTaken = taken.has(id);
        const isSel = value === id;
        // If the row count modulo 3 leaves one orphan tile at the end, centre
        // it in the second column so the grid doesn't look amputated.
        const lastSlot = i === FLAG_IDS.length - 1 && FLAG_IDS.length % 3 === 1;
        return (
          <Box
            key={id}
            role="button"
            tabIndex={isTaken ? -1 : 0}
            data-flag-id={id}
            data-disabled={isTaken ? "true" : "false"}
            data-selected={isSel ? "true" : "false"}
            aria-disabled={isTaken || undefined}
            aria-pressed={isSel || undefined}
            onClick={() => {
              if (isTaken) return;
              onChange(id);
            }}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (isTaken) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChange(id);
              }
            }}
            sx={{
              gridColumn: lastSlot ? 2 : undefined,
              background: isSel
                ? palette.ink
                : isTaken
                  ? "rgba(20,17,13,0.06)"
                  : palette.inkUp,
              border: `2px ${isTaken ? "dashed" : "solid"} ${
                isTaken ? palette.paperFaint : palette.paper
              }`,
              boxShadow: isSel
                ? `3px 3px 0 ${palette.blood}, inset 0 0 0 2px ${palette.paper}`
                : !isTaken
                  ? `2px 2px 0 ${palette.inkDeep}`
                  : "none",
              transform: isSel ? "translateY(-2px)" : "none",
              aspectRatio: "1",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.25rem",
              color: isTaken ? palette.paperFaint : flagColor(id),
              cursor: isTaken ? "not-allowed" : "pointer",
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.12s ease",
              "&:focus-visible": {
                outline: `2px solid ${palette.blood}`,
                outlineOffset: "2px",
              },
            }}
          >
            <FlagFor id={id} size={42} />
            <Box
              sx={{
                fontFamily: fonts.displayCaps,
                fontFeatureSettings: '"smcp"',
                fontSize: "0.55rem",
                letterSpacing: "0.16em",
                color: isTaken ? palette.paperFaint : palette.paper,
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
              }}
            >
              {FLAG_LABELS[id]}
            </Box>
            {isTaken && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 4,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontFamily: fonts.displayCaps,
                  fontFeatureSettings: '"smcp"',
                  fontSize: "0.5rem",
                  letterSpacing: "0.22em",
                  color: palette.paperFaint,
                }}
              >
                TAKEN
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
