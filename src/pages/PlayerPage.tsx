import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Avatar,
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

const BULLET_LABEL: Record<BulletCard, string> = {
  clic: "clic",
  bang: "BANG",
  bang_bang_bang: "B!B!B!",
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

  // Lobby state — no game doc yet.
  if (roomState.status === "lobby" || !game) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Stack spacing={3} sx={{ alignItems: "center" }}>
          <Avatar sx={{ bgcolor: slot.data?.colorOrAvatar ?? "#bdbdbd", width: 80, height: 80, fontSize: 32 }}>
            {(slot.name ?? "?").charAt(0).toUpperCase()}
          </Avatar>
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
          <Avatar sx={{ bgcolor: me.colorOrAvatar, width: 56, height: 56, opacity: me.status === "dead" ? 0.4 : 1 }}>
            {me.displayName.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6">{me.displayName}</Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
              <Chip size="small" label={`wounds ${me.wounds}/3`} color={me.wounds >= 2 ? "warning" : "default"} />
              <Chip size="small" label={`shame ${me.shame}`} />
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
  if (game.phase === "ended") {
    return <Typography variant="h5">Game over</Typography>;
  }
  if (me.status === "dead") {
    return <Typography color="text.secondary">You're out — spectator mode.</Typography>;
  }
  const phase = game.round.phase;
  const myCommit = game.round.commits[me.id];
  const opponents = game.players.filter(p => p.id !== me.id && p.status === "alive");

  if (phase === "commit") {
    return <CommitPicker me={me} opponents={opponents} myCommit={myCommit} onSubmit={submitCommit} />;
  }

  if (phase === "standoff") {
    const targetName = game.players.find(p => p.id === myCommit?.target)?.displayName ?? "?";
    return (
      <Stack spacing={2} sx={{ alignItems: "center", py: 2 }}>
        <Typography variant="h5">Aiming at {targetName}</Typography>
        <Typography color="text.secondary">Standoff…</Typography>
      </Stack>
    );
  }

  if (phase === "withdraw") {
    const aimedAtMe = Object.entries(game.round.commits)
      .filter(([sid, c]) => sid !== me.id && c.target === me.id)
      .map(([sid]) => game.players.find(p => p.id === sid)?.displayName ?? sid);
    return (
      <Stack spacing={2}>
        {aimedAtMe.length > 0 ? (
          <Alert severity="warning">Aimed at by: {aimedAtMe.join(", ")}</Alert>
        ) : (
          <Alert severity="info">Nobody is aiming at you.</Alert>
        )}
        <Button
          variant={myCommit?.withdrew ? "contained" : "outlined"}
          color="warning"
          size="large"
          onClick={() => submitDuck(me.id, !myCommit?.withdrew)}
        >
          {myCommit?.withdrew ? "Ducked (tap to undo)" : "DUCK"}
        </Button>
      </Stack>
    );
  }

  if (phase === "reveal_bbb" || phase === "reveal_others" || phase === "split") {
    return <Typography color="text.secondary">Watch the big screen…</Typography>;
  }

  return null;
}

function CommitPicker({ me, opponents, myCommit, onSubmit }: {
  me: Player;
  opponents: Player[];
  myCommit?: { bullet?: BulletCard; target?: string };
  onSubmit: (id: string, b: BulletCard, t: string) => Promise<void>;
}) {
  const [bullet, setBullet] = useState<BulletCard | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const counts = countBullets(me.bullets);
  const ready = myCommit?.bullet && myCommit.target;

  if (ready) {
    const targetName = opponents.find(o => o.id === myCommit?.target)?.displayName ?? myCommit?.target;
    return (
      <Stack spacing={1}>
        <Alert severity="success">Locked: {BULLET_LABEL[myCommit.bullet!]} → {targetName}</Alert>
        <Typography color="text.secondary">Waiting for others…</Typography>
      </Stack>
    );
  }

  // Distinct bullet types still in hand
  const bulletTypes: BulletCard[] = (["bang_bang_bang", "bang", "clic"] as BulletCard[])
    .filter(b => counts[b] > 0);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" color="text.secondary">Pick a bullet</Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 1 }} useFlexGap>
          {bulletTypes.map(b => (
            <Button
              key={b}
              variant={bullet === b ? "contained" : "outlined"}
              onClick={() => setBullet(b)}
            >
              {BULLET_LABEL[b]} ({counts[b]})
            </Button>
          ))}
        </Stack>
      </Box>

      <Box>
        <Typography variant="overline" color="text.secondary">Pick a target</Typography>
        <Stack spacing={1} sx={{ mt: 1 }}>
          {opponents.map(o => (
            <Button
              key={o.id}
              variant={target === o.id ? "contained" : "outlined"}
              onClick={() => setTarget(o.id)}
              sx={{ justifyContent: "flex-start" }}
            >
              <Avatar sx={{ bgcolor: o.colorOrAvatar, width: 24, height: 24, mr: 1.5, fontSize: 14 }}>
                {o.displayName.charAt(0).toUpperCase()}
              </Avatar>
              {o.displayName}
            </Button>
          ))}
        </Stack>
      </Box>

      <Button
        variant="contained"
        size="large"
        disabled={!bullet || !target}
        onClick={() => bullet && target && onSubmit(me.id, bullet, target)}
      >
        Ready
      </Button>
    </Stack>
  );
}

function countBullets(bullets: BulletCard[]): Record<BulletCard, number> {
  const c = { clic: 0, bang: 0, bang_bang_bang: 0 } as Record<BulletCard, number>;
  for (const b of bullets) c[b] += 1;
  return c;
}
