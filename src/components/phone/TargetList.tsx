import { Box } from "@mui/material";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor, jollyRogerForColor } from "../flags";
import { cashTotal } from "../../lib/score";
import type { Player } from "../../game/types";

interface TargetListProps {
  opponents: Player[];
  selectedId?: string | null;
  onPick?: (id: string) => void;
}

// Opponent picker for the commit phase. Each row: jolly-roger flag chip
// (per-color variant), displayName in displayCaps, blackletter cash on the
// right. Selected row inverts to paper-on-ink with a blood drop-shadow so
// the choice is unambiguous on a phone screen.
export function TargetList({ opponents, selectedId, onPick }: TargetListProps) {
  return (
    <Box
      sx={{
        padding: "0.4rem 0.7rem",
        flex: 1,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
      }}
    >
      {opponents.map(o => {
        const cash = cashTotal(o);
        const isSel = selectedId === o.id;
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
              display: "grid",
              gridTemplateColumns: "44px 1fr auto",
              gap: "0.7rem",
              alignItems: "center",
              padding: "0.5rem 0.6rem",
              background: isSel ? palette.paper : palette.inkUp,
              color: isSel ? palette.ink : palette.paper,
              border: `1.5px solid ${palette.paper}`,
              boxShadow: isSel ? `4px 4px 0 ${palette.blood}` : `2px 2px 0 ${palette.inkDeep}`,
              cursor: "pointer",
              transition: "transform 0.1s ease",
              transform: isSel ? "translateY(-1px)" : "none",
              "&:focus-visible": {
                outline: `2px solid ${palette.blood}`,
                outlineOffset: "2px",
              },
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 30,
                border: `1.5px solid ${isSel ? palette.ink : palette.paper}`,
                background: flagColor(o.colorOrAvatar),
                color: palette.paper,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FlagFor id={jollyRogerForColor(o.colorOrAvatar)} size={22} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  fontFamily: fonts.displayCaps,
                  fontFeatureSettings: '"smcp"',
                  fontSize: "0.95rem",
                  letterSpacing: "0.16em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {o.displayName}
              </Box>
            </Box>
            <Box
              sx={{
                fontFamily: fonts.blackletter,
                fontWeight: 700,
                fontSize: "1rem",
                lineHeight: 1,
                color: isSel ? palette.ink : (cash > 0 ? palette.paper : palette.paperDim),
              }}
            >
              ${cash.toLocaleString()}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
