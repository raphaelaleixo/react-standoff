import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { breath } from "../../theme/animations";
import { PageCanvas } from "./PageCanvas";
import { PhoneHeader } from "./PhoneHeader";
import { WoundPips, ShamePips } from "../marks/PlayerMarks";
import { PowerCard } from "../powers/PowerCard";
import { RoleCardBack, RoleCardFront } from "../phone/RoleCard";
import type { Player } from "../../game/types";
import { cashTotal } from "../../lib/score";

interface PhoneShellProps {
  me: Player;
  /** Room code for the header. */
  roomId: string;
  children: React.ReactNode;
  /** Open the power card face-up on mount and show the "Tap to start" hint
   *  below it. When the player taps to dismiss, the card flips + shrinks
   *  into its footer corner — one element animating, not a separate intro
   *  screen handing off to a footer widget. */
  introOpen?: boolean;
  /** Cop variant: open the role card face-up on mount with the same
   *  intro choreography as the power card. Mutually exclusive with
   *  `introOpen` at wave-1 game level (powers + cop can't coexist). */
  roleIntroOpen?: boolean;
  /** When true, the corner power card renders with the X-marks USED stamp
   *  even before the resolver flips the persistent `effects.used` flag —
   *  used to give immediate feedback as soon as the holder commits with
   *  the power armed (specialist/tough/insane). */
  armedThisRound?: boolean;
}

// Phone-shaped page canvas. PhoneHeader at top (skull + ROOM code + chosen
// flag tile), the phase body in the middle, and a footer strip showing
// cash, wounds, and shame markers — the stash bookkeeping that used to sit
// inline with the header.
export function PhoneShell({ me, roomId, children, introOpen, roleIntroOpen, armedThisRound }: PhoneShellProps) {
  const { t } = useTranslation();
  const cash = cashTotal(me);
  const myPower = me.effects[0];
  const bothCards = !!me.role && !!myPower;
  const [powerOpen, setPowerOpen] = useState(!!introOpen);
  // `introActive` flips false the first time the card closes. After that
  // taps just toggle, and the hint stays gone for the rest of the session.
  const [introActive, setIntroActive] = useState(!!introOpen);
  // Track whether we've already auto-opened for the intro, so a late prop
  // flip (e.g. game state arrives after mount, or the mock deals a power)
  // still triggers the reveal — but the user's subsequent close is final.
  const hasTriggeredIntroRef = useRef(!!introOpen);
  useEffect(() => {
    if (introOpen && !hasTriggeredIntroRef.current) {
      hasTriggeredIntroRef.current = true;
      setPowerOpen(true);
      setIntroActive(true);
    }
  }, [introOpen]);
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

  // ─── Role card (cop variant) — parallel lifecycle to the power card. ───
  // Same recipe: auto-open on first intro, tap to close + tuck, subsequent
  // taps just toggle. Wave 1 keeps role + power mutually exclusive at the
  // engine level, so both cards can safely share the bottom-right corner.
  const [roleOpen, setRoleOpen] = useState(!!roleIntroOpen);
  const [roleIntroActive, setRoleIntroActive] = useState(!!roleIntroOpen);
  const hasTriggeredRoleIntroRef = useRef(!!roleIntroOpen);
  useEffect(() => {
    if (roleIntroOpen && !hasTriggeredRoleIntroRef.current) {
      hasTriggeredRoleIntroRef.current = true;
      setRoleOpen(true);
      setRoleIntroActive(true);
    }
  }, [roleIntroOpen]);
  const closeRoleCard = () => {
    setRoleOpen(false);
    setRoleIntroActive(false);
  };
  const handleRoleCardTap = () => {
    if (roleIntroActive) {
      closeRoleCard();
      return;
    }
    setRoleOpen(o => !o);
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

        {/* Body. Scrolls vertically; padding-bottom matches the absolute-
            positioned footer's footprint so content can scroll above it. */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            paddingBottom: "6rem",
          }}
        >
          {children}
        </Box>

        {/* Footer — stash + wound/shame pips. Anchored to the bottom of
            the canvas so body content scrolls behind it; the opaque ink
            background hides anything passing underneath. */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
            padding: "0.7rem 0.95rem 0.8rem",
            borderTop: `1px solid ${palette.rule}`,
            background: palette.ink,
            zIndex: 3,
          }}
        >
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
            {me.shame.length > 0 && <ShamePips markers={me.shame} size={14} />}
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
                      transform: bothCards ? "scale(0.35)" : "scale(0.24)",
                    }),
              }}
            >
              {/* Inner flipper: rotates around its own centre to flip
                  between back (face-down) and front (face-up) faces. The
                  X-marks USED stamp is rendered on both faces via the
                  `used` prop so the corner card reads as consumed even
                  while it's still face-down in the footer slot. */}
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
                  <PowerCard
                    kind={myPower.kind}
                    variant="faceDown"
                    size="lg"
                    used={myPower.used || armedThisRound}
                  />
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
                    variant={myPower.used || armedThisRound ? "used" : "faceUp"}
                    size="lg"
                  />
                </Box>
              </Box>
            </Box>
          </>
        )}

        {/* Role card (cop variant). Same overlay recipe as the power
            card — backdrop, intro hint, flipper that tucks to the
            bottom-right corner on close. Wave 1 ensures role + power
            never both render, so they can safely share the corner. */}
        {me.role && (
          <>
            <Box
              onClick={closeRoleCard}
              sx={{
                position: "absolute",
                inset: 0,
                bgcolor: "rgba(0, 0, 0, 0.78)",
                zIndex: 5,
                opacity: roleOpen ? 1 : 0,
                pointerEvents: roleOpen ? "auto" : "none",
                transition: "opacity 0.32s ease-out",
              }}
            />
            {roleIntroActive && (
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
                {t("cop.reveal.tapHint")}
              </Box>
            )}
            <Box
              role="button"
              aria-label="Your role"
              onClick={handleRoleCardTap}
              sx={{
                position: "absolute",
                cursor: "pointer",
                zIndex: 6,
                transformOrigin: bothCards ? "bottom left" : "bottom right",
                perspective: "1200px",
                transition:
                  "bottom 0.5s cubic-bezier(0.34, 1.32, 0.64, 1), right 0.5s cubic-bezier(0.34, 1.32, 0.64, 1), transform 0.5s cubic-bezier(0.34, 1.32, 0.64, 1)",
                ...(roleOpen
                  ? {
                      bottom: "calc(50% - 200px)",
                      right: "calc(50% - 150px)",
                      transform: "scale(1)",
                    }
                  : bothCards
                    ? {
                        bottom: "0.8rem",
                        left: "0.95rem",
                        right: "auto",
                        transform: "scale(0.35)",
                      }
                    : {
                        bottom: "0.8rem",
                        right: "0.95rem",
                        transform: "scale(0.24)",
                      }),
              }}
            >
              <Box
                sx={{
                  width: 300,
                  height: 400,
                  position: "relative",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.55s cubic-bezier(0.34, 1.32, 0.64, 1)",
                  transform: roleOpen ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <RoleCardBack />
                </Box>
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <RoleCardFront role={me.role} colorOrAvatar={me.colorOrAvatar} />
                </Box>
              </Box>
            </Box>
          </>
        )}
      </PageCanvas>
    </Box>
  );
}
