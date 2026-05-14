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
// Lifecycle: enter (fade-in + title scale-up + delayed subtitle) →
// hold (siren hue cycle) → exit (fade-out) → unmount.
//
// If we mount with reinforcements already on the way (e.g. a dev
// scenario pre-seeds a post-call state, or the page reloads mid-game),
// firedRef starts true so the overlay does NOT replay — it's not
// "news" anymore.
export function ReinforcementsOverlay({ game }: Props) {
  const { t } = useTranslation();
  const round = game.cop?.reinforcementsRoundOnTheWay;
  const firedRef = useRef(round !== undefined);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (round === undefined) return;
    if (firedRef.current) return;
    firedRef.current = true;
    setActive(true);
    const id = window.setTimeout(() => setActive(false), TOTAL_MS);
    return () => clearTimeout(id);
  }, [round]);

  if (!active) return null;
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
        animation: `reinforcementsBg ${TOTAL_MS}ms ease forwards, siren-wash 800ms ease-in-out ${ENTER_MS}ms infinite alternate`,
        "@keyframes reinforcementsBg": {
          "0%": { opacity: 0 },
          "15%": { opacity: 1 },
          "83%": { opacity: 1 },
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
