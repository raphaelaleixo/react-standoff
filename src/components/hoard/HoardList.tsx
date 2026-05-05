import { Box } from "@mui/material";
import { SectionHeader } from "../shell/SectionHeader";
import { HoardItem } from "./HoardItem";
import type { Denomination } from "../../game/types";

interface HoardListEntry {
  value: Denomination;
}

interface HoardListProps {
  loot: HoardListEntry[];
}

export function HoardList({ loot }: HoardListProps) {
  return (
    <Box sx={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
      <SectionHeader title="On the Table" subtitle="the captain's hoard" />
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem", flex: 1, overflow: "hidden" }}>
        {loot.map((n, i) => (
          <HoardItem key={i} value={n.value} />
        ))}
      </Box>
    </Box>
  );
}
