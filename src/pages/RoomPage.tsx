import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
} from "@mui/material";
import { ref, update } from "firebase/database";
import { buildJoinUrl, startGame, useRoomState } from "react-gameroom";
import type { RoomState } from "react-gameroom";
import type { Player } from "../game/types";
import { initGame } from "../game/setup";
import { GameBoard } from "../components/GameBoard";
import { MusterScreen } from "../components/screens/MusterScreen";
import { ReckoningScreen } from "../components/screens/ReckoningScreen";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { useGameState } from "../hooks/useGameState";
import { database } from "../firebase";
import { PageCanvas } from "../components/shell/PageCanvas";
import { Masthead } from "../components/shell/Masthead";
import { Foot } from "../components/shell/Foot";
import { navyHoursLabel, toRoman } from "../lib/navyHours";
import { countAlive, countDead, countYielded } from "../lib/playerCounts";

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
    <MusterScreen
      roomState={roomState}
      joinUrl={joinUrl}
      canStart={derived.canStart}
      onStart={onStart}
    />
  );
}

function GameView({ game, roomId }: { game: ReturnType<typeof useGameState>["game"]; roomId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
    <Box sx={{ width: "100vw", height: "100vh", padding: 2, boxSizing: "border-box" }}>
      <PageCanvas aspectRatio="16 / 9" sx={{ width: "100%", height: "100%" }}>
        <Masthead
          left={<>{t("shell.round")} <em>{t("shell.ofTotal", { n: toRoman(round.number) })}</em></>}
          right={<>{t("shell.room")} <em>{roomId}</em></>}
        />
        <GameBoard game={game} />
        <Foot
          left={`${countAlive(game)} ${t("shell.alive")} · ${countYielded(game)} ${t("shell.yielded")} · ${countDead(game)} ${t("shell.dead")}`}
          cry={navyHoursLabel(round.number, t)}
          right={t("shell.next")}
        />
      </PageCanvas>
    </Box>
  );
}
