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
export function Switchboard({ callsMade }: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <SectionHeader title="On the Shore" subtitle="the lookouts' lanterns" />
      <Box
        sx={{
          display: "flex",
          gap: "1.1rem",
          justifyContent: "center",
          alignItems: "flex-end",
          marginTop: "0.4rem",
        }}
      >
        {[1, 2, 3].map(i => (
          <Lantern key={i} lit={callsMade >= i} size={48} />
        ))}
      </Box>
    </Box>
  );
}
