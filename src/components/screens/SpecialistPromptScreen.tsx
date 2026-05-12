import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { BulletCard, Player } from "../../game/types";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { PowderCard } from "../phone/PowderCard";
import { Button } from "../shell/Button";

interface Props {
  me: Player;
  playedBullet: BulletCard; // expected to be bang_bang_bang
  onUse: (kind: BulletCard) => void;
  onSkip: () => void;
  expiresAtMs: number;
}

// Specialist (Quartermaster's Reload) prompt — the holder revealed B!B!B!
// and now picks an unused powder to discard in its place. Uses PowderCard
// for the powder choices so the prompt feels continuous with the in-game
// hand, and the broadside shell Button for the actions.
export function SpecialistPromptScreen({ me, playedBullet, onUse, onSkip, expiresAtMs }: Props) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(i);
  }, []);
  const remaining = Math.max(0, Math.round((expiresAtMs - now) / 1000));

  // Hide one instance of the played B!B!B! from the choices — even though
  // the resolver hasn't applied the removal yet, leaving it in the picker
  // would let the holder "discard" the very card they're trying to keep.
  const playedIdx = me.bullets.findIndex(b => b === playedBullet);
  const choices = me.bullets
    .map((load, idx) => ({ load, idx }))
    .filter(c => c.idx !== playedIdx);

  const [selected, setSelected] = useState<{ value: BulletCard; idx: number } | null>(null);

  useEffect(() => {
    if (remaining === 0) onSkip();
  }, [remaining, onSkip]);

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "1.1rem 1rem 0.6rem",
        overflow: "auto",
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.blackletter,
          fontSize: "1.7rem",
          lineHeight: 1.05,
          color: palette.paper,
          textAlign: "center",
        }}
      >
        {t("powers.specialistPrompt.title")}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "0.95rem",
          lineHeight: 1.3,
          color: palette.paperDim,
          marginTop: "0.55rem",
          textAlign: "center",
        }}
      >
        {t("powers.specialistPrompt.body")}
      </Box>

      <Box
        sx={{
          marginTop: "1.1rem",
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(choices.length, 4)}, minmax(0, 70px))`,
          justifyContent: "center",
          gap: "0.45rem",
        }}
      >
        {choices.map(c => (
          <PowderCard
            key={`choice-${c.idx}`}
            load={c.load}
            selected={selected?.idx === c.idx}
            onClick={() => setSelected({ value: c.load, idx: c.idx })}
            data-testid={`specialist-choice-${c.idx}`}
          />
        ))}
      </Box>

      <Box
        sx={{
          marginTop: "1.2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.2rem",
        }}
      >
        <Button
          variant="primary"
          disabled={!selected}
          onClick={() => selected && onUse(selected.value)}
        >
          {t("powers.specialistPrompt.useAndReveal").toUpperCase()}
        </Button>
        <Button variant="text" onClick={onSkip}>
          {t("powers.specialistPrompt.skip").toUpperCase()}
        </Button>
      </Box>

      <Box
        sx={{
          marginTop: "0.4rem",
          textAlign: "center",
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "0.85rem",
          color: palette.paperDim,
        }}
      >
        {remaining}s
      </Box>
    </Box>
  );
}
