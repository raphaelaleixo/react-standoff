import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Game, RoundShot } from "../game/types";
import { palette } from "../theme/colors";

export function RevealOverlay({ game, slotName }: {
  game: Game;
  slotName: (id: string) => string;
}) {
  const { t } = useTranslation();
  const { phase, resolution } = game.round;
  if (!resolution) return null;
  if (phase !== "reveal_bbb" && phase !== "reveal_others") return null;

  const shots = phase === "reveal_bbb"
    ? resolution.shots.filter(s => s.card === "bang_bang_bang")
    : resolution.shots.filter(s => s.card !== "bang_bang_bang");

  if (shots.length === 0) return null;

  const headline = phase === "reveal_bbb" ? t("reveal.broadside") : t("reveal.shot");
  const headlineColor = palette.blood;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "rgba(40, 25, 15, 0.94)",
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
          fontFamily: "Pirata One, serif",
          fontSize: { xs: "5rem", md: "9rem" },
          letterSpacing: 8,
          textShadow: `0 0 24px ${headlineColor}, 4px 4px 0 ${palette.ink}`,
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
              fontSize: { xs: "1.51rem", md: "2.02rem" },
              textAlign: "center",
              fontWeight: 600,
              fontFamily: "Pirata One, serif",
            }}
          >
            {shotPhrase(s, slotName, t as (k: string, v?: object) => string)}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}

function shotPhrase(s: RoundShot, slotName: (id: string) => string, t: (k: string, v?: object) => string): string {
  const shooter = slotName(s.shooter);
  const target = slotName(s.target);
  switch (s.outcome) {
    case "hit":
      return t("reveal.hit", { shooter, target });
    case "no_effect_clic":
      return t("reveal.click", { shooter, target });
    case "voided_target_ducked":
      return t("reveal.voidedDuck", { shooter, target });
    case "voided_shooter_surprised":
      return t("reveal.voidedSurprised", { shooter });
  }
}

function shotColor(s: RoundShot): string {
  switch (s.outcome) {
    case "hit": return palette.paper;
    case "no_effect_clic": return palette.gold;
    case "voided_target_ducked":
    case "voided_shooter_surprised":
      return palette.paperDim;
  }
}
