import { Box } from "@mui/material";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor } from "../flags";

interface RoundelProps {
  flagId: string;
  name: string;
  ducked?: boolean;
  dim?: boolean;
  size?: number;
  "data-testid"?: string;
}

export function Roundel({
  flagId,
  name,
  ducked,
  dim,
  size = 64,
  "data-testid": testid,
}: RoundelProps) {
  const state = ducked ? "ducked" : dim ? "dim" : "live";
  const transform = ducked ? "rotate(-6deg) scale(0.92)" : "none";
  return (
    <Box data-testid={testid} data-state={state} sx={{ textAlign: "center" }}>
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: palette.inkUp,
          border: `2.5px ${ducked ? "dashed" : "solid"} ${ducked ? palette.paperDim : palette.paper}`,
          boxShadow: `3px 3px 0 ${palette.inkDeep}, inset 0 0 8px rgba(0,0,0,0.4)`,
          color: flagColor(flagId),
          opacity: ducked ? 0.45 : dim ? 0.55 : 1,
          filter: dim ? "saturate(0.6)" : undefined,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform,
          transition: "transform 0.4s ease, opacity 0.4s ease, filter 0.4s ease",
        }}
      >
        <FlagFor id={flagId} size={size * 0.6} />
      </Box>
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontSize: "0.55rem",
          letterSpacing: "0.16em",
          marginTop: "0.25rem",
          color: dim ? palette.paperDim : palette.paper,
          opacity: dim ? 0.7 : 1,
        }}
      >
        {name}
      </Box>
    </Box>
  );
}
