import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { Button } from "../shell/Button";

interface Props {
  onUse: () => void;
  onSkip: () => void;
  expiresAtMs: number;
}

// Tough (Phantom Pain) prompt — the holder was struck or yielded and gets
// one chance to claim a split share anyway. No bullet choices, just a
// confirm + skip, both rendered with the broadside shell Button.
export function ToughPromptScreen({ onUse, onSkip, expiresAtMs }: Props) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(i);
  }, []);
  const remaining = Math.max(0, Math.round((expiresAtMs - now) / 1000));
  useEffect(() => {
    if (remaining === 0) onSkip();
  }, [remaining, onSkip]);

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "1.4rem 1rem 0.6rem",
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
        {t("powers.toughPrompt.title")}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "0.95rem",
          lineHeight: 1.3,
          color: palette.paperDim,
          marginTop: "0.6rem",
          textAlign: "center",
        }}
      >
        {t("powers.toughPrompt.body")}
      </Box>

      <Box
        sx={{
          marginTop: "1.8rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.2rem",
        }}
      >
        <Button variant="primary" onClick={onUse}>
          {t("powers.toughPrompt.useAndReveal").toUpperCase()}
        </Button>
        <Button variant="text" onClick={onSkip}>
          {t("powers.toughPrompt.skip").toUpperCase()}
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
