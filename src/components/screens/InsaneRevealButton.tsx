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
import { XMarksCheckbox } from "../XMarksCheckbox";

interface Props {
  armed: boolean;
  onReveal: () => void | Promise<void>;
}

// Pocket Inferno arming. Visually shares the X-marks chip with the lobby
// variant toggle and the Phantom Pain arm, so the player's commit-time
// selections all read the same. Tapping the (unchecked) chip opens a
// confirm dialog; once revealed, the chip stays checked and is no longer
// interactive (the grenade can't be unarmed).
export function InsaneRevealButton({ armed, onReveal }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Box>
      <XMarksCheckbox
        checked={armed}
        onChange={armed ? undefined : () => setOpen(true)}
        disabled={armed}
        label={
          armed
            ? t("powers.insaneReveal.armed")
            : t("powers.insaneReveal.button")
        }
      />
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
    </Box>
  );
}
