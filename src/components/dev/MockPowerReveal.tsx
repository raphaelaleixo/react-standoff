// DEV-only page to review the PowerRevealOverlay in isolation. Each button
// dispatches a single activation through the overlay so we can eyeball every
// power's reveal animation without dealing a real game. The "all in sequence"
// button queues every power back-to-back so the auto-advance pacing can be
// checked.
import { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { POWER_KINDS } from "../../game/powerKinds";
import { PowerRevealOverlay } from "../powers/PowerRevealOverlay";
import type { PowerActivation, Player } from "../../game/types";

const DEMO_PLAYER: Player = {
  id: "demo",
  displayName: "Demo",
  colorOrAvatar: "calico_jack",
  bullets: [],
  cash: [],
  wounds: 0,
  shame: [],
  status: "alive",
  effects: [],
};

export function MockPowerReveal() {
  const [acts, setActs] = useState<PowerActivation[]>([]);
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Power reveal overlay</Typography>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
        {POWER_KINDS.map(k => (
          <Button
            key={k}
            variant="outlined"
            onClick={() => setActs([{ playerId: "demo", kind: k }])}
            sx={{ textTransform: "none" }}
          >
            {k}
          </Button>
        ))}
        <Button
          variant="contained"
          onClick={() => setActs(POWER_KINDS.map(k => ({ playerId: "demo", kind: k })))}
        >
          all in sequence
        </Button>
        <Button variant="text" onClick={() => setActs([])}>
          clear
        </Button>
      </Stack>
      <PowerRevealOverlay activations={acts} players={[DEMO_PLAYER]} />
    </Box>
  );
}

export default MockPowerReveal;
