import { useState } from "react";
import { Box, Button, MenuItem, Select, Stack, Typography } from "@mui/material";
import { SCENARIOS, RECKONING_SCENARIOS, type ScenarioKind } from "./scenarios";
import { palette } from "../../theme/colors";

const GROUPS: { kind: ScenarioKind; label: string }[] = [
  { kind: "base", label: "Normal" },
  { kind: "powers", label: "Super Powers" },
  { kind: "cop", label: "Cop variant" },
  { kind: "cop_powers", label: "Cop × Powers" },
];

export type DockSurface = "game" | "muster" | "reckoning";

interface ScenarioDockProps {
  surface: DockSurface;
  onSurfaceChange(s: DockSurface): void;
  // Surface buttons to show. Pages limit this — MockPlayerPage hides muster
  // because there's no phone surface for it.
  surfaces: DockSurface[];
  scenarioId: string;
  onScenarioChange(id: string): void;
  onPlay(): void;
  onReset(): void;
  playing: boolean;
  blurb: string;
  // Reckoning picker (only relevant when surface === "reckoning"). Optional
  // — pages that don't expose the reckoning surface can omit them.
  reckoningId?: string;
  onReckoningChange?(id: string): void;
  // Extra controls rendered below the play/reset row. Used by MockPlayerPage
  // for the seat selector + variant toggle.
  children?: React.ReactNode;
}

// Shared dev dock for the mock big screen + mock phone — surface toggle,
// scenario picker, play/reset. The mock pages each own their own
// LocalGameStore so the dock just exposes scenario controls and lets the
// page wire the actual reset/play.
export function ScenarioDock({
  surface,
  onSurfaceChange,
  surfaces,
  scenarioId,
  onScenarioChange,
  onPlay,
  onReset,
  playing,
  blurb,
  reckoningId,
  onReckoningChange,
  children,
}: ScenarioDockProps) {
  // Auto-collapse the dock when a scenario starts playing so the big-screen
  // view isn't obscured. Re-expands when reset is hit or when the user
  // clicks the collapsed pill.
  const [collapsed, setCollapsed] = useState(false);

  const handlePlay = () => {
    onPlay();
    setCollapsed(true);
  };
  const handleReset = () => {
    onReset();
    setCollapsed(false);
  };

  if (collapsed) {
    return (
      <Box
        onClick={() => setCollapsed(false)}
        sx={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 100,
          background: palette.ink,
          border: `1.5px solid ${palette.paper}`,
          padding: "0.35rem 0.7rem",
          boxShadow: `3px 3px 0 ${palette.inkDeep}`,
          cursor: "pointer",
          color: palette.paperDim,
          fontFamily: "inherit",
          fontSize: "0.7rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          "&:hover": { color: palette.paper },
        }}
        title="Show dev dock"
      >
        Dev ▾
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "fixed",
        top: 12,
        left: 12,
        zIndex: 100,
        background: palette.ink,
        border: `1.5px solid ${palette.paper}`,
        padding: "0.6rem 0.75rem",
        boxShadow: `3px 3px 0 ${palette.inkDeep}`,
        maxWidth: 360,
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={0.5}>
          {surfaces.map(s => (
            <Button
              key={s}
              size="small"
              variant={surface === s ? "contained" : "outlined"}
              onClick={() => onSurfaceChange(s)}
              sx={{ textTransform: "none", flex: 1 }}
            >
              {s}
            </Button>
          ))}
        </Stack>
        {surface === "game" && (
          <>
            {GROUPS.map(({ kind, label }) => {
              const group = SCENARIOS.filter(s => s.kind === kind);
              const valueForGroup = group.some(s => s.id === scenarioId)
                ? scenarioId
                : "";
              const empty = group.length === 0;
              return (
                <Box key={kind}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: palette.paperDim,
                      fontFamily: "inherit",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: "0.2rem",
                    }}
                  >
                    {label}
                  </Typography>
                  <Select
                    size="small"
                    fullWidth
                    value={valueForGroup}
                    displayEmpty
                    disabled={empty}
                    onChange={e => onScenarioChange(e.target.value)}
                    sx={{
                      color: palette.paper,
                      "& .MuiSelect-icon": { color: palette.paper },
                      "& fieldset": { borderColor: palette.paper },
                    }}
                    renderValue={v => {
                      if (empty) return "— no scenarios yet —";
                      if (!v) return "—";
                      return group.find(s => s.id === v)?.label ?? "—";
                    }}
                  >
                    {group.map(s => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.label}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              );
            })}
            <Typography
              variant="caption"
              sx={{
                color: palette.paperDim,
                fontStyle: "italic",
                lineHeight: 1.3,
              }}
            >
              {blurb}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={handlePlay}
                sx={{ textTransform: "none", flex: 1 }}
              >
                ▶ Play
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={handleReset}
                disabled={!playing}
                sx={{ textTransform: "none" }}
              >
                Reset
              </Button>
              <Button
                size="small"
                variant="text"
                onClick={() => setCollapsed(true)}
                sx={{ textTransform: "none", color: palette.paperDim, minWidth: 0 }}
                title="Hide dev dock"
              >
                ✕
              </Button>
            </Stack>
            {children}
          </>
        )}
        {surface === "reckoning" && onReckoningChange && (
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: palette.paperDim,
                fontFamily: "inherit",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "0.2rem",
              }}
            >
              Reckoning
            </Typography>
            <Select
              size="small"
              fullWidth
              value={reckoningId ?? RECKONING_SCENARIOS[0].id}
              onChange={e => onReckoningChange(e.target.value)}
              sx={{
                color: palette.paper,
                "& .MuiSelect-icon": { color: palette.paper },
                "& fieldset": { borderColor: palette.paper },
              }}
            >
              {RECKONING_SCENARIOS.map(s => (
                <MenuItem key={s.id} value={s.id}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
            <Typography
              variant="caption"
              sx={{
                color: palette.paperDim,
                fontStyle: "italic",
                lineHeight: 1.3,
                display: "block",
                marginTop: "0.4rem",
              }}
            >
              {RECKONING_SCENARIOS.find(s => s.id === reckoningId)?.blurb ?? ""}
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
