import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
} from "@mui/material";
import { palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import { slashDraw, popIn } from "../theme/animations";
import { get, onValue, ref, set, update } from "firebase/database";
import { buildJoinUrl, startGame, useRoomState } from "react-gameroom";
import type { RoomState } from "react-gameroom";
import type { GameVariants, Player } from "../game/types";
import { initGame } from "../game/setup";
import { GameBoard } from "../components/GameBoard";
import { PowerRevealOverlay } from "../components/powers/PowerRevealOverlay";
import { MusterScreen } from "../components/screens/MusterScreen";
import { ReckoningScreen } from "../components/screens/ReckoningScreen";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { useGameState } from "../hooks/useGameState";
import { createFirebaseGameStore } from "../hooks/gameStore";
import { useServerTime } from "../hooks/useServerTime";
import { useBigScreenZoom } from "../hooks/useBigScreenZoom";
import { database } from "../firebase";
import { PageCanvas } from "../components/shell/PageCanvas";
import { Masthead } from "../components/shell/Masthead";
import { Foot } from "../components/shell/Foot";
import { FullscreenButton } from "../components/shell/FullscreenButton";
import { toRoman } from "../lib/navyHours";

const EMPTY_ROOM: RoomState<Player> = {
  roomId: "",
  status: "lobby",
  players: [],
  config: { minPlayers: 4, maxPlayers: 6, requireFull: false },
};

export default function RoomPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { roomState, loading, error } = useFirebaseRoom(id);
  const store = useMemo(() => (id ? createFirebaseGameStore(id) : null), [id]);
  const { serverNow } = useServerTime();
  const { game } = useGameState(store, serverNow);
  const derived = useRoomState(roomState ?? EMPTY_ROOM);
  const [variantSuperPowers, setVariantSuperPowers] = useState(false);

  useEffect(() => {
    if (!id) return;
    const r = ref(database, `rooms/${id}/lobbyVariants/superPowers`);
    return onValue(r, snap => setVariantSuperPowers(!!snap.val()));
  }, [id]);

  if (loading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !roomState) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error ?? t("room.notFound")}</Alert>
      </Container>
    );
  }

  if (roomState.status === "started") {
    return <GameView game={game} roomId={id ?? ""} />;
  }

  const joinUrl = id ? buildJoinUrl(id) : "";

  const onStart = async () => {
    if (!id || !roomState) return;
    if (!derived.canStart) return;
    const startedRoom = startGame(roomState);
    const variantsSnap = await get(ref(database, `rooms/${id}/lobbyVariants`));
    const variants: GameVariants =
      (variantsSnap.val() as GameVariants | null) ?? { superPowers: false };
    const players = startedRoom.players
      .filter(p => p.status !== "empty" && p.data)
      .map(p => p.data as Player);
    const initialGame = initGame(players, id, Date.now(), variants);
    await update(ref(database), {
      [`rooms/${id}/state`]: startedRoom,
      [`rooms/${id}/game`]: initialGame,
    });
  };

  const onVariantToggle = async (next: boolean) => {
    if (!id) return;
    await set(ref(database, `rooms/${id}/lobbyVariants`), { superPowers: next });
  };

  const variantSlot = (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <Box
        role="checkbox"
        aria-checked={variantSuperPowers}
        aria-label={t("powers.variantLabel")}
        tabIndex={0}
        onClick={() => onVariantToggle(!variantSuperPowers)}
        onKeyDown={e => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onVariantToggle(!variantSuperPowers);
          }
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "0.7rem",
          cursor: "pointer",
          userSelect: "none",
          "&:focus-visible": {
            outline: `2px solid ${palette.paper}`,
            outlineOffset: "4px",
          },
        }}
      >
        {/* X-marks-the-spot chip: paper-stroked ink box. When the variant is
            on, two blood-red slashes get stroked in (left-leaning first,
            then right-leaning) with a tiny pop on the chip — like a stamp
            being smacked down. Strokes overshoot the chip edges and use
            slight angle variation so they read as hand-drawn, not CAD. */}
        <Box
          sx={{
            position: "relative",
            width: 32,
            height: 32,
            border: `1.5px solid ${palette.paper}`,
            background: palette.inkUp,
            boxShadow: `2px 2px 0 ${palette.inkDeep}`,
            flexShrink: 0,
            // Let the slashes peek past the chip's edges for a hand-stamped
            // feel — the SVG viewBox is over-extended for this exact reason.
            overflow: "visible",
            animation: variantSuperPowers
              ? `${popIn} 280ms cubic-bezier(.2,.7,.2,1.4) both`
              : undefined,
          }}
        >
          {variantSuperPowers && (
            <Box
              component="svg"
              viewBox="-10 -10 120 120"
              aria-hidden="true"
              sx={{
                position: "absolute",
                inset: "-10px",
                width: "calc(100% + 20px)",
                height: "calc(100% + 20px)",
                overflow: "visible",
                // Each slash path uses pathLength=100 so dasharray=100 is
                // the whole thing, and dashoffset 100→0 paints it in.
                "& path": {
                  fill: "none",
                  stroke: palette.blood,
                  strokeWidth: 14,
                  strokeLinecap: "round",
                  strokeDasharray: 100,
                },
              }}
            >
              <path
                d="M 8 14 L 92 88"
                pathLength={100}
                style={{
                  animation: `${slashDraw} 200ms cubic-bezier(0.7, 0, 0.3, 1) both`,
                }}
              />
              <path
                d="M 94 10 L 6 90"
                pathLength={100}
                style={{
                  animation: `${slashDraw} 220ms cubic-bezier(0.7, 0, 0.3, 1) 180ms both`,
                }}
              />
            </Box>
          )}
        </Box>
        <Box
          sx={{
            fontFamily: fonts.displayCaps,
            fontFeatureSettings: '"smcp"',
            fontSize: "1.1rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: palette.paper,
          }}
        >
          {t("powers.variantLabel")}
        </Box>
      </Box>
      <Box
        sx={{
          marginTop: "0.4rem",
          marginLeft: "calc(32px + 0.7rem)",
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "0.9rem",
          color: palette.paperDim,
        }}
      >
        {t("powers.variantHint")}
      </Box>
    </Box>
  );

  return (
    <MusterScreen
      roomState={roomState}
      joinUrl={joinUrl}
      canStart={derived.canStart}
      onStart={onStart}
      variantSlot={variantSlot}
    />
  );
}

function GameView({ game, roomId }: { game: ReturnType<typeof useGameState>["game"]; roomId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useBigScreenZoom();
  if (!game) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (game.phase === "ended") {
    // Per-player elimination round isn't tracked in game state yet — pass an
    // empty map; EndGameRow falls back to "— forfeit —" for dead players
    // without an attached round number.
    return (
      <ReckoningScreen
        game={game}
        roomId={roomId}
        eliminatedByRound={{}}
        onPlayAgain={() => navigate("/")}
        onReturn={() => navigate("/")}
      />
    );
  }

  const round = game.round;
  return (
    <Box sx={{ width: "100vw", height: "100vh" }}>
      <PageCanvas aspectRatio="16 / 9" sx={{ width: "100%", height: "100%" }}>
        <Masthead
          left={<>{t("shell.room")} <em>{roomId}</em></>}
          right={<FullscreenButton />}
        />
        <GameBoard game={game} />
        <Foot
          cry={<>{t("shell.round")} {t("shell.ofTotal", { n: toRoman(round.number) })}</>}
        />
      </PageCanvas>
      {game.round.resolution && (
        <PowerRevealOverlay
          activations={
            (game.round.resolution.powerActivations ?? []).filter(
              a =>
                a.kind === "unbreakable" ||
                a.kind === "dragon_skin" ||
                a.kind === "specialist" ||
                a.kind === "insane"
            )
          }
          players={game.players}
        />
      )}
      {/* Phantom Pain card plays during tough_reveal — the hold beat we
          insert between reveal_others and split so the card finishes
          before the loot animation begins. */}
      {game.round.phase === "tough_reveal" && game.round.resolution && (
        <PowerRevealOverlay
          activations={
            (game.round.resolution.powerActivations ?? []).filter(
              a => a.kind === "tough"
            )
          }
          players={game.players}
        />
      )}
      {/* Pocket Inferno reveal: when the holder taps REVEAL GRENADE we get
          an activations slot but no resolver activation yet — the resolver
          only pushes one if the grenade actually detonates. Synthesise an
          activation here so the big screen flashes the card the moment the
          threat is announced. Hidden once the resolver fires the explosion
          so the resolution-based overlay above can play the detonation. */}
      {game.round.activations.insane && !game.round.resolution?.roundTerminated && (
        <PowerRevealOverlay
          activations={[
            {
              playerId: game.round.activations.insane.playerId,
              kind: "insane" as const,
            },
          ]}
          players={game.players}
        />
      )}
    </Box>
  );
}
