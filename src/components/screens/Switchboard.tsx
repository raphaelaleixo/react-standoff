import { Box } from "@mui/material";
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
// Renders as a bare row of lanterns — no frame, no background. Place
// it inside another container that supplies layout context.
export function Switchboard({ callsMade }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: "1.1rem",
        justifyContent: "center",
        alignItems: "flex-end",
      }}
    >
      {[1, 2, 3].map(i => (
        <Lantern key={i} lit={callsMade >= i} size={48} />
      ))}
    </Box>
  );
}
