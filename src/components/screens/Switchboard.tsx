import { Box } from "@mui/material";
import { SectionHeader } from "../shell/SectionHeader";
import { Lantern } from "./icons/Lantern";

interface Props {
  callsMade: 0 | 1 | 2 | 3;
}

// Persistent big-screen widget — 3 coastal lookout lanterns, ambient
// on every round the cop variant is active. Each lantern lights up
// when a bottle washes ashore (cop's nth call lands). The 3rd lantern
// lighting up = the King's Navy sails; the dramatic full-screen wash
// is handled by ReinforcementsOverlay.
//
// Title also flips when callsMade hits 3 so the new win-condition
// stakes are visible the moment the Sails-on-Horizon overlay clears.
// Because both state writes happen in the same store update, the title
// swap is hidden under the overlay during its 3.5s lifecycle.
export function Switchboard({ callsMade }: Props) {
  const navySails = callsMade >= 3;
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <SectionHeader
        title={navySails ? "The Navy Sails" : "On the Shore"}
        subtitle={navySails ? "every blink is counted" : "the lookouts' lanterns"}
      />
      <Box
        sx={{
          display: "flex",
          gap: "1.8rem",
          justifyContent: "center",
          alignItems: "flex-end",
          marginTop: "0.6rem",
        }}
      >
        {[1, 2, 3].map(i => (
          <Lantern key={i} lit={callsMade >= i} size={48} />
        ))}
      </Box>
    </Box>
  );
}
