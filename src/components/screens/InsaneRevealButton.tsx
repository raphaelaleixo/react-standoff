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
}

// Pill rendered inline by the parent — designed to live in PhoneShell's
// above-footer slot. When `armed` is false, shows a tappable REVEAL GRENADE
// button that opens a confirmation dialog. When `armed`, shows a non-
// interactive ARMED badge so the holder knows the grenade is live.
export function InsaneRevealButton({ armed, onReveal }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (armed) {
    return (
      <Box
        sx={{
          display: "inline-block",
          padding: "0.45rem 0.85rem",
          background: palette.blood,
          color: palette.paper,
          border: `1.5px solid ${palette.bloodDeep}`,
          fontFamily: fonts.displayCaps,
          fontSize: "0.72rem",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          boxShadow: `2px 2px 0 ${palette.inkDeep}`,
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
          padding: "0.5rem 0.9rem",
          background: palette.blood,
          color: palette.paper,
          border: `1.5px solid ${palette.bloodDeep}`,
          fontFamily: fonts.displayCaps,
          fontSize: "0.75rem",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          boxShadow: `2px 2px 0 ${palette.inkDeep}`,
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
