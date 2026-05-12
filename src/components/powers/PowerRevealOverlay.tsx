import { useEffect, useState } from "react";
import { Box, Fade, Typography } from "@mui/material";
import { PowerCard } from "./PowerCard";
import type { PowerActivation, Player } from "../../game/types";

interface Props {
  activations: PowerActivation[];
  players: Player[];
}

export function PowerRevealOverlay({ activations, players }: Props) {
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(activations.length > 0);

  useEffect(() => {
    if (activations.length === 0) return;
    setIdx(0);
    setOpen(true);
    const stepMs = 1500;
    const i = setInterval(() => {
      setIdx(cur => {
        const next = cur + 1;
        if (next >= activations.length) {
          setOpen(false);
          clearInterval(i);
        }
        return next;
      });
    }, stepMs);
    return () => clearInterval(i);
  }, [activations]);

  if (activations.length === 0 || idx >= activations.length) return null;
  const cur = activations[idx];
  const owner = players.find(p => p.id === cur.playerId);

  return (
    <Fade in={open}>
      <Box
        sx={{
          position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.65)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 1300,
        }}
      >
        <Typography variant="overline" sx={{ color: "common.white" }}>
          {owner?.displayName ?? cur.playerId}
        </Typography>
        <PowerCard kind={cur.kind} variant="revealing" size="lg" />
      </Box>
    </Fade>
  );
}
