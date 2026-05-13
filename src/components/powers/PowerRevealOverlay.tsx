import { useEffect, useState } from "react";
import { Box, Fade } from "@mui/material";
import { PowerCard } from "./PowerCard";
import { FlagFor } from "../flags";
import { jollyRogerForColor } from "../flags/jollyRogerForColor";
import { flagColor, palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
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
    // How long each card sits on screen before the next one steps in (or
    // the overlay fades out). Long enough for the audience to read the
    // card name + see who owns it.
    const stepMs = 3800;
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
  const ownerColor = owner?.colorOrAvatar ?? "generic";

  return (
    <Fade in={open} timeout={{ enter: 380, exit: 620 }} unmountOnExit>
      <Box
        sx={{
          position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.65)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: "1rem",
          zIndex: 1300,
        }}
      >
        {/* Owner medallion: flag-aspect chip in the player's colour with
            their jolly roger, plus the display name. Same visual language
            as the CrewRow flag chip and the reckoning winner card. */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <Box
            sx={{
              width: 84,
              height: 58,
              border: `2px solid ${palette.paper}`,
              background: flagColor(ownerColor),
              color: palette.paper,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `3px 3px 0 ${palette.inkDeep}`,
            }}
          >
            <FlagFor id={jollyRogerForColor(ownerColor)} size={42} />
          </Box>
          <Box
            sx={{
              fontFamily: fonts.blackletter,
              fontSize: "1.8rem",
              lineHeight: 1,
              color: palette.paper,
              letterSpacing: "0.02em",
            }}
          >
            {owner?.displayName ?? cur.playerId}
          </Box>
        </Box>
        <PowerCard kind={cur.kind} variant="revealing" size="lg" />
      </Box>
    </Fade>
  );
}
