import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import type { BulletCard } from "../../game/types";
import type { HandSlot } from "../../hooks/useHandSlots";
import { PowderCard } from "./PowderCard";

const FULL_HAND_SIZE = 8;

interface HandProps {
  /**
   * The full hand layout, including spent slots. Constructed by
   * `useHandSlots` so positions stay stable across rounds — a card spent
   * in round 2 keeps its slot (dimmed face + red X overlay) through the
   * rest of the game instead of remaining cards sliding into the gap.
   */
  slots: HandSlot[];
  /** Slot index of the currently chosen card. */
  selectedSlotIndex?: number;
  /** Tapping a face-up card. (load, slotIndex) */
  onPick?: (load: BulletCard, slotIndex: number) => void;
}

// 4×2 grid of PowderCards, always rendered as 8 slots. Tracked slots come
// first (face-up cards from `slots`, then any tracked-spent ones — both
// rendered via PowderCard); the rest are padded with <PlaceholderSpent />,
// a blank red-X cell used when the player has fewer cards than 8 (mid-game
// reconnect, or the mock fixture).
export function Hand({ slots, selectedSlotIndex, onPick }: HandProps) {
  const padCount = Math.max(0, FULL_HAND_SIZE - slots.length);
  return (
    <Box
      sx={{
        padding: "0.55rem 0.75rem 0.35rem",
        display: "grid",
        // Cap each column at 75px max so the cards stay thumb-sized even
        // when the phone canvas itself runs wider (440px max). On narrower
        // viewports the columns shrink to fit; on wider ones the grid
        // centres itself in the row.
        gridTemplateColumns: "repeat(4, minmax(0, 75px))",
        justifyContent: "center",
        gap: "0.45rem",
      }}
    >
      {slots.map((slot, i) => (
        <Box key={`slot-${i}`} data-card-slot data-position={i}>
          <PowderCard
            load={slot.load}
            spent={slot.spent}
            selected={!slot.spent && selectedSlotIndex === i}
            onClick={slot.spent ? undefined : () => onPick?.(slot.load, i)}
          />
        </Box>
      ))}
      {Array.from({ length: padCount }).map((_, i) => (
        <Box
          key={`pad-${i}`}
          data-card-slot
          data-position={slots.length + i}
          data-spent-placeholder="true"
        >
          <PlaceholderSpent />
        </Box>
      ))}
    </Box>
  );
}

// Placeholder cell for slots whose original face we don't know — shows a
// faint card backing with just the red X, no glyph or label. Same visual
// language as the spent-face PowderCard, lighter weight.
function PlaceholderSpent() {
  return (
    <Box
      sx={{
        position: "relative",
        aspectRatio: "3 / 4",
        background: palette.inkUp,
        border: `1.5px solid ${palette.paper}`,
        boxShadow: `2px 2px 0 ${palette.inkDeep}`,
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        data-spent-x
        aria-hidden="true"
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <line x1="14" y1="14" x2="86" y2="86" stroke={palette.blood} strokeWidth="3.5" strokeLinecap="round" opacity={0.7} />
        <line x1="86" y1="14" x2="14" y2="86" stroke={palette.blood} strokeWidth="3.5" strokeLinecap="round" opacity={0.7} />
      </Box>
    </Box>
  );
}
