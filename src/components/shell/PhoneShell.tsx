import { useState } from "react";
import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
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
}

// Phone-shaped page canvas. PhoneHeader at top (skull + ROOM code + chosen
// flag tile), the phase body in the middle, and a footer strip showing
// cash, wounds, and shame markers — the stash bookkeeping that used to sit
// inline with the header.
export function PhoneShell({ me, roomId, children, aboveFooter }: PhoneShellProps) {
  const cash = cashTotal(me);
  const myPower = me.effects[0];
  const [powerOpen, setPowerOpen] = useState(false);
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
              onClick={() => setPowerOpen(false)}
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
            {/* Outer wrapper handles position + scale. Closed state: tucked
                at the footer's bottom-right corner with scale(0.24). Open:
                centred in the canvas at full size. transformOrigin sits at
                bottom-right so the card grows out of the corner naturally. */}
            <Box
              role="button"
              aria-label="Your power"
              onClick={() => setPowerOpen(open => !open)}
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
