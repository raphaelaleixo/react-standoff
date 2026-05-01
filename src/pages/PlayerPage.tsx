import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import type { BulletCard, Game, Player } from "../game/types";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { useGameState } from "../hooks/useGameState";
import { FlagFor } from "../components/flags";
import { PowderLoadCard } from "../components/PowderLoadCard";
import { FlintlockBarrel } from "../components/FlintlockBarrel";
import { YieldButton } from "../components/YieldButton";
import { flagColor, palette } from "../theme/colors";

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
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Box sx={{ color: flagColor(me.colorOrAvatar), opacity: me.status === "dead" ? 0.4 : 1 }}>
            <FlagFor id={me.colorOrAvatar} size={56} />
          </Box>
          <Box>
            <Typography variant="h6">{me.displayName}</Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
              <Chip size="small" label={`wounds ${me.wounds}/3`} color={me.wounds >= 2 ? "warning" : "default"} />
              <Chip size="small" label={`yellow ×${me.shame}`} />
              <Chip size="small" label={`$${me.cash.reduce((s, n) => s + n.value, 0).toLocaleString()}`} color="success" />
            </Stack>
          </Box>
        </Stack>

        <Divider />

        <PhaseView
          game={game}
          me={me}
          submitCommit={submitCommit}
          submitDuck={submitDuck}
        />
      </Stack>
    </Container>
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
    return <Typography variant="h5">{t("phase.ended")}</Typography>;
  }
  if (me.status === "dead") {
    return <Typography color="text.secondary">{t("player.spectator")}</Typography>;
  }
  const phase = game.round.phase;
  const myCommit = game.round.commits[me.id];
  const opponents = game.players.filter(p => p.id !== me.id && p.status === "alive");

  if (phase === "commit") {
    return <CommitPicker me={me} opponents={opponents} myCommit={myCommit} onSubmit={submitCommit} />;
  }

  if (phase === "standoff") {
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
      <Stack spacing={2}>
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

  if (phase === "reveal_bbb" || phase === "reveal_others" || phase === "split") {
    return <Typography color="text.secondary">{t("player.watchScreen")}</Typography>;
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
  const counts = countBullets(me.bullets);
  const ready = myCommit?.bullet && myCommit.target;

  if (ready) {
    const targetName = opponents.find(o => o.id === myCommit?.target)?.displayName ?? myCommit?.target;
    return (
      <Stack spacing={1}>
        <Alert severity="success">
          {t("phase.commit.locked", { load: t(`load.${myCommit.bullet!}`), target: targetName })}
        </Alert>
        <Typography color="text.secondary">{t("phase.commit.waiting")}</Typography>
      </Stack>
    );
  }

  const loadOrder: BulletCard[] = ["bang_bang_bang", "bang", "clic"];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" color="text.secondary">{t("phase.commit.pickLoad")}</Typography>
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", mt: 1 }} useFlexGap>
          {loadOrder.map(b => (
            <PowderLoadCard
              key={b}
              load={b}
              count={counts[b]}
              selected={load === b}
              onSelect={() => setLoad(b)}
            />
          ))}
        </Stack>
      </Box>

      <Box>
        <Typography variant="overline" color="text.secondary">{t("phase.commit.pickTarget")}</Typography>
        <Stack spacing={1} sx={{ mt: 1 }}>
          {opponents.map(o => (
            <Box
              key={o.id}
              role="button"
              onClick={() => setTarget(o.id)}
              sx={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1,
                bgcolor: palette.parchment,
                border: `2px solid ${target === o.id ? palette.signal : palette.ink}`,
                borderRadius: 1,
              }}
            >
              <Box sx={{ color: flagColor(o.colorOrAvatar) }}>
                <FlagFor id={o.colorOrAvatar} size={36} />
              </Box>
              <Typography sx={{ color: palette.ink, fontWeight: 600 }}>{o.displayName}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      <Button
        variant="contained"
        size="large"
        disabled={!load || !target}
        onClick={() => load && target && onSubmit(me.id, load, target)}
      >
        {t("phase.commit.ready")}
      </Button>
    </Stack>
  );
}

function countBullets(bullets: BulletCard[]): Record<BulletCard, number> {
  const c = { clic: 0, bang: 0, bang_bang_bang: 0 } as Record<BulletCard, number>;
  for (const b of bullets) c[b] += 1;
  return c;
}
