import { Box, Button, MenuItem, Select, Stack, Typography } from "@mui/material";
import { SCENARIOS } from "./scenarios";
import { palette } from "../../theme/colors";

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
  children,
}: ScenarioDockProps) {
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
            <Select
              size="small"
              value={scenarioId}
              onChange={e => onScenarioChange(e.target.value)}
              sx={{
                color: palette.paper,
                "& .MuiSelect-icon": { color: palette.paper },
                "& fieldset": { borderColor: palette.paper },
              }}
            >
              {SCENARIOS.map(s => (
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
              }}
            >
              {blurb}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={onPlay}
                sx={{ textTransform: "none", flex: 1 }}
              >
                ▶ Play
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={onReset}
                disabled={!playing}
                sx={{ textTransform: "none" }}
              >
                Reset
              </Button>
            </Stack>
            {children}
          </>
        )}
      </Stack>
    </Box>
  );
}
