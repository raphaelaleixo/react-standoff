import { Box } from "@mui/material";
import { palette } from "../../theme/colors";

const NOISE_SVG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>" +
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='5'/>" +
  "<feColorMatrix values='0 0 0 0 0.95  0 0 0 0 0.88  0 0 0 0 0.74  0 0 0 0.10 0'/></filter>" +
  "<rect width='240' height='240' filter='url(%23n)'/></svg>\")";

// App-level parchment surface. A fixed full-viewport layer that paints the
// same ink-with-grain treatment PageCanvas uses on a card, but anchored to
// the viewport — so the textured surface bleeds to every edge regardless
// of the page's content width. Renders before the route content in DOM
// order so it paints behind everything without needing a z-index.
export function ParchmentBackground() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        background: palette.ink,
        boxShadow: "inset 0 0 240px rgba(0, 0, 0, 0.6)",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          backgroundImage: NOISE_SVG,
          backgroundSize: "240px 240px",
          mixBlendMode: "screen",
          opacity: 0.45,
        },
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 8% 8%, rgba(255, 195, 120, 0.06), transparent 40%)," +
            "radial-gradient(ellipse at 95% 92%, rgba(255, 195, 120, 0.05), transparent 40%)",
        },
      }}
    />
  );
}
