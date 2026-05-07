import { Box } from "@mui/material";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor, jollyRogerForColor } from "../flags";
import { cashTotal } from "../../lib/score";
import { AimBarrel } from "./AimBarrel";
import type { Player } from "../../game/types";

interface TargetListProps {
  opponents: Player[];
  selectedId?: string | null;
  onPick?: (id: string) => void;
}

// Commit-phase target picker. Same flintlock-barrel sights used during the
// standoff phase — the currently aimed player's jolly roger sits inside —
// with a small chip row below for switching marks. Tapping a chip swaps the
// player in the sights; the barrel keeps continuity with the standoff view
// once the round locks.
export function TargetList({ opponents, selectedId, onPick }: TargetListProps) {
  const selected = opponents.find(o => o.id === selectedId) ?? null;

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        minHeight: 0,
        padding: "0.4rem 0.5rem 0.3rem",
      }}
    >
      {/* Aim view — barrel + name + cash for whoever's currently in the sights. */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.35rem",
          paddingBottom: "0.6rem",
        }}
      >
        <AimBarrel colorOrAvatar={selected?.colorOrAvatar} size={130} />
        {selected ? (
          <>
            <Box
              sx={{
                fontFamily: fonts.displayCaps,
                fontFeatureSettings: '"smcp"',
                fontSize: "1rem",
                letterSpacing: "0.18em",
                color: palette.paper,
                marginTop: "0.3rem",
              }}
            >
              {selected.displayName}
            </Box>
            <Box
              sx={{
                fontFamily: fonts.blackletter,
                fontWeight: 700,
                fontSize: "1.1rem",
                lineHeight: 1,
                color: palette.paper,
              }}
            >
              ${cashTotal(selected).toLocaleString()}
            </Box>
          </>
        ) : (
          <Box
            sx={{
              fontFamily: fonts.body,
              fontStyle: "italic",
              color: palette.paperDim,
              marginTop: "0.5rem",
              fontSize: "0.85rem",
            }}
          >
            Pick yer mark
          </Box>
        )}
      </Box>

      {/* Chip row — one chip per opponent, tap to swap who's in the sights. */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: "0.35rem",
          flexWrap: "nowrap",
          overflowX: "auto",
          padding: "0.3rem 0.2rem 0.2rem",
          // Hide scrollbar; chips are large enough that overflow is obvious.
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        }}
      >
        {opponents.map(o => {
          const isSel = selectedId === o.id;
          const shortName = lastWord(o.displayName);
          return (
            <Box
              key={o.id}
              role="button"
              tabIndex={0}
              data-target-id={o.id}
              data-selected={isSel ? "true" : "false"}
              onClick={() => onPick?.(o.id)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPick?.(o.id);
                }
              }}
              sx={{
                flex: "0 0 auto",
                minWidth: 56,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.4rem 0.35rem 0.45rem",
                background: isSel ? palette.paper : palette.inkUp,
                color: isSel ? palette.ink : palette.paper,
                border: `1.5px solid ${isSel ? palette.blood : palette.paper}`,
                boxShadow: isSel
                  ? `2px 2px 0 ${palette.blood}`
                  : `1.5px 1.5px 0 ${palette.inkDeep}`,
                opacity: isSel ? 1 : 0.85,
                transform: isSel ? "translateY(-2px)" : "none",
                transition: "transform 0.12s ease, opacity 0.12s ease",
                cursor: "pointer",
                "&:focus-visible": {
                  outline: `2px solid ${palette.blood}`,
                  outlineOffset: "2px",
                },
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 26,
                  border: `1px solid ${isSel ? palette.ink : palette.paper}`,
                  background: flagColor(o.colorOrAvatar),
                  color: palette.paper,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FlagFor id={jollyRogerForColor(o.colorOrAvatar)} size={18} />
              </Box>
              <Box
                sx={{
                  fontFamily: fonts.displayCaps,
                  fontFeatureSettings: '"smcp"',
                  fontSize: "0.62rem",
                  letterSpacing: "0.1em",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {shortName}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// Most pirate display names follow "<adjective> <name>" or "<title> <name>"
// (Cap'n Maud, Mad Mary, Wet Match, Old Salt, Black Sam). The last whitespace-
// separated chunk is the recognisable "name" — that's what we fit on the
// chip. Hyphenated single-word names like "One-Eye" stay intact.
function lastWord(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] || name;
}
