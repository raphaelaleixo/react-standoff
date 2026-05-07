import { Box } from "@mui/material";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor } from "../flags";
import { BloodSplatter } from "./BloodSplatter";

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
      {/* Blood splatter — fades in behind a struck roundel. Inline SVG
        with an irregular central pool, satellite blobs, droplets and a
        couple of drip streaks. Rotated slightly so the pattern doesn't
        read as symmetric, and sized larger than the roundel so the
        outermost specks land outside its border. */}
      <Box
        sx={{
          position: "absolute",
          inset: "-50%",
          pointerEvents: "none",
          opacity: struck ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      >
        <BloodSplatter seed={colorId ?? flagId} />
      </Box>
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
