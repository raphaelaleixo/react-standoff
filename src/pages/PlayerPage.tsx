import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
} from "@mui/material";
import { useMemo } from "react";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { useGameState } from "../hooks/useGameState";
import { createFirebaseGameStore } from "../hooks/gameStore";
import { useServerTime } from "../hooks/useServerTime";
import { useHandSlots } from "../hooks/useHandSlots";
import { FlagFor } from "../components/flags";
import { jollyRogerForColor } from "../components/flags/jollyRogerForColor";
import { flagColor, palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import { breath } from "../theme/animations";
import { PageCanvas } from "../components/shell/PageCanvas";
import { PhoneHeader } from "../components/shell/PhoneHeader";
import { PhoneShell } from "../components/shell/PhoneShell";
import { PhaseView } from "../components/phone/PhaseView";
import { ToughPromptScreen } from "../components/screens/ToughPromptScreen";
import { InsaneRevealButton } from "../components/screens/InsaneRevealButton";
import { eligibleForInsane, eligibleForTough } from "../game/powers";

export default function PlayerPage() {
  const { t } = useTranslation();
  const { id, playerId } = useParams();
  const { roomState, loading, error } = useFirebaseRoom(id);
  const store = useMemo(() => (id ? createFirebaseGameStore(id) : null), [id]);
  const { serverNow } = useServerTime();
  const { game, submitCommit, submitDuck, submitTough, submitInsane } = useGameState(store, serverNow);
  // Compute hand layout from current bullets. Pure derivation against
  // STARTING_HAND — no cached state, so it's reload-stable.
  const slotIdNum = Number(playerId);
  const meBullets = game?.players.find(p => p.id === String(slotIdNum))?.bullets ?? [];
  const handSlots = useHandSlots(meBullets);

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

  const myPower = me.effects[0];
  // First-mount intro: PhoneShell opens the power card face-up + shows the
  // "tap to start" hint. The user's tap closes it via the same widget,
  // morphing into the footer card — one element, one animation.
  const introOpen =
    game.variants.superPowers &&
    !!myPower &&
    game.phase === "in_progress" &&
    game.round.number === 1 &&
    game.round.phase === "commit";

  if (
    game.variants.superPowers &&
    game.round.phase === "tough_prompt" &&
    eligibleForTough(game, me.id)
  ) {
    return (
      <PhoneShell me={me} roomId={roomState.roomId}>
        <ToughPromptScreen
          onUse={() => submitTough(me.id)}
          onSkip={() => { /* no-op; phase auto-advances on timeout */ }}
          expiresAtMs={game.round.phaseStartedAt + 10000}
        />
      </PhoneShell>
    );
  }

  // Insane holder context: the reveal pill should appear for the holder when
  // the window is open OR while the grenade is armed (between reveal and
  // resolution).
  const insaneHolder = game.players.find(p =>
    p.effects.some(e => e.kind === "insane"),
  );
  const insaneIsMe = insaneHolder?.id === me.id;
  const grenadeArmed = !!game.round.activations.insane;

  const showInsaneReveal = insaneIsMe && (eligibleForInsane(game, me.id) || grenadeArmed);

  return (
    <PhoneShell
      me={me}
      roomId={roomState.roomId}
      introOpen={introOpen}
      aboveFooter={
        showInsaneReveal ? (
          <InsaneRevealButton
            armed={grenadeArmed}
            onReveal={() => submitInsane(me.id)}
          />
        ) : undefined
      }
    >
      <PhaseView
        game={game}
        me={me}
        submitCommit={submitCommit}
        submitDuck={submitDuck}
        handSlots={handSlots}
      />
    </PhoneShell>
  );
}
