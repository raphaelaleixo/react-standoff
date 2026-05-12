import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface Props {
  armed: boolean;
  onReveal: () => void | Promise<void>;
  // Optional pixel offset from the right edge. Lets dev pages shift the
  // pill out from under a persistent right-side drawer.
  rightOffsetPx?: number;
}

// Floating pill above the phone footer. When `armed` is false, shows a
// tappable REVEAL GRENADE button that opens a confirmation dialog. When
// `armed` is true, shows a non-interactive ARMED badge so the holder knows
// the grenade is live and waiting for a wound.
export function InsaneRevealButton({ armed, onReveal, rightOffsetPx }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rightCss = rightOffsetPx !== undefined ? `${rightOffsetPx}px` : "1.2rem";

  if (armed) {
    return (
      <Box
        sx={{
          position: "fixed",
          bottom: "calc(0.95rem + 80px)",
          right: rightCss,
          padding: "0.45rem 0.85rem",
          background: palette.blood,
          color: palette.paper,
          border: `1.5px solid ${palette.bloodDeep}`,
          fontFamily: fonts.displayCaps,
          fontSize: "0.72rem",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          boxShadow: `2px 2px 0 ${palette.inkDeep}`,
          zIndex: 7,
          pointerEvents: "none",
        }}
      >
        {t("powers.insaneReveal.armed")}
      </Box>
    );
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          bottom: "calc(0.95rem + 80px)",
          right: rightCss,
          padding: "0.5rem 0.9rem",
          background: palette.blood,
          color: palette.paper,
          border: `1.5px solid ${palette.bloodDeep}`,
          fontFamily: fonts.displayCaps,
          fontSize: "0.75rem",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          boxShadow: `2px 2px 0 ${palette.inkDeep}`,
          zIndex: 7,
          "&:hover": { background: palette.bloodDeep },
        }}
      >
        {t("powers.insaneReveal.button")}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{t("powers.insaneReveal.confirmTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{t("powers.insaneReveal.confirmBody")}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t("powers.insaneReveal.cancel")}</Button>
          <Button
            onClick={async () => {
              await onReveal();
              setOpen(false);
            }}
            variant="contained"
            color="error"
          >
            {t("powers.insaneReveal.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
