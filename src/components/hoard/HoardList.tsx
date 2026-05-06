import { Box, Fade } from "@mui/material";
import { TransitionGroup } from "react-transition-group";
import { SectionHeader } from "../shell/SectionHeader";
import { HoardItem } from "./HoardItem";
import type { Banknote } from "../../game/types";
import { durations } from "../../theme/animations";

interface HoardListProps {
  loot: Banknote[];
}

export function HoardList({ loot }: HoardListProps) {
  return (
    <Box sx={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
      <SectionHeader title="On the Table" subtitle="the captain's hoard" />
      <Box
        component={TransitionGroup}
        sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem", flex: 1, overflow: "hidden" }}
      >
        {loot.map(n => (
          <Fade key={n.id} timeout={durations.base}>
            <Box>
              <HoardItem value={n.value} />
            </Box>
          </Fade>
        ))}
      </Box>
    </Box>
  );
}
