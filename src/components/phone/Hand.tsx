import { Box } from "@mui/material";
import type { BulletCard } from "../../game/types";
import { PowderCard } from "./PowderCard";

// click → shot → quickdraw, so the player's hand reads in escalating-threat
// order regardless of the order the cards were dealt.
const ORDER: Record<BulletCard, number> = { clic: 0, bang: 1, bang_bang_bang: 2 };

interface HandProps {
  bullets: BulletCard[];
  /** Index of the currently chosen card in the displayed (sorted) hand. */
  selectedIndex?: number;
  /** Tapping a face-up card. (load, displayedIndex) */
  onPick?: (load: BulletCard, index: number) => void;
}

// 4×2 grid that always renders 8 slots — face-up cards from `bullets` followed
// by face-down spent slots filling the remainder. Players start with 8
// chambers (4 face-up, 4 face-down spent), and as cards are committed the
// face-up half shrinks and spent backs grow, but the shape of the grid never
// changes.
export function Hand({ bullets, selectedIndex, onPick }: HandProps) {
  const sorted = [...bullets].sort((a, b) => ORDER[a] - ORDER[b]);
  const spentCount = Math.max(0, 8 - sorted.length);
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
      {sorted.map((b, i) => (
        <Box key={`up-${i}`} data-card-slot data-position={i}>
          <PowderCard
            load={b}
            selected={selectedIndex === i}
            onClick={() => onPick?.(b, i)}
          />
        </Box>
      ))}
      {Array.from({ length: spentCount }).map((_, i) => (
        <Box key={`spent-${i}`} data-card-slot data-position={sorted.length + i}>
          <PowderCard load="bang" spent />
        </Box>
      ))}
    </Box>
  );
}
