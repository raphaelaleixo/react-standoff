import { useEffect, useState } from "react";
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
  const { game } = useGameState(id);
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
        {/* X-marks-the-spot box: paper-stroked ink chip with a chunky paper
            X when the variant is on. Same visual language as the spent
            overlay on PowderCard, scaled down. */}
        <Box
          sx={{
            position: "relative",
            width: 30,
            height: 30,
            border: `1.5px solid ${palette.paper}`,
            background: palette.inkUp,
            boxShadow: `2px 2px 0 ${palette.inkDeep}`,
            flexShrink: 0,
          }}
        >
          {variantSuperPowers && (
            <Box
              component="svg"
              viewBox="0 0 100 100"
              aria-hidden="true"
              sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            >
              <line
                x1="20" y1="20" x2="80" y2="80"
                stroke={palette.paper} strokeWidth="11" strokeLinecap="round"
              />
              <line
                x1="80" y1="20" x2="20" y2="80"
                stroke={palette.paper} strokeWidth="11" strokeLinecap="round"
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
          marginLeft: "calc(30px + 0.7rem)",
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
              a => a.kind === "unbreakable" || a.kind === "dragon_skin"
            )
          }
          players={game.players}
        />
      )}
      {(game.round.phase === "specialist_prompt" || game.round.phase === "tough_prompt") && game.round.resolution && (
        <PowerRevealOverlay
          activations={
            (game.round.resolution.powerActivations ?? []).filter(
              a => a.kind === "specialist" || a.kind === "tough"
            )
          }
          players={game.players}
        />
      )}
    </Box>
  );
}
