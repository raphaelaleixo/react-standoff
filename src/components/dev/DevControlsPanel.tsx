import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Box,
  Button,
  Checkbox,
  Drawer,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { BulletCard, Game, Player, PowerKind, RoundPhase } from "../../game/types";
import type { MockGameActions } from "./useMockGameState";
import { STANDOFF_DURATION_MS, STANDOFF_HOLD_MS, WITHDRAW_DURATION_MS } from "../../lib/phaseDurations";
import { POWER_KINDS } from "../../game/powerKinds";

const PHASES: RoundPhase[] = [
  "commit",
  "standoff",
  "standoff_hold",
  "withdraw",
  "reveal_withdraw",
  "reveal_bbb",
  "reveal_others",
  "tough_prompt",
  "tough_reveal",
  "split",
];

// How long each phase should linger when "Play round" walks the mock through
// the round. Tuned for at-the-table watchability, not real-game speed.
//
// `standoff` matches STANDOFF_DURATION_MS so the count animation finishes
// exactly when the panel advances. `standoff_hold` is the silent beat where
// the targeting lines draw in before the yield countdown begins. `withdraw`
// matches WITHDRAW_DURATION_MS so the on-screen seconds counter shown by
// WithdrawStamp lines up with the actual phase duration.
const PHASE_HOLD_MS: Record<RoundPhase, number> = {
  commit: 900,
  standoff: STANDOFF_DURATION_MS,
  standoff_hold: STANDOFF_HOLD_MS,
  withdraw: WITHDRAW_DURATION_MS,
  reveal_withdraw: 1500,
  reveal_bbb: 2500,
  reveal_others: 2500,
  tough_prompt: 2500,
  tough_reveal: 0,
  split: 0, // terminal — no hold; round ends here
  // Grenade is a short-circuit terminator. "Play round" doesn't walk
  // through it — the dev panel's force-grenade button drops the mock
  // directly into this phase.
  grenade: 0,
};

const BULLETS: Array<BulletCard | "none"> = ["none", "clic", "bang", "bang_bang_bang"];
const WOUNDS: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3];

export type DevScreen = "game" | "muster" | "reckoning";
const SCREENS: DevScreen[] = ["game", "muster", "reckoning"];

interface DevControlsPanelProps {
  open: boolean;
  game: Game;
  actions: MockGameActions;
  onClose(): void;
  /** Which big-screen surface MockBigScreen is rendering. */
  screen: DevScreen;
  onScreenChange(screen: DevScreen): void;
  /** Super Powers variant toggle + activation injector. */
  variantSuperPowers?: boolean;
  onVariantSuperPowersChange?(on: boolean): void;
  forcedActivations?: PowerKind[];
  onForcedActivationsChange?(next: PowerKind[]): void;
  /** Optional: when on, distribute a different revealed power to each
   *  player so PowerBadges show up in the big-screen crew rail. */
  revealAllBadges?: boolean;
  onRevealAllBadgesChange?(on: boolean): void;
  /** Optional per-seat power injector (phone mock only). */
  myPower?: PowerKind | null;
  onMyPowerChange?(power: PowerKind | null): void;
  /** Synthesize a grenade explosion for previewing the overlay + termination. */
  onForceGrenadeExplosion?(): void;
}

export function DevControlsPanel({
  open,
  game,
  actions,
  onClose,
  screen,
  onScreenChange,
  variantSuperPowers,
  onVariantSuperPowersChange,
  forcedActivations,
  onForcedActivationsChange,
  revealAllBadges,
  onRevealAllBadgesChange,
  myPower,
  onMyPowerChange,
  onForceGrenadeExplosion,
}: DevControlsPanelProps) {
  const [playing, setPlaying] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPlay = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setPlaying(false);
  }, []);

  const playRound = useCallback(() => {
    setPlaying(true);
    const step = (i: number) => {
      const phase = PHASES[i];
      actions.setPhase(phase);
      const next = PHASES[i + 1];
      if (!next) {
        timeoutRef.current = null;
        setPlaying(false);
        return;
      }
      timeoutRef.current = setTimeout(() => step(i + 1), PHASE_HOLD_MS[phase]);
    };
    step(0);
  }, [actions]);

  // Cancel any in-flight playback on unmount so we don't keep nudging phase.
  useEffect(() => () => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
  }, []);

  const handleReset = () => {
    stopPlay();
    actions.reset();
  };

  return (
    <Drawer
      anchor="right"
      variant="persistent"
      open={open}
      slotProps={{ paper: { sx: { width: 360, padding: 2, display: "flex", flexDirection: "column" } } }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}
      >
        <Typography variant="h6">Dev Controls</Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={handleReset}>
            Reset
          </Button>
          <IconButton size="small" onClick={onClose} aria-label="Close dev controls">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      <Box sx={{ overflowY: "auto", flex: 1 }}>
        <Section title="Screen">
          <ToggleButtonGroup
            exclusive
            size="small"
            value={screen}
            onChange={(_, value: DevScreen | null) => value && onScreenChange(value)}
            sx={{ flexWrap: "wrap" }}
          >
            {SCREENS.map(s => (
              <ToggleButton key={s} value={s} sx={{ textTransform: "none" }}>
                {s}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          {screen !== "game" && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              Phase / players / commits below only drive the in-game ledger. Switch back to <em>game</em> to use them.
            </Typography>
          )}
        </Section>

        {onVariantSuperPowersChange && (
          <Section title="Variant">
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={!!variantSuperPowers}
                  onChange={(_, v) => onVariantSuperPowersChange(v)}
                />
              }
              label={<Typography variant="body2">Super Powers</Typography>}
            />
            {variantSuperPowers && onForcedActivationsChange && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                  Force activations (big-screen overlay)
                </Typography>
                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
                  {POWER_KINDS.map(k => (
                    <Button
                      key={k}
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        onForcedActivationsChange([...(forcedActivations ?? []), k])
                      }
                      sx={{ textTransform: "none" }}
                    >
                      +{k}
                    </Button>
                  ))}
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => onForcedActivationsChange([])}
                  >
                    clear
                  </Button>
                </Stack>
                {forcedActivations && forcedActivations.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    Queued: {forcedActivations.join(", ")}
                  </Typography>
                )}
              </Box>
            )}
            {onRevealAllBadgesChange && (
              <Box sx={{ mt: 1.5 }}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={!!revealAllBadges}
                      onChange={(_, v) => onRevealAllBadgesChange(v)}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Reveal all powers (crew rail badges)
                    </Typography>
                  }
                />
              </Box>
            )}
            {variantSuperPowers && onMyPowerChange && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                  Deal me a power
                </Typography>
                <Select
                  size="small"
                  fullWidth
                  value={myPower ?? "none"}
                  onChange={e => {
                    const v = e.target.value;
                    onMyPowerChange(v === "none" ? null : (v as PowerKind));
                  }}
                >
                  <MenuItem value="none">none</MenuItem>
                  {POWER_KINDS.map(k => (
                    <MenuItem key={k} value={k}>{k}</MenuItem>
                  ))}
                </Select>
              </Box>
            )}
            {onForceGrenadeExplosion && (
              <Box sx={{ mt: 1.5 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={onForceGrenadeExplosion}
                  sx={{ textTransform: "none" }}
                >
                  Force grenade explosion
                </Button>
              </Box>
            )}
          </Section>
        )}

        <Section title="Round">
          <Typography variant="caption">Phase</Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={game.round.phase}
            onChange={(_, value: RoundPhase | null) => value && actions.setPhase(value)}
            sx={{ flexWrap: "wrap", mt: 0.5 }}
          >
            {PHASES.map(p => (
              <ToggleButton key={p} value={p} sx={{ textTransform: "none" }}>
                {p}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", mt: 1.5 }}
          >
            <Typography variant="caption" sx={{ minWidth: 56 }}>Round #</Typography>
            <Button size="small" variant="outlined" onClick={() => actions.setRoundNumber(game.round.number - 1)}>−</Button>
            <Typography sx={{ minWidth: 24, textAlign: "center" }}>{game.round.number}</Typography>
            <Button size="small" variant="outlined" onClick={() => actions.setRoundNumber(game.round.number + 1)}>+</Button>
          </Stack>

          <Button
            size="small"
            variant={playing ? "outlined" : "contained"}
            onClick={playing ? stopPlay : playRound}
            sx={{ mt: 1.5 }}
            fullWidth
          >
            {playing ? "Stop" : "▶ Play round"}
          </Button>
        </Section>

        <Section title="Players">
          <Stack spacing={2}>
            {game.players.map(player => {
              const commit = game.round.commits[player.id] ?? {};
              const targetOptions = game.players.filter(p => p.id !== player.id);
              return (
                <Box key={player.id} sx={{ borderTop: 1, borderColor: "divider", pt: 1 }}>
                  <Stack
                    direction="row"
                    sx={{ alignItems: "center", justifyContent: "space-between" }}
                  >
                    <Typography variant="subtitle2">{player.displayName}</Typography>
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      value={player.status}
                      onChange={(_, value: Player["status"] | null) => value && actions.setStatus(player.id, value)}
                    >
                      <ToggleButton value="alive">alive</ToggleButton>
                      <ToggleButton value="dead">dead</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center", mt: 1 }}
                  >
                    <Typography variant="caption" sx={{ minWidth: 56 }}>Wounds</Typography>
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      value={player.wounds}
                      onChange={(_, value: 0 | 1 | 2 | 3 | null) => value !== null && actions.setWounds(player.id, value)}
                    >
                      {WOUNDS.map(w => (
                        <ToggleButton key={w} value={w}>{w}</ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center", mt: 1 }}
                  >
                    <Typography variant="caption" sx={{ minWidth: 56 }}>Shame</Typography>
                    <Button size="small" variant="outlined" onClick={() => actions.setShame(player.id, player.shame - 1)}>−</Button>
                    <Typography sx={{ minWidth: 24, textAlign: "center" }}>{player.shame}</Typography>
                    <Button size="small" variant="outlined" onClick={() => actions.setShame(player.id, player.shame + 1)}>+</Button>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center", mt: 1 }}
                  >
                    <Typography variant="caption" sx={{ minWidth: 56 }}>Bullet</Typography>
                    <Select
                      size="small"
                      value={commit.bullet ?? "none"}
                      onChange={e => {
                        const value = e.target.value as BulletCard | "none";
                        actions.setCommit(player.id, { bullet: value === "none" ? undefined : value });
                      }}
                      sx={{ flex: 1 }}
                    >
                      {BULLETS.map(b => (
                        <MenuItem key={b} value={b}>{b}</MenuItem>
                      ))}
                    </Select>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center", mt: 1 }}
                  >
                    <Typography variant="caption" sx={{ minWidth: 56 }}>Target</Typography>
                    <Select
                      size="small"
                      value={commit.target ?? "none"}
                      onChange={e => {
                        const value = e.target.value;
                        actions.setCommit(player.id, { target: value === "none" ? undefined : value });
                      }}
                      sx={{ flex: 1 }}
                    >
                      <MenuItem value="none">none</MenuItem>
                      {targetOptions.map(p => (
                        <MenuItem key={p.id} value={p.id}>{p.displayName}</MenuItem>
                      ))}
                    </Select>
                  </Stack>

                  <FormControlLabel
                    sx={{ mt: 0.5 }}
                    control={
                      <Checkbox
                        size="small"
                        checked={!!commit.withdrew}
                        onChange={e => actions.setCommit(player.id, { withdrew: e.target.checked || undefined })}
                      />
                    }
                    label={<Typography variant="caption">Withdrew</Typography>}
                  />
                </Box>
              );
            })}
          </Stack>
        </Section>
      </Box>
    </Drawer>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="overline" color="text.secondary">{title}</Typography>
      <Box>{children}</Box>
    </Box>
  );
}
