import { Box, Typography } from "@mui/material";
import { palette } from "../theme/colors";
import { AimBarrel } from "./phone/AimBarrel";

// Phase 2 phone view: the standoff-phase aim display. Big barrel sights with
// the locked-in target's jolly roger inside, plus the AIM TRUE caption and
// the "Aiming at NAME" subtext. The barrel visual itself is shared with the
// commit-phase TargetList via <AimBarrel>.
export function FlintlockBarrel({ targetFlag, targetName }: {
  targetFlag: string;
  targetName: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        py: 4,
      }}
    >
      <AimBarrel colorOrAvatar={targetFlag} size={220} />
      <Typography variant="h4" sx={{ color: palette.ink, letterSpacing: 4 }}>
        AIM TRUE
      </Typography>
      <Typography variant="body1" sx={{ color: palette.paperDim }}>
        Aiming at {targetName}
      </Typography>
    </Box>
  );
}
