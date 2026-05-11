import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
} from "@mui/material";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { useGameState } from "../hooks/useGameState";
import { FlagFor, jollyRogerForColor } from "../components/flags";
import { flagColor, palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import { breath } from "../theme/animations";
import { PageCanvas } from "../components/shell/PageCanvas";
import { PhoneHeader } from "../components/shell/PhoneHeader";
import { PhoneShell } from "../components/shell/PhoneShell";
import { PhaseView } from "../components/phone/PhaseView";

export default function PlayerPage() {
  const { t } = useTranslation();
  const { id, playerId } = useParams();
  const { roomState, loading, error } = useFirebaseRoom(id);
  const { game, submitCommit, submitDuck } = useGameState(id);

  if (loading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !roomState) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{error ?? t("room.notFound")}</Alert>
      </Container>
    );
  }

  const slotId = Number(playerId);
  const slot = roomState.players.find(p => p.id === slotId);
  if (!slot || slot.status === "empty") {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{t("room.notFound")}</Alert>
      </Container>
    );
  }

  if (roomState.status === "lobby" || !game) {
    const flagId = slot.data?.colorOrAvatar ?? "generic";
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
          <PhoneHeader roomId={roomState.roomId} flagId={flagId} />
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1.4rem",
              padding: "1.5rem",
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: "10rem",
                height: "6.9rem",
                background: flagColor(flagId),
                color: palette.paper,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `4px 4px 0 ${palette.inkDeep}`,
              }}
            >
              <FlagFor id={jollyRogerForColor(flagId)} size="4.5rem" />
            </Box>
            <Box
              sx={{
                fontFamily: fonts.displayCaps,
                fontSize: "1.7rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: palette.paper,
              }}
            >
              {slot.name}
            </Box>
            <Box
              sx={{
                fontFamily: fonts.body,
                fontStyle: "italic",
                fontSize: "1.05rem",
                color: palette.paperDim,
                marginTop: "-1rem",
                animation: `${breath} 2.4s ease-in-out infinite`,
              }}
            >
              {t("player.lobbyWaiting")}
            </Box>
          </Box>
        </PageCanvas>
      </Box>
    );
  }

  const me = game.players.find(p => p.id === String(slotId));
  if (!me) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{t("room.notFound")}</Alert>
      </Container>
    );
  }

  return (
    <PhoneShell me={me} roomId={roomState.roomId}>
      <PhaseView
        game={game}
        me={me}
        submitCommit={submitCommit}
        submitDuck={submitDuck}
      />
    </PhoneShell>
  );
}
