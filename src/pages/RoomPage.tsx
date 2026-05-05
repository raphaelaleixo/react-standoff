import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
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
import type { Game, Player } from "../game/types";
import { initGame } from "../game/setup";
import { GameBoard } from "../components/GameBoard";
import { FlagFor } from "../components/flags";
import { flagColor } from "../theme/colors";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { useGameState } from "../hooks/useGameState";
import { database } from "../firebase";
import { PageCanvas } from "../components/shell/PageCanvas";
import { Masthead } from "../components/shell/Masthead";
import { Foot } from "../components/shell/Foot";
import { navyHoursLabel, toRoman } from "../lib/navyHours";

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
    return <GameView game={game} roomId={id ?? ""} />;
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
                  <Box sx={{ color: flagColor(p.data?.colorOrAvatar ?? "generic"), width: 48, height: 48 }}>
                    <FlagFor id={p.data?.colorOrAvatar ?? "generic"} size={48} />
                  </Box>
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

function GameView({ game, roomId }: { game: ReturnType<typeof useGameState>["game"]; roomId: string }) {
  const { t } = useTranslation();
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
        <Typography variant="h3" gutterBottom>{t("phase.ended")}</Typography>
        <Stack spacing={1}>
          {[...game.players].sort((a, b) => totalScore(b) - totalScore(a)).map(p => (
            <PlayerCard key={p.id} player={p} score={totalScore(p)} />
          ))}
        </Stack>
      </Container>
    );
  }

  const round = game.round;
  return (
    <Box sx={{ width: "100vw", height: "100vh", padding: 2, boxSizing: "border-box" }}>
      <PageCanvas aspectRatio="16 / 9" sx={{ width: "100%", height: "100%" }}>
        <Masthead
          left={<>ROUND <em>{toRoman(round.number)} of VIII</em></>}
          right={<>ROOM <em>{roomId}</em></>}
        />
        <GameBoard game={game} />
        <Foot
          left={`${countAlive(game)} ALIVE · ${countYielded(game)} YIELDED · ${countDead(game)} DEAD`}
          cry={navyHoursLabel(round.number)}
          right="NEXT · WHO SHALL FALL?"
        />
      </PageCanvas>
    </Box>
  );
}

const countAlive = (g: Game) => g.players.filter(p => p.status === "alive").length;
const countYielded = (g: Game) => Object.values(g.round.commits).filter(c => c?.withdrew).length;
const countDead = (g: Game) => g.players.filter(p => p.status === "dead").length;

function PlayerCard({ player, score }: { player: Player; score?: number }) {
  const cashTotal = player.cash.reduce((s, n) => s + n.value, 0);
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
      <Box sx={{ color: flagColor(player.colorOrAvatar), opacity: player.status === "dead" ? 0.4 : 1, width: 32, height: 32 }}>
        <FlagFor id={player.colorOrAvatar} size={32} />
      </Box>
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
