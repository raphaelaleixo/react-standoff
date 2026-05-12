import { useState } from "react";
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { breath } from "../../theme/animations";
import { PageCanvas } from "./PageCanvas";
import { PhoneHeader } from "./PhoneHeader";
import { WoundPips, ShamePips } from "../marks/PlayerMarks";
import { PowerCard } from "../powers/PowerCard";
import type { Player } from "../../game/types";
import { cashTotal } from "../../lib/score";

interface PhoneShellProps {
  me: Player;
  /** Room code for the header. */
  roomId: string;
  children: React.ReactNode;
  /** Optional content floated just above the footer (e.g. the Insane reveal
   *  pill). Anchored to the footer's top edge so the body content underneath
   *  isn't pushed up. */
  aboveFooter?: React.ReactNode;
  /** Open the power card face-up on mount and show the "Tap to start" hint
   *  below it. When the player taps to dismiss, the card flips + shrinks
   *  into its footer corner — one element animating, not a separate intro
   *  screen handing off to a footer widget. */
  introOpen?: boolean;
}

// Phone-shaped page canvas. PhoneHeader at top (skull + ROOM code + chosen
// flag tile), the phase body in the middle, and a footer strip showing
// cash, wounds, and shame markers — the stash bookkeeping that used to sit
// inline with the header.
export function PhoneShell({ me, roomId, children, aboveFooter, introOpen }: PhoneShellProps) {
  const { t } = useTranslation();
  const cash = cashTotal(me);
  const myPower = me.effects[0];
  const [powerOpen, setPowerOpen] = useState(!!introOpen);
  // `introActive` flips false the first time the card closes. After that
  // taps just toggle, and the hint stays gone for the rest of the session.
  const [introActive, setIntroActive] = useState(!!introOpen);
  const closeCard = () => {
    setPowerOpen(false);
    setIntroActive(false);
  };
  const handleCardTap = () => {
    if (introActive) {
      closeCard();
      return;
    }
    setPowerOpen(o => !o);
  };
  return (
    <Box
      sx={{
        width: "100vw",
        height: "100dvh",
        padding: "8px",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <PageCanvas
        borderRadius={28}
        sx={{ width: "100%", maxWidth: "440px", height: "100%" }}
      >
        <PhoneHeader roomId={roomId} flagId={me.colorOrAvatar} />

        {/* Body. */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {children}
        </Box>

        {/* Footer — stash + wound/shame pips. Power widget floats above the
            footer's top edge so it doesn't push the footer down. */}
        <Box
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
            padding: "0.7rem 0.95rem 0.8rem",
            borderTop: `1px solid ${palette.rule}`,
            flexShrink: 0,
          }}
        >
          {aboveFooter && (
            <Box
              sx={{
                position: "absolute",
                bottom: "100%",
                left: "0.95rem",
                paddingBottom: "0.5rem",
                zIndex: 4,
              }}
            >
              {aboveFooter}
            </Box>
          )}
          <Box
            sx={{
              fontFamily: fonts.blackletter,
              fontWeight: 700,
              fontSize: "1.45rem",
              lineHeight: 1,
              color: cash > 0 ? palette.paper : palette.paperDim,
            }}
          >
            ${cash.toLocaleString()}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <WoundPips count={me.wounds} size={14} />
            {me.shame > 0 && <ShamePips count={me.shame} size={14} />}
          </Box>
        </Box>

        {myPower && (
          <>
            {/* Backdrop — fades in/out behind the open card. */}
            <Box
              onClick={closeCard}
              sx={{
                position: "absolute",
                inset: 0,
                bgcolor: "rgba(0, 0, 0, 0.78)",
                zIndex: 5,
                opacity: powerOpen ? 1 : 0,
                pointerEvents: powerOpen ? "auto" : "none",
                transition: "opacity 0.32s ease-out",
              }}
            />
            {/* Intro hint — only rendered while the card has never been
                closed. Positioned just below the centred card so it stays
                in view while the card itself sits at full size. */}
            {introActive && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: "calc(50% - 230px)",
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontFamily: fonts.body,
                  fontStyle: "italic",
                  fontSize: "1rem",
                  color: palette.paperDim,
                  animation: `${breath} 2.4s ease-in-out infinite`,
                  zIndex: 6,
                  pointerEvents: "none",
                }}
              >
                {t("powers.tapToStart")}
              </Box>
            )}
            {/* Outer wrapper handles position + scale. Closed state: tucked
                at the footer's bottom-right corner with scale(0.24). Open:
                centred in the canvas at full size. transformOrigin sits at
                bottom-right so the card grows out of the corner naturally. */}
            <Box
              role="button"
              aria-label="Your power"
              onClick={handleCardTap}
              sx={{
                position: "absolute",
                cursor: "pointer",
                zIndex: 6,
                transformOrigin: "bottom right",
                perspective: "1200px",
                transition:
                  "bottom 0.5s cubic-bezier(0.34, 1.32, 0.64, 1), right 0.5s cubic-bezier(0.34, 1.32, 0.64, 1), transform 0.5s cubic-bezier(0.34, 1.32, 0.64, 1)",
                ...(powerOpen
                  ? {
                      bottom: "calc(50% - 200px)",
                      right: "calc(50% - 150px)",
                      transform: "scale(1)",
                    }
                  : {
                      bottom: "0.8rem",
                      right: "0.95rem",
                      transform: "scale(0.24)",
                    }),
              }}
            >
              {/* Inner flipper: rotates around its own centre to flip
                  between back (face-down) and front (face-up) faces. */}
              <Box
                sx={{
                  width: 300,
                  height: 400,
                  position: "relative",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.55s cubic-bezier(0.34, 1.32, 0.64, 1)",
                  transform: powerOpen ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Back of the card — visible when closed. */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <PowerCard kind={myPower.kind} variant="faceDown" size="lg" />
                </Box>
                {/* Front of the card — visible after the flip. */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <PowerCard
                    kind={myPower.kind}
                    variant={myPower.used ? "used" : "faceUp"}
                    size="lg"
                  />
                </Box>
              </Box>
            </Box>
          </>
        )}
      </PageCanvas>
    </Box>
  );
}
