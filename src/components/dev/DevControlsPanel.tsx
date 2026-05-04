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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { BulletCard, Game, RoundPhase } from "../../game/types";
import type { MockGameActions } from "./useMockGameState";

const PHASES: RoundPhase[] = [
  "commit",
  "standoff",
  "withdraw",
  "reveal_bbb",
  "reveal_others",
  "split",
];

const BULLETS: Array<BulletCard | "none"> = ["none", "clic", "bang", "bang_bang_bang"];
const WOUNDS: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3];

interface DevControlsPanelProps {
  open: boolean;
  game: Game;
  actions: MockGameActions;
  onClose(): void;
}

export function DevControlsPanel({ open, game, actions, onClose }: DevControlsPanelProps) {
  return (
    <Drawer
      anchor="right"
      variant="persistent"
      open={open}
      slotProps={{ paper: { sx: { width: 360, padding: 2 } } }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}
      >
        <Typography variant="h6">Dev Controls</Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={actions.reset}>
            Reset
          </Button>
          <IconButton size="small" onClick={onClose} aria-label="Close dev controls">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      <Box sx={{ overflowY: "auto", flex: 1 }}>
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
        </Section>

        <Section title="Players">
          <Stack spacing={2}>
            {game.players.map(player => {
              const commit = game.round.commits[player.id] ?? {};
              const targetOptions = game.players.filter(p => p.id !== player.id);
              return (
                <Box key={player.id} sx={{ borderTop: "1px solid rgba(0,0,0,0.12)", pt: 1 }}>
                  <Stack
                    direction="row"
                    sx={{ alignItems: "center", justifyContent: "space-between" }}
                  >
                    <Typography variant="subtitle2">{player.displayName}</Typography>
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      value={player.status}
                      onChange={(_, value) => value && actions.setStatus(player.id, value)}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="overline" color="text.secondary">{title}</Typography>
      <Box>{children}</Box>
    </Box>
  );
}
