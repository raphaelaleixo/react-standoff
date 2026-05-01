import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { joinPlayer } from "react-gameroom";
import type { Player } from "../game/types";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { FLAG_IDS, FLAG_LABELS, takenFlags } from "../game/playerFlags";
import { FlagFor } from "../components/flags";
import { flagColor } from "../theme/colors";

export default function PlayerJoinPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { roomState, loading, error, updateRoom } = useFirebaseRoom(id);
  const [name, setName] = useState("");
  const [flag, setFlag] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  if (roomState.status === "started") {
    // Game in progress: show rejoin links for already-claimed seats.
    const claimed = roomState.players.filter(p => p.status !== "empty");
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h5" gutterBottom>{t("playerJoin.rejoinTitle")}</Typography>
        <Stack spacing={1}>
          {claimed.map(p => (
            <Button
              key={p.id}
              variant="outlined"
              onClick={() => navigate(`/room/${id}/player/${p.id}`)}
              sx={{ justifyContent: "flex-start" }}
            >
              {p.name ?? `Player ${p.id}`}
            </Button>
          ))}
        </Stack>
      </Container>
    );
  }

  const empty = roomState.players.find(p => p.status === "empty");
  if (!empty) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="info">{t("playerJoin.lobbyFull")}</Alert>
      </Container>
    );
  }

  const taken = takenFlags(roomState.players.map(p => p.data));
  const availableFlags = FLAG_IDS.filter(flagId => !taken.has(flagId));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !flag || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const newPlayer: Player = {
        id: String(empty.id),
        displayName: name.trim(),
        colorOrAvatar: flag,
        bullets: [],
        cash: [],
        wounds: 0,
        shame: 0,
        status: "alive",
        effects: [],
      };
      const updated = joinPlayer(roomState, empty.id, name.trim(), newPlayer);
      await updateRoom(updated);
      navigate(`/room/${id}/player/${empty.id}`);
    } catch (e) {
      setSubmitError((e as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t("playerJoin.title")}
      </Typography>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={3}>
          <TextField
            label={t("playerJoin.nameLabel")}
            placeholder={t("playerJoin.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            slotProps={{ htmlInput: { maxLength: 24 } }}
          />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>{t("playerJoin.flagLabel")}</Typography>
            <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: "wrap" }}>
              {availableFlags.map(flagId => (
                <Box
                  key={flagId}
                  role="button"
                  aria-label={`flag ${FLAG_LABELS[flagId]}`}
                  onClick={() => setFlag(flagId)}
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 1,
                    backgroundColor: "#e8d8b0",
                    color: flagColor(flagId),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    outline: flag === flagId ? `3px solid ${flagColor(flagId)}` : "1px solid #5a371d",
                    outlineOffset: 2,
                  }}
                >
                  <FlagFor id={flagId} size={56} />
                </Box>
              ))}
            </Stack>
          </Box>
          {submitError && <Alert severity="error">{submitError}</Alert>}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={!name.trim() || !flag || submitting}
          >
            {submitting ? t("playerJoin.submitting") : t("playerJoin.submit")}
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
