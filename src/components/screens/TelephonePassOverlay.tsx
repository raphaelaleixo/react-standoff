import { Box } from "@mui/material";
import type { Game } from "../../game/types";
import { Lantern } from "./icons/Lantern";

interface Props {
  game: Game;
  // Optional anchor for positioning the token next to a specific player's
  // character card. If not supplied, falls back to centered.
  anchorFor?: (playerId: string) => { x: number; y: number } | null;
}

// Big-screen overlay for the telephone pass beat. The "bottle" being
// passed is rendered as a lantern — unlit while in transit, lit once
// the pass finalises with the cop's note inside. Reads the per-round
// telephone state and positions the lantern either:
//   - at the current holder's character card while the pass is in
//     progress (lantern unlit, gentle pulse), or
//   - at table center after the pass finalises (lit if used, unlit if
//     the bottle came back empty).
export function TelephonePassOverlay({ game, anchorFor }: Props) {
  if (game.round.phase !== "telephone") return null;
  const tel = game.round.telephone;
  if (!tel) return null; // Awaiting init effect.

  const currentHolderId = tel.currentHolderId;
  const finalised = !currentHolderId;
  const lit = finalised && tel.used;
  const anchor = currentHolderId && anchorFor ? anchorFor(currentHolderId) : null;

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 30,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          left: anchor ? `${anchor.x}px` : "50%",
          top: anchor ? `${anchor.y}px` : "50%",
          transform: "translate(-50%, -50%)",
          transition: "left 360ms ease, top 360ms ease",
          animation: !finalised
            ? "bottlePulse 1400ms ease-in-out infinite"
            : undefined,
          "@keyframes bottlePulse": {
            "0%, 100%": { transform: "translate(-50%, -50%) scale(1)" },
            "50%": { transform: "translate(-50%, -50%) scale(1.06)" },
          },
        }}
      >
        <Lantern lit={lit} size={120} />
      </Box>
    </Box>
  );
}
