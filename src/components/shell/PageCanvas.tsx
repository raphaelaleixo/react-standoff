import { Box, type BoxProps } from "@mui/material";
import { palette } from "../../theme/colors";

const NOISE_SVG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>" +
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='5'/>" +
  "<feColorMatrix values='0 0 0 0 0.95  0 0 0 0 0.88  0 0 0 0 0.74  0 0 0 0.10 0'/></filter>" +
  "<rect width='240' height='240' filter='url(%23n)'/></svg>\")";

interface PageCanvasProps extends Omit<BoxProps, "children"> {
  aspectRatio?: string;
  borderRadius?: number;
  children: React.ReactNode;
}

export function PageCanvas({ aspectRatio, borderRadius, children, sx, ...rest }: PageCanvasProps) {
  return (
    <Box
      {...rest}
      style={{
        aspectRatio: aspectRatio as any,
        borderRadius: borderRadius != null ? `${borderRadius}px` : undefined,
      }}
      sx={[
        {
          background: palette.ink,
          color: palette.paper,
          position: "relative",
          overflow: "hidden",
          border: `1px solid ${palette.inkUp}`,
          boxShadow: "inset 0 0 100px rgba(0,0,0,0.6)",
          // grain — cream noise, screen blend
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            backgroundImage: NOISE_SVG,
            backgroundSize: "240px 240px",
            mixBlendMode: "screen",
            opacity: 0.45,
            borderRadius: "inherit",
          },
          // warm-light corner spills
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            background:
              "radial-gradient(ellipse at 8% 10%, rgba(255, 195, 120, 0.06), transparent 35%)," +
              "radial-gradient(ellipse at 95% 92%, rgba(255, 195, 120, 0.05), transparent 35%)",
            borderRadius: "inherit",
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {/* contents render above the ::before/::after layers via z-index 2 */}
      <Box sx={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column" }}>
        {children}
      </Box>
    </Box>
  );
}
