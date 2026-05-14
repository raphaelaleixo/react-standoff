import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Game } from "../../game/types";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface Props {
  game: Game;
}

const ENTER_MS = 500;
const HOLD_MS = 2400;
const EXIT_MS = 600;
const TOTAL_MS = ENTER_MS + HOLD_MS + EXIT_MS;

// One-shot full-screen overlay that fires the first time
// Game.cop.reinforcementsRoundOnTheWay transitions from undefined to a
// number *during this mount*. Pirate copy: "SAILS ON THE HORIZON" —
// the King's Navy is on its way.
//
// Lifecycle: enter (500ms wash+title) → hold (2.4s, siren hue cycle) →
// exit (600ms fade) → unmount.
//
// If we mount with reinforcements already on the way (e.g. a dev
// scenario pre-seeds a post-call state, or the page reloads mid-game),
// the shownRef starts true so the overlay does NOT replay — it's not
// "news" anymore. The ref also means the effect only re-runs on
// `round` changes; using useState here was the original bug, because
// flipping shown→true caused the effect's cleanup to clear the
// just-set timeout, leaving the overlay on screen forever.
export function ReinforcementsOverlay({ game }: Props) {
  const { t } = useTranslation();
  const round = game.cop?.reinforcementsRoundOnTheWay;
  const shownRef = useRef(round !== undefined);
  const [phase, setPhase] = useState<"idle" | "showing">("idle");

  useEffect(() => {
    if (round === undefined) return;
    if (shownRef.current) return;
    shownRef.current = true;
    setPhase("showing");
    const id = window.setTimeout(() => setPhase("idle"), TOTAL_MS);
    return () => clearTimeout(id);
  }, [round]);

  if (phase === "idle") return null;
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(circle, ${palette.blood} 0%, ${palette.ink} 80%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: palette.paper,
        zIndex: 50,
        opacity: 0,
        animation: `reinforcementsBg ${TOTAL_MS}ms ease both, siren-wash 800ms ease-in-out ${ENTER_MS}ms infinite alternate`,
        "@keyframes reinforcementsBg": {
          "0%": { opacity: 0 },
          [`${(ENTER_MS / TOTAL_MS) * 100}%`]: { opacity: 1 },
          [`${((ENTER_MS + HOLD_MS) / TOTAL_MS) * 100}%`]: { opacity: 1 },
          "100%": { opacity: 0 },
        },
        "@keyframes siren-wash": {
          from: { filter: "hue-rotate(0deg)" },
          to: { filter: "hue-rotate(20deg)" },
        },
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.blackletter,
          fontSize: "5rem",
          lineHeight: 1,
          textShadow: `4px 4px 0 ${palette.inkDeep}`,
          opacity: 0,
          transform: "scale(0.7)",
          animation: `reinforcementsTitle ${ENTER_MS}ms cubic-bezier(0.2, 0.9, 0.3, 1.2) forwards`,
          "@keyframes reinforcementsTitle": {
            from: { opacity: 0, transform: "scale(0.7)" },
            to: { opacity: 1, transform: "scale(1)" },
          },
        }}
      >
        {t("cop.reinforcements.overlayTitle")}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "1.6rem",
          marginTop: "1.2rem",
          color: palette.paperDim,
          opacity: 0,
          animation: `reinforcementsSub 400ms ease ${ENTER_MS + 200}ms forwards`,
          "@keyframes reinforcementsSub": {
            from: { opacity: 0, transform: "translateY(8px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        {t("cop.reinforcements.overlaySub")}
      </Box>
    </Box>
  );
}
