import { useEffect, useRef, useState } from "react";
import { Box, Fade } from "@mui/material";
import type { Game } from "../game/types";
import { HoardList } from "./hoard/HoardList";
import { TargetingMap } from "./standoff/TargetingMap";
import { StandoffStamp } from "./standoff/StandoffStamp";
import { WithdrawStamp } from "./standoff/WithdrawStamp";
import { RevealStamp } from "./standoff/RevealStamp";
import { CrewRoster } from "./crew/CrewRoster";
import { useStandoffCount } from "../hooks/useStandoffCount";
import { useSecondsRemaining } from "../hooks/useSecondsRemaining";
import { STANDOFF_DURATION_MS, WITHDRAW_DURATION_MS } from "../lib/phaseDurations";
import { durations } from "../theme/animations";

interface GameBoardProps {
  game: Game;
  freshlyStruck?: Set<string>;
}

const REVEAL_LABEL: Partial<Record<Game["round"]["phase"], string>> = {
  reveal_bbb: "Quickdraw!",
  reveal_others: "Shots",
};

// Split-phase choreography. The state machine doesn't apply awards until the
// split → next-round transition fires; here we run a purely-visual transform
// so the screen reads as a sequence: notes leave the table first, then a beat
// later the standing players' cash ticks up. The next round's draw lands when
// the real transition fires (HoardList's dropIn handles those new IDs).
const SPLIT_AWARDS_REVEAL_DELAY_MS = 250;

function useSplitDisplayGame(game: Game): Game {
  const inSplit = game.round.phase === "split" && !!game.round.resolution;
  const [awardsRevealed, setAwardsRevealed] = useState(false);

  useEffect(() => {
    if (!inSplit) {
      setAwardsRevealed(false);
      return;
    }
    const t = setTimeout(() => setAwardsRevealed(true), SPLIT_AWARDS_REVEAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [inSplit, game.round.phaseStartedAt]);

  if (!inSplit) return game;
  const resolution = game.round.resolution!;
  const players = awardsRevealed
    ? game.players.map(p => {
        const won = resolution.awards[p.id];
        if (!won || won.length === 0) return p;
        return { ...p, cash: [...p.cash, ...won] };
      })
    : game.players;
  return {
    ...game,
    players,
    round: { ...game.round, loot: resolution.carryover },
  };
}

export function GameBoard({ game: rawGame, freshlyStruck }: GameBoardProps) {
  const game = useSplitDisplayGame(rawGame);
  const inStandoff = game.round.phase === "standoff";
  const count = useStandoffCount({
    active: inStandoff,
    startedAt: game.round.phaseStartedAt,
    durationMs: STANDOFF_DURATION_MS,
  });
  // Latch the last visible count so the StandoffStamp keeps reading the
  // same digit while it fades out. The standoff phase persists for an
  // extra silent beat (STANDOFF_HOLD_MS) after the count reaches 0; we
  // hide the stamp at that point so the "0" digit isn't held on screen.
  const lastCountRef = useRef(0);
  if (count !== null && count > 0) lastCountRef.current = count;
  const showStamp = inStandoff && count !== null && count > 0;

  const inWithdraw = game.round.phase === "withdraw";
  const withdrawSeconds = useSecondsRemaining({
    active: inWithdraw,
    startedAt: game.round.phaseStartedAt,
    durationMs: WITHDRAW_DURATION_MS,
  });
  const lastWithdrawRef = useRef(0);
  if (withdrawSeconds !== null) lastWithdrawRef.current = withdrawSeconds;
  const showWithdraw = inWithdraw && withdrawSeconds !== null;

  const revealLabel = REVEAL_LABEL[game.round.phase];
  const lastRevealLabelRef = useRef("");
  if (revealLabel) lastRevealLabelRef.current = revealLabel;
  const showReveal = !!revealLabel;

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        position: "relative",
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "25% 50% 25%",
          minHeight: 0,
        }}
      >
        <Box sx={{ padding: "0.6rem 0.85rem", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <HoardList loot={game.round.loot} />
        </Box>
        <Box
          sx={{
            padding: "0.6rem 0.85rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 0,
          }}
        >
          <TargetingMap
            game={game}
            overlay={
              <>
                <Fade in={showStamp} timeout={{ enter: 0, exit: durations.base }} unmountOnExit>
                  <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    <StandoffStamp count={lastCountRef.current} />
                  </Box>
                </Fade>
                <Fade in={showWithdraw} timeout={{ enter: 0, exit: durations.base }} unmountOnExit>
                  <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    <WithdrawStamp count={lastWithdrawRef.current} />
                  </Box>
                </Fade>
                <Fade in={showReveal} timeout={{ enter: 0, exit: durations.base }} unmountOnExit>
                  <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    <RevealStamp label={lastRevealLabelRef.current} />
                  </Box>
                </Fade>
              </>
            }
          />
        </Box>
        <Box sx={{ padding: "0.6rem 0.85rem", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <CrewRoster game={game} freshlyStruck={freshlyStruck} />
        </Box>
      </Box>
    </Box>
  );
}
