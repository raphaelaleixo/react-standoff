import { Box, Typography } from "@mui/material";
import { palette } from "../theme/colors";
import { FlagFor } from "./flags";

// Phase 2 phone view: a flintlock barrel-end framing the target's flag.
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
      <Box
        sx={{
          position: "relative",
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${palette.paper} 0%, ${palette.paper} 55%, ${palette.ink} 60%, ${palette.ink} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `inset 0 0 30px rgba(90,55,29,0.6)`,
        }}
      >
        <Box sx={{ color: palette.blood }}>
          <FlagFor id={targetFlag} size={120} />
        </Box>
        <Box
          sx={{
            position: "absolute",
            inset: "50% 0 auto 0",
            height: 2,
            bgcolor: palette.blood,
            opacity: 0.5,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: "0 50% auto auto",
            width: 2,
            height: "100%",
            bgcolor: palette.blood,
            opacity: 0.5,
          }}
        />
      </Box>
      <Typography variant="h4" sx={{ color: palette.ink, letterSpacing: 4 }}>
        AIM TRUE
      </Typography>
      <Typography variant="body1" sx={{ color: palette.paperDim }}>
        Aiming at {targetName}
      </Typography>
    </Box>
  );
}
