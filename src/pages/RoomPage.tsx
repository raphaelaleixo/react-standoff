import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { ref, update } from "firebase/database";
import { buildJoinUrl, RoomQRCode, startGame, useRoomState } from "react-gameroom";
import type { RoomState } from "react-gameroom";
import type { Player } from "../game/types";
import { initGame } from "../game/setup";
import { GameBoard } from "../components/GameBoard";
import { RevealOverlay } from "../components/RevealOverlay";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { useGameState } from "../hooks/useGameState";
import { useServerTime } from "../hooks/useServerTime";
import { database } from "../firebase";

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
  const { game } = useGameState(id);
  const derived = useRoomState(roomState ?? EMPTY_ROOM);

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
    return <GameView roomState={roomState} game={game} />;
  }

  const claimed = roomState.players.filter(p => p.status !== "empty");
  const joinUrl = id ? buildJoinUrl(id) : "";

  const onStart = async () => {
    if (!id || !roomState) return;
    if (!derived.canStart) return;
    const startedRoom = startGame(roomState);
    const players = startedRoom.players
      .filter(p => p.status !== "empty" && p.data)
      .map(p => p.data as Player);
    const initialGame = initGame(players, id, Date.now());
    await update(ref(database), {
      [`rooms/${id}/state`]: startedRoom,
      [`rooms/${id}/game`]: initialGame,
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="overline" color="text.secondary">{t("room.code")}</Typography>
          <Typography variant="h2" component="div" sx={{ letterSpacing: 8, fontFamily: "monospace" }}>
            {roomState.roomId}
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", md: "row" }} spacing={4} sx={{ alignItems: { md: "flex-start" } }}>
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              {t("room.scanToJoin")}
            </Typography>
            <RoomQRCode roomId={roomState.roomId} url={joinUrl} size={220} />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" gutterBottom>{t("room.playersHeading")}</Typography>
            <Stack spacing={1.5}>
              {claimed.map(p => (
                <Stack key={p.id} direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Avatar sx={{ bgcolor: p.data?.colorOrAvatar ?? "#bdbdbd", width: 40, height: 40 }}>
                    {(p.name ?? "?").charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="h6">{p.name}</Typography>
                </Stack>
              ))}
              {claimed.length === 0 && (
                <Typography color="text.secondary">{t("room.waitingForPlayers")}</Typography>
              )}
            </Stack>
          </Box>
        </Stack>

        <Box>
          {derived.canStart ? (
            <Button variant="contained" size="large" onClick={onStart}>
              {t("room.startGame")}
            </Button>
          ) : (
            <Typography color="text.secondary">{t("room.waitingForPlayers")}</Typography>
          )}
        </Box>
      </Stack>
    </Container>
  );
}

// ─────────────────── In-game skeleton view ───────────────────
// Throwaway scaffolding for step 4 verification — step 5 will replace with the
// real game UI (player cards in a hex layout, targeting lines, animations).

function GameView({ roomState, game }: { roomState: RoomState<Player>; game: ReturnType<typeof useGameState>["game"] }) {
  if (!game) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (game.phase === "ended") {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom>Game over</Typography>
        <Stack spacing={1}>
          {[...game.players]
            .sort((a, b) => totalScore(b) - totalScore(a))
            .map(p => (
              <PlayerCard key={p.id} player={p} score={totalScore(p)} />
            ))}
        </Stack>
      </Container>
    );
  }

  const { round } = game;
  const slotName = (id: string) => roomState.players.find(s => String(s.id) === id)?.name ?? id;
  const showPrevSummary = round.phase === "commit" && !!game.previousRoundSummary;
  const showShotLog = round.resolution && round.phase === "split";

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <Stack direction="row" spacing={3} sx={{ alignItems: "baseline" }}>
          <Typography variant="overline" color="text.secondary">Round {round.number} / 8</Typography>
          <Typography variant="h5" sx={{ textTransform: "uppercase", letterSpacing: 2 }}>{round.phase}</Typography>
        </Stack>

        <Countdown phase={round.phase} startedAt={round.phaseStartedAt} />

        <GameBoard game={game} />

        {showPrevSummary && game.previousRoundSummary && (
          <PrevRoundSummary summary={game.previousRoundSummary} slotName={slotName} />
        )}

        {showShotLog && round.resolution && (
          <ShotLog resolution={round.resolution} slotName={slotName} />
        )}
      </Stack>

      <RevealOverlay game={game} slotName={slotName} />
    </Container>
  );
}

function PrevRoundSummary({ summary, slotName }: {
  summary: { round: number; resolution: import("../game/types").RoundResolution };
  slotName: (id: string) => string;
}) {
  const { round, resolution } = summary;
  return (
    <Box sx={{ width: "100%", maxWidth: 700, p: 2, bgcolor: "grey.100", borderRadius: 2 }}>
      <Typography variant="overline" color="text.secondary">Last round (round {round})</Typography>
      <Stack spacing={0.5}>
        {resolution.shots.length === 0 && resolution.ducks.length === 0 && (
          <Typography color="text.secondary">A quiet round.</Typography>
        )}
        {resolution.ducks.length > 0 && (
          <Typography>Ducked: {resolution.ducks.map(slotName).join(", ")}</Typography>
        )}
        {resolution.shots.map((s, i) => (
          <Typography key={i} variant="body2">
            {slotName(s.shooter)} → {slotName(s.target)} [{s.card}] {outcomeLabel(s.outcome)}
          </Typography>
        ))}
        {resolution.eliminated.length > 0 && (
          <Typography color="error">Eliminated: {resolution.eliminated.map(slotName).join(", ")}</Typography>
        )}
      </Stack>
    </Box>
  );
}

function ShotLog({ resolution, slotName }: {
  resolution: import("../game/types").RoundResolution;
  slotName: (id: string) => string;
}) {
  return (
    <Box sx={{ width: "100%", maxWidth: 700, p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
      <Stack spacing={0.5}>
        {resolution.shots.map((s, i) => (
          <Typography key={i} variant="body2">
            {slotName(s.shooter)} → {slotName(s.target)} [{s.card}] {outcomeLabel(s.outcome)}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}

function outcomeLabel(outcome: import("../game/types").ShotOutcome): string {
  switch (outcome) {
    case "hit": return "✓ HIT";
    case "no_effect_clic": return "*click*";
    case "voided_target_ducked": return "(target ducked)";
    case "voided_shooter_surprised": return "(surprised)";
  }
}

function PlayerCard({ player, score }: { player: Player; score?: number }) {
  const cashTotal = player.cash.reduce((s, n) => s + n.value, 0);
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
      <Avatar sx={{ bgcolor: player.colorOrAvatar, width: 32, height: 32, opacity: player.status === "dead" ? 0.4 : 1 }}>
        {player.displayName.charAt(0).toUpperCase()}
      </Avatar>
      <Typography sx={{ minWidth: 120, textDecoration: player.status === "dead" ? "line-through" : "none" }}>
        {player.displayName}
      </Typography>
      <Chip size="small" label={`wounds ${player.wounds}/3`} color={player.wounds >= 2 ? "warning" : "default"} />
      <Chip size="small" label={`shame ${player.shame}`} />
      <Chip size="small" label={`bullets ${player.bullets.length}`} />
      <Chip size="small" label={`$${cashTotal.toLocaleString()}`} color="success" />
      {score !== undefined && <Chip size="small" label={`score $${score.toLocaleString()}`} />}
    </Stack>
  );
}

function totalScore(p: Player): number {
  if (p.status !== "alive") return 0;
  return p.cash.reduce((s, n) => s + n.value, 0) - 5000 * p.shame;
}

// Live countdown for timed phases. Renders nothing for untimed phases.
function Countdown({ phase, startedAt }: { phase: string; startedAt: number }) {
  const duration = phase === "standoff" ? 4000
    : phase === "withdraw" ? 10000
    : 0;
  if (!duration) return null;
  return <CountdownTicker startedAt={startedAt} duration={duration} />;
}

function CountdownTicker({ startedAt, duration }: { startedAt: number; duration: number }) {
  const { serverNow } = useServerTime();
  const [now, setNow] = useState(() => serverNow());
  useEffect(() => {
    const t = setInterval(() => setNow(serverNow()), 100);
    return () => clearInterval(t);
  }, [serverNow]);
  const elapsed = now - startedAt;
  const remaining = Math.max(0, duration - elapsed);
  return <Typography variant="h2" sx={{ fontFamily: "monospace" }}>{(remaining / 1000).toFixed(1)}s</Typography>;
}
