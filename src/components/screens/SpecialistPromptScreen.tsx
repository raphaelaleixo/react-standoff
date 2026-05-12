import { useEffect, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { BulletCard, Player } from "../../game/types";

interface Props {
  me: Player;
  playedBullet: BulletCard; // expected to be bang_bang_bang
  onUse: (kind: BulletCard) => void;
  onSkip: () => void;
  expiresAtMs: number;
}

export function SpecialistPromptScreen({ me, playedBullet, onUse, onSkip, expiresAtMs }: Props) {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(i);
  }, []);
  const remaining = Math.max(0, Math.round((expiresAtMs - now) / 1000));

  // Show the player's remaining bullets EXCLUDING the played B!B!B!.
  // (Even though the resolver hasn't applied removal yet, we hide it for clarity.)
  // Find the first index of playedBullet and exclude that one instance.
  const playedIdx = me.bullets.findIndex(b => b === playedBullet);
  const choices = me.bullets.filter((_, i) => i !== playedIdx);

  const [selected, setSelected] = useState<{ value: BulletCard; idx: number } | null>(null);

  useEffect(() => {
    if (remaining === 0) onSkip();
  }, [remaining, onSkip]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontFamily: "'Pirata One', serif" }}>
        {t("powers.specialistPrompt.title")}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        {t("powers.specialistPrompt.body")}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
        {choices.map((b, i) => (
          <Button
            key={`${b}-${i}`}
            variant={selected?.idx === i ? "contained" : "outlined"}
            onClick={() => setSelected({ value: b, idx: i })}
          >
            {b}
          </Button>
        ))}
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          disabled={!selected}
          onClick={() => selected && onUse(selected.value)}
        >
          {t("powers.specialistPrompt.useAndReveal")}
        </Button>
        <Button variant="outlined" onClick={onSkip}>
          {t("powers.specialistPrompt.skip")}
        </Button>
      </Stack>
      <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
        {remaining}s
      </Typography>
    </Box>
  );
}
