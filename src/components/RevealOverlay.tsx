import { Box, Stack, Typography } from "@mui/material";
import type { Game, RoundShot } from "../game/types";

// Throwaway-but-clear text takeovers for the reveal phases. No animations —
// just the events of the round laid out for everyone to read.
export function RevealOverlay({ game, slotName }: {
  game: Game;
  slotName: (id: string) => string;
}) {
  const { phase, resolution } = game.round;
  if (!resolution) return null;
  if (phase !== "reveal_bbb" && phase !== "reveal_others") return null;

  const shots = phase === "reveal_bbb"
    ? resolution.shots.filter(s => s.card === "bang_bang_bang")
    : resolution.shots.filter(s => s.card !== "bang_bang_bang");

  if (shots.length === 0) return null;

  const headline = phase === "reveal_bbb" ? "B! B! B!" : "BANG!";
  const headlineColor = phase === "reveal_bbb" ? "#ff5252" : "#ffb74d";

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "rgba(8, 8, 12, 0.94)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        zIndex: 1300,
        px: 4,
      }}
    >
      <Typography
        sx={{
          color: headlineColor,
          fontWeight: 900,
          fontSize: { xs: "4rem", md: "7rem" },
          letterSpacing: 8,
          textShadow: `0 0 24px ${headlineColor}`,
        }}
      >
        {headline}
      </Typography>
      <Stack spacing={1.5} sx={{ alignItems: "center" }}>
        {shots.map((s, i) => (
          <Typography
            key={i}
            sx={{
              color: shotColor(s),
              fontSize: { xs: "1.4rem", md: "2rem" },
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {shotPhrase(s, slotName)}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}

function shotPhrase(s: RoundShot, slotName: (id: string) => string): string {
  const shooter = slotName(s.shooter);
  const target = slotName(s.target);
  switch (s.outcome) {
    case "hit":
      return `${shooter} shot ${target}!`;
    case "no_effect_clic":
      return `${shooter} aimed at ${target}… *click*`;
    case "voided_target_ducked":
      return `${shooter}'s bullet was wasted — ${target} ducked.`;
    case "voided_shooter_surprised":
      return `${shooter} was caught off guard — bullet wasted.`;
  }
}

function shotColor(s: RoundShot): string {
  switch (s.outcome) {
    case "hit": return "#ffffff";
    case "no_effect_clic": return "#90caf9";
    case "voided_target_ducked":
    case "voided_shooter_surprised":
      return "#9e9e9e";
  }
}
