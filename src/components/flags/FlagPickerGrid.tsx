import { Box } from "@mui/material";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor, jollyRogerForColor } from ".";
import { FLAG_IDS } from "../../game/playerFlags";

interface FlagPickerGridProps {
  /** Set of flag ids already claimed by other players. Disabled in the grid. */
  taken: Set<string>;
  /** The currently picked flag id, or null if none chosen yet. */
  value: string | null;
  onChange: (id: string) => void;
}

// 3-column grid of flag tiles for the player join screen. Each tile renders
// the per-colour jolly roger (via `jollyRogerForColor`) tinted in its flag
// colour — players pick by colour silhouette, not pirate name.
//
// Tile states:
// - Available: paper-bordered ink-up tile, lifted on hover, flag-color tint
// - Selected: ink-bg + paper inset border + blood drop-shadow + lifted
// - Taken: dashed paperFaint border, no shadow, "TAKEN" badge, no tap response
// `generic` is a fallback flag for unset players (used in big-screen / phone
// views when a slot has no colour yet) — it's not a pick-able identity, so
// exclude it from the picker. Without this filter it would also collide with
// `calico_jack` since both map to the same jolly-roger silhouette.
const PICKABLE_FLAGS = FLAG_IDS.filter(id => id !== "generic");

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
      {PICKABLE_FLAGS.map((id, i) => {
        const isTaken = taken.has(id);
        const isSel = value === id;
        // If the row count modulo 3 leaves one orphan tile at the end, centre
        // it in the second column so the grid doesn't look amputated.
        const lastSlot = i === PICKABLE_FLAGS.length - 1 && PICKABLE_FLAGS.length % 3 === 1;
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
                ? flagColor(id)
                : isTaken
                  ? palette.inkUp
                  : palette.inkUp,
              border: `${isSel ? 3 : 2}px ${isTaken ? "dashed" : "solid"} ${
                isSel
                  ? palette.blood
                  : isTaken
                    ? palette.paperDim
                    : palette.paper
              }`,
              boxShadow: isSel
                ? `inset 0 0 0 2px ${palette.paper}, 5px 5px 0 ${palette.inkDeep}`
                : !isTaken
                  ? `2px 2px 0 ${palette.inkDeep}`
                  : "none",
              transform: isSel ? "translateY(-4px)" : "none",
              opacity: isTaken ? 0.35 : 1,
              aspectRatio: "52 / 36",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.25rem",
              color: isSel ? palette.paper : isTaken ? palette.paperDim : flagColor(id),
              cursor: isTaken ? "not-allowed" : "pointer",
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.12s ease, background 0.18s ease, color 0.18s ease",
              "&:focus-visible": {
                outline: `2px solid ${palette.blood}`,
                outlineOffset: "2px",
              },
            }}
          >
            <FlagFor id={jollyRogerForColor(id)} size={44} />
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
                  fontSize: "0.7rem",
                  letterSpacing: "0.22em",
                  color: palette.paper,
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
