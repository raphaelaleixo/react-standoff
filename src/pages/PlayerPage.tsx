import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import type { RoundPhase } from "../game/types";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { useGameState } from "../hooks/useGameState";
import { FlagFor } from "../components/flags";
import { flagColor } from "../theme/colors";
import { PhoneShell } from "../components/shell/PhoneShell";
import { PhaseView } from "../components/phone/PhaseView";

// Concise phase labels for the PhoneShell's round/phase strip. The four
// reveal sub-phases collapse to "REVEAL" — the player has nothing to do
// during them anyway; the big screen is the show.
const PHASE_LABEL: Record<RoundPhase, string> = {
  commit: "LOAD & AIM",
  standoff: "STANDOFF",
  standoff_hold: "STANDOFF",
  withdraw: "YIELD?",
  reveal_withdraw: "REVEAL",
  reveal_bbb: "REVEAL",
  reveal_others: "REVEAL",
  split: "SPLIT",
};

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
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Stack spacing={3} sx={{ alignItems: "center" }}>
          <Box sx={{ color: flagColor(flagId) }}>
            <FlagFor id={flagId} size={96} />
          </Box>
          <Typography variant="h5">{slot.name}</Typography>
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress size={32} sx={{ mb: 2 }} />
            <Typography color="text.secondary">{t("player.lobbyWaiting")}</Typography>
          </Box>
        </Stack>
      </Container>
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
    <PhoneShell
      me={me}
      round={game.round.number}
      phaseLabel={PHASE_LABEL[game.round.phase]}
    >
      <PhaseView
        game={game}
        me={me}
        submitCommit={submitCommit}
        submitDuck={submitDuck}
      />
    </PhoneShell>
  );
}
