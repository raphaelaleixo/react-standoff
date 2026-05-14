import { useEffect, useMemo, useState } from "react";
import { PUBLIC_POWER_KINDS } from "../game/powerKinds";
import type { PowerActivation } from "../game/types";
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
import { RolesDealtOverlay } from "../components/screens/RolesDealtOverlay";
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
  const { game, rolesDealtSeen } = useGameState(store, serverNow);
  const derived = useRoomState(roomState ?? EMPTY_ROOM);
  const [variantSuperPowers, setVariantSuperPowers] = useState(false);
  const [variantCop, setVariantCop] = useState(false);

  useEffect(() => {
    if (!id) return;
    const r = ref(database, `rooms/${id}/lobbyVariants`);
    return onValue(r, snap => {
      const v = (snap.val() as Partial<GameVariants> | null) ?? null;
      setVariantSuperPowers(!!v?.superPowers);
      setVariantCop(!!v?.cop);
    });
  }, [id]);

  // Auto-disable cop if the crew falls out of the 5-6 range mid-lobby.
  const claimedCount = (roomState?.players ?? []).filter(
    p => p.status !== "empty",
  ).length;
  const canEnableCop = claimedCount >= 5 && claimedCount <= 6;
  useEffect(() => {
    if (!id) return;
    if (variantCop && !canEnableCop) {
      void set(ref(database, `rooms/${id}/lobbyVariants`), {
        superPowers: variantSuperPowers,
        cop: false,
      });
    }
  }, [id, variantCop, canEnableCop, variantSuperPowers]);

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
    return <GameView game={game} roomId={id ?? ""} rolesDealtSeen={rolesDealtSeen} />;
  }

  const joinUrl = id ? buildJoinUrl(id) : "";

  const onStart = async () => {
    if (!id || !roomState) return;
    if (!derived.canStart) return;
    const startedRoom = startGame(roomState);
    const variantsSnap = await get(ref(database, `rooms/${id}/lobbyVariants`));
    const raw = (variantsSnap.val() as Partial<GameVariants> | null) ?? null;
    const variants: GameVariants = {
      superPowers: !!raw?.superPowers,
      cop: !!raw?.cop,
    };
    const players = startedRoom.players
      .filter(p => p.status !== "empty" && p.data)
      .map(p => p.data as Player);
    const initialGame = initGame(players, id, Date.now(), variants);
    await update(ref(database), {
      [`rooms/${id}/state`]: startedRoom,
      [`rooms/${id}/game`]: initialGame,
    });
  };

  const onSuperPowersToggle = async (next: boolean) => {
    if (!id) return;
    await set(ref(database, `rooms/${id}/lobbyVariants`), {
      superPowers: next,
      cop: variantCop,
    });
  };

  const onCopToggle = async (next: boolean) => {
    if (!id) return;
    if (next && !canEnableCop) return;
    await set(ref(database, `rooms/${id}/lobbyVariants`), {
      superPowers: variantSuperPowers,
      cop: next,
    });
  };

  const copHint = !canEnableCop
    ? t("cop.lobby.requiresFiveSix")
    : t("cop.lobby.toggleSub");

  const variantSlot = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      <XMarksCheckbox
        checked={variantSuperPowers}
        onChange={onSuperPowersToggle}
        label={t("powers.variantLabel")}
        hint={t("powers.variantHint")}
      />
      <XMarksCheckbox
        checked={variantCop}
        onChange={onCopToggle}
        disabled={!canEnableCop}
        label={t("cop.lobby.toggleLabel")}
        hint={copHint}
      />
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

function GameView({
  game,
  roomId,
  rolesDealtSeen,
}: {
  game: ReturnType<typeof useGameState>["game"];
  roomId: string;
  rolesDealtSeen: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useBigScreenZoom();
  const [rolesDealtVisible, setRolesDealtVisible] = useState(false);
  useEffect(() => {
    if (rolesDealtSeen) setRolesDealtVisible(true);
  }, [rolesDealtSeen]);
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
      <RoundStartPublicReveals game={game} />
      {game.round.resolution && (
        <PowerRevealOverlay
          activations={
            (game.round.resolution.powerActivations ?? []).filter(
              a =>
                a.kind === "unbreakable" ||
                a.kind === "dragon_skin" ||
                a.kind === "specialist"
              // `insane` is intentionally excluded — when the grenade
              // detonates the audience already saw the card via the
              // synthetic reveal that fired when the holder armed it.
              // The detonation is told via the BOOM stamp + wound pips,
              // not by replaying the card.
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
      <RolesDealtOverlay
        visible={rolesDealtVisible}
        onDone={() => setRolesDealtVisible(false)}
        acknowledgedCount={game.players.length}
        totalCount={game.players.length}
      />
    </Box>
  );
}

// Round-start reveal for revealed-on-deal powers (Dead Eye / Bloodhound).
// Captured once at round 1 commit entry and held stable so the overlay
// plays through even after the state machine has moved on to standoff.
function RoundStartPublicReveals({
  game,
}: {
  game: NonNullable<ReturnType<typeof useGameState>["game"]>;
}) {
  const [reveals, setReveals] = useState<PowerActivation[]>([]);
  useEffect(() => {
    if (reveals.length > 0) return;
    if (game.round.number !== 1 || game.round.phase !== "commit") return;
    const out: PowerActivation[] = [];
    for (const p of game.players) {
      for (const e of p.effects) {
        if (PUBLIC_POWER_KINDS.has(e.kind) && e.revealed) {
          out.push({ playerId: p.id, kind: e.kind });
        }
      }
    }
    if (out.length > 0) setReveals(out);
  }, [game, reveals.length]);
  return <PowerRevealOverlay activations={reveals} players={game.players} />;
}
