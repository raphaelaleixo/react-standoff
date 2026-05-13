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
  // Content key so the effect only re-fires when the activation set itself
  // changes. Depending on `activations` (the array ref) made every game
  // snapshot reset the overlay — even when the resolution was unchanged —
  // which is what made the Krakenscale card flash on every Firebase tick
  // through the reveal phases.
  const sig = activations.map(a => `${a.playerId}:${a.kind}`).join("|");
  const count = activations.length;

  useEffect(() => {
    if (count === 0) return;
    setIdx(0);
    setOpen(true);
    const stepMs = 1500;
    const i = setInterval(() => {
      setIdx(cur => {
        const next = cur + 1;
        if (next >= count) {
          setOpen(false);
          clearInterval(i);
        }
        return next;
      });
    }, stepMs);
    return () => clearInterval(i);
  }, [sig, count]);

  if (activations.length === 0) return null;
  // Clamp idx to the last activation once the sequence finishes so the Fade
  // wrapper keeps a child to animate while `open` flips to false — otherwise
  // the overlay returned null on the very tick that triggered exit, and the
  // card vanished instead of fading out.
  const cur = activations[Math.min(idx, activations.length - 1)];
  const owner = players.find(p => p.id === cur.playerId);

  return (
    <Fade in={open} timeout={{ enter: 220, exit: 420 }} unmountOnExit>
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
