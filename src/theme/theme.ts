import { createTheme } from "@mui/material/styles";
import { palette } from "./colors";

const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: palette.parchment,
      paper: palette.parchment,
    },
    text: {
      primary: palette.ink,
      secondary: palette.inkSoft,
    },
    primary: { main: palette.ink },
    error: { main: palette.signal },
    warning: { main: palette.yellow },
    success: { main: palette.goldDeep },
  },
  typography: {
    fontFamily: '"Iowan Old Style", Georgia, serif',
    h1: { fontFamily: '"Pirata One", Georgia, serif', letterSpacing: 2 },
    h2: { fontFamily: '"Pirata One", Georgia, serif', letterSpacing: 2 },
    h3: { fontFamily: '"Pirata One", Georgia, serif', letterSpacing: 1 },
    h4: { fontFamily: '"Pirata One", Georgia, serif' },
    h5: { fontFamily: '"Pirata One", Georgia, serif' },
    h6: { fontFamily: '"Pirata One", Georgia, serif' },
    button: { fontFamily: '"Pirata One", Georgia, serif', letterSpacing: 1 },
    overline: { fontFamily: '"Pirata One", Georgia, serif', letterSpacing: 2 },
  },
});

export default theme;
