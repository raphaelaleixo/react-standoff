import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { Lantern } from "./icons/Lantern";

interface Props {
  callsMade: 0 | 1 | 2 | 3;
}

// Persistent big-screen widget — 3 coastal lookout lanterns, ambient
// on every round the cop variant is active. Each lantern lights up
// when a bottle washes ashore (cop's nth call lands). The 3rd lantern
// lighting up = the King's Navy sails; the dramatic full-screen wash
// is handled by ReinforcementsOverlay.
export function Switchboard({ callsMade }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: "0.4rem",
        padding: "0.5rem 0.7rem",
        background: palette.inkUp,
        border: `2px solid ${palette.paper}`,
        boxShadow: `3px 3px 0 ${palette.inkDeep}`,
        alignItems: "flex-end",
      }}
    >
      {[1, 2, 3].map(i => (
        <Lantern key={i} lit={callsMade >= i} size={56} />
      ))}
    </Box>
  );
}
