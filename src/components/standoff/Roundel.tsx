import { Box } from "@mui/material";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor } from "../flags";

interface RoundelProps {
  flagId: string;
  /** Optional override for the tint color, separate from the SVG flag. Defaults to flagId. */
  colorId?: string;
  name?: string;
  ducked?: boolean;
  dim?: boolean;
  size?: number;
  "data-testid"?: string;
}

export function Roundel({
  flagId,
  colorId,
  name,
  ducked,
  dim,
  size = 64,
  "data-testid": testid,
}: RoundelProps) {
  const state = ducked ? "ducked" : dim ? "dim" : "live";
  const transform = ducked ? "rotate(-6deg) scale(0.92)" : "none";
  return (
    <Box
      data-testid={testid}
      data-state={state}
      sx={{
        position: "relative",
        width: size,
        height: size,
      }}
    >
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: palette.inkUp,
          border: `2.5px ${ducked ? "dashed" : "solid"} ${ducked ? palette.paperDim : palette.paper}`,
          boxShadow: `3px 3px 0 ${palette.inkDeep}, inset 0 0 8px rgba(0,0,0,0.4)`,
          color: flagColor(colorId ?? flagId),
          opacity: ducked ? 0.45 : dim ? 0.55 : 1,
          filter: dim ? "saturate(0.6)" : undefined,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform,
          transition: "transform 0.4s ease, opacity 0.4s ease, filter 0.4s ease",
        }}
      >
        <FlagFor id={flagId} size={size * 0.5} />
      </Box>
      {name && (
        <Box
          sx={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: "0.5rem",
            whiteSpace: "nowrap",
            fontFamily: fonts.displayCaps,
            fontFeatureSettings: '"smcp"',
            fontSize: "0.79rem",
            letterSpacing: "0.16em",
            color: dim ? palette.paperDim : palette.paper,
            opacity: dim ? 0.7 : 1,
          }}
        >
          {name}
        </Box>
      )}
    </Box>
  );
}
