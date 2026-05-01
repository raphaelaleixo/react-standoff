import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, Container, Divider, Stack, TextField, Typography } from "@mui/material";
import { createInitialRoom, generateRoomId } from "react-gameroom";
import type { Player } from "../game/types";
import { roomExists } from "../hooks/useFirebaseRoom";
import { ref, set } from "firebase/database";
import { database } from "../firebase";

const ROOM_CONFIG = { minPlayers: 4, maxPlayers: 6, requireFull: false };

async function createRoom(): Promise<string> {
  const roomId = generateRoomId();
  const initial = { ...createInitialRoom<Player>(ROOM_CONFIG), roomId };
  await set(ref(database, `rooms/${roomId}/state`), initial);
  return roomId;
}

export default function JoinPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"create" | "join" | null>(null);

  const onCreate = async () => {
    setSubmitting("create");
    setError(null);
    try {
      const id = await createRoom();
      navigate(`/room/${id}`);
    } catch (e) {
      console.error("createRoom failed:", e);
      setError((e as Error).message);
      setSubmitting(null);
    }
  };

  const onJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setSubmitting("join");
    setError(null);
    try {
      const exists = await roomExists(trimmed);
      if (!exists) {
        setError(t("join.notFound"));
        setSubmitting(null);
        return;
      }
      navigate(`/room/${trimmed}/player`);
    } catch (e) {
      console.error("join failed:", e);
      setError((e as Error).message);
      setSubmitting(null);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t("join.title")}
        </Typography>

        <Button variant="contained" size="large" onClick={onCreate} disabled={submitting !== null}>
          {submitting === "create" ? t("join.joinSubmitting") : t("join.createNew")}
        </Button>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        <Divider sx={{ my: 3 }}>{t("join.or")}</Divider>

        <Box component="form" onSubmit={onJoin}>
          <Stack spacing={2}>
            <TextField
              label={t("join.codeLabel")}
              placeholder={t("join.codePlaceholder")}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              slotProps={{ htmlInput: { style: { textTransform: "uppercase" } } }}
            />
            <Button type="submit" variant="outlined" size="large" disabled={!code.trim() || submitting !== null}>
              {submitting === "join" ? t("join.joinSubmitting") : t("join.joinSubmit")}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Container>
  );
}

