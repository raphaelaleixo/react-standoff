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
  /** Just took a wound this phase — solid blood-red border, ducked-style dim/rotate. */
  struck?: boolean;
  size?: number;
  "data-testid"?: string;
}

export function Roundel({
  flagId,
  colorId,
  name,
  ducked,
  dim,
  struck,
  size = 64,
  "data-testid": testid,
}: RoundelProps) {
  const state = struck ? "struck" : ducked ? "ducked" : dim ? "dim" : "live";
  const laidDown = ducked || struck;
  const transform = laidDown ? "rotate(-6deg) scale(0.92)" : "none";
  const borderStyle = ducked ? "dashed" : "solid";
  const borderColor = struck ? palette.blood : ducked ? palette.paperDim : palette.paper;
  const borderWidth = struck ? 3 : 2.5;
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
      {/* Blood splatter — fades in behind a struck roundel. Multiple
        asymmetric radial blobs at darker / lighter reds layered on top of a
        wide deep-red wash; sits below the backplate so the inner area is
        covered and only the surrounding splatter reads. */}
      <Box
        sx={{
          position: "absolute",
          inset: "-50%",
          pointerEvents: "none",
          opacity: struck ? 1 : 0,
          transition: "opacity 0.4s ease",
          transform: "rotate(-8deg)",
          background: `
            radial-gradient(ellipse 26% 22% at 28% 36%, rgba(124,25,22,0.85) 0%, transparent 70%),
            radial-gradient(ellipse 22% 18% at 72% 58%, rgba(124,25,22,0.78) 0%, transparent 70%),
            radial-gradient(ellipse 24% 20% at 52% 78%, rgba(124,25,22,0.82) 0%, transparent 72%),
            radial-gradient(ellipse 14% 12% at 18% 70%, rgba(180,40,32,0.7) 0%, transparent 80%),
            radial-gradient(ellipse 16% 13% at 82% 30%, rgba(180,40,32,0.7) 0%, transparent 80%),
            radial-gradient(ellipse 11% 10% at 64% 16%, rgba(180,40,32,0.6) 0%, transparent 80%),
            radial-gradient(ellipse 13% 11% at 88% 75%, rgba(180,40,32,0.55) 0%, transparent 80%),
            radial-gradient(ellipse 9% 8% at 12% 50%, rgba(201,58,48,0.55) 0%, transparent 80%),
            radial-gradient(ellipse 60% 55% at 50% 50%, rgba(124,25,22,0.35) 0%, transparent 70%)
          `,
          filter: "blur(2px)",
        }}
      />
      {/* Always-opaque backplate so targeting lines never bleed through a dimmed roundel. */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: palette.inkUp,
        }}
      />
      <Box
        sx={{
          position: "relative",
          width: size,
          height: size,
          borderRadius: "50%",
          background: palette.inkUp,
          border: `${borderWidth}px ${borderStyle} ${borderColor}`,
          boxShadow: struck
            ? `0 0 0 2px rgba(201,58,48,0.35), 3px 3px 0 ${palette.inkDeep}, inset 0 0 8px rgba(0,0,0,0.4)`
            : `3px 3px 0 ${palette.inkDeep}, inset 0 0 8px rgba(0,0,0,0.4)`,
          color: flagColor(colorId ?? flagId),
          opacity: laidDown ? 0.45 : dim ? 0.55 : 1,
          filter: dim ? "saturate(0.6)" : undefined,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform,
          transition: "transform 0.4s ease, opacity 0.4s ease, filter 0.4s ease, border-color 0.3s ease, box-shadow 0.3s ease",
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
