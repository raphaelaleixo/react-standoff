import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
} from "@mui/material";
import { XMarksCheckbox } from "../components/XMarksCheckbox";
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
    <XMarksCheckbox
      checked={variantSuperPowers}
      onChange={onVariantToggle}
      label={t("powers.variantLabel")}
      hint={t("powers.variantHint")}
    />
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
                a.kind === "super_coward"
              // `insane` is intentionally excluded — when the grenade
              // detonates the audience already saw the card via the
              // synthetic reveal that fired when the holder armed it.
              // The detonation is told via the BOOM stamp + wound pips,
              // not by replaying the card.
              //
              // `tough` and `six_feet_under` are also excluded — they
              // play in tough_reveal (the hold inserted between
              // reveal_others and split) so the card lands after the
              // strike / kill animations.
            )
          }
          players={game.players}
        />
      )}
      {/* Late-reveal cards play during tough_reveal — the hold beat we
          insert between reveal_others and split so the card lands after
          the strike / kill animations. Phantom Pain fires when the holder
          rejoined standing; Davy Jones's Cut fires when a kill happened
          this round. */}
      {game.round.phase === "tough_reveal" && game.round.resolution && (
        <PowerRevealOverlay
          activations={
            (game.round.resolution.powerActivations ?? []).filter(
              a => a.kind === "tough" || a.kind === "six_feet_under"
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
