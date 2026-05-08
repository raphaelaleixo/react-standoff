import { Box } from "@mui/material";
import type { BulletCard } from "../../game/types";
import type { HandSlot } from "../../hooks/useHandSlots";
import { PowderCard } from "./PowderCard";

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

// 4×2 grid of PowderCards. Slot count and ordering are determined by the
// caller via `slots`; spent slots render with the original face dimmed +
// red X, face-up slots are tappable.
export function Hand({ slots, selectedSlotIndex, onPick }: HandProps) {
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
    </Box>
  );
}
