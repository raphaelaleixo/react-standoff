import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { onValue, ref } from "firebase/database";
import { joinPlayer } from "react-gameroom";
import { palette, flagColor } from "../theme/colors";
import { fonts } from "../theme/typography";
import { PageCanvas } from "../components/shell/PageCanvas";
import { PhoneHeader } from "../components/shell/PhoneHeader";
import { Button } from "../components/shell/Button";
import { FlagPickerGrid } from "../components/flags/FlagPickerGrid";
import { takenFlags } from "../game/playerFlags";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { database } from "../firebase";
import type { Player } from "../game/types";

export default function PlayerJoinPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { roomState, loading, error, updateRoom } = useFirebaseRoom(id);
  const [name, setName] = useState("");
  const [flag, setFlag] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [variantSuperPowers, setVariantSuperPowers] = useState(false);
  const [variantCop, setVariantCop] = useState(false);

  useEffect(() => {
    if (!id) return;
    const r = ref(database, `rooms/${id}/lobbyVariants`);
    return onValue(r, snap => {
      const v = (snap.val() as { superPowers?: unknown; cop?: unknown } | null) ?? null;
      setVariantSuperPowers(!!v?.superPowers);
      setVariantCop(!!v?.cop);
    });
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !roomState) {
    return (
      <Box sx={{ padding: 2 }}>
        <Alert severity="error">{error ?? t("room.notFound")}</Alert>
      </Box>
    );
  }

  if (roomState.status === "started") {
    // Game in progress: rejoin path. Show every claimed seat as a button so
    // the player can pick their previous identity from this device.
    const claimed = roomState.players.filter(p => p.status !== "empty");
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
          <PhoneHeader roomId={roomState.roomId} />
          <Box sx={{ flex: 1, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <Box
              sx={{
                fontFamily: fonts.displayCaps,
                fontFeatureSettings: '"smcp"',
                fontSize: "0.85rem",
                letterSpacing: "0.32em",
                color: palette.paperDim,
                textAlign: "center",
                marginBottom: "0.5rem",
              }}
            >
              {t("playerJoin.rejoinTitle")}
            </Box>
            {claimed.map(p => (
              <Button
                key={p.id}
                variant="ghost"
                onClick={() => navigate(`/room/${id}/player/${p.id}`)}
                fullWidth
              >
                {(p.name ?? `Player ${p.id}`).toString()}
              </Button>
            ))}
          </Box>
        </PageCanvas>
      </Box>
    );
  }

  const empty = roomState.players.find(p => p.status === "empty");
  if (!empty) {
    return (
      <Box sx={{ padding: 2 }}>
        <Alert severity="info">{t("playerJoin.lobbyFull")}</Alert>
      </Box>
    );
  }

  const taken = takenFlags(roomState.players.map(p => p.data));

  const onSubmit = async () => {
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
        shame: [],
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
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
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
        <PhoneHeader roomId={roomState.roomId} flagId={flag ?? undefined} />

        {variantSuperPowers && (
          <Box sx={{ textAlign: "center", padding: "0.4rem 0.85rem 0", opacity: 0.8 }}>
            <Typography variant="caption" sx={{ color: palette.paperDim }}>
              {t("powers.lobbyBannerOn")}
            </Typography>
          </Box>
        )}

        {variantCop && (
          <Box sx={{ textAlign: "center", padding: "0.4rem 0.85rem 0", opacity: 0.8 }}>
            <Typography variant="caption" sx={{ color: palette.paperDim }}>
              {t("cop.lobby.banner")}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            textAlign: "center",
            padding: "0.7rem 0 0.4rem",
            fontFamily: fonts.blackletter,
            fontWeight: 700,
            fontSize: "1.6rem",
            lineHeight: 1,
            letterSpacing: "0.02em",
            color: palette.paper,
          }}
        >
          {t("playerJoin.raiseYerFlag")}
        </Box>

        <Box sx={{ padding: "0.7rem 0.85rem 1.8rem" }}>
          <Box
            sx={{
              fontFamily: fonts.displayCaps,
              fontFeatureSettings: '"smcp"',
              fontSize: "0.9rem",
              letterSpacing: "0.32em",
              color: palette.paperDim,
              textAlign: "center",
              marginBottom: "-0.2rem",
            }}
          >
            {t("playerJoin.nicknameEyebrow")}
          </Box>
          <Box
            component="input"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder={t("playerJoin.namePlaceholder")}
            maxLength={24}
            sx={{
              background: "transparent",
              border: "none",
              borderBottom: `1px solid ${palette.paperFaint}`,
              textAlign: "center",
              width: "100%",
              fontFamily: fonts.body,
              fontStyle: "italic",
              fontSize: "1.6rem",
              letterSpacing: "0.04em",
              color: palette.paper,
              padding: "0.4rem 0.4rem 0.3rem",
              "&::placeholder": { color: palette.paperFaint, opacity: 1 },
              "&:focus": { outline: "none", borderColor: palette.blood },
            }}
          />
        </Box>

        <FlagPickerGrid taken={taken} value={flag} onChange={(id) => setFlag(id)} />

        {submitError && (
          <Box sx={{ padding: "0 0.85rem" }}>
            <Alert severity="error">{submitError}</Alert>
          </Box>
        )}

        <Box sx={{ padding: "0.6rem 0.85rem 0.85rem", marginTop: "auto" }}>
          <Button
            fullWidth
            disabled={!name.trim() || !flag || submitting}
            onClick={onSubmit}
            caption={t("playerJoin.submitCaption")}
            color={flag ? `color-mix(in srgb, ${flagColor(flag)} 55%, ${palette.ink})` : palette.ink}
          >
            {t("playerJoin.submit")}
          </Button>
        </Box>
      </PageCanvas>
    </Box>
  );
}
