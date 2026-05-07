import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, Divider } from "@mui/material";
import { createInitialRoom, generateRoomId } from "react-gameroom";
import { ref, set } from "firebase/database";
import { database } from "../firebase";
import { palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import { PageCanvas } from "../components/shell/PageCanvas";
import { Button } from "../components/shell/Button";
import { roomExists } from "../hooks/useFirebaseRoom";
import type { Player } from "../game/types";

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

  const onJoin = async () => {
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
    <Box
      sx={{
        minHeight: "100vh",
        padding: "8px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <PageCanvas sx={{ width: "min(480px, 100%)", padding: "2rem" }}>
        <Box sx={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Box
            sx={{
              fontFamily: fonts.blackletter,
              fontWeight: 700,
              fontSize: "2rem",
              lineHeight: 1,
              textAlign: "center",
              color: palette.paper,
            }}
          >
            {t("join.title")}
          </Box>

          <Button
            fullWidth
            onClick={onCreate}
            disabled={submitting !== null}
            caption="— hoist new colours —"
          >
            {submitting === "create" ? t("join.joinSubmitting").toUpperCase() : t("join.createNew").toUpperCase()}
          </Button>

          {error && <Alert severity="error">{error}</Alert>}

          <Divider
            sx={{
              borderColor: palette.ruleStrong,
              "&::before, &::after": { borderColor: palette.ruleStrong },
              color: palette.paperDim,
              fontFamily: fonts.body,
              fontStyle: "italic",
            }}
          >
            {t("join.or")}
          </Divider>

          <Box
            component="form"
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              if (!code.trim() || submitting !== null) return;
              onJoin();
            }}
            sx={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}
          >
            <Box
              sx={{
                fontFamily: fonts.displayCaps,
                fontFeatureSettings: '"smcp"',
                fontSize: "0.62rem",
                letterSpacing: "0.36em",
                color: palette.paperDim,
                textAlign: "center",
              }}
            >
              {t("join.codeLabel").toUpperCase()}
            </Box>
            <Box
              component="input"
              value={code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.toUpperCase())}
              placeholder={t("join.codePlaceholder")}
              autoFocus
              maxLength={8}
              sx={{
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${palette.paper}`,
                textAlign: "center",
                fontFamily: fonts.displayCaps,
                fontFeatureSettings: '"smcp"',
                fontSize: "2rem",
                letterSpacing: "0.36em",
                color: palette.paper,
                padding: "0.4rem 0.4rem 0.3rem",
                textTransform: "uppercase",
                "&::placeholder": { color: palette.paperFaint, opacity: 1 },
                "&:focus": { outline: "none", borderColor: palette.blood },
              }}
            />
            <Button
              variant="ghost"
              fullWidth
              disabled={!code.trim() || submitting !== null}
              onClick={onJoin}
            >
              {submitting === "join" ? t("join.joinSubmitting").toUpperCase() : t("join.joinSubmit").toUpperCase()}
            </Button>
          </Box>
        </Box>
      </PageCanvas>
    </Box>
  );
}
