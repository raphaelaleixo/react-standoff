import { Box } from "@mui/material";
import { FullscreenToggle } from "react-gameroom";
import { palette } from "../../theme/colors";

// Wraps react-gameroom's FullscreenToggle so it inherits the masthead's
// display-caps typography. The library renders a bare <button>; the sx
// selector below strips its native chrome and lets it sit in the same
// type rhythm as ROOM / round labels.
export function FullscreenButton() {
  return (
    <Box
      sx={{
        "& button": {
          background: "transparent",
          border: 0,
          padding: 0,
          font: "inherit",
          letterSpacing: "inherit",
          color: "inherit",
          cursor: "pointer",
          transition: "color 0.18s ease",
          "&:hover": { color: palette.paper },
          "&:focus-visible": {
            outline: `2px solid ${palette.paper}`,
            outlineOffset: "4px",
          },
        },
      }}
    >
      <FullscreenToggle labels={{ enter: "FULLSCREEN", exit: "EXIT" }} />
    </Box>
  );
}
