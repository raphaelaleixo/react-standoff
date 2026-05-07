import { useState } from "react";
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
import type { BulletCard, Game, Player, RoundPhase } from "../game/types";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { useGameState } from "../hooks/useGameState";
import { FlagFor } from "../components/flags";
import { FlintlockBarrel } from "../components/FlintlockBarrel";
import { YieldButton } from "../components/YieldButton";
import { flagColor, palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import { PhoneShell } from "../components/shell/PhoneShell";
import { Button } from "../components/shell/Button";
import { Hand } from "../components/phone/Hand";
import { TargetList } from "../components/phone/TargetList";

// Sorted in the same order as the Hand grid, so we can map the selected
// BulletCard back to a displayed-index for highlight.
const HAND_ORDER: Record<BulletCard, number> = { clic: 0, bang: 1, bang_bang_bang: 2 };

// Concise phase labels for the PhoneShell's round/phase strip. The reveal
// sub-phases all collapse to "REVEAL" — the player has nothing to do during
// them anyway; the big screen is the show.
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

function PhaseView({ game, me, submitCommit, submitDuck }: {
  game: Game;
  me: Player;
  submitCommit: (id: string, b: BulletCard, t: string) => Promise<void>;
  submitDuck: (id: string, w: boolean) => Promise<void>;
}) {
  const { t } = useTranslation();
  if (game.phase === "ended") {
    return (
      <Box sx={{ padding: "1.4rem", textAlign: "center" }}>
        <Typography variant="h5">{t("phase.ended")}</Typography>
      </Box>
    );
  }
  if (me.status === "dead") {
    return (
      <Box sx={{ padding: "1.4rem", textAlign: "center" }}>
        <Typography color="text.secondary">{t("player.spectator")}</Typography>
      </Box>
    );
  }
  const phase = game.round.phase;
  const myCommit = game.round.commits[me.id];
  const opponents = game.players.filter(p => p.id !== me.id && p.status === "alive");

  if (phase === "commit") {
    return <CommitPicker me={me} opponents={opponents} myCommit={myCommit} onSubmit={submitCommit} />;
  }

  if (phase === "standoff" || phase === "standoff_hold") {
    const target = game.players.find(p => p.id === myCommit?.target);
    return (
      <FlintlockBarrel
        targetFlag={target?.colorOrAvatar ?? "generic"}
        targetName={target?.displayName ?? "?"}
      />
    );
  }

  if (phase === "withdraw") {
    const aimedAtMe = Object.entries(game.round.commits)
      .filter(([sid, c]) => sid !== me.id && c.target === me.id)
      .map(([sid]) => game.players.find(p => p.id === sid)?.displayName ?? sid);
    return (
      <Stack spacing={2} sx={{ padding: "1rem" }}>
        {aimedAtMe.length > 0 ? (
          <Alert severity="warning">{t("phase.withdraw.aimedAt", { names: aimedAtMe.join(", ") })}</Alert>
        ) : (
          <Alert severity="info">{t("phase.withdraw.noOne")}</Alert>
        )}
        <YieldButton
          yielded={!!myCommit?.withdrew}
          onToggle={() => submitDuck(me.id, !myCommit?.withdrew)}
        />
      </Stack>
    );
  }

  if (phase === "reveal_withdraw" || phase === "reveal_bbb" || phase === "reveal_others" || phase === "split") {
    return (
      <Box sx={{ padding: "1.4rem", textAlign: "center" }}>
        <Typography color="text.secondary">{t("player.watchScreen")}</Typography>
      </Box>
    );
  }

  return null;
}

function CommitPicker({ me, opponents, myCommit, onSubmit }: {
  me: Player;
  opponents: Player[];
  myCommit?: { bullet?: BulletCard; target?: string };
  onSubmit: (id: string, b: BulletCard, t: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [load, setLoad] = useState<BulletCard | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const ready = myCommit?.bullet && myCommit.target;

  if (ready) {
    const targetName = opponents.find(o => o.id === myCommit?.target)?.displayName ?? myCommit?.target;
    return (
      <Box sx={{ padding: "1.4rem", textAlign: "center", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
        <Box sx={{ fontFamily: fonts.displayCaps, fontFeatureSettings: '"smcp"', fontSize: "1rem", letterSpacing: "0.22em", color: palette.paper }}>
          {t(`load.${myCommit.bullet!}`).toUpperCase()} → {targetName}
        </Box>
        <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", color: palette.paperDim }}>
          {t("phase.commit.waiting")}
        </Box>
      </Box>
    );
  }

  // Map the chosen BulletCard back to a displayed-index for the Hand's highlight.
  // If the player has multiple cards of the same load (e.g. two CLICKs), the
  // first matching slot is highlighted — visually identical, interchangeable.
  const sorted = [...me.bullets].sort((a, b) => HAND_ORDER[a] - HAND_ORDER[b]);
  const selectedIndex = load ? sorted.indexOf(load) : undefined;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Hand
        bullets={me.bullets}
        selectedIndex={selectedIndex !== -1 ? selectedIndex : undefined}
        onPick={(b) => setLoad(b)}
      />

      <Box
        sx={{
          padding: "0.55rem 0 0.25rem",
          textAlign: "center",
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "0.7rem",
          letterSpacing: "0.32em",
          color: palette.paperDim,
        }}
      >
        {t("phase.commit.pickTarget")}
      </Box>

      <TargetList
        opponents={opponents}
        selectedId={target}
        onPick={(id) => setTarget(id)}
      />

      <Box sx={{ padding: "0.7rem 0.85rem 0.85rem" }}>
        <Button
          fullWidth
          disabled={!load || !target}
          onClick={() => load && target && onSubmit(me.id, load, target)}
          caption={
            load && target
              ? `— ${t(`load.${load}`).toLowerCase()} · ${opponents.find(o => o.id === target)?.displayName ?? "?"} —`
              : undefined
          }
        >
          {t("phase.commit.ready").toUpperCase()}
        </Button>
      </Box>
    </Box>
  );
}
