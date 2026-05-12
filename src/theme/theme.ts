import { createTheme } from "@mui/material/styles";
import { palette } from "./colors";
import { fonts } from "./typography";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: palette.ink,
      paper: palette.inkUp,
    },
    text: {
      primary: palette.paper,
      secondary: palette.paperDim,
      disabled: palette.paperFaint,
    },
    primary: { main: palette.paper, contrastText: palette.ink },
    error: { main: palette.blood },
    warning: { main: palette.yellow },
    success: { main: palette.gold, contrastText: palette.ink },
    divider: palette.ruleStrong,
  },
  typography: {
    fontFamily: fonts.body,
    fontWeightRegular: 500,
    h1: { fontFamily: fonts.blackletter, letterSpacing: "0.02em" },
    h2: { fontFamily: fonts.blackletter, letterSpacing: "0.02em" },
    h3: { fontFamily: fonts.displayCaps, fontFeatureSettings: '"smcp"', letterSpacing: "0.04em" },
    h4: { fontFamily: fonts.displayCaps, fontFeatureSettings: '"smcp"', letterSpacing: "0.06em" },
    h5: { fontFamily: fonts.displayCaps, fontFeatureSettings: '"smcp"', letterSpacing: "0.18em" },
    h6: { fontFamily: fonts.displayCaps, fontFeatureSettings: '"smcp"', letterSpacing: "0.18em" },
    button: {
      fontFamily: fonts.displayCaps,
      fontFeatureSettings: '"smcp"',
      letterSpacing: "0.32em",
      fontWeight: 400,
    },
    overline: {
      fontFamily: fonts.displayCaps,
      fontFeatureSettings: '"smcp"',
      letterSpacing: "0.36em",
      fontSize: "0.96rem",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Force lining figures everywhere — keeps UI numerals (cash, hours,
        // room codes) consistent regardless of the serif's default figure
        // style. `font-variant-numeric` inherits and survives child
        // `font-feature-settings: "smcp"` overrides, since the two properties
        // map to independent OpenType features.
        body: {
          fontVariantNumeric: "lining-nums",
        },
      },
    },
  },
});

export default theme;
