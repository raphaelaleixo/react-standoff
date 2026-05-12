import { useEffect, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface Props {
  onUse: () => void;
  onSkip: () => void;
  expiresAtMs: number;
}

export function ToughPromptScreen({ onUse, onSkip, expiresAtMs }: Props) {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(i);
  }, []);
  const remaining = Math.max(0, Math.round((expiresAtMs - now) / 1000));
  useEffect(() => {
    if (remaining === 0) onSkip();
  }, [remaining, onSkip]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontFamily: "'Pirata One', serif" }}>
        {t("powers.toughPrompt.title")}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        {t("powers.toughPrompt.body")}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
        <Button variant="contained" color="primary" onClick={onUse}>
          {t("powers.toughPrompt.useAndReveal")}
        </Button>
        <Button variant="outlined" onClick={onSkip}>
          {t("powers.toughPrompt.skip")}
        </Button>
      </Stack>
      <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
        {remaining}s
      </Typography>
    </Box>
  );
}
