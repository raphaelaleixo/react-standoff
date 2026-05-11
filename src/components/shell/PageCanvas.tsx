import { Box, type BoxProps } from "@mui/material";
import { palette } from "../../theme/colors";

interface PageCanvasProps extends Omit<BoxProps, "children"> {
  aspectRatio?: string;
  borderRadius?: number;
  children: React.ReactNode;
}

// Layout container — no ink/grain/corner-spill chrome of its own. The
// parchment surface lives at the App level (ParchmentBackground), so any
// PageCanvas just sits on it as a transparent reading column. The hairline
// border + radius are still useful for card-shaped contexts (PhoneShell,
// MockBigScreen previewing a TV inside a desktop), so they're applied only
// when borderRadius is supplied — which is how those callers opt in.
export function PageCanvas({ aspectRatio, borderRadius, children, sx, ...rest }: PageCanvasProps) {
  const isCard = borderRadius != null;
  return (
    <Box
      {...rest}
      // aspectRatio + borderRadius applied as inline style (not sx) so they're
      // observable on element.style — the test contract asserts on node.style.*
      style={{
        aspectRatio,
        borderRadius: borderRadius != null ? `${borderRadius}px` : undefined,
      }}
      sx={[
        {
          color: palette.paper,
          position: "relative",
          overflow: "hidden",
          ...(isCard && {
            border: `1px solid ${palette.inkUp}`,
            boxShadow: "inset 0 0 100px rgba(0, 0, 0, 0.5)",
          }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
        {children}
      </Box>
    </Box>
  );
}
